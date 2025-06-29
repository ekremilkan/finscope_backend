const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../configs/index");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      match: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
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
      minlength: 8,
      validate: {
        validator: function (password) {
          // Güçlü şifre kontrolü: en az 1 büyük, 1 küçük, 1 rakam, 1 özel karakter
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            password
          );
        },
        message:
          "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir",
      },
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
    // Access token alanı eklendi
    refreshToken: {
      type: String,
      default: null,
    },
    // Token'ın ne zaman oluşturulduğunu takip etmek için
    tokenCreatedAt: {
      type: Date,
      default: null,
    },
    // Şifre değişiklik tarihi
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    // Hesap kilitlenme bilgileri
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
    // Şifre alanını select'ten hariç tut
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.accessToken;
        delete ret.verificationCode;
        delete ret.verificationCodeExpiresAt;
        return ret;
      },
    },
  }
);

// Şifre değişiklik middleware'i
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Şifre değişiklik tarihini güncelle
  this.passwordChangedAt = new Date();

  // Şifreyi hashle
  const salt = await bcrypt.genSalt(12); // Salt round'u artırdık
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Access token oluşturma method'u
userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    config.jwt.secret, // Config'den güvenli şekilde al
    { expiresIn: config.jwt.expiresIn }
  );

  // Token'ı database'e kaydet
  this.accessToken = token;
  this.tokenCreatedAt = new Date();

  return token;
};

// Token'ı temizleme method'u (logout için)
userSchema.methods.clearAccessToken = function () {
  this.accessToken = null;
  this.tokenCreatedAt = null;
};

// Password karşılaştırma method'u
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hesap kilitleme kontrolü
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Login denemeleri artırma
userSchema.methods.incLoginAttempts = function () {
  // Eğer lockUntil geçmişse, sıfırla
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // 5 başarısız denemeden sonra hesabı 30 dakika kilitle
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 dakika
  }

  return this.updateOne(updates);
};

// Başarılı login sonrası sıfırla
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
