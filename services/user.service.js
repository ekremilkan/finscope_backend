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

  const user = await User.findOne({ email }).select(
    "+password +loginAttempts +lockUntil"
  );
  if (!user) {
    const err = new Error("Geçersiz e-posta veya şifre.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  if (user.isLocked) {
    const err = new Error("Hesap geçici olarak kilitlenmiştir.");
    err.statusCode = StatusCodes.LOCKED;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    const err = new Error("Geçersiz e-posta veya şifre.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  // --- DEĞİŞEN KISIM BAŞLANGICI ---

  // 6 haneli rastgele bir sayısal kod üret
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Kodun geçerlilik süresini 10 dakika olarak ayarla
  user.verificationCode = verificationCode;
  user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

  await user.save();

  // E-posta ile kodu gönder (hata olursa logla ama kullanıcıya yansıtma)
  try {
    await utils.email.sendVerificationCode(user.email, verificationCode);
  } catch (emailError) {
    console.error(
      `Verification email could not be sent to ${user.email}`,
      emailError
    );
  }

  // Başarılı ama henüz giriş yapılmamış yanıtı dön
  return { message: "Doğrulama kodu e-posta adresinize gönderildi." };

  // --- DEĞİŞEN KISIM SONU ---
};

exports.resendVerificationCode = async (req) => {
  const { email } = req.body;

  if (!email) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Yeni 6 haneli kod oluştur
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Kodun geçerlilik süresini 10 dakika olarak ayarla
  user.verificationCode = verificationCode;
  user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  try {
    await utils.email.sendVerificationCode(user.email, verificationCode);
  } catch (emailError) {
    console.error(
      `Verification email could not be sent to ${user.email}`,
      emailError
    );
  }

  return {
    message: "Verification code resent successfully.",
  };
};

exports.verifyLogin = async (req) => {
  const { email, verificationCode } = req.body;

  const user = await User.findOne({ email, verificationCode });

  // Kod yanlış veya kullanıcı bulunamadı
  if (!user) {
    const err = new Error("Geçersiz doğrulama kodu veya e-posta.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  // Kodun süresi dolmuş mu kontrol et
  if (user.verificationCodeExpiresAt < new Date()) {
    // Süresi dolan kodu temizle
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    const err = new Error(
      "Doğrulama kodunun süresi dolmuş. Lütfen tekrar giriş yapın."
    );
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // --- Başarılı Doğrulama ---

  // Giriş denemelerini sıfırla (eğer varsa)
  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Token'ları oluştur
  const token = user.generateAccessToken();
  const refreshToken = utils.helper.createRefreshToken(user);

  // Doğrulama kodunu temizle ve refresh token'ı kaydet
  user.verificationCode = null;
  user.verificationCodeExpiresAt = null;
  user.refreshToken = refreshToken;
  user.tokenCreatedAt = new Date();

  await user.save();

  const userResponse = user.toJSON();

  return { user: userResponse, token, refreshToken };
};

exports.logout = async (req) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (user) {
    user.clearAccessToken();
    user.refreshToken = null;
    await user.save();
  }
  return { message: "Başarıyla çıkış yapıldı" };
};

// ----------------------------
// Şifre Sıfırlama Fonksiyonları
// ----------------------------

exports.forgotPassword = async (req) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    const err = new Error("Bu e-posta adresine ait bir kullanıcı bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika

  user.verificationCode = code;
  user.verificationCodeExpiresAt = expiresAt;
  await user.save();

  try {
    await utils.email.sendVerificationCode(user.email, code);
  } catch (error) {
    console.error("Kod gönderilemedi:", error);
  }

  return { message: "Şifre sıfırlama kodu e-posta adresinize gönderildi." };
};

exports.verifyResetCode = async (req) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });

  if (
    !user ||
    user.verificationCode !== code ||
    !user.verificationCodeExpiresAt ||
    user.verificationCodeExpiresAt < new Date()
  ) {
    const err = new Error("Kod geçersiz veya süresi dolmuş.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  return { message: "Kod doğrulandı." };
};

exports.resetPassword = async (req) => {
  const { email, code, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (
    !user ||
    user.verificationCode !== code ||
    !user.verificationCodeExpiresAt ||
    user.verificationCodeExpiresAt < new Date()
  ) {
    const err = new Error("Kod geçersiz veya süresi dolmuş.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  user.password = newPassword;
  user.verificationCode = null;
  user.verificationCodeExpiresAt = null;
  await user.save();

  return { message: "Şifreniz başarıyla sıfırlandı." };
};