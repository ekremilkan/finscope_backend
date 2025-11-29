const mongoose = require("mongoose");

const socialVerificationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["twitter"],
      required: true,
    },

    // Kampanya sahibinin handle'ı (target)
    targetHandle: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Kullanıcının handle'ı (source)
    sourceHandle: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    ok: { type: Boolean, default: false }, // “takip ediyor mu?” genel sonuç
    following: { type: Boolean, default: false },
    followedBy: { type: Boolean, default: false },

    checkedAt: { type: Date, default: Date.now },

    raw: { type: Object, default: null }, // API cevabını ham hâliyle saklamak istersen
    error: { type: String, default: null }, // hata varsa
  },
  { timestamps: true }
);

// Aynı kampanya + aynı user + platform için tek kayıt
socialVerificationSchema.index(
  { campaignId: 1, userId: 1, platform: 1 },
  { unique: true }
);

module.exports = mongoose.model("SocialVerification", socialVerificationSchema);
