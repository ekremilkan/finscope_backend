const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["send", "receive", "swap", "stake", "unstake", "airdrop", "other"],
    },
    amount: {
      type: String, // String olarak saklıyoruz (precision için)
      required: true,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fromAddress: {
      type: String,
      trim: true,
    },
    toAddress: {
      type: String,
      trim: true,
    },
    gasUsed: {
      type: String,
      default: "0",
    },
    gasPrice: {
      type: String,
      default: "0",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    blockNumber: {
      type: Number,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ txHash: 1 }, { unique: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction; 