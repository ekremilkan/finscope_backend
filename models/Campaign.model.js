const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  reward: {
    type: Number,
    required: true,
    min: 0,
  },
  maxParticipants: {
    type: Number,
    default: 100,
    min: 1,
  },
  category: {
    type: String,
    default: 'education',
    enum: ['education', 'technology', 'health', 'finance', 'sports', 'entertainment', 'other'], // frontend'deki category ID'lerine göre düzenle
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  duration: {
    type: String,
    default: '', // örneğin "5 days"
  },
  questions: {
    type: Number,
    default: 5,
    min: 1,
  },
  passRate: {
    type: Number,
    default: 70,
    min: 0,
    max: 100,
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
});

module.exports = mongoose.model('Campaign', campaignSchema);
