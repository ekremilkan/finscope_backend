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
  joined: {
    type: Boolean,
    default: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  timeSpent: {
    type: Number,
    default: 0, // saniye
    min: 0,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  isPurchase: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
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
});

// Progress güncelleme
userProgressSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  next();
});

// Compound index for unique user-campaign combination
userProgressSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", userProgressSchema);
