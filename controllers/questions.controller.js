// controllers/question.controller.js
const { StatusCodes } = require("http-status-codes");
const questionService = require("../services/questions.service");
const baseResponse = require("../dto/baseresponse.dto");

exports.create = async (req, res) => {
  try {
    const data = await questionService.create({ ...req.body, createdUserId: req.user.userId });
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "Soru başarıyla oluşturuldu",
      code: StatusCodes.CREATED,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await questionService.getAll(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Tüm sorular getirildi",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.getByCampaign = async (req, res) => {
  try {
    const data = await questionService.getByCampaign(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanyaya ait sorular getirildi",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.getByCustomer = async (req, res) => {
  try {
    const data = await questionService.getByCustomer(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Müşteriye ait sorular getirildi",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await questionService.update(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Soru başarıyla güncellendi",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const data = await questionService.remove(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Soru başarıyla silindi",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};