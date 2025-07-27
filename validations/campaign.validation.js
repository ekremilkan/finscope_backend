const Joi = require('joi');

// Kampanya oluşturma validation şeması
const createCampaignSchema = Joi.object({
  title: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Kampanya başlığı boş olamaz',
      'string.max': 'Kampanya başlığı en fazla 100 karakter olmalıdır',
      'any.required': 'Kampanya başlığı zorunludur'
    }),
  description: Joi.string()
    .max(500)
    .required()
    .messages({
      'string.empty': 'Kampanya açıklaması boş olamaz',
      'string.max': 'Kampanya açıklaması en fazla 500 karakter olmalıdır',
      'any.required': 'Kampanya açıklaması zorunludur'
    }),
  // ✅ YENİ: Detaylı kampanya içeriği
  content: Joi.string()
    .max(2000)
    .default('')
    .messages({
      'string.max': 'Kampanya içeriği en fazla 2000 karakter olmalıdır'
    }),
  reward: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Ödül miktarı sayı olmalıdır',
      'number.min': 'Ödül miktarı 0 veya daha büyük olmalıdır',
      'any.required': 'Ödül miktarı zorunludur'
    }),
  maxParticipants: Joi.number()
    .min(1)
    .default(100)
    .messages({
      'number.base': 'Maksimum katılımcı sayısı sayı olmalıdır',
      'number.min': 'Maksimum katılımcı sayısı en az 1 olmalıdır'
    }),
  category: Joi.string()
    .valid('education', 'technology', 'health', 'finance', 'sports', 'entertainment', 'other')
    .default('education')
    .messages({
      'any.only': 'Geçerli bir kategori seçiniz'
    }),
  difficulty: Joi.string()
    .valid('Beginner', 'Intermediate', 'Advanced')
    .default('Beginner')
    .messages({
      'any.only': 'Geçerli bir zorluk seviyesi seçiniz'
    }),
  startDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Geçerli bir başlangıç tarihi giriniz',
      'any.required': 'Başlangıç tarihi zorunludur'
    }),
  endDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Geçerli bir bitiş tarihi giriniz',
      'any.required': 'Bitiş tarihi zorunludur'
    }),
  questions: Joi.number()
    .min(1)
    .default(5)
    .messages({
      'number.base': 'Soru sayısı sayı olmalıdır',
      'number.min': 'Soru sayısı en az 1 olmalıdır'
    }),
  // ✅ YENİ: Tahmini süre
  estimatedDuration: Joi.number()
    .min(1)
    .default(15)
    .messages({
      'number.base': 'Tahmini süre sayı olmalıdır',
      'number.min': 'Tahmini süre en az 1 dakika olmalıdır'
    }),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .default([])
    .messages({
      'array.base': 'Resimler dizi formatında olmalıdır',
      'array.max': 'En fazla 10 resim eklenebilir',
      'string.uri': 'Geçerli resim URL\'leri giriniz'
    }),
  // ✅ YENİ: Image URLs
  imageUrls: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .default([])
    .messages({
      'array.base': 'Resim URL\'leri dizi formatında olmalıdır',
      'array.max': 'En fazla 10 resim eklenebilir',
      'string.uri': 'Geçerli resim URL\'leri giriniz'
    }),
  videoLink: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Geçerli bir video linki giriniz'
    }),
  // ✅ YENİ: Video URL
  videoUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Geçerli bir video URL\'i giriniz'
    }),
  tags: Joi.array()
    .items(Joi.string())
    .default([])
    .messages({
      'array.base': 'Etiketler dizi formatında olmalıdır'
    })
});

