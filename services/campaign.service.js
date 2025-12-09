const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const UserSegment = require("../models/userSegment.model");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const UserCampaign = require("../models/userCampaign.model");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const { transformCampaignByLanguage, detectLanguage } = require("../utils/i18n");

// Kampanya soru sayısını güncelle
const updateCampaignQuestionCount = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return 0;

  const questionCount = campaign.questionIds.length;
  await Campaign.findByIdAndUpdate(campaignId, { questions: questionCount });
  return questionCount;
};

// ✅ YENİ: Quizi tamamla (Race Condition Fix ile)
exports.completeQuiz = async (req) => {
  const { id: campaignId } = req.params;
  const { userId } = req.user;

  // 🔍 Kampanya kontrolü
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // 🟢 Zorunlu kampanya (onboarding vb.) tamamlanmışsa
  if (campaign.isRequired === true) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      const err = new Error("User not found while completing required campaign.");
      err.statusCode = StatusCodes.NOT_FOUND;
      throw err;
    }

    console.log(`✅ [REQUIRED CAMPAIGN] User ${userId} onboarding completed.`);

    return {
      success: true,
      message: "Required campaign completed successfully.",
      data: {
        userId: updatedUser._id,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
      },
    };
  }

  // 🔵 Normal kampanya süreci
  const progress = await UserProgress.findOne({ userId, campaignId });

  if (!progress) {
    // 🧩 Eğer kayıt yoksa otomatik oluşturmak istersen (isteğe bağlı)
    // await UserProgress.create({ userId, campaignId, completed: true, completedAt: new Date() });
    const err = new Error("User progress not found for this campaign.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Güncelle
  progress.completed = true;
  progress.completedAt = new Date();
  await progress.save();

  console.log(`🎯 [CAMPAIGN COMPLETE] User ${userId} completed campaign ${campaignId}`);

  return {
    success: true,
    message: "Campaign completed successfully.",
    data: {
      campaignId,
      completedAt: progress.completedAt,
    },
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
      earnedAmount: 0,
      depositedAmount: 0,
    };
  }

  return userProgress;
};

// ✅ GÜNCELLENDİ: Kampanyaya katıl (Segment-based)
exports.joinCampaign = async (req) => {
  const { id: campaignId, segment: segmentParam } = req.params;
  const { userId, role } = req.user;

  // 🔹 Kullanıcıyı bul
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // 🔹 Kampanyayı bul
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

  // 🔹 Zorunlu kampanyayı tespit et
  const requiredCampaign = await Campaign.findOne({ isRequired: true, isActive: true });
  const isRequiredCampaign =
    requiredCampaign && requiredCampaign._id.toString() === campaignId;

  // 🧠 1️⃣ Eğer kullanıcı zaten onboarding'i tamamladıysa ve tekrar girmeye çalışıyorsa:
  if (campaign.isRequired && user.hasCompletedOnboarding) {
    const err = new Error("ONBOARDING_ALREADY_COMPLETED");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 🧠 2️⃣ Eğer zorunlu kampanya değilse ama onboarding yapılmadıysa: izin yok
  if (!isRequiredCampaign && requiredCampaign && !user.hasCompletedOnboarding) {
    const err = new Error("ONBOARDING_REQUIRED");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  // 🟢 Eğer zorunlu kampanyaysa, UserProgress’e kayıt oluşturma!
  if (isRequiredCampaign) {
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          hasJoinedOnboarding: true,
          onboardingJoinedAt: new Date(),
        },
      },
      { new: true }
    );

    console.log(`✅ [REQUIRED CAMPAIGN JOINED] User ${userId} joined onboarding campaign`);

    return {
      campaignId,
      userId,
      joined: true,
      segment: "ALL",
      message: "User joined required campaign (UserProgress not created).",
    };
  }

  // 🔹 Normal kampanyalar (önceki hali aynı kalıyor)
  const VALID_SEGMENTS = new Set(["A", "B", "C", "D", "ALL"]);
  const fromParam = (segmentParam || "").toString().trim().toUpperCase();
  const userSegmentClass = VALID_SEGMENTS.has(fromParam) ? fromParam : "A";

  const segment = campaign.segments.find((s) => s.name === userSegmentClass);
  if (!segment) {
    const err = new Error("Your wallet does not fit the segments of this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const isRewardLimited = segment.maxParticipants > 0;
  const eligibleForReward =
    !isRewardLimited || segment.currentParticipants < segment.maxParticipants;

  const existingProgress = await UserProgress.findOne({ userId, campaignId });
  if (!existingProgress) {
    await UserProgress.create({
      userId,
      campaignId,
      joined: true,
      startedAt: new Date(),
      joinedAt: new Date(),
      segment: userSegmentClass,
      eligibleForReward,
      status: "joined",
    });
  } else {
    existingProgress.joined = true;
    existingProgress.segment = userSegmentClass;
    existingProgress.eligibleForReward = eligibleForReward;
    existingProgress.status = "joined";
    await existingProgress.save();
  }

  return {
    campaignId,
    userId,
    joined: true,
    segment: userSegmentClass,
    rewardEligibility: eligibleForReward,
    message: "Joined campaign successfully.",
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
      score: newCompleted ? 100 : (userProgress.score || 0),
      status: newCompleted ? "completed" : "active",
    },
    { new: true }
  );

  return {
    campaignId,
    userId: userId.toString(),
    completed: newCompleted,
  };
};

