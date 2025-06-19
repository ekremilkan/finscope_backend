const jsonwebtoken = require("jsonwebtoken");
const config = require("../configs");

exports.createToken = (userId, userName) => {
  const token = jsonwebtoken.sign({ userId, userName }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  return token;
};

exports.verifyToken = (token) => {
  const isVerify = { decodedToken: null };
  try {
    const decodedToken = jsonwebtoken.verify(token, config.jwt.secret);
    return isVerify.decodedToken = decodedToken;
  } catch (error) {
    console.log("helper'da hata oldu verify tokende");
    throw new Error("Token validate sırasında hata oluştu");
  }
};

exports.createRefreshToken = (user) => {
  const refreshToken = jsonwebtoken.sign(
    {
      _id: user._id,
      email: user.email,
    },
    process.env.REFRESH_SECRETKEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
  return refreshToken;
};
