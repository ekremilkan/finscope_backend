const jsonwebtoken = require("jsonwebtoken");
const config = require("../configs");

exports.createToken = (userId, userName) => {
  const token = jsonwebtoken.sign({ userId, userName }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  return token;
};
