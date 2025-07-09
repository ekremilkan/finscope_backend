const Joi = require("joi");
const utils = require("../utils/index");

// Özel adres validation fonksiyonu
const validateAddress = (value, helpers) => {
  const { network } = helpers.state.ancestors[0];
  
  if (!network) {
    return helpers.error('address.network.required');
  }
  
  const validation = utils.addressValidator.validateWalletAddress(network, value);
  
  if (!validation.valid) {
    return helpers.error('address.invalid', { 
      error: validation.error, 
      suggestion: validation.suggestion 
    });
  }
  
  // Normalize edilmiş adresi döndür
  return validation.normalizedAddress;
};

// Cüzdan bağlama validation şeması
const connectWalletSchema = Joi.object({
  network: Joi.string()
    .valid("Ethereum", "Solana", "Tron", "BNBChain", "SUI", "Base")
    .required()
    .messages({
      "any.only": "Desteklenen ağlardan birini seçiniz",
      "any.required": "Blockchain ağı zorunludur",
    }),
  address: Joi.string()
    .trim()
    .custom(validateAddress)
    .required()
    .messages({
      "string.empty": "Cüzdan adresi boş olamaz",
      "any.required": "Cüzdan adresi zorunludur",
      "address.network.required": "Blockchain ağı bilgisi eksik",
      "address.invalid": "{{#error}}",
    }),
});

// Airdrop cüzdan ayarlama validation şeması
const setAirdropWalletSchema = Joi.object({
  address: Joi.string()
    .trim()
    .min(26)
    .max(100)
    .required()
    .messages({
      "string.empty": "Cüzdan adresi boş olamaz",
      "any.required": "Cüzdan adresi zorunludur",
    }),
});

// İşlem ekleme validation şeması
const addTransactionSchema = Joi.object({
  type: Joi.string()
    .valid("send", "receive", "swap", "stake", "unstake", "airdrop", "other")
    .required()
    .messages({
      "any.only": "Geçerli bir işlem tipi seçiniz",
      "any.required": "İşlem tipi zorunludur",
    }),
  amount: Joi.string()
    .pattern(/^\d+(\.\d+)?$/)
    .required()
    .messages({
      "string.pattern.base": "Geçerli bir miktar giriniz",
      "any.required": "İşlem miktarı zorunludur",
    }),
  currency: Joi.string()
    .trim()
    .min(2)
    .max(10)
    .uppercase()
    .required()
    .messages({
      "string.min": "Para birimi en az 2 karakter olmalıdır",
      "string.max": "Para birimi en fazla 10 karakter olmalıdır",
      "any.required": "Para birimi zorunludur",
    }),
  txHash: Joi.string()
    .trim()
    .min(20)
    .max(200)
    .required()
    .messages({
      "string.empty": "İşlem hash'i boş olamaz",
      "string.min": "Geçerli bir işlem hash'i giriniz",
      "any.required": "İşlem hash'i zorunludur",
    }),
  fromAddress: Joi.string()
    .trim()
    .min(26)
    .max(100)
    .optional(),
  toAddress: Joi.string()
    .trim()
    .min(26)
    .max(100)
    .optional(),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      "string.max": "Açıklama en fazla 500 karakter olmalıdır",
    }),
});

// Adres doğrulama için validation şeması
const addressCheckSchema = Joi.object({
  network: Joi.string()
    .valid("Ethereum", "Solana", "Tron", "BNBChain", "SUI", "Base")
    .required()
    .messages({
      "any.only": "Desteklenen ağlardan birini seçiniz",
      "any.required": "Blockchain ağı zorunludur",
    }),
  address: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Cüzdan adresi boş olamaz",
      "any.required": "Cüzdan adresi zorunludur",
    }),
});

// KALDIRILDI: Manuel bakiye validation (GÜVENLİK RİSKİ)
// Artık kullanıcılar manuel bakiye giremez

// Validation middleware'leri
const validateConnectWallet = (req, res, next) => {
  const { error } = connectWalletSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => {
      // Özel address validation hatası için suggestion'ı dahil et
      if (detail.context && detail.context.suggestion) {
        return `${detail.message}${detail.context.suggestion ? ' - Öneri: ' + detail.context.suggestion : ''}`;
      }
      return detail.message;
    });
    
    return res.status(400).json({
      success: false,
      error: true,
      message: "Validation hatası",
      errors: errors,
      code: 400,
    });
  }
  next();
};

const validateSetAirdropWallet = (req, res, next) => {
  const { error } = setAirdropWalletSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: true,
      message: "Validation hatası",
      errors: errors,
      code: 400,
    });
  }
  next();
};

const validateAddTransaction = (req, res, next) => {
  const { error } = addTransactionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: true,
      message: "Validation hatası",
      errors: errors,
      code: 400,
    });
  }
  next();
};

const validateAddressCheck = (req, res, next) => {
  const { error } = addressCheckSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: true,
      message: "Validation hatası",
      errors: errors,
      code: 400,
    });
  }
  next();
};

module.exports = {
  connectWalletSchema,
  setAirdropWalletSchema,
  addTransactionSchema,
  addressCheckSchema,
  // KALDIRILDI: manualBalanceSchema (GÜVENLİK RİSKİ)
  validateConnectWallet,
  validateSetAirdropWallet,
  validateAddTransaction,
  validateAddressCheck,
  // KALDIRILDI: validateManualBalance (GÜVENLİK RİSKİ)
}; 