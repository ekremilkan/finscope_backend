const Question = require("../models/question.model");
const { StatusCodes } = require("http-status-codes");

exports.create = async (req) => {
  const { questionText, options, campaignId, customerId } = req;

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
    customerId,
  });

  await question.save();
  return question;
};

exports.getAll = async () => {
  return await Question.find()
    .populate("customerId", "name email")
    .populate("campaignId", "name");
};

exports.getByCampaign = async (req) => {
  const { campaignId } = req.query;
  if (!campaignId) {
    const err = new Error("Kampanya ID gerekli.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  return await Question.find({ campaignId });
};

exports.getByCustomer = async (req) => {
  const customerId = req.user._id;
  return await Question.find({ customerId });
};

exports.remove = async (req) => {
  const { id } = req.params;
  const customerId = req.user._id;

  const question = await Question.findOne({ _id: id, customerId });

  if (!question) {
    const err = new Error("Bu soruyu silme yetkiniz yok veya soru bulunamadı.");
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  await Question.findByIdAndDelete(id);
  return { message: "Soru silindi." };
};