// models/verificationRun.model.js
const mongoose = require("mongoose");

const VerificationRunSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    job: { type: String, required: true }, // "x_follow_verify"
    ranAt: { type: Date, default: Date.now },
    report: { type: Object, default: null },
  },
  { timestamps: true }
);

VerificationRunSchema.index({ campaignId: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("VerificationRun", VerificationRunSchema);
