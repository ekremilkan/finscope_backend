const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const CampaignParticipation = require("../models/campaignParticipation.model");
const UserSegment = require("../models/userSegment.model");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const { StatusCodes } = require("http-status-codes");

// Kampanya soru sayısını güncelle
const updateCampaignQuestionCount = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return 0;

  const questionCount = campaign.questionIds.length;
  await Campaign.findByIdAndUpdate(campaignId, { questions: questionCount });
  return questionCount;
};

// ✅ YENİ: Quizi tamamla
exports.completeQuiz = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { totalTimeSpent } = req.body;

  // 1) Katılım kontrolü
  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("You have not joined this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 2) Çift tamamlama engeli
  if (userProgress.completed) {
    const err = new Error("This quiz has already been completed.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 3) İlerleme & katılım güncelle
  const updatedUserProgress = await UserProgress.findByIdAndUpdate(
    userProgress._id,
    {
      completed: true,
      timeSpent: totalTimeSpent,
      completedAt: new Date(),
    },
    { new: true }
  );

  await CampaignParticipation.findOneAndUpdate(
    { userId, campaignId },
    {
      timeSpent: totalTimeSpent,
      status: "completed",
      completedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // 4) Referral bonus (segment-based)
  try {
    const campaign = await Campaign.findById(campaignId).lean();
    if (campaign) {
      const user = await User.findById(userId, "invitedBy").lean();
      const inviterId = user?.invitedBy;

      if (inviterId) {
        const userSegment = await UserSegment.findOne({
          userId,
          chain: "ethereum",
        })
          .sort({ asOf: -1 })
          .lean();

        const segmentClass = userSegment?.class || "D";

        // ✅ YENİ: Kampanyanın ilgili segment'inden reward'ı al
        const segment = campaign.segments?.find((s) => s.name === segmentClass);
        let rewardAmount = Number(segment?.reward || 0);

        if (!Number.isFinite(rewardAmount)) rewardAmount = 0;

        // %3'ü hesapla, 2 ondalık sakla
        const referralBonus = Number((rewardAmount * 0.03).toFixed(2));

        if (referralBonus > 0) {
          await User.findByIdAndUpdate(
            inviterId,
            {
              $inc: { referralRewards: referralBonus },
              $push: {
                referralHistory: {
                  inviteeId: userId,
                  campaignId,
                  bonus: referralBonus,
                  segment: segmentClass,
                  at: new Date(),
                },
              },
            },
            { new: true }
          );
        }
      }
    }
  } catch (referralErr) {
    console.error("Referral reward error:", referralErr);
  }

  return {
    campaignId,
    userId: userId.toString(),
    completed: true,
    completedAt: updatedUserProgress.completedAt,
    totalTimeSpent,
  };
};

// ✅ YENİ: Kullanıcının kampanya ilerlemesini getir
exports.getUserProgress = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;

  const userProgress = await UserProgress.findOne({ userId, campaignId });

  if (!userProgress) {
    return {
      campaignId,
      userId: userId.toString(),
      joined: false,
      completed: false,
      timeSpent: 0,
      startedAt: null,
      completedAt: null,
    };
  }

  return userProgress;
};

// ✅ GÜNCELLENDİ: Kampanyaya katıl (Segment-based)
exports.joinCampaign = async (req) => {
  const { id: campaignId, segment: segmentParam } = req.params;
  const { userId, role } = req.user;

  const VALID_SEGMENTS = new Set(["A", "B", "C", "D"]);
  const fromParam = (segmentParam || "").toString().trim().toUpperCase();
  const requestedSegment = VALID_SEGMENTS.has(fromParam) ? fromParam : null;

  // 1. Kampanyayı getir
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  if (!campaign.isActive) {
    const err = new Error("This campaign is not active.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 2. Katılım ve ilerleme kontrolü
  const existingProgress = await UserProgress.findOne({ userId, campaignId });
  const existingParticipation = await CampaignParticipation.findOne({
    userId,
    campaignId,
  });

  if (existingProgress && existingProgress.completed) {
    const err = new Error("You have already completed this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 3. Kullanıcının segment'ini belirle

  const userSegmentClass = requestedSegment;

  // 4. Kampanyanın ilgili segment'ini bul
  const segment = campaign.segments.find((s) => s.name === userSegmentClass);

  if (!segment) {
    const err = new Error(
      `Segment ${userSegmentClass} not found in this campaign.`
    );
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 5. Segment kontenjan kontrolü (sadece yeni katılımlarda ve admin değilse)
  if (role !== "admin" && !existingParticipation) {
    if (
      segment.maxParticipants > 0 &&
      segment.currentParticipants >= segment.maxParticipants
    ) {
      const err = new Error(
        `The quota for segment ${userSegmentClass} is full.`
      );
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
  }

  // 6. UserProgress kaydını oluştur veya sıfırla
  if (existingProgress) {
    existingProgress.joined = true;
    existingProgress.startedAt = new Date();
    await existingProgress.save();
  } else {
    await UserProgress.create({
      userId,
      campaignId,
      joined: true,
      startedAt: new Date(),
    });
  }

  // 7. Katılım kaydını ve sayacı SADECE İLK GİRİŞTE oluştur/güncelle
  if (!existingParticipation) {
    await CampaignParticipation.create({
      campaignId,
      userId,
      joinedAt: new Date(),
    });

    // Segment katılımcı sayısını artır
    segment.currentParticipants += 1;
    await campaign.save();
  }

  return {
    campaignId,
    userId: userId.toString(),
    joined: true,
    segment: userSegmentClass,
    segmentQuota: {
      current: segment.currentParticipants,
      max: segment.maxParticipants,
      available: segment.maxParticipants - segment.currentParticipants,
    },
    reward: segment.reward,
    message: "Successfully joined/continued the campaign.",
  };
};

// ✅ YENİ: İlerlemeyi güncelle
exports.updateProgress = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { questionId, selectedAnswer, isCorrect, timeSpent, completed } =
    req.body;

  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("You have not joined this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const updatedUserProgress = await UserProgress.findByIdAndUpdate(
    userProgress._id,
    {
      completed: newCompleted,
      timeSpent: userProgress.timeSpent + timeSpent,
      completedAt: newCompleted ? new Date() : null,
    },
    { new: true }
  );

  await CampaignParticipation.findOneAndUpdate(
    { userId, campaignId },
    {
      score: newCompleted ? 100 : 0,
      timeSpent: updatedUserProgress.timeSpent,
      status: newCompleted ? "completed" : "active",
      completedAt: newCompleted ? new Date() : null,
    }
  );

  return {
    campaignId,
    userId: userId.toString(),
    completed: newCompleted,
  };
};

// ✅ GÜNCELLENDİ: Kampanya oluştur (segment-based)
exports.create = async (req) => {
  const {
    title,
    description,
    content,
    segments, // ✅ YENİ: Segment array
    startDate,
    endDate,
    questions,
    tags,
    company_logo,
    twitter_url,
    telegram_url,
    website_url,
  } = req.body;

  const createdUserId = req.user.userId;
  const role = req.user.role;

  // Segment validation
  if (!segments || segments.length === 0) {
    const err = new Error("Kampanya en az bir segment içermelidir");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Her segment için currentParticipants'ı 0 olarak ayarla
  const processedSegments = segments.map((segment) => ({
    ...segment,
    currentParticipants: segment.currentParticipants || 0,
  }));

  const campaign = new Campaign({
    title,
    description,
    content,
    segments: processedSegments, // ✅ YENİ: Segments array
    startDate,
    endDate,
    questions,
    tags,
    company_logo,
    twitter_url,
    telegram_url,
    website_url,
    createdUserId,
    isAdminAccept: role === "admin" ? true : false,
    isActive: false, // ✅ Admin kampanyaları inaktif olarak kaydedilir
  });

  await campaign.save();
  return campaign;
};

// ✅ YENİ: Tüm kampanyaları getir (rol bazlı filtreleme)
exports.getAll = async (req) => {
  const isAdmin = req.user?.role === "admin";

  let filter = {};
  if (!isAdmin) {
    filter = { isAdminAccept: true, isActive: true };
  }

  const campaigns = await Campaign.find(filter);
  return campaigns;
};

// ✅ EKLENDİ: Kampanyayı ID'ye göre getir
exports.getById = async (req) => {
  const { id } = req.params;
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }
  return campaign;
};

// ✅ EKLENDİ: Kampanyayı güncelle (admin veya sahip)
// ✅ GÜNCELLENDİ: Update campaign (segment-based)
exports.update = async (req) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  // Müşteri, istemci tarafından isAdminAccept'i değiştiremez
  if (role !== "admin" && typeof req.body.isAdminAccept !== "undefined") {
    delete req.body.isAdminAccept;
  }

  // createdUserId değiştirilemez
  if (typeof req.body.createdUserId !== "undefined") {
    delete req.body.createdUserId;
  }

  // ✅ YENİ: Segment currentParticipants korunmalı (istemci tarafından değiştirilemez)
  if (req.body.segments && Array.isArray(req.body.segments)) {
    const existingCampaign = await Campaign.findById(id).lean();
    if (existingCampaign && existingCampaign.segments) {
      req.body.segments = req.body.segments.map((newSegment, index) => {
        const existingSegment = existingCampaign.segments.find(
          (s) => s.name === newSegment.name
        );
        return {
          ...newSegment,
          // CurrentParticipants'ı koru
          currentParticipants: existingSegment?.currentParticipants || 0,
        };
      });
    }
  }

  // Admin herhangi bir kampanyayı güncelleyebilir; müşteri sadece kendisininkini
  const filter =
    role === "admin" ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error(
      "You do not have permission to update this campaign or the campaign was not found."
    );
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  return updated;
};

// ✅ EKLENDİ: Kampanyayı sil (admin için kalıcı, müşteri için yetki yok)
exports.remove = async (req) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== "admin") {
    const err = new Error("Only an admin can permanently delete a campaign.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  const deleted = await Campaign.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  return { _id: deleted._id, title: deleted.title };
};

// ✅ EKLENDİ: Kampanya silme isteği (müşteri veya admin)
exports.requestDelete = async (req) => {
  const { id } = req.params;
  const role = req.user.role;
  const userId = req.user.userId;

  // Admin veya kampanyayı oluşturan müşteri istekte bulunabilir
  const filter =
    role === "admin" ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { isActive: false, status: "pending_deletion", updatedAt: new Date() },
    { new: true }
  );

  if (!updated) {
    const err = new Error(
      "You do not have permission to create a deletion request for this campaign or the campaign was not found."
    );
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  return updated;
};

// ✅ EKLENDİ: Silme isteklerini getir (admin)
exports.getDeleteRequests = async () => {
  return await Campaign.find({ status: "pending_deletion", isActive: false });
};

// ✅ YENİ: Müşteriye ait kampanyaları getir (rol bazlı filtreleme)
exports.getByCustomer = async (req) => {
  const customerId = req.user.userId;
  const isAdmin = req.user.role === "admin";

  let filter = { createdUserId: customerId };
  if (!isAdmin) {
    filter.isAdminAccept = true;
    filter.isActive = true;
  }

  const campaigns = await Campaign.find(filter);
  return campaigns;
};

// ✅ YENİ: Tamamlanan kullanıcıları listele
exports.listCompletedUsers = async (req) => {
  // Sadece admin controller katmanında yetkilendiriliyor
  // Burada filtreleme yapılır
  const { campaignId } = req.query; // opsiyonel: belirli bir kampanya için filtreleme
  const filter = { completed: true };
  if (campaignId) {
    filter.campaignId = campaignId;
  }

  // Progress, user ve campaign bilgilerini topla
  const progresses = await UserProgress.find(filter)
    .populate("userId", "name email")
    .populate("campaignId", "title segments") // ✅ YENİ: segments
    .lean();

  if (!progresses.length) return [];

  const preferredWindow = `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;

  const results = [];
  for (const p of progresses) {
    // Orphan kayıtlara karşı güvenlik
    if (!p.userId || !p.campaignId) {
      continue;
    }

    const userIdVal = String(p.userId._id || p.userId);
    const campaignIdVal = String(p.campaignId._id || p.campaignId);

    // Segment: önce preferred window, yoksa en güncel fallback
    let segDoc = await UserSegment.findOne({
      userId: userIdVal,
      chain: "ethereum",
      window: preferredWindow,
    })
      .sort({ asOf: -1 })
      .lean();
    if (!segDoc) {
      segDoc = await UserSegment.findOne({
        userId: userIdVal,
        chain: "ethereum",
      })
        .sort({ asOf: -1 })
        .lean();
    }
    const segmentClass = segDoc?.class || null;

    // Airdrop cüzdanını bul (Wallet koleksiyonundan)
    const airdropWalletDoc = await Wallet.findOne({
      user: userIdVal,
      isAirdropAddress: true,
    }).lean();
    const airdropWallet = airdropWalletDoc?.address || null;

    // ✅ YENİ: Kullanıcının segmentine göre reward hesapla (segments array'den)
    const segment = p.campaignId.segments?.find((s) => s.name === segmentClass);
    const segmentReward = segment?.reward || 0;

    results.push({
      userId: userIdVal,
      userName: p.userId.name || null,
      campaignId: campaignIdVal,
      campaignTitle: p.campaignId.title || null,
      completedAt: p.completedAt,
      segment: segmentClass,
      reward: segmentReward,
      isPurchase: !!p.isPurchase,
      airdropWallet,
    });
  }

  return results;
};

// ✅ YENİ: Ödeme (isPurchase) durumunu güncelle
exports.updatePurchaseStatus = async (req) => {
  const { userId, campaignId } = req.params;
  const { isPurchase } = req.body;

  const progress = await UserProgress.findOne({ userId, campaignId });
  if (!progress) {
    const err = new Error("Progress not found for given user and campaign");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  progress.isPurchase = !!isPurchase;
  await progress.save();

  return {
    userId: String(userId),
    campaignId: String(campaignId),
    isPurchase: progress.isPurchase,
    updatedAt: progress.updatedAt,
  };
};

// Kampanya soru sayısını güncelle (dışarıdan erişilebilir)
exports.updateQuestionCount = updateCampaignQuestionCount;

// ✅ YENİ: Kullanıcının segmentine göre potansiyel kazanç analizi
exports.getUserSegmentEarningsAnalysis = async (req) => {
  const userId = req.user.userId;
  const segment = req.params.segment;

  const VALID_SEGMENTS = new Set(["A", "B", "C", "D"]);
  const requestedSegment = VALID_SEGMENTS.has(segment?.toString().toUpperCase())
    ? segment.toString().toUpperCase()
    : null;

  // 1. Kullanıcının mevcut segmentini al
  const userSegmentClass = requestedSegment;

  // 2. Kullanıcının tamamladığı kampanyaları ve kazandığı ödülleri hesapla
  const completedCampaigns = await UserProgress.find({
    userId,
    completed: true,
    campaignId: { $exists: true, $ne: null }, // Campaign ID'si null olmayan kayıtlar
  })
    .populate(
      "campaignId",
      "title rewards maxParticipants currentParticipants status isActive isAdminAccept"
    )
    .lean();

  let actualEarnings = 0;
  const completedCampaignDetails = [];
  console.log("Completed Campaigns:", completedCampaigns);
  
  for (const progress of completedCampaigns) {
    if (progress.campaignId && progress.campaignId.segments) {
      // ✅ YENİ: Segment array'inden kullanıcının segment'ini bul
      const segment = progress.campaignId.segments.find(
        (s) => s.name === userSegmentClass
      );
      const segmentReward = segment?.reward || 0;

      actualEarnings += segmentReward;
      completedCampaignDetails.push({
        campaignId: progress.campaignId._id,
        title: progress.campaignId.title,
        reward: segmentReward,
        segment: userSegmentClass,
        completedAt: progress.completedAt,
      });
    }
  }

  // 3. Kullanıcının segmentine uygun tüm geçmiş kampanyaları bul
  const userSegmentCampaigns = await Campaign.find({
    status: { $in: ["active", "expired", "inactive"] },
    isActive: true,
    isAdminAccept: true,
    endDate: { $lte: new Date() },
  }).lean();

  let potentialEarnings = 0;
  const potentialCampaignDetails = [];

  for (const campaign of userSegmentCampaigns) {
    // ✅ YENİ: Segment array'inden kullanıcının segment'ini bul
    const segment = campaign.segments?.find((s) => s.name === userSegmentClass);

    if (segment && segment.maxParticipants > 0) {
      const segmentReward = segment.reward || 0;
      potentialEarnings += segmentReward;
      potentialCampaignDetails.push({
        campaignId: campaign._id,
        title: campaign.title,
        reward: segmentReward,
        segment: userSegmentClass,
        segmentMaxParticipants: segment.maxParticipants,
        segmentCurrentParticipants: segment.currentParticipants,
        endDate: campaign.endDate,
      });
    }
  }

  // 4. Kullanıcının katıldığı ama tamamlamadığı kampanyaları bul
  const joinedButNotCompleted = await UserProgress.find({
    userId,
    joined: true,
    completed: false,
    campaignId: { $exists: true, $ne: null },
  })
    .populate("campaignId", "title segments status isActive isAdminAccept")
    .lean();

  const inProgressCampaigns = [];
  for (const progress of joinedButNotCompleted) {
    if (progress.campaignId && progress.campaignId.segments) {
      // ✅ YENİ: Segment array'inden kullanıcının segment'ini bul
      const segment = progress.campaignId.segments.find(
        (s) => s.name === userSegmentClass
      );
      const segmentReward = segment?.reward || 0;

      inProgressCampaigns.push({
        campaignId: progress.campaignId._id,
        title: progress.campaignId.title,
        reward: segmentReward,
        segment: userSegmentClass,
      });
    }
  }

  // 5. Sonuçları hesapla
  const missedEarnings = potentialEarnings - actualEarnings;
  const completionRate =
    potentialCampaignDetails.length > 0
      ? (completedCampaignDetails.length / potentialCampaignDetails.length) *
        100
      : 0;

  // 6. Kayıp analizi detayları
  const missedCampaigns = potentialCampaignDetails.filter(
    (campaign) =>
      !completedCampaignDetails.find(
        (completed) =>
          completed.campaignId.toString() === campaign.campaignId.toString()
      )
  );

  return {
    userSegment: {
      class: userSegmentClass,
    },
    earnings: {
      actualEarnings,
      potentialEarnings,
      missedEarnings,
      completionRate: Math.round(completionRate * 100) / 100,
    },
    campaigns: {
      completed: completedCampaignDetails,
      potential: potentialCampaignDetails,
      missed: missedCampaigns, // ✅ YENİ: Kaçırılan kampanyalar
      inProgress: inProgressCampaigns,
    },
    summary: {
      totalCompletedCampaigns: completedCampaignDetails.length,
      totalPotentialCampaigns: potentialCampaignDetails.length,
      totalMissedCampaigns: missedCampaigns.length, // ✅ YENİ: Kaçırılan kampanya sayısı
      totalInProgressCampaigns: inProgressCampaigns.length,
    },
  };
};

// ✅ GÜNCELLENDİ: Reward status (segment-based)
exports.getRewardStatus = async (req) => {
  const { id: campaignId } = req.params;
  const campaign = await Campaign.findById(campaignId, "title segments").lean();

  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Her segment için quota ve current participant bilgisi
  const segmentStatus = campaign.segments.map((segment) => ({
    name: segment.name,
    maxParticipants: segment.maxParticipants,
    currentParticipants: segment.currentParticipants,
    available: segment.maxParticipants - segment.currentParticipants,
    reward: segment.reward,
    fillRate:
      segment.maxParticipants > 0
        ? (
            (segment.currentParticipants / segment.maxParticipants) *
            100
          ).toFixed(2) + "%"
        : "0%",
  }));

  // Toplam istatistikler
  const totalMax = campaign.segments.reduce(
    (sum, s) => sum + s.maxParticipants,
    0
  );
  const totalCurrent = campaign.segments.reduce(
    (sum, s) => sum + s.currentParticipants,
    0
  );

  return {
    campaignTitle: campaign.title,
    segments: segmentStatus,
    totalStats: {
      totalMaxParticipants: totalMax,
      totalCurrentParticipants: totalCurrent,
      totalAvailable: totalMax - totalCurrent,
      overallFillRate:
        totalMax > 0
          ? ((totalCurrent / totalMax) * 100).toFixed(2) + "%"
          : "0%",
    },
  };
};