// ✅ GÜNCELLENDİ: Kampanya oluştur (segment-based + çoklu dil)
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

  // ✅ Çoklu dil yapısını doğrula
  if (!title || !title.tr || !title.en) {
    const err = new Error('Title must have both tr and en translations');
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }
  
  if (!description || !description.tr || !description.en) {
    const err = new Error('Description must have both tr and en translations');
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

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
    // Segment description'ı çoklu dil formatına çevir (eğer varsa)
    description: segment.description && typeof segment.description === 'object' 
      ? segment.description 
      : segment.description 
        ? { tr: segment.description, en: segment.description }
        : undefined
  }));

  // Content array'ini çoklu dil formatına çevir
  const processedContent = (content || []).map(item => ({
    itemTitle: {
      tr: item.itemTitle?.tr || item.itemTitle || '',
      en: item.itemTitle?.en || item.itemTitle || ''
    },
    itemDescription: {
      tr: item.itemDescription?.tr || item.itemDescription || '',
      en: item.itemDescription?.en || item.itemDescription || ''
    },
    itemImage: item.itemImage || '',
    itemVideo: item.itemVideo || '',
    itemIndex: item.itemIndex || 1
  }));

  const campaign = new Campaign({
    title: {
      tr: title.tr,
      en: title.en
    },
    description: {
      tr: description.tr,
      en: description.en
    },
    content: processedContent,
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

// ✅ YENİ: Tüm kampanyaları getir (rol bazlı filtreleme + kullanıcı segment bilgisi + çoklu dil)
exports.getAll = async (req) => {
  const isAdmin = req.user?.role === "admin";
  const userId = req.user.userId;
  // Dil algılama: query param > user preference > Accept-Language header > default
  const lang = detectLanguage(req);

  let matchFilter = {};
  if (!isAdmin) {
    matchFilter = { isAdminAccept: true, isActive: true };
  }

  // Aggregation pipeline ile performanslı çözüm
  const campaignsWithUserSegment = await Campaign.aggregate([
    {
      $match: matchFilter
    },
    {
      $lookup: {
        from: "usercampaigns", // UserCampaign collection adı
        let: { campaignId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$campaign_id", "$$campaignId"] },
                  { $eq: ["$user_id", new mongoose.Types.ObjectId(userId)] }
                ]
              }
            }
          }
        ],
        as: "userCampaign"
      }
    },
    {
      $addFields: {
        userSegment: {
          $ifNull: [{ $arrayElemAt: ["$userCampaign.class", 0] }, null]
        }
      }
    },
    {
      $addFields: {
        userReward: {
          $let: {
            vars: {
              segment: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$segments",
                      cond: { $eq: ["$$this.name", "$userSegment"] }
                    }
                  },
                  0
                ]
              }
            },
            in: "$$segment.reward"
          }
        }
      }
    },
    {
      $project: {
        userCampaign: 0 // Gereksiz alanı kaldır
      }
    },
    {
      $sort: { startDate: -1 }
    }
  ]);

  // Her kampanyayı istenen dile göre transform et
  return campaignsWithUserSegment.map(campaign => transformCampaignByLanguage(campaign, lang, 'tr'));
};

// ✅ EKLENDİ: Kampanyayı ID'ye göre getir (çoklu dil)
exports.getById = async (req) => {
  const { id } = req.params;
  
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }
  
  // ✅ YENİ: Admin panel için tüm dil verilerini döndür (allLanguages=true query parametresi ile)
  // Frontend geliştirici form düzenleme için tüm dil verilerine ihtiyaç duyuyor
  if (req.query && req.query.allLanguages === 'true') {
    // Ham veriyi döndür (tüm dil verileri ile birlikte)
    const campaignObj = campaign.toObject ? campaign.toObject() : campaign;
    return campaignObj;
  }
  
  // Normal kullanım: Sadece istenen dilde transform edilmiş veri döndür
  // Dil algılama: query param > user preference > Accept-Language header > default
  const lang = detectLanguage(req);
  return transformCampaignByLanguage(campaign, lang, 'tr');
};

