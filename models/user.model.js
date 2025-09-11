const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TelegramSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true }, // Telegram user id
    username: String,
    firstName: String,
    lastName: String,
    languageCode: String,
    isPremium: Boolean,
    photoUrl: String,
    linkedAt: Date,
  },
  { _id: false }
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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "user", "admin"],
      default: "user",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    wallets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet", // Wallet modeline referans
      },
    ],
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpiresAt: {
      type: Date,
      default: null,
    },
    // Sadece uzun ömürlü refresh token veritabanında saklanır.
    refreshToken: {
      type: String,
      default: null,
    },
    tokenCreatedAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false, // Bu alanı normal sorgularda getirme
    },
    lockUntil: {
      type: Date,
      select: false, // Bu alanı normal sorgularda getirme
    },
    signupSource: { type: String, enum: ["web", "telegram"], default: "web" },
    telegram: TelegramSchema,
    referralCode: {
      type: String,
      unique: true,
      uppercase: true,
      sparse: true,
      minlength: 6,
      maxlength: 12,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    invitedAt: {
      type: Date,
      default: null,
    },
    invitees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    // Hassas verileri API yanıtlarından otomatik olarak temizle
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationCode;
        delete ret.verificationCodeExpiresAt;
        delete ret.refreshToken; // Refresh token'ı da yanıtlarda gönderme
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  }
);

//refferalCode için üretim (8 karakter uzunluğunda, userid'nin son 8 karakteri)
userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    const userIdStr = this._id.toString();
    this.referralCode = userIdStr.slice(-8).toUpperCase();
  }
  next();
});


// Şifre her değiştiğinde hash'leyen ve tarihi güncelleyen middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.passwordChangedAt = new Date();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Access token oluşturma metodu
userSchema.methods.generateAccessToken = function () {
  const payload = {
    _id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
  };

  // Not: Access token'lar kısa ömürlüdür ve veritabanına kaydedilmez.
  // Her seferinde bu metotla oluşturulup istemciye gönderilir.
  const token = jwt.sign(payload, process.env.SECRETKEY, {
    expiresIn: process.env.EXPIRESIN,
  });

  return token;
};

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Rol kontrol metotları
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Sanal (Virtual) alan: Hesabın kilitli olup olmadığını anlık hesaplar
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Başarısız giriş denemelerini yöneten metot
userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 dakika
  }

  return this.updateOne(updates);
};

// Başarılı giriş sonrası denemeleri sıfırlayan metot
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
