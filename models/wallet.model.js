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
      enum: ["Ethereum", 
        "BNB Smart Chain", // "BNBChain" yerine wagmi'nin kullandığı isim
        "Polygon",         // Eklendi
        "Arbitrum One",    // Eklendi
        "OP Mainnet",      // Eklendi
        "Base",
        // EVM dışı cüzdanlar
        "Solana", 
        "Tron", 
        "SUI"], // Desteklenen ağlar
    },
    address: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Her cüzdan adresi tüm sistemde benzersiz olmalı
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAirdropAddress: {
      type: Boolean,
      default: false, // Bu cüzdanın airdrop için işaretlenip işaretlenmediği
    },
    // YENİ: Bakiye bilgileri (SADECE BLOCKCHAIN'DEN)
    balances: [
      {
        currency: {
          type: String,
          required: true,
          trim: true,
          uppercase: true, // ETH, BTC, SOL vs.
        },
        amount: {
          type: String, // Precision için string
          required: true,
          default: "0",
        },
        usdValue: {
          type: String, // USD karşılığı
          default: "0",
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Son blockchain sorgusu tarihi
    lastBalanceCheck: {
      type: Date,
      default: Date.now,
    },
    // Toplam portföy değeri (USD) - SADECE BLOCKCHAIN'DEN HESAPLANAN
    totalUsdValue: {
      type: String,
      default: "0",
    },
  },
  {
    timestamps: true,
  }
);

// Bakiye arama için index
walletSchema.index({ user: 1, network: 1 });
walletSchema.index({ "balances.currency": 1 });

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
