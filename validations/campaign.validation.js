const Joi = require('joi');

// ========================================
// YENİ: Localized String Schema (Çoklu Dil Desteği)
// ========================================
const localizedStringSchema = Joi.object({
  tr: Joi.string()
    .required()
    .messages({
      'any.required': 'Turkish translation is required',
      'string.empty': 'Turkish text cannot be empty'
    }),
  en: Joi.string()
    .required()
    .messages({
      'any.required': 'English translation is required',
      'string.empty': 'English text cannot be empty'
    })
})
  .custom((value, helpers) => {
    // Her iki dil de dolu olmalı
    if (!value.tr || !value.en) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid': 'Both Turkish and English translations are required'
  });

// ========================================
// YENİ: Filter Schema (Segment Filtreleri)
// ========================================
const filterSchema = Joi.object({
  field: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'Filtre alanı boş olamaz',
      'any.required': 'Filtre alanı zorunludur'
    }),
  
  chain: Joi.array()
    .items(Joi.string().valid('ETH', 'BNB', 'ARB', 'ETC'))
    .min(1)
    .required()
    .messages({
      'array.min': 'En az bir chain seçilmelidir',
      'any.only': 'Chain ETH, BNB, ARB veya ETC olmalıdır',
      'any.required': 'Chain alanı zorunludur'
    }),
  
  tx_types: Joi.object({
    state: Joi.string()
      .valid('and', 'or')
      .default('and')
      .messages({
        'any.only': 'State and veya or olmalıdır'
      }),
    types: Joi.array().items(
      Joi.object({
        name: Joi.string()
          .valid('bridge', 'lending', 'swap', 'other')
          .messages({
            'any.only': 'Transaction type bridge, lending, swap veya other olmalıdır'
          }),
        min_value: Joi.number()
          .min(0)
          .default(0)
          .messages({
            'number.min': 'Min value 0 veya daha büyük olmalıdır'
          }),
        min_count: Joi.number()
          .min(0)
          .default(0)
          .messages({
            'number.min': 'Min count 0 veya daha büyük olmalıdır'
          })
      })
    ).default([])
  }).optional(),
  
  token_types: Joi.object({
    state: Joi.string()
      .valid('and', 'or')
      .default('and')
      .messages({
        'any.only': 'State and veya or olmalıdır'
      }),
    types: Joi.array().items(
      Joi.object({
        name: Joi.string()
          .valid('meme', 'ai', 'stable', 'defi', 'nft')
          .messages({
            'any.only': 'Token type meme, ai, stable, defi veya nft olmalıdır'
          }),
        min_value: Joi.number()
          .min(0)
          .default(0),
        min_count: Joi.number()
          .min(0)
          .default(0)
      })
    ).default([])
  }).optional()
});

// ========================================
// YENİ: Segment Schema
// ========================================
const segmentSchema = Joi.object({
  name: Joi.string()
    .uppercase()
    .required()
    .trim()
    .messages({
      'string.empty': 'Segment adı boş olamaz',
      'any.required': 'Segment adı zorunludur'
    }),
  
  reward: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Ödül sayı olmalıdır',
      'number.min': 'Ödül 0 veya daha büyük olmalıdır',
      'any.required': 'Ödül zorunludur'
    }),
  
  maxParticipants: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Maksimum katılımcı sayı olmalıdır',
      'number.min': 'Maksimum katılımcı 0 veya daha büyük olmalıdır',
      'any.required': 'Maksimum katılımcı zorunludur'
    }),
  
  currentParticipants: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Mevcut katılımcı 0 veya daha büyük olmalıdır'
    }),
  
  description: Joi.object({
    tr: Joi.string().max(500).allow('', null).messages({
      'string.max': 'Açıklama en fazla 500 karakter olabilir'
    }),
    en: Joi.string().max(500).allow('', null).messages({
      'string.max': 'Açıklama en fazla 500 karakter olabilir'
    })
  }).optional(),
  
  filters: Joi.array()
    .items(filterSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Her segment en az bir filtre içermelidir',
      'any.required': 'Filtreler zorunludur'
    })
});

// ========================================
// YENİ: Content Item Schema (Çoklu Dil Desteği)
// ========================================
const contentItemSchema = Joi.object({
  itemTitle: localizedStringSchema.required(),
  itemDescription: localizedStringSchema.required(),
  itemImage: Joi.string().uri().allow('', null).optional().messages({
    'string.uri': 'Geçerli bir item image URL giriniz'
  }),
  itemVideo: Joi.string().uri().allow('', null).optional().messages({
    'string.uri': 'Geçerli bir item video URL giriniz'
  }),
  itemIndex: Joi.number().min(0).default(1)
});

