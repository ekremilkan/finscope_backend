const Question = require("../models/questions.model");
const Campaign = require("../models/campaign.model");
const { StatusCodes } = require("http-status-codes");

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

  if (!Array.isArray(options) || options.length !== 4) {
    const err = new Error("Tam olarak 4 seçenek olmalı.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
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

  const question = new Question({
    questionText,
    options,
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

exports.getAll = async () => {
  return await Question.find()
    .populate("createdUserId", "name email")
    .sort({ order: 1, createdAt: -1 });
};

exports.getByCampaign = async (req) => {
  const { campaignId } = req.params;
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
  return await Question.find({ _id: { $in: campaign.questionIds } })
    .populate("createdUserId", "name email")
    .sort({ order: 1, createdAt: -1 });
};

exports.getByCustomer = async (req) => {
  const createdUserId = req.user.userId;
  return await Question.find({ createdUserId })
    .sort({ order: 1, createdAt: -1 });
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

  // Eğer options güncelleniyorsa validation yap
  if (options) {
    if (!Array.isArray(options) || options.length !== 4) {
      const err = new Error("Tam olarak 4 seçenek olmalı.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }

    const trueCount = options.filter((opt) => opt.isTrue === true).length;
    if (trueCount !== 1) {
      const err = new Error("Sadece bir adet doğru cevap olmalıdır.");
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    id,
    { questionText, options, order },
    { new: true, runValidators: true }
  ).populate("createdUserId", "name email");

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