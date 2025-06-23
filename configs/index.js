// configs/index.js

const config = {
  // Veritabanı bağlantı kodunun bozulmaması için eski anahtar geri eklendi.
  dbURI: process.env.DB_URI,

  app: {
    port: process.env.PORT || 5000,
    prefix: process.env.APP_PREFIX || "/api/v1",
  },
  db: {
    // Yeni yapı için de URI burada durmaya devam ediyor.
    uri: process.env.DB_URI,
  },
  jwt: {
    secret: process.env.SECRETKEY,
    refreshSecret: process.env.REFRESH_SECRETKEY,
    expiresIn: process.env.EXPIRESIN || "1h",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === "true",
    from: process.env.EMAIL_FROM,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
};

module.exports = config;
