const { StatusCodes } = require("http-status-codes");
const userService = require("../services/index");
const baseResponse = require("../dto/baseresponse.dto");

exports.register = async (req, res) => {
  try {
    const data = await userService.user.register(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "Kullanıcı başarıyla oluşturuldu",
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

exports.login = async (req, res) => {
  try {
    const data = await userService.user.login(req);
    
    // ✅ YENİ: isVerified durumuna göre mesaj ayarla
    const message = data.isVerified 
      ? "Giriş başarılı" 
      : "Doğrulama kodu e-posta adresinize gönderildi";
    
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message,
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

exports.resendVerificationCode = async (req, res) => {
  try {
    const data = await userService.user.resendVerificationCode(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Code has been sent",
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

exports.verifyLogin = async (req, res) => {
  try {
    const data = await userService.user.verifyLogin(req);
    
    // ✅ YENİ: isVerified durumuna göre mesaj ayarla
    const message = data.isVerified 
      ? "Doğrulama başarılı. Giriş yapıldı." 
      : "Doğrulama başarılı";
    
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message,
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

exports.logout = async (req, res) => {
  try {
    const data = await userService.user.logout(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Çıkış başarılı",
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
exports.getProfile = async (req, res) => {
  // Middleware token'ı doğrulayıp kullanıcıyı req.user'a eklediği için,
  // burada veritabanına tekrar gitmemize gerek yok.
  // Direkt olarak req.user'dan bilgiyi alıp gönderebiliriz.
  res.status(StatusCodes.OK).json({
    message: "Profil bilgileri başarıyla getirildi.",
    data: req.user,
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const data = await userService.user.forgotPassword(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

/**
 * Refresh token ile yeni access token üretme
 */
exports.refreshToken = async (req, res) => {
  try {
    const data = await userService.user.refreshAccessToken(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

exports.verifyResetCode = async (req, res) => {
  try {
    const data = await userService.user.verifyResetCode(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

exports.resetPassword = async (req, res) => {
  try {
    const data = await userService.user.resetPassword(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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


exports.getUserById = async (req, res) => {
  try {
    const data = await userService.user.getUserById(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data: data,
      timestamp: new Date(),
      message: "Kullanıcı başarıyla getirildi",
      code: StatusCodes.CREATED,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      timestamp: new Date(),
      message: "Hata oluştu",
      errorMessage: error.message,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.getUserByName = async (req, res) => {
  try {
    const data = await userService.user.getUserByName(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data: data,
      timestamp: new Date(),
      message: "Kullanıcı başarıyla getirildi",
      code: StatusCodes.CREATED,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      timestamp: new Date(),
      message: "Hata oluştu",
      errorMessage: error.message,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
