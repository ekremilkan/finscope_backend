const mongoose = require('mongoose');

const campaignParticipationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
  },
  score: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  timeSpent: {
    type: Number,
    default: 0, // saniye
    min: 0,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Participation güncelleme
campaignParticipationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Status güncelleme
  if (this.score === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }
  
  next();
});

// Compound index for unique user-campaign combination
campaignParticipationSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model('CampaignParticipation', campaignParticipationSchema); 