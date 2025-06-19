const User = require("../models/user.model");
const utils = require("../utils/index");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");

exports.register = async (req) => {
  const { name, email, password } = req.body;
  
  // E-posta kontrolü
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("Bu email adresi zaten kullanımda.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }
  
  // Kullanıcı oluştur
  const user = new User({ name, email, password });
  await user.save();
  
  // Token oluştur
  const token = user.generateAccessToken();
  await user.save(); // Token'ı kaydet
  
  // Güvenli response oluştur
  const userResponse = user.toJSON();
  
  return { user: userResponse, token };
};

exports.login = async (req) => {
  const { email, password } = req.body;
  
  // Kullanıcıyı bul (şifre dahil)
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    const err = new Error("Geçersiz e-posta veya şifre.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }
  
  // Hesap kilitli mi kontrol et
  if (user.isLocked) {
    const err = new Error("Hesap geçici olarak kilitlenmiştir. Lütfen daha sonra tekrar deneyin.");
    err.statusCode = StatusCodes.LOCKED;
    throw err;
  }
  
  // Şifre kontrolü
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Başarısız giriş denemesi kaydet
    await user.incLoginAttempts();
    
    const err = new Error("Geçersiz e-posta veya şifre.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }
  
  // Başarılı giriş - deneme sayacını sıfırla
  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Token oluştur ve kaydet
  const token = user.generateAccessToken();
  await user.save();
  
  // Güvenli response oluştur
  const userResponse = user.toJSON();
  
  return { user: userResponse, token };
};

exports.logout = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.clearAccessToken();
    await user.save();
  }
  return { message: "Başarıyla çıkış yapıldı" };
};
