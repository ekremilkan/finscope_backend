const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const CampaignParticipation = require("../models/campaignParticipation.model");
const { StatusCodes } = require("http-status-codes");

// Kampanyanın soru sayısını güncelle
const updateCampaignQuestionCount = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return 0;
  
  const questionCount = campaign.questionIds.length;
  await Campaign.findByIdAndUpdate(campaignId, { questions: questionCount });
  return questionCount;
};

// ✅ YENİ: Quiz tamamlama
exports.completeQuiz = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { totalTimeSpent, score, questionsAnswered, totalQuestions } = req.body;

  // UserProgress kontrolü
  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("Bu kampanyaya katılmamışsınız.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Quiz zaten tamamlanmış mı kontrolü
  if (userProgress.completed) {
    const err = new Error("Bu quiz zaten tamamlanmış.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Score validasyonu (100% olacak - tüm sorular doğru)
  if (score !== 100) {
    const err = new Error("Quiz tamamlanması için tüm sorular doğru cevaplanmalıdır.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Tüm sorular cevaplanmış mı kontrolü
  if (questionsAnswered !== totalQuestions) {
    const err = new Error("Quiz tamamlanması için tüm sorular cevaplanmalıdır.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // UserProgress güncelle
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

  // CampaignParticipation güncelle
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

// ✅ YENİ: Kullanıcının kampanya progress'ini getir
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

// ✅ YENİ: Kampanyaya katıl
exports.joinCampaign = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;

  // Kampanya kontrolü
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  if (!campaign.isActive) {
    const err = new Error("Bu kampanya aktif değil.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Zaten katılmış mı kontrolü
  const existingProgress = await UserProgress.findOne({ userId, campaignId });
  if (existingProgress && existingProgress.joined) {
    const err = new Error("Bu kampanyaya zaten katılmışsınız.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Kontenjan kontrolü
  if (campaign.participants >= campaign.maxParticipants) {
    const err = new Error("Kampanya kontenjanı dolmuştur.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // UserProgress oluştur veya güncelle
  let userProgress;
  if (existingProgress) {
    userProgress = await UserProgress.findByIdAndUpdate(
      existingProgress._id,
      {
        joined: true,
        startedAt: new Date(),
        progress: {
          currentQuestion: 0,
          totalQuestions: campaign.questions,
          answeredQuestions: [],
          correctAnswers: 0,
          wrongAnswers: 0,
          lastActivity: new Date()
        }
      },
      { new: true }
    );
  } else {
    userProgress = new UserProgress({
      userId,
      campaignId,
      joined: true,
      startedAt: new Date(),
      progress: {
        currentQuestion: 0,
        totalQuestions: campaign.questions,
        answeredQuestions: [],
        correctAnswers: 0,
        wrongAnswers: 0,
        lastActivity: new Date()
      }
    });
    await userProgress.save();
  }

  // CampaignParticipation oluştur
  const participation = new CampaignParticipation({
    campaignId,
    userId,
    joinedAt: new Date()
  });
  await participation.save();

  // Kampanya katılımcı sayısını artır
  await Campaign.findByIdAndUpdate(campaignId, {
    $inc: { participants: 1, currentParticipants: 1 }
  });

  // Güncellenmiş kampanya bilgilerini al
  const updatedCampaign = await Campaign.findById(campaignId);

  return {
    campaignId,
    userId: userId.toString(),
    joined: true,
    joinedAt: userProgress.startedAt,
    message: "Kampanyaya başarıyla katıldınız",
    participants: updatedCampaign.participants,
    maxParticipants: updatedCampaign.maxParticipants,
    remainingSlots: updatedCampaign.maxParticipants - updatedCampaign.participants
  };
};

// ✅ YENİ: Progress güncelle
exports.updateProgress = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { questionId, selectedAnswer, isCorrect, timeSpent, completed } = req.body;

  // UserProgress kontrolü
  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("Bu kampanyaya katılmamışsınız.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Progress güncelleme
  const currentQuestion = userProgress.progress.currentQuestion;
  const totalQuestions = userProgress.progress.totalQuestions;

  // Yeni progress hesaplama
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

  // Score hesaplama (100% olacak - tüm sorular doğru)
  const newScore = newProgress.correctAnswers === totalQuestions ? 100 : null;
  const newCompleted = newScore === 100;

  // UserProgress güncelle
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

  // CampaignParticipation güncelle
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

exports.create = async (req) => {
  const { 
    title, 
    description, 
    content,
    reward, 
    maxParticipants, 
    category, 
    difficulty, 
    startDate, 
    endDate, 
    questions, 
    tags,
    images,
    imageUrls,
    videoLink,
    videoUrl,
    estimatedDuration
  } = req.body;
  
  const createdUserId = req.user.userId;

  const campaign = new Campaign({ 
    title, 
    description, 
    content,
    reward, 
    maxParticipants, 
    category, 
    difficulty, 
    startDate, 
    endDate, 
    questions, 
    tags,
    images: images || [],
    imageUrls: imageUrls || [],
    videoLink: videoLink || null,
    videoUrl: videoUrl || null,
    estimatedDuration: estimatedDuration || 15,
    createdUserId 
  });
  
  await campaign.save();
  return campaign;
};

exports.getAll = async (req) => {
  const userId = req.user?._id;
  
  const campaigns = await Campaign.find()
    .populate("createdUserId", "name email")
    .sort({ createdAt: -1 });

  // ✅ YENİ: User-specific data ekle
  if (userId) {
    const userProgresses = await UserProgress.find({ userId });
    const progressMap = {};
    
    userProgresses.forEach(progress => {
      progressMap[progress.campaignId.toString()] = progress;
    });

    return campaigns.map(campaign => {
      const userProgress = progressMap[campaign._id.toString()];
      return {
        ...campaign.toObject(),
        userJoined: userProgress?.joined || false,
        userCompleted: userProgress?.completed || false,
        userScore: userProgress?.score || null,
        userTimeSpent: userProgress?.timeSpent || null,
        userProgress: userProgress?.progress || null
      };
    });
  }

  return campaigns;
};

exports.getById = async (req) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const campaign = await Campaign.findById(id)
    .populate("createdUserId", "name email");

  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // ✅ YENİ: User-specific data ekle
  const userProgress = await UserProgress.findOne({ userId, campaignId: id });
  
  return {
    ...campaign.toObject(),
    userJoined: userProgress?.joined || false,
    userCompleted: userProgress?.completed || false,
    userScore: userProgress?.score || null,
    userTimeSpent: userProgress?.timeSpent || null,
    userProgress: userProgress?.progress || null
  };
};

exports.update = async (req) => {
  const { id } = req.params;
  const createdUserId = req.user.userId;
  const userRole = req.user.role;
  
  // Admin ise tüm kampanyaları güncelleyebilir, değilse sadece kendi kampanyasını
  let campaign;
  if (userRole === 'admin') {
    campaign = await Campaign.findById(id);
  } else {
    campaign = await Campaign.findOne({ _id: id, createdUserId });
  }
  
  if (!campaign) {
    const err = new Error("Bu kampanyayı güncelleme yetkiniz yok veya kampanya bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  const updatedCampaign = await Campaign.findByIdAndUpdate(
    id, 
    req.body, 
    { new: true, runValidators: true }
  ).populate("createdUserId", "name email");
  
  return updatedCampaign;
};

exports.getByCustomer = async (req) => {
  const createdUserId = req.user.userId;
  const campaigns = await Campaign.find({ createdUserId })
    .populate("createdUserId", "name email")
    .sort({ createdAt: -1 });
  return campaigns;
};

// Customer için silme isteği (isActive false yapar)
exports.requestDelete = async (req) => {
  const { id } = req.params;
  const createdUserId = req.user.userId;
  const userRole = req.user.role;

  // Admin ise direkt silme yapabilir, customer ise sadece isActive false yapar
  if (userRole === 'admin') {
    await Campaign.findByIdAndDelete(id);
    return { message: "Kampanya silindi." };
  } else {
    // Customer sadece kendi kampanyasını silme isteği yapabilir
    const campaign = await Campaign.findOne({ _id: id, createdUserId });
    
    if (!campaign) {
      const err = new Error("Bu kampanyayı silme yetkiniz yok veya kampanya bulunamadı.");
      err.statusCode = StatusCodes.FORBIDDEN;
      throw err;
    }

    // isActive false yap
    await Campaign.findByIdAndUpdate(id, { isActive: false });
    return { 
      message: "Kampanya silme isteği gönderildi. Admin onayı bekleniyor.",
      campaignId: id
    };
  }
};

// Sadece admin için gerçek silme işlemi
exports.remove = async (req) => {
  const { id } = req.params;
  const userRole = req.user.role;

  // Sadece admin gerçek silme yapabilir
  if (userRole !== 'admin') {
    const err = new Error("Bu işlem için admin yetkisi gereklidir.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  const campaign = await Campaign.findById(id);
  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  await Campaign.findByIdAndDelete(id);
  return { message: "Kampanya kalıcı olarak silindi." };
};

// Kampanya durumunu güncelle (cron job için)
exports.updateExpiredCampaigns = async () => {
  const now = new Date();
  const result = await Campaign.updateMany(
    { 
      endDate: { $lt: now },
      status: { $ne: 'expired' }
    },
    { 
      status: 'expired',
      isActive: false
    }
  );
  return result;
};

// Admin için silme isteklerini getir
exports.getDeleteRequests = async () => {
  const campaigns = await Campaign.find({ isActive: false })
    .populate("createdUserId", "name email")
    .sort({ updatedAt: -1 });
  return campaigns;
};

// Kampanyanın soru sayısını güncelle (dışarıdan erişilebilir)
exports.updateQuestionCount = updateCampaignQuestionCount;