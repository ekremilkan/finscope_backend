const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // User modeline referans
      required: true,
    },
    network: {
      type: String,
      required: true,
      enum: ["Ethereum", "Solana", "Tron", "BNBChain", "SUI", "Base"], // Desteklenen ağlar [cite: 2]
    },
    address: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Her cüzdan adresi tüm sistemde benzersiz olmalı
    },
    isAirdropAddress: {
      type: Boolean,
      default: false, // Bu cüzdanın airdrop için işaretlenip işaretlenmediği [cite: 3]
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
