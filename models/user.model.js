const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, minlength: 6 },
    // Access token alanı eklendi
    accessToken: {
      type: String,
      default: null,
    },
    // Token'ın ne zaman oluşturulduğunu takip etmek için
    tokenCreatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Access token oluşturma method'u
userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign(
    { 
      _id: this._id, 
      email: this.email,
      name: this.name 
    },
    process.env.JWT_SECRET || "your-secret-key", // .env dosyasından al
    { expiresIn: "7d" } // 7 gün geçerli
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

const User = mongoose.model("User", userSchema);
module.exports = User;