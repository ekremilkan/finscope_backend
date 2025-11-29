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

// Seçenek şeması
const optionSchema = Joi.object({
  text: localizedStringSchema.required(),
  isTrue: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Doğru cevap boolean olmalıdır'
    })
});

// Soru oluşturma validation şeması
const createQuestionSchema = Joi.object({
  questionText: localizedStringSchema
    .custom((value, helpers) => {
      // Maxlength kontrolü
      if (value.tr && value.tr.length > 300) {
        return helpers.error('string.max', { limit: 300 });
      }
      if (value.en && value.en.length > 300) {
        return helpers.error('string.max', { limit: 300 });
      }
      return value;
    })
    .required()
    .messages({
      'string.max': 'Soru metni en fazla 300 karakter olmalıdır'
    }),
  options: Joi.array()
    .items(optionSchema)
    .length(4)
    .required()
    .messages({
      'array.base': 'Seçenekler dizi formatında olmalıdır',
      'array.length': 'Tam olarak 4 seçenek olmalıdır',
      'any.required': 'Seçenekler zorunludur'
    }),
  campaignId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Kampanya ID boş olamaz',
      'any.required': 'Kampanya ID zorunludur'
    }),
  order: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Soru sırası sayı olmalıdır',
      'number.min': 'Soru sırası 0 veya daha büyük olmalıdır'
    })
});

// Soru güncelleme validation şeması
const updateQuestionSchema = Joi.object({
  questionText: localizedStringSchema
    .custom((value, helpers) => {
      // Maxlength kontrolü
      if (value && value.tr && value.tr.length > 300) {
        return helpers.error('string.max', { limit: 300 });
      }
      if (value && value.en && value.en.length > 300) {
        return helpers.error('string.max', { limit: 300 });
      }
      return value;
    })
    .optional()
    .messages({
      'string.max': 'Soru metni en fazla 300 karakter olmalıdır'
    }),
  options: Joi.array()
    .items(optionSchema)
    .length(4)
    .messages({
      'array.base': 'Seçenekler dizi formatında olmalıdır',
      'array.length': 'Tam olarak 4 seçenek olmalıdır'
    }),
  order: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Soru sırası sayı olmalıdır',
      'number.min': 'Soru sırası 0 veya daha büyük olmalıdır'
    })
});

// Validation middleware'leri
const validateCreateQuestion = (req, res, next) => {
  const { error } = createQuestionSchema.validate(req.body, { abortEarly: false });
  
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
  
  // Özel validasyon: Sadece bir doğru cevap olmalı
  const trueCount = req.body.options.filter(opt => opt.isTrue === true).length;
  if (trueCount !== 1) {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'Validation hatası',
      errors: ['Sadece bir adet doğru cevap olmalıdır'],
      code: 400
    });
  }
  
  next();
};

const validateUpdateQuestion = (req, res, next) => {
  const { error } = updateQuestionSchema.validate(req.body, { abortEarly: false });
  
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
  
  // Eğer options güncelleniyorsa, sadece bir doğru cevap kontrolü
  if (req.body.options) {
    const trueCount = req.body.options.filter(opt => opt.isTrue === true).length;
    if (trueCount !== 1) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Validation hatası',
        errors: ['Sadece bir adet doğru cevap olmalıdır'],
        code: 400
      });
    }
  }
  
  next();
};

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
  validateCreateQuestion,
  validateUpdateQuestion
}; 