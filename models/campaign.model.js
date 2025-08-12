const mongoose = require('mongoose');

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
  // ✅ YENİ: Detaylı kampanya içeriği
  content: {
    type: String,
    default: '',
    maxlength: 2000,
  },

    // Kampanyaya ait soruların ID'leri
  content: [
    {
      itemImage: {
      type: String,
      default: '',
      },
      itemVideo:{
        type: String,
        default:'',
      },
      itemTitle: {
        type: String,
        default: '',
        maxlength: 500,
      },
      itemDescription: {
        type: String,
        default: '',
        maxlength: 500,
      },
        itemIndex: {
        type: Number,
        default: 1,
        min: 0,
      },
    }
  ],
  reward: {
    type: Number,
    required: true,
    min: 0,
  },
  maxParticipants: {
    type: Number,
    default: 100,
    min: 1,
  },
  // ✅ YENİ: Mevcut katılımcı sayısı
  participants: {
    type: Number,
    default: 0,
    min: 0,
  },
  // ✅ YENİ: Aktif katılımcı sayısı
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0,
  },
  category: {
    type: String,
    default: 'education',
    enum: ['education', 'technology', 'health', 'finance', 'sports', 'entertainment', 'other'],
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
  questionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: []
  }],
  images: {
    type: String, // Resim URL'leri dizisi
    default: '',
  },
  // ✅ YENİ: Video URL'i (eski videoLink yerine)
  videoUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Boş olabilir
        // YouTube, Vimeo, veya diğer video platformları için basit URL kontrolü
        const urlPattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com|instagram\.com)\/.+/;
        return urlPattern.test(v);
      },
      message: 'Geçerli bir video linki giriniz (YouTube, Vimeo, vb.)'
    }
  },
  // ✅ YENİ: Image URLs (eski images yerine)
  imageUrls: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10; // Maksimum 10 resim
      },
      message: 'En fazla 10 resim eklenebilir'
    }
  },
  // Geriye uyumluluk için eski videoLink alanını koru
  videoLink: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Boş olabilir
        // YouTube, Vimeo, veya diğer video platformları için basit URL kontrolü
        const urlPattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com|instagram\.com)\/.+/;
        return urlPattern.test(v);
      },
      message: 'Geçerli bir video linki giriniz (YouTube, Vimeo, vb.)'
    }
  },
  tags: {
    type: [String],
    default: [],
  },
  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Hangi kullanıcı oluşturdu
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'upcoming'],
    default: 'upcoming',
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Bitiş tarihi kontrolü ve status güncelleme
campaignSchema.pre('save', function(next) {
  const now = new Date();
  
  // updatedAt alanını güncelle
  this.updatedAt = now;
  
  // Status kontrolü
  if (this.endDate < now) {
    this.status = 'expired';
    this.isActive = false;
  } else if (this.startDate > now) {
    this.status = 'upcoming';
  } else {
    this.status = 'active';
  }
  
  // ✅ YENİ: Participants validasyonu
  if (this.participants > this.maxParticipants) {
    this.participants = this.maxParticipants;
  }
  
  if (this.currentParticipants > this.participants) {
    this.currentParticipants = this.participants;
  }
  
  next();
});

// Tarih validasyonu
campaignSchema.pre('validate', function(next) {
  if (this.startDate >= this.endDate) {
    const err = new Error('Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
    return next(err);
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
