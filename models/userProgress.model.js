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
});

// Progress güncelleme
userProgressSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Progress validasyonu
  if (this.progress.currentQuestion > this.progress.totalQuestions) {
    this.progress.currentQuestion = this.progress.totalQuestions;
  }

  if (
    this.progress.correctAnswers + this.progress.wrongAnswers >
    this.progress.totalQuestions
  ) {
    this.progress.correctAnswers =
      this.progress.totalQuestions - this.progress.wrongAnswers;
  }

  // Score hesaplama (100% olacak - tüm sorular doğru)
  if (this.progress.totalQuestions > 0) {
    if (this.progress.correctAnswers === this.progress.totalQuestions) {
      this.score = 100;
      this.completed = true;
      if (!this.completedAt) {
        this.completedAt = new Date();
      }
    } else {
      this.score = null;
      this.completed = false;
    }
  }

  next();
});

// Compound index for unique user-campaign combination
userProgressSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", userProgressSchema);
