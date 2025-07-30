const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const utils = require("../utils/index"); // Helper dosyanız

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Yetkilendirme token'ı gerekli" });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token bulunamadı" });
    }
    
    // Helper'daki verifyToken fonksiyonunu çağır
    const decodedToken = utils.helper.verifyToken(token);
    
    if (!decodedToken || !decodedToken._id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Geçersiz veya süresi dolmuş token" });
    }
    
    // --- YENİ VE DAHA SAĞLAM YAPI ---
    // req.user objesini, sonraki adımlarda ihtiyaç duyulacak şekilde
    // net ve tutarlı bir yapıda oluşturalım.
    req.user = {
      userId: decodedToken._id, // En önemlisi: userId'yi ekle
      email: decodedToken.email,
      name: decodedToken.name,
      role: decodedToken.role,
    };
    // ---------------------------------

    // Opsiyonel ama önerilen: Kullanıcının hala DB'de var olduğunu ve kilitli olmadığını kontrol et
    const userInDb = await User.findById(req.user.userId);
    if (!userInDb) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token'a ait kullanıcı bulunamadı" });
    }
    if (userInDb.isLocked) {
      return res.status(StatusCodes.LOCKED).json({ message: "Hesap geçici olarak kilitlenmiştir" });
    }

    next();
    
  } catch (error) {
    console.error('💥 Auth Middleware Hatası:', error.message);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Yetkilendirme hatası oluştu.",
      error: error.message
    });
  }
};