require("dotenv").config();

const config = {
  port: process.env.PORT,
  dbURI: process.env.DB_URI,
  appPrefix: process.env.APP_PREFIX,
  jwt: {
    secret: process.env.SECRETKEY,
    expiresIn: process.env.EXPIRESIN,
  },
};

module.exports = config;