// Kampanya güncelleme validation şeması
const updateCampaignSchema = Joi.object({
  title: Joi.string()
    .max(100)
    .messages({
      'string.empty': 'Kampanya başlığı boş olamaz',
      'string.max': 'Kampanya başlığı en fazla 100 karakter olmalıdır'
    }),
  description: Joi.string()
    .max(500)
    .messages({
      'string.empty': 'Kampanya açıklaması boş olamaz',
      'string.max': 'Kampanya açıklaması en fazla 500 karakter olmalıdır'
    }),
  // ✅ YENİ: Detaylı kampanya içeriği
  content: Joi.string()
    .max(2000)
    .messages({
      'string.max': 'Kampanya içeriği en fazla 2000 karakter olmalıdır'
    }),
  reward: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Ödül miktarı sayı olmalıdır',
      'number.min': 'Ödül miktarı 0 veya daha büyük olmalıdır'
    }),
  maxParticipants: Joi.number()
    .min(1)
    .messages({
      'number.base': 'Maksimum katılımcı sayısı sayı olmalıdır',
      'number.min': 'Maksimum katılımcı sayısı en az 1 olmalıdır'
    }),
  category: Joi.string()
    .valid('education', 'technology', 'health', 'finance', 'sports', 'entertainment', 'other')
    .messages({
      'any.only': 'Geçerli bir kategori seçiniz'
    }),
  difficulty: Joi.string()
    .valid('Beginner', 'Intermediate', 'Advanced')
    .messages({
      'any.only': 'Geçerli bir zorluk seviyesi seçiniz'
    }),
  startDate: Joi.date()
    .messages({
      'date.base': 'Geçerli bir başlangıç tarihi giriniz'
    }),
  endDate: Joi.date()
    .messages({
      'date.base': 'Geçerli bir bitiş tarihi giriniz'
    }),
  questions: Joi.number()
    .min(1)
    .messages({
      'number.base': 'Soru sayısı sayı olmalıdır',
      'number.min': 'Soru sayısı en az 1 olmalıdır'
    }),
  // ✅ YENİ: Tahmini süre
  estimatedDuration: Joi.number()
    .min(1)
    .messages({
      'number.base': 'Tahmini süre sayı olmalıdır',
      'number.min': 'Tahmini süre en az 1 dakika olmalıdır'
    }),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .messages({
      'array.base': 'Resimler dizi formatında olmalıdır',
      'array.max': 'En fazla 10 resim eklenebilir',
      'string.uri': 'Geçerli resim URL\'leri giriniz'
    }),
  // ✅ YENİ: Image URLs
  imageUrls: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .messages({
      'array.base': 'Resim URL\'leri dizi formatında olmalıdır',
      'array.max': 'En fazla 10 resim eklenebilir',
      'string.uri': 'Geçerli resim URL\'leri giriniz'
    }),
  videoLink: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Geçerli bir video linki giriniz'
    }),
  // ✅ YENİ: Video URL
  videoUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Geçerli bir video URL\'i giriniz'
    }),
  tags: Joi.array()
    .items(Joi.string())
    .messages({
      'array.base': 'Etiketler dizi formatında olmalıdır'
    }),
  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'Aktiflik durumu boolean olmalıdır'
    })
});

// ✅ YENİ: Progress update validation şeması
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
  completed: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Tamamlanma durumu boolean olmalıdır'
    })
});

// ✅ YENİ: Quiz completion validation şeması
const completeQuizSchema = Joi.object({
  totalTimeSpent: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Toplam harcanan süre sayı olmalıdır',
      'number.min': 'Toplam harcanan süre 0 veya daha büyük olmalıdır',
      'any.required': 'Toplam harcanan süre zorunludur'
    }),
  score: Joi.number()
    .valid(100)
    .required()
    .messages({
      'number.base': 'Skor sayı olmalıdır',
      'any.only': 'Quiz tamamlanması için skor 100 olmalıdır',
      'any.required': 'Skor zorunludur'
    }),
  questionsAnswered: Joi.number()
    .min(1)
    .required()
    .messages({
      'number.base': 'Cevaplanan soru sayısı sayı olmalıdır',
      'number.min': 'Cevaplanan soru sayısı en az 1 olmalıdır',
      'any.required': 'Cevaplanan soru sayısı zorunludur'
    }),
  totalQuestions: Joi.number()
    .min(1)
    .required()
    .messages({
      'number.base': 'Toplam soru sayısı sayı olmalıdır',
      'number.min': 'Toplam soru sayısı en az 1 olmalıdır',
      'any.required': 'Toplam soru sayısı zorunludur'
    })
});

// Validation middleware'leri
const validateCreateCampaign = (req, res, next) => {
  const { error } = createCampaignSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
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
  const { error } = updateCampaignSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
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

// ✅ YENİ: Progress update validation middleware
const validateUpdateProgress = (req, res, next) => {
  const { error } = updateProgressSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
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

// ✅ YENİ: Quiz completion validation middleware
const validateCompleteQuiz = (req, res, next) => {
  const { error } = completeQuizSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
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

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  updateProgressSchema,
  completeQuizSchema,
  validateCreateCampaign,
  validateUpdateCampaign,
  validateUpdateProgress,
  validateCompleteQuiz
}; 