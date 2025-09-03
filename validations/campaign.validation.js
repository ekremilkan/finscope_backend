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
  // ✅ GÜNCELLENDİ: Her segment için farklı ödül değerleri
  rewards: Joi.object({
    A: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'A segmenti ödül miktarı sayı olmalıdır',
        'number.min': 'A segmenti ödül miktarı 0 veya daha büyük olmalıdır',
        'any.required': 'A segmenti ödül miktarı zorunludur'
      }),
    B: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'B segmenti ödül miktarı sayı olmalıdır',
        'number.min': 'B segmenti ödül miktarı 0 veya daha büyük olmalıdır',
        'any.required': 'B segmenti ödül miktarı zorunludur'
      }),
    C: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'C segmenti ödül miktarı sayı olmalıdır',
        'number.min': 'C segmenti ödül miktarı 0 veya daha büyük olmalıdır',
        'any.required': 'C segmenti ödül miktarı zorunludur'
      }),
    D: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'D segmenti ödül miktarı sayı olmalıdır',
        'number.min': 'D segmenti ödül miktarı 0 veya daha büyük olmalıdır',
        'any.required': 'D segmenti ödül miktarı zorunludur'
      })
  }).required().messages({
    'any.required': 'Segment ödülleri zorunludur'
  }),
  maxParticipants: Joi.object({
    A: Joi.number().min(0).default(0),
    B: Joi.number().min(0).default(0),
    C: Joi.number().min(0).default(0),
    D: Joi.number().min(0).default(0)
  }).default({ A:0,B:0,C:0,D:0 }),
  // ✅ YENİ: Toplam maksimum katılımcı sayısı
  maxTotalParticipants: Joi.number().min(0).default(0).allow(null),
  // currentParticipants uygulama tarafından yönetilir; istemciden gelirse yok sayılacaktır
  currentParticipants: Joi.object({
    A: Joi.number().min(0).default(0),
    B: Joi.number().min(0).default(0),
    C: Joi.number().min(0).default(0),
    D: Joi.number().min(0).default(0)
  }).default({ A:0,B:0,C:0,D:0 }),
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
  // ✅ YENİ: Şirket logosu (zorunlu)
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
  // ✅ YENİ: Twitter URL (zorunlu)
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
  status: Joi.string().valid('active','inactive','expired','upcoming').default('upcoming'),
  isActive: Joi.boolean().default(true),
  isAdminAccept: Joi.forbidden().messages({
    'any.unknown': 'Sadece admin bu alanı değiştirebilir.'
  }),
  // createdUserId uygulama tarafından auth üzerinden set edilir; istemci gönderemez
  createdUserId: Joi.forbidden().messages({
    'any.unknown': 'createdUserId istemci tarafından gönderilemez'
  }),
  // ✅ YENİ: Segmentasyon kriterleri - opsiyonel alanlar
  segmentation: Joi.object({
    // Genel Portföy
    portfolioFilters: Joi.object({
      minTotalValueUsd: Joi.number().min(0).allow(null),
      minTokenCount: Joi.number().min(0).allow(null),
      minChainValues: Joi.array().items(
        Joi.object({
          chain: Joi.string().valid("eth", "bsc", "polygon", "arbitrum", "optimism", "base").allow(null),
          minValueUsd: Joi.number().min(0).allow(null)
        })
      ).allow(null),
      minTokenHoldings: Joi.array().items(
        Joi.object({
          symbol: Joi.string().valid("ETH", "USDC", "UNI", "COMP", "FET", "MATIC", "BNB").allow(null),
          minAmount: Joi.number().min(0).allow(null)
        })
      ).allow(null),
      diversification: Joi.object({
        maxHHI: Joi.number().min(0).allow(null),
        maxTop5Concentration: Joi.number().min(0).max(100).allow(null),
        riskScore: Joi.string().valid("LOW", "MEDIUM", "HIGH").allow(null)
      }).allow(null),
      minNativeBalances: Joi.array().items(
        Joi.object({
          chain: Joi.string().valid("eth", "bsc", "polygon", "arbitrum", "optimism", "base").allow(null),
          symbol: Joi.string().valid("ETH", "BNB", "MATIC").allow(null),
          minAmount: Joi.number().min(0).allow(null)
        })
      ).allow(null)
    }).allow(null),

    // Token Dağılımı
    tokenCategoryPercentage: Joi.array().items(
      Joi.object({
        category: Joi.string().valid(
          "dex", "stablecoin", "layer1", "layer2", "lending_protocol", "ai", 
          "gamefi", "liquid_staking", "meme_token", "oracle", "restaking", 
          "bridge", "yield_farming", "infrastructure", "alt"
        ).allow(null),
        minPercent: Joi.number().min(0).max(100).allow(null),
        maxPercent: Joi.number().min(0).max(100).allow(null)
      })
    ).allow(null),

    // DeFi Aktivitesi
    minDefiTvlUsd: Joi.number().min(0).default(0).allow(null),
    defiProtocols: Joi.array().items(
      Joi.object({
        protocol: Joi.string().valid("compound", "aave", "lido", "uniswap_v3", "sushiswap").allow(null),
        type: Joi.string().valid("supplied", "borrowed", "liquidity", "staked").allow(null),
        minUsdValue: Joi.number().min(0).allow(null)
      })
    ).allow(null),

    // Trading Aktivitesi
    minTrades: Joi.number().min(0).default(0).allow(null),
    minTradingVolumeUsd: Joi.number().min(0).default(0).allow(null),
    requiredDexes: Joi.array().items(
      Joi.string().valid("uniswap_v3", "sushiswap", "pancakeswap", "1inch")
    ).allow(null),
    pnlFilters: Joi.array().items(
      Joi.object({
        chain: Joi.string().valid("eth", "bsc", "polygon", "arbitrum", "optimism", "base").allow(null),
        period: Joi.string().valid("7d", "30d", "90d").allow(null),
        minRoiPercent: Joi.number().allow(null)
      })
    ).allow(null),

    // NFT Portföyü
    requiredNftCollections: Joi.array().items(Joi.string()).allow(null),
    minBlueChipNfts: Joi.number().min(0).default(0).allow(null),

    // Davranışsal Skorlar
    riskTolerance: Joi.string().valid("LOW", "MEDIUM", "HIGH").allow(null),
    handsClassification: Joi.string().valid("PAPER_HANDS", "DIAMOND_HANDS").allow(null),
    behavioralScores: Joi.object({
      minHodlScore: Joi.number().min(0).max(100).allow(null),
      minTraderScore: Joi.number().min(0).max(100).allow(null),
      minSophisticationScore: Joi.number().min(0).max(100).allow(null),
      minDiamondHandsScore: Joi.number().min(0).max(100).allow(null)
    }).allow(null),

    // Güvenlik
    security: Joi.object({
      maxUnlimitedApprovals: Joi.number().min(0).allow(null),
      maxHighRiskApprovals: Joi.number().min(0).allow(null)
    }).allow(null),

    // Wallet Classifications
    walletClassifications: Joi.array().items(
      Joi.string().valid(
        "Plankton (<0.01 BTC)", "Shrimp (<1 BTC)", "Crab (1–10 BTC)", 
        "Octopus (10–50 BTC)", "Fish (50–100 BTC)", "Dolphin (100–500 BTC)", 
        "Shark (500–1,000 BTC)", "Whale (1,000–5,000 BTC)", "Humpback (>5,000 BTC)", 
        "Early Retail (<$10k, pre-2020)", "Early Professional ($10k–$10M, pre-2020)", 
        "Early Institutional (>$10M, pre-2020)", "Late Retail (<$10k, post-2020)", 
        "Late Professional ($10k–$10M, post-2020)", "Late Institutional (>$10M, post-2020)", 
        "Custom"
      )
    ).allow(null)
  }).allow(null)
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