// ========================================
// Kampanya Oluşturma Validation Şeması
// ========================================
const createCampaignSchema = Joi.object({
  title: localizedStringSchema
    .custom((value, helpers) => {
      // Maxlength kontrolü
      if (value.tr && value.tr.length > 100) {
        return helpers.error('string.max', { limit: 100 });
      }
      if (value.en && value.en.length > 100) {
        return helpers.error('string.max', { limit: 100 });
      }
      return value;
    })
    .required()
    .messages({
      'string.max': 'Kampanya başlığı en fazla 100 karakter olmalıdır'
    }),
  
  description: localizedStringSchema
    .custom((value, helpers) => {
      // Maxlength kontrolü
      if (value.tr && value.tr.length > 500) {
        return helpers.error('string.max', { limit: 500 });
      }
      if (value.en && value.en.length > 500) {
        return helpers.error('string.max', { limit: 500 });
      }
      return value;
    })
    .required()
    .messages({
      'string.max': 'Kampanya açıklaması en fazla 500 karakter olmalıdır'
    }),
  
  content: Joi.array()
    .items(contentItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'En az bir içerik öğesi gereklidir',
      'any.required': 'Content zorunludur'
    }),
  
  // ========================================
  // YENİ: Segments Array (ESKİ rewards, maxParticipants YERİNE)
  // ========================================
  segments: Joi.array()
    .items(segmentSchema)
    .min(1)
    .required()
    .custom((segments, helpers) => {
      // Segment isimlerinin benzersiz olduğunu kontrol et
      const names = segments.map(s => s.name);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        return helpers.error('any.custom', { 
          message: 'Segment isimleri benzersiz olmalıdır' 
        });
      }
      return segments;
    })
    .messages({
      'array.min': 'Kampanya en az bir segment içermelidir',
      'any.required': 'Segments zorunludur'
    }),
  
  // ❌ ESKİ ALANLAR KALDIRILDI:
  // - rewards
  // - maxParticipants
  // - maxTotalParticipants
  // - currentParticipants
  
  startDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Geçerli bir başlangıç tarihi giriniz',
      'any.required': 'Başlangıç tarihi zorunludur'
    }),
  
  endDate: Joi.date()
    .required()
    .greater(Joi.ref('startDate'))
    .messages({
      'date.base': 'Geçerli bir bitiş tarihi giriniz',
      'any.required': 'Bitiş tarihi zorunludur',
      'date.greater': 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    }),
  
  questions: Joi.number()
    .min(1)
    .default(5)
    .messages({
      'number.base': 'Soru sayısı sayı olmalıdır',
      'number.min': 'Soru sayısı en az 1 olmalıdır'
    }),
  
  questionIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .default([]),
  
  tags: Joi.array().items(Joi.string()).default([]),
  
  company_logo: Joi.string()
    .required()
    .messages({
      'string.empty': 'Şirket logosu boş olamaz',
      'any.required': 'Şirket logosu zorunludur'
    })
    .custom((value, helpers) => {
      // URL veya base64 format kontrolü
      if (!/^https?:\/\/.+/.test(value) && !value.startsWith('data:image/')) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'Geçerli bir resim URL\'si veya base64 string giriniz'),
  
  twitter_url: Joi.string()
    .required()
    .messages({
      'string.empty': 'Twitter URL\'si boş olamaz',
      'any.required': 'Twitter URL\'si zorunludur'
    })
    .custom((value, helpers) => {
      // Twitter URL format kontrolü
      if (!/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'Geçerli bir Twitter URL\'si giriniz (twitter.com veya x.com)'),
  
  telegram_url: Joi.string()
    .uri()
    .allow('', null)
    .messages({
      'string.uri': 'Geçerli bir Telegram URL\'si giriniz'
    })
    .custom((value, helpers) => {
      if (!value) return value; // Opsiyonel alan
      // Telegram URL format kontrolü
      if (!/^https?:\/\/(www\.)?(t\.me|telegram\.me)\/.+/.test(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'Geçerli bir Telegram URL\'si giriniz (t.me veya telegram.me)'),
  
  website_url: Joi.string()
    .uri()
    .allow('', null)
    .messages({
      'string.uri': 'Geçerli bir website URL\'si giriniz'
    })
    .custom((value, helpers) => {
      if (!value) return value; // Opsiyonel alan
      // Website URL format kontrolü
      if (!/^https?:\/\/.+/.test(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'Geçerli bir website URL\'si giriniz'),
  
  status: Joi.string()
    .valid('active','inactive','expired','upcoming')
    .default('upcoming'),
  
  isActive: Joi.boolean().default(true),
  
  isAdminAccept: Joi.forbidden().messages({
    'any.unknown': 'Sadece admin bu alanı değiştirebilir.'
  }),
  
  createdUserId: Joi.forbidden().messages({
    'any.unknown': 'createdUserId istemci tarafından gönderilemez'
  })
});

// ========================================
// Update için Filter ve Segment Şemaları
// (MongoDB'den gelen _id, createdAt, updatedAt gibi otomatik alanları kabul eder)
// ========================================
const updateFilterSchema = filterSchema.unknown(true);

// Update için segment şeması - filters için updateFilterSchema kullan
const updateSegmentSchema = segmentSchema.fork(['filters'], schema => 
  schema.items(updateFilterSchema)
).unknown(true);

// Kampanya güncelleme validation şeması
// Update için tüm alanları optional yap ve bilinmeyen alanları kabul et
// (MongoDB'den gelen _id, createdAt, updatedAt gibi otomatik alanlar için)
const updateCampaignSchema = createCampaignSchema.fork(
  Object.keys(createCampaignSchema.describe().keys),
  schema => schema.optional()
).fork(['segments'], schema => 
  schema.items(updateSegmentSchema)
).unknown(true); // MongoDB'den gelen otomatik alanları (_id, createdAt, updatedAt) kabul et

// Progress update validation
const updateProgressSchema = Joi.object({
  questionId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Soru ID\'si boş olamaz',
      'any.required': 'Soru ID\'si zorunludur'
    }),
  selectedAnswer: Joi.number()
    .min(0)
    .max(3)
    .required()
    .messages({
      'number.base': 'Seçilen cevap sayı olmalıdır',
      'number.min': 'Seçilen cevap 0-3 arasında olmalıdır',
      'number.max': 'Seçilen cevap 0-3 arasında olmalıdır',
      'any.required': 'Seçilen cevap zorunludur'
    }),
  isCorrect: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'Doğru/yanlış durumu boolean olmalıdır',
      'any.required': 'Doğru/yanlış durumu zorunludur'
    }),
  timeSpent: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Harcanan süre sayı olmalıdır',
      'number.min': 'Harcanan süre 0 veya daha büyük olmalıdır',
      'any.required': 'Harcanan süre zorunludur'
    }),
  completed: Joi.boolean().default(false)
});

// Quiz completion validation
const completeQuizSchema = Joi.object({
  totalTimeSpent: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Toplam harcanan süre sayı olmalıdır',
      'number.min': 'Toplam harcanan süre 0 veya daha büyük olmalıdır',
      'any.required': 'Toplam harcanan süre zorunludur'
    }),
});

