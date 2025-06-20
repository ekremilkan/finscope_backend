require("dotenv").config();

const config = {
  port: process.env.PORT,
  dbURI: process.env.DB_URI,
  appPrefix: process.env.APP_PREFIX,
  jwt: {
    secret: process.env.SECRETKEY,
    refreshSecret:process.env.REFRESH_SECRETKEY,
    expiresIn: process.env.EXPIRESIN,
    refreshExpiresIn:process.env.REFRESH_TOKEN_EXPIRES_IN,
  },
};

module.exports = config;
