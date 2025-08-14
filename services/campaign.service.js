const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const CampaignParticipation = require("../models/campaignParticipation.model");
const UserSegment = require("../models/userSegment.model");
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

  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("Bu kampanyaya katılmamışsınız.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (userProgress.completed) {
    const err = new Error("Bu quiz zaten tamamlanmış.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (score !== 100) {
    const err = new Error("Quiz tamamlanması için tüm sorular doğru cevaplanmalıdır.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (questionsAnswered !== totalQuestions) {
    const err = new Error("Quiz tamamlanması için tüm sorular cevaplanmalıdır.");
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

// ✅ GÜNCELLENDİ: Kampanyaya katıl (Adminler için kontenjan kontrolsüz)
exports.joinCampaign = async (req) => {
  const { id: campaignId } = req.params;
  const { userId, role } = req.user; // Rol bilgisi alınıyor

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

  const existingProgress = await UserProgress.findOne({ userId, campaignId });
  if (existingProgress && existingProgress.joined) {
    const err = new Error("Bu kampanyaya zaten katılmışsınız.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // --- YENİ: Admin rolü için özel kontrol bloğu (Kontenjanı atlar) ---
  if (role === 'admin') {
    // Admin, segment ve kontenjan kontrolünü atlar.
    let userProgress;
    if (existingProgress) {
      userProgress = await UserProgress.findByIdAndUpdate(existingProgress._id, { joined: true, startedAt: new Date() }, { new: true });
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

    const participation = new CampaignParticipation({ campaignId, userId, joinedAt: new Date() });
    await participation.save();

    // Adminleri ayrı bir sayaçta tutarak segment kontenjanını etkilemelerini önlüyoruz.
    if (!campaign.currentParticipants.admin) {
        campaign.currentParticipants.admin = 0;
    }
    campaign.currentParticipants.admin += 1;
    // Toplam katılımcı sayısını güncelle
    campaign.participants = Object.values(campaign.currentParticipants).reduce((a, b) => a + b, 0);
    await campaign.save();

    return {
      campaignId,
      userId: userId.toString(),
      joined: true,
      joinedAt: userProgress.startedAt,
      message: "Admin olarak kampanyaya başarıyla katıldınız (segment ve kontenjan kontrolü atlandı)."
    };
  }
  // --- Admin kontrol bloğu sonu ---


  // --- Normal Kullanıcılar İçin Mantık (Kontenjan kontrolü dahil) ---
  // Aşağıdaki mantık, sadece rolü 'admin' olmayan kullanıcılar için çalışır.
  const preferredWindow = `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;
  let segDoc = await UserSegment.findOne({ userId, chain: "ethereum", window: preferredWindow }).lean();
  if (!segDoc) {
    segDoc = await UserSegment.findOne({ userId, chain: "ethereum" }).sort({ asOf: -1 }).lean();
  }
  const userSegment = segDoc?.class;

  if (!['A','B','C','D'].includes(userSegment)) {
    const err = new Error("Kullanıcı segmenti bulunamadı. Lütfen segment yeniden hesaplandıktan sonra deneyin.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const maxSeg = campaign.maxParticipants[userSegment] || 0;
  const curSeg = campaign.currentParticipants[userSegment] || 0;
  if (curSeg >= maxSeg) {
    const err = new Error(`Kampanya ${userSegment} segmenti kontenjanı dolmuştur.`);
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

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

  const participation = new CampaignParticipation({
    campaignId,
    userId,
    joinedAt: new Date()
  });
  await participation.save();

  campaign.currentParticipants[userSegment] = (campaign.currentParticipants[userSegment] || 0) + 1;
  campaign.participants = Object.values(campaign.currentParticipants).reduce((a,b)=>a+b,0);
  await campaign.save();

  return {
    campaignId,
    userId: userId.toString(),
    joined: true,
    joinedAt: userProgress.startedAt,
    message: "Kampanyaya başarıyla katıldınız",
    participants: campaign.participants,
    maxParticipants: campaign.maxParticipants,
    remainingSlots: maxSeg - campaign.currentParticipants[userSegment]
  };
};

// ✅ YENİ: Progress güncelle
exports.updateProgress = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { questionId, selectedAnswer, isCorrect, timeSpent, completed } = req.body;

  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("Bu kampanyaya katılmamışsınız.");
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

// ✅ YENİ: Campaign create (isAdminAccept kontrolü)
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
    startDate, endDate, questions, tags, images, // Modeldeki 'image' alanı kullanıldı
    videoUrl: videoUrl || "", // Modeldeki 'videoUrl' alanı kullanıldı
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
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }
  return campaign;
};

// ✅ EKLENDİ: Kampanyayı güncelle (admin veya owner)
exports.update = async (req) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  // İstemciden gelen isAdminAccept değişikliğini customer yapamaz
  if (role !== 'admin' && typeof req.body.isAdminAccept !== 'undefined') {
    delete req.body.isAdminAccept;
  }

  // createdUserId değiştirilemez
  if (typeof req.body.createdUserId !== 'undefined') {
    delete req.body.createdUserId;
  }

  // Admin her kampanyayı güncelleyebilir; customer sadece kendi kampanyasını
  const filter = role === 'admin' ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Bu kampanyayı güncelleme yetkiniz yok veya kampanya bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  return updated;
};

// ✅ EKLENDİ: Kampanya silme (admin için kalıcı, customer için yetki yok)
exports.remove = async (req) => {
  const { id } = req.params;
  const role = req.user.role;

  if (role !== 'admin') {
    const err = new Error("Sadece admin kampanyayı kalıcı silebilir.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  const deleted = await Campaign.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  return { _id: deleted._id, title: deleted.title };
};

// ✅ EKLENDİ: Kampanya silme isteği (customer veya admin)
exports.requestDelete = async (req) => {
  const { id } = req.params;
  const role = req.user.role;
  const userId = req.user.userId;

  // Admin veya kampanyayı oluşturan customer istekte bulunabilir
  const filter = role === 'admin' ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { isActive: false, status: 'pending_deletion', updatedAt: new Date() },
    { new: true }
  );

  if (!updated) {
    const err = new Error("Bu kampanya için silme isteği oluşturma yetkiniz yok veya kampanya bulunamadı.");
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

// Kampanya soru sayısını güncelle (dışarıdan erişilebilir)
exports.updateQuestionCount = updateCampaignQuestionCount;