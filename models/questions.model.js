const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isTrue: {
    type: Boolean,
    default: false,
  },
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    maxlength: 300,
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function (v) {
        return v.length === 4;
      },
      message: 'There must be exactly 4 options.',
    },
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign', // Hangi kampanyaya ait
    required: true,
  },
  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Hangi kullanıcı oluşturdu
    required: true,
  },
  order: {
    type: Number,
    default: 0, // Soru sırası
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

// updatedAt alanını güncelle
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Question', questionSchema);
