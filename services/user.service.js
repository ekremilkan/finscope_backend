const User = require("../models/user.model");
const utils = require("../utils/index");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");

exports.register = async (req) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("Bu email adresi zaten kullanımda.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }
  const user = new User({ name, email, password });
  await user.save();
  const userResponse = user.toObject();
  delete userResponse.password;
  return userResponse;
};

exports.login = async (req) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("Geçersiz e-posta veya şifre.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Geçersiz e-posta veya şifre.");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    throw err;
  }
  const token = utils.helper.createToken(user._id, user.name);
  const userResponse = user.toObject();
  delete userResponse.password;
  return { user: userResponse, token };
};
