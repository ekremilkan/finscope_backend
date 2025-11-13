const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true,
  },
  // Katılım durumu
  joined: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: null,
  },
  // Tamamlanma durumu
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  // Status (CampaignParticipation'dan)
  status: {
    type: String,
    enum: ["active", "completed", "abandoned", "joined"],
    default: "active",
  },
  // Segment bilgisi (CampaignParticipation'dan)
  segment: {
    type: String,
    default: null,
  },
  // Ödül uygunluğu (CampaignParticipation'dan)
  eligibleForReward: {
    type: Boolean,
    default: true,
  },
  // Skor (CampaignParticipation'dan)
  score: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  // Süre ve tarihler
  timeSpent: {
    type: Number,
    default: 0, // saniye
    min: 0,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  // Ödeme bilgileri
  isPurchase: {
    type: Boolean,
    default: false,
  },
  isPaymentEarned: {
    type: Boolean,
    default: false,
  },
  earnedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  depositedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Progress güncelleme
userProgressSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Status güncelleme (CampaignParticipation'dan)
  if (this.completed && this.status !== "completed") {
    this.status = "completed";
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }

  // Score'a göre status güncelleme
  if (this.score === 100 && this.status !== "completed") {
    this.status = "completed";
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }

  next();
});

// Compound index for unique user-campaign combination
userProgressSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", userProgressSchema);
