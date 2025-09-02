const mongoose = require("mongoose");

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
  // Kampanyaya ait soruların ID'leri
  content: [
    {
      itemImage: {
        type: String,
        default: "",
      },
      itemVideo: {
        type: String,
        default: "",
      },
      itemTitle: {
        type: String,
        default: "",
        maxlength: 500,
      },
      itemDescription: {
        type: String,
        default: "",
        maxlength: 500,
      },
      itemIndex: {
        type: Number,
        default: 1,
        min: 0,
      },
    },
  ],
  // ✅ GÜNCELLENDİ: Her segment için farklı ödül değerleri
  rewards: {
    A: {
      type: Number,
      required: true,
      min: 0,
    },
    B: {
      type: Number,
      required: true,
      min: 0,
    },
    C: {
      type: Number,
      required: true,
      min: 0,
    },
    D: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  maxParticipants: {
    A: {
      type: Number,
      default: 0,
      min: 0,
    },
    B: {
      type: Number,
      default: 0,
      min: 0,
    },
    C: {
      type: Number,
      default: 0,
      min: 0,
    },
    D: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  // ✅ YENİ: Mevcut katılımcı sayısı
  currentParticipants: {
    A: {
      type: Number,
      default: 0,
      min: 0,
    },
    B: {
      type: Number,
      default: 0,
      min: 0,
    },
    C: {
      type: Number,
      default: 0,
      min: 0,
    },
    D: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  
  // ✅ YENİ: Toplam katılımcı sayısı (segment bazlı toplam)
  participants: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // ✅ YENİ: Toplam maksimum katılımcı sayısı
  maxTotalParticipants: {
    type: Number,
    default: 0,
    min: 0,
  },

  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  questions: {
    type: Number,
    default: 5,
    min: 1,
  },
  // Kampanyaya ait soruların ID'leri
  questionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: [],
    },
  ],
  tags: {
    type: [String],
    default: [],
  },
  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Hangi kullanıcı oluşturdu
    required: true,
  },
  // ✅ YENİ: Şirket logosu (zorunlu)
  company_logo: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // URL formatı kontrolü
        return /^https?:\/\/.+/.test(v) || v.startsWith('data:image/');
      },
      message: 'Geçerli bir resim URL\'si veya base64 string giriniz'
    }
  },
  // ✅ YENİ: Twitter URL (zorunlu)
  twitter_url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Twitter URL formatı kontrolü
        return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(v);
      },
      message: 'Geçerli bir Twitter URL\'si giriniz (twitter.com veya x.com)'
    }
  },
  status: {
    type: String,
    enum: ["active", "inactive", "expired", "upcoming"],
    default: "upcoming",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isAdminAccept: {
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
  // --- Segmentasyon Kriterleri ---
  segmentation: {
    // Genel Portföy
    portfolioFilters: {
      minTotalValueUsd: { type: Number },
      minTokenCount: { type: Number },
      minChainValues: [
        {
          chain: {
            type: String,
            enum: ["eth", "bsc", "polygon", "arbitrum", "optimism", "base"],
          },
          minValueUsd: Number,
        },
      ],
      minTokenHoldings: [
        {
          symbol: {
            type: String,
            enum: ["ETH", "USDC", "UNI", "COMP", "FET", "MATIC", "BNB"],
          },
          minAmount: Number,
        },
      ],
      diversification: {
        maxHHI: Number,
        maxTop5Concentration: Number,
        riskScore: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
      },
      minNativeBalances: [
        {
          chain: {
            type: String,
            enum: ["eth", "bsc", "polygon", "arbitrum", "optimism", "base"],
          },
          symbol: {
            type: String,
            enum: ["ETH", "BNB", "MATIC"],
          },
          minAmount: Number,
        },
      ],
    },

    // Token Dağılımı
    tokenCategoryPercentage: [
      {
        category: {
          type: String,
          enum: [
            "dex",
            "stablecoin",
            "layer1",
            "layer2",
            "lending_protocol",
            "ai",
            "gamefi",
            "liquid_staking",
            "meme_token",
            "oracle",
            "restaking",
            "bridge",
            "yield_farming",
            "infrastructure",
            "alt",
          ],
        },
        minPercent: Number,
        maxPercent: Number,
      },
    ],

    // DeFi Aktivitesi
    minDefiTvlUsd: { type: Number, default: 0 },
    defiProtocols: [
      {
        protocol: {
          type: String,
          enum: ["compound", "aave", "lido", "uniswap_v3", "sushiswap"],
        },
        type: {
          type: String,
          enum: ["supplied", "borrowed", "liquidity", "staked"],
        },
        minUsdValue: Number,
      },
    ],

    // Trading Aktivitesi
    minTrades: { type: Number, default: 0 },
    minTradingVolumeUsd: { type: Number, default: 0 },
    requiredDexes: [
      {
        type: String,
        enum: ["uniswap_v3", "sushiswap", "pancakeswap", "1inch"],
      },
    ],
    pnlFilters: [
      {
        chain: {
          type: String,
          enum: ["eth", "bsc", "polygon", "arbitrum", "optimism", "base"],
        },
        period: { type: String, enum: ["7d", "30d", "90d"] },
        minRoiPercent: Number,
      },
    ],

    // NFT Portföyü
    requiredNftCollections: [{ type: String }],
    minBlueChipNfts: { type: Number, default: 0 },

    // Davranışsal Skorlar
    riskTolerance: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
    handsClassification: {
      type: String,
      enum: ["PAPER_HANDS", "DIAMOND_HANDS"],
    },
    behavioralScores: {
      minHodlScore: Number,
      minTraderScore: Number,
      minSophisticationScore: Number,
      minDiamondHandsScore: Number,
    },

    // Güvenlik
    security: {
      maxUnlimitedApprovals: Number,
      maxHighRiskApprovals: Number,
    },

    // Wallet Classifications
    walletClassifications: [
      {
        type: String,
        enum: [
          "Plankton (<0.01 BTC)",
          "Shrimp (<1 BTC)",
          "Crab (1–10 BTC)",
          "Octopus (10–50 BTC)",
          "Fish (50–100 BTC)",
          "Dolphin (100–500 BTC)",
          "Shark (500–1,000 BTC)",
          "Whale (1,000–5,000 BTC)",
          "Humpback (>5,000 BTC)",
          "Early Retail (<$10k, pre-2020)",
          "Early Professional ($10k–$10M, pre-2020)",
          "Early Institutional (>$10M, pre-2020)",
          "Late Retail (<$10k, post-2020)",
          "Late Professional ($10k–$10M, post-2020)",
          "Late Institutional (>$10M, post-2020)",
          "Custom",
        ],
      },
    ],
  },
});

