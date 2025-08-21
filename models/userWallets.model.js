const mongoose = require("mongoose");

const userWalletsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    address: [{
      type: String,
      required: true,
      trim: true,
      unique: true,
    }],
  },
  {
    timestamps: true,
  }
);

const UserWallets = mongoose.model("UserWallets", userWalletsSchema, "userWallets");
module.exports = UserWallets;