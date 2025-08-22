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
  content: Joi.array().items(
    Joi.object({
      itemImage: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Geçerli bir item image URL giriniz'
      }),
      itemVideo: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Geçerli bir item video URL giriniz'
      }),
      itemTitle: Joi.string().max(500).allow('', null).messages({
        'string.max': 'Item başlığı en fazla 500 karakter olmalıdır'
      }),
      itemDescription: Joi.string().max(500).allow('', null).messages({
        'string.max': 'Item açıklaması en fazla 500 karakter olmalıdır'
      }),
      itemIndex: Joi.number().min(0).default(0)
    })
  ).default([]),
  reward: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Ödül miktarı sayı olmalıdır',
      'number.min': 'Ödül miktarı 0 veya daha büyük olmalıdır',
      'any.required': 'Ödül miktarı zorunludur'
    }),
  maxParticipants: Joi.object({
    A: Joi.number().min(0).default(0),
    B: Joi.number().min(0).default(0),
    C: Joi.number().min(0).default(0),
    D: Joi.number().min(0).default(0)
  }).default({ A:0,B:0,C:0,D:0 }),
  // currentParticipants uygulama tarafından yönetilir; istemciden gelirse yok sayılacaktır
  currentParticipants: Joi.object({
    A: Joi.number().min(0).default(0),
    B: Joi.number().min(0).default(0),
    C: Joi.number().min(0).default(0),
    D: Joi.number().min(0).default(0)
  }).default({ A:0,B:0,C:0,D:0 }),
  category: Joi.string()
    .valid('education', 'technology', 'health', 'finance', 'sports', 'entertainment', 'other')
    .default('education')
    .messages({
      'any.only': 'Geçerli bir kategori seçiniz'
    }),
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
  estimatedDuration: Joi.number()
    .min(1)
    .default(15)
    .messages({
      'number.base': 'Tahmini süre sayı olmalıdır',
      'number.min': 'Tahmini süre en az 1 dakika olmalıdır'
    }),
  questionIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .default([]),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .default([]),
  videoUrl: Joi.string().uri().allow('', null),
  tags: Joi.array().items(Joi.string()).default([]),
  status: Joi.string().valid('active','inactive','expired','upcoming').default('upcoming'),
  isActive: Joi.boolean().default(true),
  isAdminAccept: Joi.forbidden().messages({
    'any.unknown': 'Sadece admin bu alanı değiştirebilir.'
  }),
  // createdUserId uygulama tarafından auth üzerinden set edilir; istemci gönderemez
  createdUserId: Joi.forbidden().messages({
    'any.unknown': 'createdUserId istemci tarafından gönderilemez'
  })
});

// Kampanya güncelleme validation şeması
const updateCampaignSchema = createCampaignSchema.fork(
  Object.keys(createCampaignSchema.describe().keys),
  schema => schema.optional()
);

// Progress update ve quiz completion validation senkron
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

// Middleware'ler
const validateCreateCampaign = (req, res, next) => {
  const { error } = createCampaignSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, error: true, message: 'Validation hatası', errors, code: 400 });
  }
  next();
};

const validateUpdateCampaign = (req, res, next) => {
  const { error } = updateCampaignSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, error: true, message: 'Validation hatası', errors, code: 400 });
  }
  next();
};

const validateUpdateProgress = (req, res, next) => {
  const { error } = updateProgressSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, error: true, message: 'Validation hatası', errors, code: 400 });
  }
  next();
};

const validateCompleteQuiz = (req, res, next) => {
  const { error } = completeQuizSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, error: true, message: 'Validation hatası', errors, code: 400 });
  }
  next();
};

// ✅ YENİ: Ödeme durumu güncelleme validation
const validateUpdatePurchase = (req, res, next) => {
  const bodySchema = Joi.object({
    isPurchase: Joi.boolean().required().messages({
      'boolean.base': 'isPurchase boolean olmalıdır',
      'any.required': 'isPurchase alanı zorunludur'
    })
  });

  // Body kontrolü
  const { error } = bodySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: true, message: error.details[0].message, code: 400 });
  }

  // Param kontrolü (ObjectId deseni)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  const { userId, campaignId } = req.params || {};
  if (!objectIdRegex.test(userId || '')) {
    return res.status(400).json({ success: false, error: true, message: 'Geçersiz userId', code: 400 });
  }
  if (!objectIdRegex.test(campaignId || '')) {
    return res.status(400).json({ success: false, error: true, message: 'Geçersiz campaignId', code: 400 });
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
  validateCompleteQuiz,
  validateUpdatePurchase
};
