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
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .default([])
    .messages({
      'array.base': 'Resimler dizi formatında olmalıdır',
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
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .messages({
      'array.base': 'Resimler dizi formatında olmalıdır',
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

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  validateCreateCampaign,
  validateUpdateCampaign
}; 