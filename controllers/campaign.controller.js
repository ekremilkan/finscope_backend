const { StatusCodes } = require("http-status-codes");
const campaignService = require("../services/campaign.service");
const baseResponse = require("../dto/baseresponse.dto");

// Kampanya oluştur
exports.create = async (req, res) => {
  try {
    const data = await campaignService.create(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "Kampanya başarıyla oluşturuldu",
      code: StatusCodes.CREATED,
      isAdmin: req.user.role === 'admin',
      isAdminAccept: data.isAdminAccept
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

// Tüm kampanyaları getir
exports.getAll = async (req, res) => {
  try {
    const data = await campaignService.getAll(req);
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

// Kampanyayı ID'ye göre getir
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

// Kullanıcının kampanya progress'ini getir
exports.getUserProgress = async (req, res) => {
  try {
    const data = await campaignService.getUserProgress(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kullanıcı progress'i getirildi",
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

// Kampanyaya katıl
exports.joinCampaign = async (req, res) => {
  try {
    const data = await campaignService.joinCampaign(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanyaya başarıyla katıldınız",
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

// Progress güncelle
exports.updateProgress = async (req, res) => {
  try {
    const data = await campaignService.updateProgress(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Progress güncellendi",
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

// Quiz tamamla
exports.completeQuiz = async (req, res) => {
  try {
    const data = await campaignService.completeQuiz(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Quiz tamamlandı",
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

// Kampanya güncelle
exports.update = async (req, res) => {
  try {
    const data = await campaignService.update(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Kampanya güncellendi",
      code: StatusCodes.OK,
      isAdmin: req.user.role === 'admin',
      isAdminAccept: data.isAdminAccept
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

// Kampanya sil
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

// Kampanya silme isteği
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

// Müşteriye ait kampanyaları getir
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

// Silme isteklerini getir
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
