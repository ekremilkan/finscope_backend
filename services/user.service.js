const User = require("../models/user.model");
const CampaignParticipation = require("../models/campaignParticipation.model");
const utils = require("../utils/index");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const {
  validateTelegramInitData,
} = require("../utils/validateTelegramInitData");

exports.register = async (req) => {
  const { name, email, password, role, telegramInitData } = req.body;
  
  let telegram = null;
  if (telegramInitData) {
    const result = validateTelegramInitData(telegramInitData, 300); // 5 dk
    if (result.ok) {
      telegram = result.user; // { id, username, first_name, last_name, language_code, ... }
    } else {
      // Politika: istersen hataya düş, istersen yok say. Genelde yok saymak kullanıcıyı bloklamaz.
      // const err = new Error(`Invalid Telegram initData: ${result.reason}`);
      // err.statusCode = StatusCodes.UNAUTHORIZED; throw err;
    }
  }

  // E-posta kontrolü
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("This email address is already in use.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  if (telegram?.id) {
    const existingByTg = await User.findOne({ "telegram.id": telegram.id });
    if (existingByTg) {
      const err = new Error(
        "This Telegram account is already linked to another user."
      );
      err.statusCode = StatusCodes.CONFLICT;
      throw err;
    }
  }

  // Kullanıcı oluştur (role varsa kullan, yoksa default 'user')
  const user = new User({
    name,
    email,
    password,
    role: role || "user",
    signupSource: telegram ? "telegram" : "web",
    telegram: telegram
      ? {
          id: telegram.id,
          username: telegram.username,
          firstName: telegram.first_name,
          lastName: telegram.last_name,
          languageCode: telegram.language_code,
          isPremium: telegram.is_premium,
          photoUrl: telegram.photo_url,
          linkedAt: new Date(),
        }
      : undefined,
  });
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
    const err = new Error("Invalid email or password.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  if (user.isLocked) {
    const err = new Error("Account is temporarily locked.");
    err.statusCode = StatusCodes.LOCKED;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    const err = new Error("Invalid email or password.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  // ✅ YENİ: Kullanıcı doğrulanmış mı kontrol et
  if (user.isVerified) {
    // Kullanıcı zaten doğrulanmış, direkt giriş yap
    await user.resetLoginAttempts();

    // Token'ları oluştur
    const token = user.generateAccessToken();
    const refreshToken = utils.helper.createRefreshToken(user);

    // Refresh token'ı kaydet
    user.refreshToken = refreshToken;
    user.tokenCreatedAt = new Date();
    await user.save();

    const userResponse = user.toJSON();

    return {
      user: userResponse,
      token,
      refreshToken,
      isVerified: true,
      message: "Login successful",
    };
  } else {
    // Kullanıcı henüz doğrulanmamış, verification code gönder
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

    // Doğrulama gerektiğini belirten yanıt dön
    return {
      message: "Verification code sent to your email address.",
      isVerified: false,
      email: user.email,
    };
  }
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
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

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

  // 1. ADIM: Önce kullanıcıyı SADECE e-posta adresiyle bul.
  const user = await User.findOne({ email });

  // 2. ADIM: Kullanıcı bulunamadıysa veya bulunan kullanıcının kodu eşleşmiyorsa hata ver.
  // Bu kontrol, hangi durumda hata olduğunu netleştirir.
  if (!user || user.verificationCode !== verificationCode) {
    const err = new Error("Invalid verification code or email.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  // 3. ADIM (Mevcut kodunuzdan): Kodun süresi dolmuş mu kontrol et.
  if (user.verificationCodeExpiresAt < new Date()) {
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    const err = new Error("Verification code has expired. Please login again.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // --- Başarılı Doğrulama ---
  // (Kodun geri kalanı sizinkinde olduğu gibi aynı kalıyor)

  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  user.isVerified = true;
  const token = user.generateAccessToken();
  const refreshToken = utils.helper.createRefreshToken(user);

  user.verificationCode = null;
  user.verificationCodeExpiresAt = null;
  user.refreshToken = refreshToken;
  user.tokenCreatedAt = new Date();

  await user.save();

  const userResponse = user.toJSON();

  return {
    user: userResponse,
    token,
    refreshToken,
    isVerified: true,
    message: "Verification successful. Login completed.",
  };
};

exports.logout = async (req) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (user) {
    // user.clearAccessToken();
    user.refreshToken = null;
    await user.save();
  }
  return { message: "Logout successful" };
};

exports.getUserById = async (req) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw new Error(error);
  }
};

exports.getUserByName = async (req) => {
  try {
    const { name } = req.params;
    const user = await User.find({ name: name });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw new Error(error);
  }
};

exports.updateUserName = async (req) => {
  const { userId } = req.params;
  const { newName } = req.body;

  // Kullanıcıyı bul
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // İsmi güncelle
  user.name = newName;
  await user.save();

  return {
    user: user,
    message: "Name updated successfully.",
  };
};

// ----------------------------
// Şifre Sıfırlama Fonksiyonları
// ----------------------------

exports.forgotPassword = async (req) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    const err = new Error("No user found with this email address.");
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
    console.error("Code could not be sent:", error);
  }

  return {
    message: "Password reset code sent to your email address.",
    expiresAt: expiresAt.toISOString(),
  };
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
    const err = new Error("Code is invalid or expired.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  return { message: "Code verified." };
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
    const err = new Error("Code is invalid or expired.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  user.password = newPassword;
  user.verificationCode = null;
  user.verificationCodeExpiresAt = null;
  await user.save();

  return { message: "Password reset successfully." };
};

/**
 * Refresh token ile yeni access token üretme
 */
exports.refreshAccessToken = async (req) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    const err = new Error("Refresh token required.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  try {
    // Refresh token'ı doğrula
    const decodedToken = utils.helper.verifyRefreshToken(refreshToken);

    // Kullanıcıyı database'den bul
    const user = await User.findById(decodedToken._id);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = StatusCodes.NOT_FOUND;
      throw err;
    }

    // Database'deki refresh token ile gelen token'ı karşılaştır
    if (user.refreshToken !== refreshToken) {
      const err = new Error("Invalid refresh token.");
      err.statusCode = StatusCodes.UNAUTHORIZED;
      throw err;
    }

    // Hesap kilitli mi kontrol et
    if (user.isLocked) {
      const err = new Error("Account is temporarily locked.");
      err.statusCode = StatusCodes.LOCKED;
      throw err;
    }

    // Yeni access token oluştur
    const newAccessToken = user.generateAccessToken();

    // Yeni refresh token oluştur (refresh token rotation için)
    const newRefreshToken = utils.helper.createRefreshToken(user);

    // Yeni refresh token'ı database'e kaydet
    user.refreshToken = newRefreshToken;
    user.tokenCreatedAt = new Date();
    await user.save();

    const userResponse = user.toJSON();

    return {
      user: userResponse,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Token refreshed successfully",
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    const err = new Error("Error occurred while refreshing token.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }
};

exports.getTotalUserCount = async () => {
  const totalUsers = await User.countDocuments({});
  return { totalUsers };
};

exports.getUserJoinedCampaigns = async (req) => {
  const { userId } = req.user;

  // 1. CampaignParticipation koleksiyonundan kullanıcının tüm katılımlarını bul.
  // 'populate', bulduğu katılımlardaki 'campaignId'yi kullanarak Campaign koleksiyonundan
  // ilgili kampanyanın tüm detaylarını (başlık, ödül vb.) otomatik olarak çeker.
  const participations = await CampaignParticipation.find({ userId })
    .populate("campaignId") // Campaign detaylarını getirmek için
    .lean();

  // Eğer kullanıcı hiçbir kampanyaya katılmamışsa, boş dizi döndür.
  if (!participations || participations.length === 0) {
    return [];
  }

  // 2. Frontend'in beklediği formata dönüştür.
  const result = participations
    .map((p) => {
      // Silinmiş bir kampanyaya ait katılım kaydı kalmışsa, onu atla.
      if (!p.campaignId) return null;

      return {
        ...p.campaignId, // Kampanyanın tüm alanlarını buraya kopyala (title, reward, vb.)
        userStatus: p.status, // Katılım durumunu 'userStatus' olarak ekle (completed, active, vb.)
        completedAt: p.completedAt,
      };
    })
    .filter(Boolean); // Null olan kayıtları temizle.

  return result;
};
