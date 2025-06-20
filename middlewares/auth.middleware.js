const utils = require("../utils/index");
const { StatusCodes } = require("http-status-codes");
const consts = require("../consts/index");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
  try {
    // Public route kontrolü
    let isPublicRoute = consts.general.ROUTES.find((route) => {
      return req.url.includes(route);
    });
    
    if (isPublicRoute) {
      return next();
    }
    
    // Authorization header kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: true,
        success: false,
        message: "Yetkilendirme token'ı gerekli",
        code: StatusCodes.UNAUTHORIZED
      });
    }
    
    // Token'ı çıkar
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: true,
        success: false,
        message: "Token bulunamadı",
        code: StatusCodes.UNAUTHORIZED
      });
    }
    
    // Token'ı doğrula
    const decodedToken = utils.helper.verifyToken(token);
    if (!decodedToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: true,
        success: false,
        message: "Geçersiz token",
        code: StatusCodes.UNAUTHORIZED
      });
    }
    
    // Kullanıcıyı veritabanından kontrol et
    const user = await User.findById(decodedToken._id).select('-password');
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: true,
        success: false,
        message: "Kullanıcı bulunamadı",
        code: StatusCodes.UNAUTHORIZED
      });
    }
   
  
    // Hesap kilitli mi kontrol et
    if (user.isLocked) {
      return res.status(StatusCodes.LOCKED).json({
        error: true,
        success: false,
        message: "Hesap geçici olarak kilitlenmiştir",
        code: StatusCodes.LOCKED
      });
    }
    
    // Kullanıcı bilgilerini request'e ekle
    req.user = user;
    req.token = token;
    
    next();
    
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: true,
      success: false,
      message: "Yetkilendirme hatası",
      code: StatusCodes.UNAUTHORIZED
    });
  }
};
