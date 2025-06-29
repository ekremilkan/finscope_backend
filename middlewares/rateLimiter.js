const rateLimit = require("express-rate-limit");

// Genel API için rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 15 dakikada maksimum 100 istek
  message: {
    error: true,
    success: false,
    message: "Çok fazla istek! 15 dakika sonra tekrar deneyin.",
    code: 429,
  },
  standardHeaders: true, // Rate limit bilgilerini header'da gönder
  legacyHeaders: false,
});

// Auth işlemleri için daha sıkı limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına 15 dakikada maksimum 5 giriş denemesi
  message: {
    error: true,
    success: false,
    message: "Çok fazla giriş denemesi! 15 dakika sonra tekrar deneyin.",
    code: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Başarılı login sonrası counter'ı sıfırla
  skipSuccessfulRequests: true,
});

// Kayıt işlemleri için limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // IP başına 1 saatte maksimum 3 kayıt denemesi
  message: {
    error: true,
    success: false,
    message: "Çok fazla kayıt denemesi! 1 saat sonra tekrar deneyin.",
    code: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Şifre sıfırlama (forgot password) için limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // IP başına 15 dakikada maksimum 10 istek
  message: {
    error: true,
    success: false,
    message: "Çok fazla şifre sıfırlama isteği! 15 dakika sonra tekrar deneyin.",
    code: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  forgotPasswordLimiter,
};
