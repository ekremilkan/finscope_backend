"use strict";

const mongoose = require("mongoose");

const walletScoreSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    metrics: {
      volume: { type: Number, default: 0 },
      txCount: { type: Number, default: 0 },
      uniqueProtocols: { type: Number, default: 0 },
      balanceUsd: { type: Number, default: 0 },
      recency: { type: Number, default: 0 },
      nonCex: { type: Number, default: 0 },
      penalty: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const aggregateSchema = new mongoose.Schema(
  {
    volume: { type: Number, default: 0 },
    txCount: { type: Number, default: 0 },
    uniqueProtocols: { type: Number, default: 0 },
    balanceUsd: { type: Number, default: 0 },
    recency: { type: Number, default: 0 },
    nonCex: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSegmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chain: { type: String, enum: ["ethereum"], required: true, index: true },
    window: { type: String, enum: ["30d", "90d", "180d"], default: "90d", index: true },
    wallets: { type: [walletScoreSchema], default: [] },
    metricsAggregate: { type: aggregateSchema, default: {} },
    compositeScore: { type: Number, required: true, index: true },
    zScore: { type: Number },
    percentile: { type: Number },
    class: { type: String, enum: ["A", "B", "C", "D"], index: true },
    insufficientData: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    asOf: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

userSegmentSchema.index({ userId: 1, chain: 1, window: 1 }, { unique: true });

module.exports = mongoose.model("UserSegment", userSegmentSchema); 