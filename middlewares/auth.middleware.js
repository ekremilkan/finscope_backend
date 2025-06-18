const jsonwebtoken = require("jsonwebtoken");
const config = require("../configs");
const { StatusCodes } = require("http-status-codes");

exports.verifyToken = (req, res, next) => {
  // Token genellikle 'Authorization' header'ında 'Bearer TOKEN_DEGERI' şeklinde gelir.
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Token bulunamadı. Erişim reddedildi." });
  }

  try {
    // Token'ı doğrula
    const decoded = jsonwebtoken.verify(token, config.jwt.secret);
    // Doğrulanmış kullanıcı bilgisini isteğe (req) ekle, böylece sonraki adımlarda kullanabiliriz.
    req.user = decoded;
    next(); // Her şey yolundaysa, bir sonraki adıma (asıl controller fonksiyonuna) geç
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Geçersiz token." });
  }
};
