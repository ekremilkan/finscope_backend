const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TelegramSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true }, // Telegram user id
    username: { type: String, trim: true, lowercase: true, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    languageCode: { type: String, default: null },
    isPremium: { type: Boolean, default: false },
    photoUrl: { type: String, default: null },
    linkedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ✅ Sadece "kullanıcının beyan ettiği" sosyal username’ler burada.
const SocialSchema = new mongoose.Schema(
  {
    twitter: {
      username: { type: String, trim: true, lowercase: true, default: null, maxlength: 15 },
    },
    telegram: {
      username: { type: String, trim: true, lowercase: true, default: null, maxlength: 32 },
    },
  },
  { _id: false, minimize: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      match: /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_\-\s]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["customer", "user", "admin"],
      default: "user",
      required: true,
    },

    isVerified: { type: Boolean, default: false },

    wallets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Wallet" }],

    verificationCode: { type: String, default: null },
    verificationCodeExpiresAt: { type: Date, default: null },

    refreshToken: { type: String, default: null },
    tokenCreatedAt: { type: Date, default: null },

    passwordChangedAt: { type: Date, default: Date.now },

    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    signupSource: { type: String, enum: ["web", "telegram"], default: "web" },

    // Telegram login / link bilgisi (mevcut)
    telegram: TelegramSchema,

    // ✅ username'ler burada
    social: { type: SocialSchema, default: () => ({}) },

    referralCode: {
      type: String,
      unique: true,
      uppercase: true,
      sparse: true,
      minlength: 6,
      maxlength: 12,
      index: true,
    },

    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    invitedAt: { type: Date, default: null },
    invitees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    referralRewards: { type: Number, default: 0 },

    referralHistory: [
      {
        inviteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
        bonus: { type: Number, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationCode;
        delete ret.verificationCodeExpiresAt;
        delete ret.refreshToken;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  }
);

// referralCode üretim
userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    const userIdStr = this._id.toString();
    this.referralCode = userIdStr.slice(-8).toUpperCase();
  }
  next();
});

// Şifre hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.passwordChangedAt = new Date();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Access token
userSchema.methods.generateAccessToken = function () {
  const payload = { _id: this._id, email: this.email, name: this.name, role: this.role };
  return jwt.sign(payload, process.env.SECRETKEY, { expiresIn: process.env.EXPIRESIN });
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $unset: { lockUntil: 1 }, $set: { loginAttempts: 1 } });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

module.exports = mongoose.model("User", userSchema);
