const mongoose = require("mongoose");

const SocialVerificationSchema = new mongoose.Schema(
  {
    twitter: {
      targetUserName: { type: String, trim: true, lowercase: true, default: null }, // kampanya sahibi
      userName: { type: String, trim: true, lowercase: true, default: null }, // katılımcı
      isFollowing: { type: Boolean, default: null }, 
      checkedAt: { type: Date, default: null },
      details: { type: Object, default: null }, 
    },
    telegram: {
      target: { type: String, trim: true, lowercase: true, default: null }, // kanal/grup vs
      userName: { type: String, trim: true, lowercase: true, default: null },
      isMember: { type: Boolean, default: null },
      checkedAt: { type: Date, default: null },
      details: { type: Object, default: null },
    },
  },
  { _id: false, minimize: true }
);

const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },

    joined: { type: Boolean, default: false },
    joinedAt: { type: Date, default: null },

    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    status: { type: String, enum: ["active", "completed", "abandoned", "joined"], default: "active" },
    segment: { type: String, default: null },

    eligibleForReward: { type: Boolean, default: true },
    ineligibleReason: { type: String, default: null },

    score: { type: Number, default: null, min: 0, max: 100 },
    timeSpent: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: null },

    isPurchase: { type: Boolean, default: false },
    isPaymentEarned: { type: Boolean, default: false },

    earnedAmount: { type: Number, default: 0, min: 0 },
    depositedAmount: { type: Number, default: 0, min: 0 },

    // ✅ Kampanya bitince “bir kere” doğrulayacağımız alan
    socialVerification: { type: SocialVerificationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Unique user-campaign
userProgressSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

// status otomasyonu
userProgressSchema.pre("save", function (next) {
  if (this.completed && this.status !== "completed") {
    this.status = "completed";
    if (!this.completedAt) this.completedAt = new Date();
  }
  if (this.score === 100 && this.status !== "completed") {
    this.status = "completed";
    if (!this.completedAt) this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("UserProgress", userProgressSchema);