// Bitiş tarihi kontrolü ve status güncelleme
campaignSchema.pre("save", function (next) {
  const now = new Date();

  // updatedAt alanını güncelle
  this.updatedAt = now;

  // Status kontrolü
  if (this.endDate < now) {
    this.status = "expired";
    this.isActive = false;
  } else if (this.startDate > now) {
    this.status = "upcoming";
  } else {
    this.status = "active";
  }

  // ✅ YENİ: maxTotalParticipants hesaplama (eğer belirtilmemişse)
  if (!this.maxTotalParticipants || this.maxTotalParticipants === 0) {
    this.maxTotalParticipants = Object.values(this.maxParticipants || {}).reduce((sum, count) => sum + count, 0);
  }

  // ✅ YENİ: participants hesaplama (eğer belirtilmemişse)
  if (!this.participants || this.participants === 0) {
    this.participants = Object.values(this.currentParticipants || {}).reduce((sum, count) => sum + count, 0);
  }

  next();
});

// Tarih validasyonu
campaignSchema.pre("validate", function (next) {
  if (this.startDate >= this.endDate) {
    const err = new Error("Başlangıç tarihi bitiş tarihinden önce olmalıdır.");
    return next(err);
  }
  next();
});

module.exports = mongoose.model("Campaign", campaignSchema);