// ✅ EKLENDİ: Kampanyayı güncelle (admin veya sahip + çoklu dil)
// ✅ GÜNCELLENDİ: Update campaign (segment-based + çoklu dil)
exports.update = async (req) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const { title, description, content, ...otherFields } = req.body;

  // Müşteri, istemci tarafından isAdminAccept'i değiştiremez
  if (role !== "admin" && typeof otherFields.isAdminAccept !== "undefined") {
    delete otherFields.isAdminAccept;
  }

  // createdUserId değiştirilemez
  if (typeof otherFields.createdUserId !== "undefined") {
    delete otherFields.createdUserId;
  }

  const campaign = await Campaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Yetki kontrolü
  if (role !== "admin" && campaign.createdUserId.toString() !== userId) {
    const err = new Error("You do not have permission to update this campaign.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  // ✅ Çoklu dil alanlarını güncelle
  if (title) {
    // Eğer mevcut title çoklu dil formatında değilse, önce dönüştür
    const currentTitle = typeof campaign.title === 'object' 
      ? campaign.title 
      : { tr: campaign.title || '', en: campaign.title || '' };
    
    campaign.title = {
      tr: title.tr || currentTitle.tr || '',
      en: title.en || currentTitle.en || ''
    };
  }
  
  if (description) {
    // Eğer mevcut description çoklu dil formatında değilse, önce dönüştür
    const currentDescription = typeof campaign.description === 'object' 
      ? campaign.description 
      : { tr: campaign.description || '', en: campaign.description || '' };
    
    campaign.description = {
      tr: description.tr || currentDescription.tr || '',
      en: description.en || currentDescription.en || ''
    };
  }
  
  if (content) {
    campaign.content = content.map(item => ({
      itemTitle: {
        tr: item.itemTitle?.tr || '',
        en: item.itemTitle?.en || ''
      },
      itemDescription: {
        tr: item.itemDescription?.tr || '',
        en: item.itemDescription?.en || ''
      },
      itemImage: item.itemImage || '',
      itemVideo: item.itemVideo || '',
      itemIndex: item.itemIndex || 1
    }));
  }

  // ✅ YENİ: Segment currentParticipants korunmalı (istemci tarafından değiştirilemez)
  if (otherFields.segments && Array.isArray(otherFields.segments)) {
    otherFields.segments = otherFields.segments.map((newSegment) => {
      const existingSegment = campaign.segments.find(
        (s) => s.name === newSegment.name
      );
      return {
        ...newSegment,
        // CurrentParticipants'ı koru
        currentParticipants: existingSegment?.currentParticipants || 0,
        // Segment description'ı çoklu dil formatına çevir (eğer varsa)
        description: newSegment.description && typeof newSegment.description === 'object' 
          ? newSegment.description 
          : newSegment.description 
            ? { tr: newSegment.description, en: newSegment.description }
            : existingSegment?.description
      };
    });
  }

  // Diğer alanları güncelle
  Object.assign(campaign, otherFields);
  campaign.updatedAt = new Date();

  await campaign.save();
  return campaign;
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

  // Title artık çoklu dil formatında, varsayılan olarak tr döndür
  const titleString = typeof deleted.title === 'object' 
    ? (deleted.title.tr || deleted.title.en || '') 
    : deleted.title;

  return { _id: deleted._id, title: titleString };
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

// ✅ YENİ: Müşteriye ait kampanyaları getir (rol bazlı filtreleme + çoklu dil)
exports.getByCustomer = async (req) => {
  const customerId = req.user.userId;
  const isAdmin = req.user.role === "admin";
  // Dil algılama: query param > user preference > Accept-Language header > default
  const lang = detectLanguage(req);

  let filter = { createdUserId: customerId };
  if (!isAdmin) {
    filter.isAdminAccept = true;
    filter.isActive = true;
  }

  const campaigns = await Campaign.find(filter).lean();
  // Her kampanyayı istenen dile göre transform et
  return campaigns.map(campaign => transformCampaignByLanguage(campaign, lang, 'tr'));
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
    .populate("campaignId", "title segments") // ✅ segments lazım
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

    // ✅ Kullanıcının segmentine göre reward (segments array'den)
    const segment = p.campaignId.segments?.find((s) => s.name === segmentClass);
    const segmentReward = segment?.reward || 0;

    // Title artık çoklu dil formatında, varsayılan olarak tr döndür
    const campaignTitle =
      typeof p.campaignId.title === "object"
        ? p.campaignId.title.tr || p.campaignId.title.en || null
        : p.campaignId.title || null;

    // ✅ Social verification alanlarını hazırla
    const twitter = p.socialVerification?.twitter || {};
    const telegram = p.socialVerification?.telegram || {};

    results.push({
      userId: userIdVal,
      userName: p.userId.name || null,
      campaignId: campaignIdVal,
      campaignTitle,
      completedAt: p.completedAt,
      segment: segmentClass,
      reward: segmentReward,
      isPurchase: !!p.isPurchase,
      airdropWallet,

      // ✅ Ödül uygunluğu / sebep
      eligibleForReward: p.eligibleForReward,
      ineligibleReason: p.ineligibleReason || null,

      // ✅ Twitter doğrulama bilgileri
      twitterUserName: twitter.userName || null,
      twitterIsFollowing:
        typeof twitter.isFollowing === "boolean"
          ? twitter.isFollowing
          : null,
      twitterCheckedAt: twitter.checkedAt || null,

      // ✅ Telegram doğrulama bilgileri
      telegramUserName: telegram.userName || null,
      telegramIsMember:
        typeof telegram.isMember === "boolean" ? telegram.isMember : null,
      telegramCheckedAt: telegram.checkedAt || null,
    });
  }

  return results;
};


// ✅ YENİ: Ödeme (isPurchase) durumunu güncelle
exports.updatePurchaseStatus = async (req) => {
  const { userId, campaignId } = req.params;
  const { isPurchase, depositedAmount } = req.body;

  const progress = await UserProgress.findOne({ userId, campaignId });
  if (!progress) {
    const err = new Error("Progress not found for given user and campaign");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  progress.isPurchase = !!isPurchase;
  if (typeof depositedAmount === "number" && depositedAmount >= 0) {
    progress.depositedAmount = depositedAmount;
  }
  await progress.save();

  return {
    userId: String(userId),
    campaignId: String(campaignId),
    isPurchase: progress.isPurchase,
    depositedAmount: progress.depositedAmount,
    updatedAt: progress.updatedAt,
  };
};

// Kampanya soru sayısını güncelle (dışarıdan erişilebilir)
exports.updateQuestionCount = updateCampaignQuestionCount;

// ✅ YENİ: Kullanıcının kampanyalarına göre potansiyel kazanç analizi (UserCampaign tabanlı)
exports.getUserSegmentEarningsAnalysis = async (req) => {
  const userId = req.user.userId;

  // 1. Kullanıcının tüm UserCampaign kayıtlarını al
  const userCampaigns = await UserCampaign.find({ user_id: userId }).lean();
  
  // UserCampaign'leri campaign_id'ye göre map'le
  const userCampaignMap = new Map();
  userCampaigns.forEach(uc => {
    userCampaignMap.set(uc.campaign_id.toString(), uc.class);
  });

  // 2. Kullanıcının tamamladığı kampanyaları ve kazandığı ödülleri hesapla
  const completedCampaigns = await UserProgress.find({
    userId,
    completed: true,
    campaignId: { $exists: true, $ne: null },
  })
    .populate("campaignId", "title segments")
    .lean();

  let actualEarnings = 0;
  const completedCampaignDetails = [];

  for (const progress of completedCampaigns) {
    if (progress.campaignId && progress.campaignId.segments) {
      // Bu kampanyada kullanıcının gerçek segmentini bul
      const userSegment = userCampaignMap.get(progress.campaignId._id.toString());
      
      if (userSegment) {
        const segment = progress.campaignId.segments.find(s => s.name === userSegment);
        const segmentReward = segment?.reward || 0;
        
        actualEarnings += segmentReward;
        
        // Title artık çoklu dil formatında, varsayılan olarak tr döndür
        const campaignTitle = typeof progress.campaignId.title === 'object'
          ? (progress.campaignId.title.tr || progress.campaignId.title.en || '')
          : progress.campaignId.title || '';
        
        completedCampaignDetails.push({
          campaignId: progress.campaignId._id,
          title: campaignTitle,
          reward: segmentReward,
          userSegment,
          completedAt: progress.completedAt,
        });
      }
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
    // Bu kampanyada kullanıcının segmentini kontrol et
    const userSegment = userCampaignMap.get(campaign._id.toString());
    
    if (userSegment) {
      const segment = campaign.segments?.find(s => s.name === userSegment);
      
      if (segment && segment.maxParticipants > 0) {
        const segmentReward = segment.reward || 0;
        potentialEarnings += segmentReward;
        
        // Title artık çoklu dil formatında, varsayılan olarak tr döndür
        const campaignTitle = typeof campaign.title === 'object'
          ? (campaign.title.tr || campaign.title.en || '')
          : campaign.title || '';
        
        potentialCampaignDetails.push({
          campaignId: campaign._id,
          title: campaignTitle,
          reward: segmentReward,
          userSegment,
          segmentMaxParticipants: segment.maxParticipants,
          segmentCurrentParticipants: segment.currentParticipants,
          endDate: campaign.endDate,
        });
      }
    }
  }

  // 4. Kullanıcının katıldığı ama tamamlamadığı kampanyaları bul
  const joinedButNotCompleted = await UserProgress.find({
    userId,
    joined: true,
    completed: false,
    campaignId: { $exists: true, $ne: null },
  })
    .populate("campaignId", "title segments")
    .lean();

  const inProgressCampaigns = [];
  for (const progress of joinedButNotCompleted) {
    if (progress.campaignId && progress.campaignId.segments) {
      const userSegment = userCampaignMap.get(progress.campaignId._id.toString());
      
      if (userSegment) {
        const segment = progress.campaignId.segments.find(s => s.name === userSegment);
        const segmentReward = segment?.reward || 0;

        // Title artık çoklu dil formatında, varsayılan olarak tr döndür
        const campaignTitle = typeof progress.campaignId.title === 'object'
          ? (progress.campaignId.title.tr || progress.campaignId.title.en || '')
          : progress.campaignId.title || '';

        inProgressCampaigns.push({
          campaignId: progress.campaignId._id,
          title: campaignTitle,
          reward: segmentReward,
          userSegment,
        });
      }
    }
  }

  // 5. Sonuçları hesapla
  const missedEarnings = potentialEarnings - actualEarnings;
  const completionRate =
    potentialCampaignDetails.length > 0
      ? (completedCampaignDetails.length / potentialCampaignDetails.length) * 100
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
    userCampaigns: {
      totalUserCampaigns: userCampaigns.length,
      segments: [...new Set(userCampaigns.map(uc => uc.class))], // Kullanıcının tüm segmentleri
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
      missed: missedCampaigns,
      inProgress: inProgressCampaigns,
    },
    summary: {
      totalCompletedCampaigns: completedCampaignDetails.length,
      totalPotentialCampaigns: potentialCampaignDetails.length,
      totalMissedCampaigns: missedCampaigns.length,
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

  // Title artık çoklu dil formatında, dil parametresine göre döndür
  const lang = detectLanguage(req);
  const campaignTitle = typeof campaign.title === 'object'
    ? (campaign.title[lang] || campaign.title.tr || campaign.title.en || '')
    : campaign.title || '';

  return {
    campaignTitle: campaignTitle,
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

// ✅ Yeni: Kampanyaları durumuna göre getir (örneğin status=ended)
exports.getByStatus = async (req) => {
  const { status } = req.query;

  let filter = {};

  if (status === "ended") {
    filter.endDate = { $lt: new Date() }; // bitmiş kampanyalar
  } else if (status === "active") {
    filter.startDate = { $lte: new Date() };
    filter.endDate = { $gte: new Date() };
    filter.isActive = true;
  } else if (status === "upcoming") {
    filter.startDate = { $gt: new Date() };
  }

  // sadece onaylı kampanyaları döndür (güvenlik için)
  filter.isAdminAccept = true;

  const campaigns = await Campaign.find(filter)
    .select("_id title endDate startDate isActive")
    .sort({ endDate: -1 })
    .lean();

  // Çoklu dil destekli title dönüşümü
  const lang = detectLanguage(req);
  return campaigns.map((c) => ({
    _id: c._id,
    title:
      typeof c.title === "object"
        ? c.title[lang] || c.title.tr || c.title.en
        : c.title,
    startDate: c.startDate,
    endDate: c.endDate,
    isActive: c.isActive,
  }));
};

exports.getRequiredCampaign = async () => {
  const requiredCampaign = await Campaign.findOne({ isRequired: true }).select(
    "_id title description isActive startDate endDate"
  );

  if (!requiredCampaign) {
    const err = new Error("Required onboarding campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  return requiredCampaign;
};