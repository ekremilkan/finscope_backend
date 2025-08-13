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
  reward: {
    type: Number,
    required: true,
    min: 0,
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
  category: {
    type: String,
    default: "education",
    enum: [
      "education",
      "technology",
      "health",
      "finance",
      "sports",
      "entertainment",
      "other",
    ],
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
  // ✅ YENİ: Tahmini süre (dakika)
  estimatedDuration: {
    type: Number,
    default: 15,
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
  images: { type: [String], default: [] },
  // ✅ YENİ: Video URL'i (eski videoLink yerine)
  videoUrl: {
    type: String,
    default: "",
  },
  tags: {
    type: [String],
    default: [],
  },
  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Hangi kullanıcı oluşturdu
    required: true,
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
