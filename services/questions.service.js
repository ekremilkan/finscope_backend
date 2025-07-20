const Question = require("../models/questions.model");
const { StatusCodes } = require("http-status-codes");

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

  const question = new Question({
    questionText,
    options,
    campaignId,
    createdUserId,
    order: order || 0,
  });

  await question.save();
  return question;
};

exports.getAll = async () => {
  return await Question.find()
    .populate("createdUserId", "name email")
    .populate("campaignId", "title")
    .sort({ order: 1, createdAt: -1 });
};

exports.getByCampaign = async (req) => {
  const { campaignId } = req.params;
  if (!campaignId) {
    const err = new Error("Kampanya ID gerekli.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  return await Question.find({ campaignId })
    .populate("createdUserId", "name email")
    .sort({ order: 1, createdAt: -1 });
};

exports.getByCustomer = async (req) => {
  const createdUserId = req.user._id;
  return await Question.find({ createdUserId })
    .populate("campaignId", "title")
    .sort({ order: 1, createdAt: -1 });
};

exports.update = async (req) => {
  const { id } = req.params;
  const createdUserId = req.user._id;
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
  ).populate("createdUserId", "name email").populate("campaignId", "title");

  return updatedQuestion;
};

exports.remove = async (req) => {
  const { id } = req.params;
  const createdUserId = req.user._id;
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

  await Question.findByIdAndDelete(id);
  return { message: "Soru silindi." };
};