// ========================================
// Middleware Functions
// ========================================
const validateCreateCampaign = (req, res, next) => {
  const { error } = createCampaignSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: 'Validation hatası', 
      errors, 
      code: 400 
    });
  }
  next();
};

const validateUpdateCampaign = (req, res, next) => {
  // Update için bilinmeyen alanları kabul et (MongoDB otomatik alanları için)
  const { error } = updateCampaignSchema.validate(req.body, { 
    abortEarly: false,
    allowUnknown: true, // MongoDB'den gelen _id, createdAt, updatedAt gibi alanları kabul et
    stripUnknown: false // Bilinmeyen alanları silme, sadece kabul et
  });
  
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: 'Validation hatası', 
      errors, 
      code: 400 
    });
  }
  next();
};

const validateUpdateProgress = (req, res, next) => {
  const { error } = updateProgressSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: 'Validation hatası', 
      errors, 
      code: 400 
    });
  }
  next();
};

const validateCompleteQuiz = (req, res, next) => {
  const { error } = completeQuizSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: 'Validation hatası', 
      errors, 
      code: 400 
    });
  }
  next();
};

const validateUpdatePurchase = (req, res, next) => {
  const bodySchema = Joi.object({
    isPurchase: Joi.boolean().required().messages({
      'boolean.base': 'isPurchase boolean olmalıdır',
      'any.required': 'isPurchase alanı zorunludur'
    }),
    depositedAmount: Joi.number().min(0).optional().messages({
      'number.base': 'depositedAmount sayı olmalıdır',
      'number.min': 'depositedAmount 0 veya daha büyük olmalıdır'
    })
  });

  // Body kontrolü
  const { error } = bodySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: error.details[0].message, 
      code: 400 
    });
  }

  // Param kontrolü (ObjectId deseni)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  const { userId, campaignId } = req.params || {};
  if (!objectIdRegex.test(userId || '')) {
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: 'Geçersiz userId', 
      code: 400 
    });
  }
  if (!objectIdRegex.test(campaignId || '')) {
    return res.status(400).json({ 
      success: false, 
      error: true, 
      message: 'Geçersiz campaignId', 
      code: 400 
    });
  }

  next();
};

module.exports = {
  // Schemas
  filterSchema,
  segmentSchema,
  createCampaignSchema,
  updateCampaignSchema,
  updateProgressSchema,
  completeQuizSchema,
  
  // Validators
  validateCreateCampaign,
  validateUpdateCampaign,
  validateUpdateProgress,
  validateCompleteQuiz,
  validateUpdatePurchase
};
