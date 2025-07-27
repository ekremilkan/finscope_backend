const { StatusCodes } = require("http-status-codes");
const campaignService = require("../services/campaign.service");
const baseResponse = require("../dto/baseresponse.dto");

exports.create = async (req, res) => {
  try {
    const data = await campaignService.create(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "Kampanya başarıyla oluşturuldu",
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
    const data = await campaignService.getAll();
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Tüm kampanyalar getirildi",
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

exports.getById = async (req, res) => {
  try {
    const data = await campaignService.getById(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanya getirildi",
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
    const data = await campaignService.update(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanya güncellendi",
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
    const data = await campaignService.remove(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanya silindi",
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

exports.requestDelete = async (req, res) => {
  try {
    const data = await campaignService.requestDelete(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanya silme isteği gönderildi. Admin onayı bekleniyor.",
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
    const data = await campaignService.getByCustomer(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Müşteriye ait kampanyalar getirildi",
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

exports.getDeleteRequests = async (req, res) => {
  try {
    const data = await campaignService.getDeleteRequests();
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Silme istekleri getirildi",
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
