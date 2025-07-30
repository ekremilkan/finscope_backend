const jsonwebtoken = require("jsonwebtoken");

/**
 * Bir kullanıcı için yeni bir Access Token oluşturur.
 * Anahtarı doğrudan process.env'den alarak tutarlılık sağlar.
 */
exports.createToken = (user) => {
  const payload = { 
    _id: user._id, 
    email: user.email, 
    name: user.name, 
    role: user.role 
  };
  
  // DİKKAT: Anahtar doğrudan process.env'den okunuyor.
  const token = jsonwebtoken.sign(payload, process.env.SECRETKEY, {
    expiresIn: process.env.EXPIRESIN,
  });

  return token;
};

/**
 * Verilen Access Token'ı doğrular.
 * Token geçerliyse payload'ını, geçersizse (imza hatası, süresi dolmuş vb.) null döndürür.
 * Hata fırlatmaz, kararı çağrıldığı yere bırakır.
 */
exports.verifyToken = (token) => {
  try {
    // DİKKAT: Doğrulama anahtarı da doğrudan process.env'den okunuyor.
    const decoded = jsonwebtoken.verify(token, process.env.SECRETKEY);
    return decoded;
  } catch (error) {
    // Token doğrulanamadığında hata logla ama null döndür.
    console.error("verifyToken hatası:", error.message);
    return null;
  }
};

/**
 * Bir kullanıcı için yeni bir Refresh Token oluşturur.
 */
exports.createRefreshToken = (user) => {
  const payload = { _id: user._id, email: user.email };

  const refreshToken = jsonwebtoken.sign(
    payload,
    process.env.REFRESH_SECRETKEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
  return refreshToken;
};

/**
 * Verilen Refresh Token'ı doğrular.
 * Token geçerliyse payload'ını, geçersizse hata fırlatır.
 */
exports.verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jsonwebtoken.verify(refreshToken, process.env.REFRESH_SECRETKEY);
    return decoded;
  } catch (error) {
    console.error("Refresh token doğrulama hatası:", error.message);
    throw new Error("Refresh token geçersiz veya süresi dolmuş");
  }
};