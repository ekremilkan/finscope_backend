const Question = require("../models/questions.model");
const Campaign = require("../models/campaign.model");
const { StatusCodes } = require("http-status-codes");
const { transformQuestionByLanguage, detectLanguage } = require("../utils/i18n");

// Kampanya soru sayısını güncelle
const updateCampaignQuestionCount = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return 0;
  
  const questionCount = campaign.questionIds.length;
  await Campaign.findByIdAndUpdate(campaignId, { questions: questionCount });
  return questionCount;
};

exports.create = async (req) => {
  const { questionText, options, campaignId, createdUserId, order } = req;

  // ✅ Çoklu dil yapısını doğrula
  if (!questionText || !questionText.tr || !questionText.en) {
    const err = new Error('QuestionText must have both tr and en translations');
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (!Array.isArray(options) || options.length !== 4) {
    const err = new Error("Tam olarak 4 seçenek olmalı.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Her option için çoklu dil kontrolü
  for (const option of options) {
    if (!option.text || !option.text.tr || !option.text.en) {
      const err = new Error('Each option text must have both tr and en translations');
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
  }

  const trueCount = options.filter((opt) => opt.isTrue === true).length;
  if (trueCount !== 1) {
    const err = new Error("Sadece bir adet doğru cevap olmalıdır.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Kampanyanın var olup olmadığını kontrol et
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Çoklu dil formatında kaydet
  const question = new Question({
    questionText: {
      tr: questionText.tr,
      en: questionText.en
    },
    options: options.map(opt => ({
      text: {
        tr: opt.text.tr,
        en: opt.text.en
      },
      isTrue: opt.isTrue || false
    })),
    createdUserId,
    order: order || 0,
  });

  await question.save();

  // Kampanyanın questionIds alanını güncelle
  await Campaign.findByIdAndUpdate(
    campaignId,
    { $push: { questionIds: question._id } }
  );

  // Kampanya soru sayısını güncelle
  await updateCampaignQuestionCount(campaignId);

  return question;
};

exports.getAll = async (req = {}) => {
  // Dil algılama: query param > user preference > Accept-Language header > default
  const lang = detectLanguage(req);
  
  const questions = await Question.find()
    .populate("createdUserId", "name email")
    .sort({ order: 1, createdAt: -1 })
    .lean();
  
  // Her soruyu istenen dile göre transform et
  return questions.map(question => transformQuestionByLanguage(question, lang, 'tr'));
};

exports.getByCampaign = async (req) => {
  const { campaignId } = req.params;
  // Dil algılama: query param > user preference > Accept-Language header > default
  const lang = detectLanguage(req);
  
  if (!campaignId) {
    const err = new Error("Kampanya ID gerekli.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Kampanyayı bul ve questionIds'i al
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Kampanya bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Kampanyanın questionIds'ine göre soruları getir
  const questions = await Question.find({ _id: { $in: campaign.questionIds } })
    .populate("createdUserId", "name email")
    .sort({ order: 1, createdAt: -1 })
    .lean();
  
  // Her soruyu istenen dile göre transform et
  return questions.map(question => transformQuestionByLanguage(question, lang, 'tr'));
};

exports.getByCustomer = async (req) => {
  const createdUserId = req.user.userId;
  // Dil algılama: query param > user preference > Accept-Language header > default
  const lang = detectLanguage(req);
  
  const questions = await Question.find({ createdUserId })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  
  // Her soruyu istenen dile göre transform et
  return questions.map(question => transformQuestionByLanguage(question, lang, 'tr'));
};

exports.update = async (req) => {
  const { id } = req.params;
  const createdUserId = req.user.userId;
  const userRole = req.user.role;
  const { questionText, options, order } = req.body;

  // Admin ise tüm soruları güncelleyebilir, değilse sadece kendi sorusunu
  let question;
  if (userRole === 'admin') {
    question = await Question.findById(id);
  } else {
    question = await Question.findOne({ _id: id, createdUserId });
  }

  if (!question) {
    const err = new Error("Bu soruyu güncelleme yetkiniz yok veya soru bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  // ✅ Çoklu dil alanlarını güncelle
  if (questionText) {
    // Eğer mevcut questionText çoklu dil formatında değilse, önce dönüştür
    const currentQuestionText = typeof question.questionText === 'object' 
      ? question.questionText 
      : { tr: question.questionText || '', en: question.questionText || '' };
    
    question.questionText = {
      tr: questionText.tr || currentQuestionText.tr || '',
      en: questionText.en || currentQuestionText.en || ''
    };
  }

  // Eğer options güncelleniyorsa validation yap
  if (options) {
    if (!Array.isArray(options) || options.length !== 4) {
      const err = new Error("Tam olarak 4 seçenek olmalı.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }

    // Her option için çoklu dil kontrolü
    for (const option of options) {
      if (!option.text || !option.text.tr || !option.text.en) {
        const err = new Error('Each option text must have both tr and en translations');
        err.statusCode = StatusCodes.BAD_REQUEST;
        throw err;
      }
    }

    const trueCount = options.filter((opt) => opt.isTrue === true).length;
    if (trueCount !== 1) {
      const err = new Error("Sadece bir adet doğru cevap olmalıdır.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }

    // Çoklu dil formatında güncelle
    question.options = options.map(opt => ({
      text: {
        tr: opt.text.tr,
        en: opt.text.en
      },
      isTrue: opt.isTrue || false
    }));
  }

  if (order !== undefined) {
    question.order = order;
  }

  await question.save();

  const updatedQuestion = await Question.findById(id)
    .populate("createdUserId", "name email")
    .lean();

  return updatedQuestion;
};

exports.remove = async (req) => {
  const { id } = req.params;
  const createdUserId = req.user.userId;
  const userRole = req.user.role;

  // Admin ise tüm soruları silebilir, değilse sadece kendi sorusunu
  let question;
  if (userRole === 'admin') {
    question = await Question.findById(id);
  } else {
    question = await Question.findOne({ _id: id, createdUserId });
  }

  if (!question) {
    const err = new Error("Bu soruyu silme yetkiniz yok veya soru bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  // Bu soruyu içeren tüm kampanyalardan çıkar
  await Campaign.updateMany(
    { questionIds: question._id },
    { $pull: { questionIds: question._id } }
  );

  await Question.findByIdAndDelete(id);

  // Etkilenen kampanyaların soru sayısını güncelle
  const affectedCampaigns = await Campaign.find({ questionIds: question._id });
  for (const campaign of affectedCampaigns) {
    await updateCampaignQuestionCount(campaign._id);
  }

  return { message: "Soru silindi." };
};