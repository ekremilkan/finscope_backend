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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Question', questionSchema);
