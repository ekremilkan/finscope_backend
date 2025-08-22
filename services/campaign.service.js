const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const CampaignParticipation = require("../models/campaignParticipation.model");
const UserSegment = require("../models/userSegment.model");
const Wallet = require("../models/wallet.model");
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
  const { totalTimeSpent, score, questionsAnswered, totalQuestions } = req.body;

  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("You have not joined this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (userProgress.completed) {
    const err = new Error("This quiz has already been completed.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (score !== 100) {
    const err = new Error("All questions must be answered correctly to complete the quiz.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (questionsAnswered !== totalQuestions) {
    const err = new Error("All questions must be answered to complete the quiz.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const updatedUserProgress = await UserProgress.findByIdAndUpdate(
    userProgress._id,
    {
      completed: true,
      score: 100,
      timeSpent: totalTimeSpent,
      progress: {
        ...userProgress.progress,
        currentQuestion: totalQuestions,
        answeredQuestions: Array.from({ length: totalQuestions }, (_, i) => i),
        correctAnswers: totalQuestions,
        wrongAnswers: 0,
        lastActivity: new Date()
      },
      completedAt: new Date()
    },
    { new: true }
  );

  await CampaignParticipation.findOneAndUpdate(
    { userId, campaignId },
    {
      score: 100,
      timeSpent: totalTimeSpent,
      status: 'completed',
      completedAt: new Date()
    }
  );

  return {
    campaignId,
    userId: userId.toString(),
    completed: true,
    completedAt: updatedUserProgress.completedAt,
    score: 100,
    totalTimeSpent
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
      score: null,
      timeSpent: 0,
      progress: {
        currentQuestion: 0,
        totalQuestions: 0,
        answeredQuestions: [],
        correctAnswers: 0,
        wrongAnswers: 0,
        lastActivity: null
      },
      startedAt: null,
      completedAt: null
    };
  }

  return userProgress;
};

// ✅ GÜNCELLENDİ: Kampanyaya katıl (Adminler kontenjan kontrolünü atlar)
exports.joinCampaign = async (req) => {
  const { id: campaignId } = req.params;
  const { userId, role } = req.user;

  // --- 1. Gerekli Belgeleri Başlangıçta Çek ---
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

  const existingProgress = await UserProgress.findOne({ userId, campaignId });
  const existingParticipation = await CampaignParticipation.findOne({ userId, campaignId });

  // --- 2. Tamamlama Kontrolü (En Yüksek Öncelik) ---
  if (existingProgress && existingProgress.completed) {
    const err = new Error("You have already completed this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // --- 3. Normal Kullanıcılar için Segment ve Kontenjan Kontrolü ---
  let userSegment;
  if (role !== 'admin') {
    const preferredWindow = `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;
    let segDoc = await UserSegment.findOne({ userId, chain: "ethereum", window: preferredWindow }).lean();
    if (!segDoc) {
      segDoc = await UserSegment.findOne({ userId, chain: "ethereum" }).sort({ asOf: -1 }).lean();
    }
    userSegment = segDoc?.class;

    if (!['A','B','C','D'].includes(userSegment)) {
      const err = new Error("User segment not found. Please try again after the segment has been recalculated.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }

    // Kontenjan kontrolü sadece kullanıcı ilk defa katılıyorsa yapılır.
    if (!existingParticipation) {
        const maxSeg = campaign.maxParticipants[userSegment] || 0;
        const curSeg = campaign.currentParticipants[userSegment] || 0;
        if (curSeg >= maxSeg) {
          const err = new Error(`The quota for campaign segment ${userSegment} is full.`);
          err.statusCode = StatusCodes.BAD_REQUEST;
          throw err;
        }
    }
  }

  // --- 4. UserProgress Kaydını Oluştur veya Sıfırla ---
  // Kullanıcı ister ilk defa katılsın, isterse yarım bıraktığı quize devam etsin,
  // bu blok çalışarak quizi en baştan başlatır.
  if (existingProgress) {
    // Kayıt varsa, ilerlemeyi sıfırla
    existingProgress.joined = true;
    existingProgress.startedAt = new Date();
    existingProgress.progress = {
      currentQuestion: 0,
      totalQuestions: campaign.questions.length, // Soru sayısını campaign'den al
      answeredQuestions: [],
      correctAnswers: 0,
      wrongAnswers: 0,
      lastActivity: new Date()
    };
    await existingProgress.save();
  } else {
    // Kayıt yoksa, yeni kayıt oluştur
    await UserProgress.create({
      userId,
      campaignId,
      joined: true,
      startedAt: new Date(),
      progress: {
        totalQuestions: campaign.questions.length,
      }
    });
  }

  // --- 5. Katılım Kaydını ve Sayacı SADECE İLK GİRİŞTE Oluştur/Güncelle ---
  // Bu blok, duplicate hatasını engeller ve sayacın sadece bir kez artmasını sağlar.
  if (!existingParticipation) {
    await CampaignParticipation.create({ campaignId, userId, joinedAt: new Date() });
    
    if (role === 'admin') {
        campaign.currentParticipants.admin = (campaign.currentParticipants.admin || 0) + 1;
    } else {
        campaign.currentParticipants[userSegment] = (campaign.currentParticipants[userSegment] || 0) + 1;
    }
    
    campaign.participants = Object.values(campaign.currentParticipants).reduce((a, b) => a + b, 0);
    await campaign.save();
  }

  // --- 6. Başarılı Cevap Döndür ---
  return {
    campaignId,
    userId: userId.toString(),
    joined: true,
    message: "Successfully joined/continued the campaign."
  };
};

// ✅ YENİ: İlerlemeyi güncelle
exports.updateProgress = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { questionId, selectedAnswer, isCorrect, timeSpent, completed } = req.body;

  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("You have not joined this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const currentQuestion = userProgress.progress.currentQuestion;
  const totalQuestions = userProgress.progress.totalQuestions;

  const newProgress = {
    currentQuestion: isCorrect ? currentQuestion + 1 : currentQuestion,
    totalQuestions,
    answeredQuestions: isCorrect
      ? [...userProgress.progress.answeredQuestions, currentQuestion]
      : userProgress.progress.answeredQuestions,
    correctAnswers: userProgress.progress.correctAnswers + (isCorrect ? 1 : 0),
    wrongAnswers: userProgress.progress.wrongAnswers + (isCorrect ? 0 : 1),
    lastActivity: new Date()
  };

  const newScore = newProgress.correctAnswers === totalQuestions ? 100 : null;
  const newCompleted = newScore === 100;

  const updatedUserProgress = await UserProgress.findByIdAndUpdate(
    userProgress._id,
    {
      score: newScore,
      completed: newCompleted,
      timeSpent: userProgress.timeSpent + timeSpent,
      progress: newProgress,
      completedAt: newCompleted ? new Date() : null
    },
    { new: true }
  );

  await CampaignParticipation.findOneAndUpdate(
    { userId, campaignId },
    {
      score: newScore,
      timeSpent: updatedUserProgress.timeSpent,
      status: newCompleted ? 'completed' : 'active',
      completedAt: newCompleted ? new Date() : null
    }
  );

  return {
    campaignId,
    userId: userId.toString(),
    progress: newProgress,
    score: newScore,
    completed: newCompleted
  };
};

// ✅ YENİ: Kampanya oluştur (isAdminAccept kontrolü)
exports.create = async (req) => {
  const {
    title, description, content, reward, maxParticipants, category,
    startDate, endDate, questions, tags, images,
    videoUrl, estimatedDuration
  } = req.body;

  const createdUserId = req.user.userId;
  const role = req.user.role;

  const campaign = new Campaign({
    title, description, content, reward, maxParticipants, category,
    startDate, endDate, questions, tags, images, // Modeldeki 'image' alanı kullanılıyor
    videoUrl: videoUrl || "", // Modeldeki 'videoUrl' alanı kullanılıyor
    estimatedDuration: estimatedDuration || 15,
    createdUserId,
    currentParticipants: {A:0,B:0,C:0,D:0},
    isAdminAccept: role === "admin" ? true : false,
    // isActive'i doğrudan true yapmak yerine modelin pre-save hook'una bırakmak daha doğru olabilir.
    // Model zaten başlangıç ve bitiş tarihine göre status'ü ve isActive'i ayarlayacaktır.
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
exports.update = async (req) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  // Müşteri, istemci tarafından isAdminAccept'i değiştiremez
  if (role !== 'admin' && typeof req.body.isAdminAccept !== 'undefined') {
    delete req.body.isAdminAccept;
  }

  // createdUserId değiştirilemez
  if (typeof req.body.createdUserId !== 'undefined') {
    delete req.body.createdUserId;
  }

  // Admin herhangi bir kampanyayı güncelleyebilir; müşteri sadece kendisininkini
  const filter = role === 'admin' ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("You do not have permission to update this campaign or the campaign was not found.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  return updated;
};

// ✅ EKLENDİ: Kampanyayı sil (admin için kalıcı, müşteri için yetki yok)
exports.remove = async (req) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== 'admin') {
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
  const filter = role === 'admin' ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { isActive: false, status: 'pending_deletion', updatedAt: new Date() },
    { new: true }
  );

  if (!updated) {
    const err = new Error("You do not have permission to create a deletion request for this campaign or the campaign was not found.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  return updated;
};

// ✅ EKLENDİ: Silme isteklerini getir (admin)
exports.getDeleteRequests = async () => {
  return await Campaign.find({ status: 'pending_deletion', isActive: false });
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
    .populate('userId', 'name email')
    .populate('campaignId', 'title reward')
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
    let segDoc = await UserSegment.findOne({ userId: userIdVal, chain: 'ethereum', window: preferredWindow })
      .sort({ asOf: -1 })
      .lean();
    if (!segDoc) {
      segDoc = await UserSegment.findOne({ userId: userIdVal, chain: 'ethereum' })
        .sort({ asOf: -1 })
        .lean();
    }
    const segmentClass = segDoc?.class || null;

    // Airdrop cüzdanını bul (Wallet koleksiyonundan)
    const airdropWalletDoc = await Wallet.findOne({ user: userIdVal, isAirdropAddress: true }).lean();
    const airdropWallet = airdropWalletDoc?.address || null;

    results.push({
      userId: userIdVal,
      userName: p.userId.name || null,
      campaignId: campaignIdVal,
      campaignTitle: p.campaignId.title || null,
      completedAt: p.completedAt,
      segment: segmentClass,
      reward: p.campaignId.reward,
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
    const err = new Error('Progress not found for given user and campaign');
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  progress.isPurchase = !!isPurchase;
  await progress.save();

  return {
    userId: String(userId),
    campaignId: String(campaignId),
    isPurchase: progress.isPurchase,
    updatedAt: progress.updatedAt
  };
};

// Kampanya soru sayısını güncelle (dışarıdan erişilebilir)
exports.updateQuestionCount = updateCampaignQuestionCount;