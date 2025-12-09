const mongoose = require("mongoose");

// Filter şeması (her segment için birden fazla filtre)
const filterSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: [true, "Filtre alanı zorunludur"],
      trim: true,
      // Örnek: 'age', 'location', 'purchaseAmount', 'lastPurchaseDate'
    },
    chain: {
      type: [String],
      required: [true, "Filtre zorunludur"],
      enum: ["ETH", "BNB", "ARB", "ETC"],
      validate: {
        validator: function (chainArray) {
          return chainArray && chainArray.length > 0;
        },
        message: "En az bir chain seçilmelidir",
      },
    },
    tx_types: {
      state: {
        type: String,
        enum: ["and", "or"],
        default: "and",
      },
      // bridge, lending, swap, other
      types: [
        {
          name: {
            type: String,
          },
          min_value: {
            type: Number,
            default: 0,
          },
          min_count: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    token_types: {
      state: {
        type: String,
        enum: ["and", "or"],
        default: "and",
      },
      // meme,ai,stable
      types: [
        {
          name: {
            type: String,
          },
          min_value: {
            type: Number,
            default: 0,
          },
          min_count: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  },
  { _id: true }
);

// Segment şeması
const segmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Segment adı zorunludur"],
      trim: true,
      uppercase: true,
      // Örnek: 'A', 'B', 'C'
    },
    reward: {
      type: Number,
      required: [true, "Ödül zorunludur"],
      min: 0,
    },
    maxParticipants: {
      type: Number,
      required: [true, "Maksimum katılımcı sayısı zorunludur"],
      min: 0,
    },
    currentParticipants: {
      type: Number,
      required: [true, "Mevcut katılımcı sayısı zorunludur"],
      min: 0,
    },
    description: {
      tr: { type: String, trim: true, maxlength: [500, "Açıklama en fazla 500 karakter olabilir"] },
      en: { type: String, trim: true, maxlength: [500, "Açıklama en fazla 500 karakter olabilir"] },
    },
    filters: {
      type: [filterSchema],
      validate: {
        validator: function (filters) {
          return filters && filters.length > 0;
        },
        message: "Her segment en az bir filtre içermelidir",
      },
    },
  },
  { _id: true, timestamps: true }
);

const campaignSchema = new mongoose.Schema({
  title: {
    tr: { type: String, required: true, maxlength: 100 },
    en: { type: String, required: true, maxlength: 100 }
  },
  description: {
    tr: { type: String, required: true, maxlength: 500 },
    en: { type: String, required: true, maxlength: 500 }
  },

  content: [
    {
      itemImage: { type: String, default: "" }, // Dil bağımsız
      itemVideo: { type: String, default: "" }, // Dil bağımsız
      itemTitle: {
        tr: { type: String, default: "", maxlength: 500 },
        en: { type: String, default: "", maxlength: 500 }
      },
      itemDescription: {
        tr: { type: String, default: "", maxlength: 500 },
        en: { type: String, default: "", maxlength: 500 }
      },
      itemIndex: { type: Number, default: 1, min: 0 },
    },
  ],

  segments: {
    type: [segmentSchema],
    validate: {
      validator: function (segments) {
        return segments && segments.length > 0;
      },
      message: "Kampanya en az bir segment içermelidir",
    },
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  questions: { type: Number, default: 5, min: 1 },

  questionIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] },
  ],

  tags: { type: [String], default: [] },

  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  company_logo: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^https?:\/\/.+/.test(v) || v.startsWith("data:image/"),
      message: "Geçerli bir resim URL'si veya base64 string giriniz",
    },
  },

  twitter_url: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(v),
      message: "Geçerli bir Twitter URL'si giriniz (twitter.com veya x.com)",
    },
  },

  telegram_url: {
    type: String,
    required: false,
    validate: {
      validator: (v) => {
        if (!v) return true; // Opsiyonel alan
        return /^https?:\/\/(www\.)?(t\.me|telegram\.me)\/.+/.test(v);
      },
      message: "Geçerli bir Telegram URL'si giriniz (t.me veya telegram.me)",
    },
  },

  website_url: {
    type: String,
    required: false,
    validate: {
      validator: (v) => {
        if (!v) return true; // Opsiyonel alan
        return /^https?:\/\/.+/.test(v);
      },
      message: "Geçerli bir website URL'si giriniz",
    },
  },

  status: {
    type: String,
    enum: ["active", "inactive", "expired", "upcoming"],
    default: "upcoming",
  },
  isActive: { type: Boolean, default: true },
  isRequired: { type: Boolean, default: false },
  isAdminAccept: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Bitiş tarihi kontrolü ve status güncelleme
campaignSchema.pre("save", function (next) {
  // Segment isimlerinin benzersiz olduğundan emin ol
  const segmentNames = this.segments.map((s) => s.name);
  const uniqueNames = new Set(segmentNames);
  if (segmentNames.length !== uniqueNames.size) {
    next(new Error("Segment isimleri benzersiz olmalıdır"));
  }
  const now = new Date();
  this.updatedAt = now;

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

campaignSchema.methods.addSegment = function (segmentData) {
  this.segments.push(segmentData);
  return this.save();
};
// Instance metodları
campaignSchema.methods.activate = function () {
  this.status = "active";
  return this.save();
};

campaignSchema.methods.inactive = function () {
  this.status = "inactive";
  return this.save();
};

campaignSchema.methods.expired = function () {
  this.status = "expired";
  return this.save();
};

campaignSchema.methods.upcoming = function () {
  this.status = "upcoming";
  return this.save();
};

// ========================================
// ✅ YENİ: Database Indexes (Performance Optimization)
// ========================================

// 1. Kampanya listeleme ve filtreleme için compound index
campaignSchema.index({
  status: 1,
  isActive: 1,
  isAdminAccept: 1,
  startDate: -1,
});

// 2. User bazlı kampanya sorgular için
campaignSchema.index({ createdUserId: 1, status: 1 });

// 3. Tarih bazlı sorgular için
campaignSchema.index({ endDate: 1, status: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });

// 4. Segment bazlı sorgular için (segments array içinde)
campaignSchema.index({ "segments.name": 1 });
campaignSchema.index({
  "segments.currentParticipants": 1,
  "segments.maxParticipants": 1,
});

// 5. Tag bazlı arama için
campaignSchema.index({ tags: 1 });

// 6. Full-text search için (title ve description) - Her dil için ayrı index
campaignSchema.index({ "title.tr": "text", "description.tr": "text" });
campaignSchema.index({ "title.en": "text", "description.en": "text" });

module.exports = mongoose.model("Campaign", campaignSchema);
