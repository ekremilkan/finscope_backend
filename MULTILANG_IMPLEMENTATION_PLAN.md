# 🌍 ÇOKLU DİL (MULTILINGUAL) İMPLEMENTASYON PLANI

**Proje:** FinScope Backend  
**Modül:** Database Multilingual Support  
**Versiyon:** 1.0.0  
**Tarih:** 2024-12-19  
**Durum:** 📋 Planlama Aşaması

---

## 📋 İÇİNDEKİLER

1. [Model Analizi](#model-analizi)
2. [Görev Listesi](#görev-listesi)
3. [Detaylı Adımlar](#detaylı-adımlar)
4. [Migration Stratejisi](#migration-stratejisi)
5. [Test Planı](#test-planı)
6. [API Değişiklikleri](#api-değişiklikleri)

---

## 🔍 MODEL ANALİZİ

### ✅ Çoklu Dile İhtiyacı Olan Modeller

#### 1. **Campaign Model** (YÜKSEK ÖNCELİK)
**Dosya:** `models/campaign.model.js`

**Çevrilmesi Gereken Alanlar:**
- ✅ `title` → `title: { tr: String, en: String }`
- ✅ `description` → `description: { tr: String, en: String }`
- ✅ `content[].itemTitle` → `content[].itemTitle: { tr: String, en: String }`
- ✅ `content[].itemDescription` → `content[].itemDescription: { tr: String, en: String }`
- ⚠️ `segments[].description` → `segments[].description: { tr: String, en: String }` (Opsiyonel)

**Çevrilmeyecek Alanlar:**
- ❌ `segments[].name` (A, B, C, D - teknik değer)
- ❌ `tags` (teknik değerler)
- ❌ `company_logo`, `twitter_url`, `telegram_url`, `website_url` (URL'ler)
- ❌ `itemImage`, `itemVideo` (URL'ler)
- ❌ `startDate`, `endDate`, `status`, `isActive` (teknik değerler)

---

#### 2. **Question Model** (YÜKSEK ÖNCELİK)
**Dosya:** `models/questions.model.js`

**Çevrilmesi Gereken Alanlar:**
- ✅ `questionText` → `questionText: { tr: String, en: String }`
- ✅ `options[].text` → `options[].text: { tr: String, en: String }`

**Çevrilmeyecek Alanlar:**
- ❌ `options[].isTrue` (boolean)
- ❌ `order` (sayısal değer)
- ❌ `createdUserId` (referans)

---

### ❌ Çoklu Dile İhtiyacı OLMAYAN Modeller

- **User Model** - Kullanıcı adı çevrilmez
- **Wallet Model** - Teknik veriler
- **Transaction Model** - Kullanıcı tarafından girilen description
- **UserSegment Model** - Teknik veriler
- **UserProgress Model** - Teknik veriler
- **UserCampaign Model** - Teknik veriler

---

## 📝 GÖREV LİSTESİ

### Faz 1: Campaign Model Güncellemesi
- [x] **TASK-001:** Campaign model şemasını çoklu dil yapısına güncelle ✅
- [x] **TASK-002:** Campaign validation şemalarını güncelle ✅
- [x] **TASK-003:** Campaign service fonksiyonlarını güncelle ✅
- [x] **TASK-004:** Campaign controller'ları güncelle ✅
- [x] **TASK-005:** Campaign migration script'i oluştur ✅

### Faz 2: Question Model Güncellemesi
- [x] **TASK-006:** Question model şemasını çoklu dil yapısına güncelle ✅
- [x] **TASK-007:** Question validation şemalarını güncelle ✅
- [x] **TASK-008:** Question service fonksiyonlarını güncelle ✅
- [x] **TASK-009:** Question controller'ları güncelle ✅
- [x] **TASK-010:** Question migration script'i oluştur ✅

### Faz 3: API ve Helper Güncellemeleri
- [x] **TASK-011:** Dil algılama helper fonksiyonu oluştur ✅
- [x] **TASK-012:** Response transform helper fonksiyonu oluştur ✅
- [x] **TASK-013:** API endpoint'lerine `lang` query parameter desteği ekle ✅
- [x] **TASK-014:** Fallback mekanizması implementasyonu ✅

### Faz 4: Test ve Dokümantasyon
- [ ] **TASK-015:** Unit testler yaz
- [ ] **TASK-016:** Integration testler yaz
- [ ] **TASK-017:** API dokümantasyonunu güncelle
- [ ] **TASK-018:** Migration script'ini test et

---

## 🔧 DETAYLI ADIMLAR

### 📦 FAZ 1: CAMPAIGN MODEL GÜNCELLEMESİ

#### TASK-001: Campaign Model Şemasını Güncelle

**Dosya:** `models/campaign.model.js`

**Yapılacaklar:**

1. **Title alanını güncelle:**
```javascript
// ÖNCE
title: { type: String, required: true, maxlength: 100 }

// SONRA
title: {
  tr: { type: String, required: true, maxlength: 100 },
  en: { type: String, required: true, maxlength: 100 }
}
```

2. **Description alanını güncelle:**
```javascript
// ÖNCE
description: { type: String, required: true, maxlength: 500 }

// SONRA
description: {
  tr: { type: String, required: true, maxlength: 500 },
  en: { type: String, required: true, maxlength: 500 }
}
```

3. **Content array'ini güncelle:**
```javascript
// ÖNCE
content: [{
  itemImage: { type: String, default: "" },
  itemVideo: { type: String, default: "" },
  itemTitle: { type: String, default: "", maxlength: 500 },
  itemDescription: { type: String, default: "", maxlength: 500 },
  itemIndex: { type: Number, default: 1, min: 0 }
}]

// SONRA
content: [{
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
  itemIndex: { type: Number, default: 1, min: 0 }
}]
```

4. **Segment description'ı güncelle (Opsiyonel):**
```javascript
// segmentSchema içinde
description: {
  tr: { type: String, trim: true, maxlength: 500 },
  en: { type: String, trim: true, maxlength: 500 }
}
```

5. **Index'leri güncelle:**
```javascript
// Full-text search index'i kaldır veya güncelle
// ÖNCE
campaignSchema.index({ title: "text", description: "text" });

// SONRA - Her dil için ayrı index
campaignSchema.index({ "title.tr": "text", "description.tr": "text" });
campaignSchema.index({ "title.en": "text", "description.en": "text" });
```

**Kontrol Listesi:**
- [x] Model şeması güncellendi ✅
- [x] Tüm required alanlar korundu ✅
- [x] Maxlength validasyonları korundu ✅
- [x] Index'ler güncellendi ✅
- [x] Pre-save hook'ları kontrol edildi ✅

---

#### TASK-002: Campaign Validation Şemalarını Güncelle

**Dosya:** `validations/campaign.validation.js`

**Yapılacaklar:**

1. **Localized string schema oluştur:**
```javascript
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
```

2. **Content item schema güncelle:**
```javascript
const contentItemSchema = Joi.object({
  itemTitle: localizedStringSchema.required(),
  itemDescription: localizedStringSchema.required(),
  itemImage: Joi.string().uri().allow('').optional(),
  itemVideo: Joi.string().uri().allow('').optional(),
  itemIndex: Joi.number().min(0).default(1)
});
```

3. **Create campaign schema güncelle:**
```javascript
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
    .required(),
  
  description: localizedStringSchema
    .custom((value, helpers) => {
      if (value.tr && value.tr.length > 500) {
        return helpers.error('string.max', { limit: 500 });
      }
      if (value.en && value.en.length > 500) {
        return helpers.error('string.max', { limit: 500 });
      }
      return value;
    })
    .required(),
  
  content: Joi.array()
    .items(contentItemSchema)
    .min(1)
    .required(),
  
  // ... diğer alanlar aynı kalır
});
```

4. **Update campaign schema güncelle:**
```javascript
const updateCampaignSchema = Joi.object({
  title: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  content: Joi.array().items(contentItemSchema).optional(),
  // ... diğer alanlar
});
```

**Kontrol Listesi:**
- [x] Localized string schema oluşturuldu ✅
- [x] Her iki dil için required kontrolü eklendi ✅
- [x] Maxlength validasyonları korundu ✅
- [x] Create schema güncellendi ✅
- [x] Update schema güncellendi ✅

---

#### TASK-003: Campaign Service Fonksiyonlarını Güncelle

**Dosya:** `services/campaign.service.js`

**Yapılacaklar:**

1. **Helper fonksiyon oluştur (dosyanın başına):**
```javascript
/**
 * Çoklu dil verisini istenen dile göre transform eder
 * @param {Object} campaign - Campaign document
 * @param {String} lang - İstenen dil (tr, en)
 * @param {String} fallbackLang - Fallback dil (default: 'tr')
 * @returns {Object} Transform edilmiş campaign
 */
function transformCampaignByLanguage(campaign, lang = 'tr', fallbackLang = 'tr') {
  if (!campaign) return null;
  
  const campaignObj = campaign.toObject ? campaign.toObject() : campaign;
  
  return {
    ...campaignObj,
    title: campaignObj.title?.[lang] || campaignObj.title?.[fallbackLang] || '',
    description: campaignObj.description?.[lang] || campaignObj.description?.[fallbackLang] || '',
    content: (campaignObj.content || []).map(item => ({
      itemTitle: item.itemTitle?.[lang] || item.itemTitle?.[fallbackLang] || '',
      itemDescription: item.itemDescription?.[lang] || item.itemDescription?.[fallbackLang] || '',
      itemImage: item.itemImage || '',
      itemVideo: item.itemVideo || '',
      itemIndex: item.itemIndex || 1
    })),
    language: lang
  };
}
```

2. **create fonksiyonunu güncelle:**
```javascript
exports.create = async (req) => {
  const { title, description, content, ...otherFields } = req.body;
  const userId = req.user.userId;
  
  // Çoklu dil yapısını doğrula
  if (!title || !title.tr || !title.en) {
    const err = new Error('Title must have both tr and en translations');
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }
  
  if (!description || !description.tr || !description.en) {
    const err = new Error('Description must have both tr and en translations');
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }
  
  const campaign = new Campaign({
    title: {
      tr: title.tr,
      en: title.en
    },
    description: {
      tr: description.tr,
      en: description.en
    },
    content: (content || []).map(item => ({
      itemTitle: {
        tr: item.itemTitle?.tr || '',
        en: item.itemTitle?.en || ''
      },
      itemDescription: {
        tr: item.itemDescription?.tr || '',
        en: item.itemDescription?.en || ''
      },
      itemImage: item.itemImage || '',
      itemVideo: item.itemVideo || '',
      itemIndex: item.itemIndex || 1
    })),
    createdUserId: userId,
    ...otherFields
  });
  
  await campaign.save();
  return campaign;
};
```

3. **getById fonksiyonunu güncelle:**
```javascript
exports.getById = async (req) => {
  const { id } = req.params;
  // Dil algılama: query param > user preference > default
  const lang = req.query.lang || req.user?.preferredLanguage || 'tr';
  
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    const err = new Error('Campaign not found');
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }
  
  return transformCampaignByLanguage(campaign, lang, 'tr');
};
```

4. **getAll fonksiyonunu güncelle:**
```javascript
exports.getAll = async (req) => {
  const lang = req.query.lang || req.user?.preferredLanguage || 'tr';
  
  // Filtreleme (mevcut kod)
  const filter = {
    isActive: true,
    isAdminAccept: true
  };
  
  // Admin ise tüm kampanyaları göster
  if (req.user.role === 'admin') {
    delete filter.isAdminAccept;
  }
  
  const campaigns = await Campaign.find(filter)
    .sort({ startDate: -1 })
    .lean();
  
  // Her kampanyayı istenen dile göre transform et
  return campaigns.map(campaign => transformCampaignByLanguage(campaign, lang, 'tr'));
};
```

5. **update fonksiyonunu güncelle:**
```javascript
exports.update = async (req) => {
  const { id } = req.params;
  const { title, description, content, ...otherFields } = req.body;
  const userId = req.user.userId;
  
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    const err = new Error('Campaign not found');
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }
  
  // Yetki kontrolü (mevcut kod)
  if (req.user.role !== 'admin' && campaign.createdUserId.toString() !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }
  
  // Çoklu dil alanlarını güncelle
  if (title) {
    campaign.title = {
      tr: title.tr || campaign.title.tr,
      en: title.en || campaign.title.en
    };
  }
  
  if (description) {
    campaign.description = {
      tr: description.tr || campaign.description.tr,
      en: description.en || campaign.description.en
    };
  }
  
  if (content) {
    campaign.content = content.map(item => ({
      itemTitle: {
        tr: item.itemTitle?.tr || '',
        en: item.itemTitle?.en || ''
      },
      itemDescription: {
        tr: item.itemDescription?.tr || '',
        en: item.itemDescription?.en || ''
      },
      itemImage: item.itemImage || '',
      itemVideo: item.itemVideo || '',
      itemIndex: item.itemIndex || 1
    }));
  }
  
  // Diğer alanları güncelle
  Object.assign(campaign, otherFields);
  
  await campaign.save();
  return campaign;
};
```

**Kontrol Listesi:**
- [x] transformCampaignByLanguage helper fonksiyonu oluşturuldu ✅
- [x] create fonksiyonu güncellendi ✅
- [x] getById fonksiyonu güncellendi ✅
- [x] getAll fonksiyonu güncellendi ✅
- [x] update fonksiyonu güncellendi ✅
- [x] Fallback mekanizması eklendi ✅

---

#### TASK-004: Campaign Controller'ları Güncelle

**Dosya:** `controllers/campaign.controller.js`

**Yapılacaklar:**

Controller'lar genelde service'i çağırıyor, bu yüzden minimal değişiklik gerekli. Sadece dil parametresinin geçirildiğinden emin ol.

**Kontrol Listesi:**
- [x] Controller'lar service'i doğru şekilde çağırıyor ✅
- [x] req.query.lang parametresi service'e geçiriliyor ✅
- [x] Response formatı değişmedi (sadece içerik çevrildi) ✅

---

#### TASK-005: Campaign Migration Script'i Oluştur

**Dosya:** `scripts/migrate_campaigns_to_multilang.js`

**Yapılacaklar:**

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('../models/campaign.model');
const config = require('../configs');

async function migrateCampaigns() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(config.dbURI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const campaigns = await Campaign.find({});
    console.log(`📊 Toplam ${campaigns.length} kampanya bulundu`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const campaign of campaigns) {
      // Eğer zaten çoklu dil yapısındaysa atla
      if (typeof campaign.title === 'object' && campaign.title.tr) {
        console.log(`⏭️  Kampanya ${campaign._id} zaten çoklu dil formatında, atlanıyor`);
        skippedCount++;
        continue;
      }
      
      // Eski format (tek dil) - yeni formata dönüştür
      if (typeof campaign.title === 'string') {
        const oldTitle = campaign.title;
        const oldDescription = campaign.description || '';
        
        // Yeni çoklu dil yapısına dönüştür
        campaign.title = {
          tr: oldTitle,
          en: oldTitle // Varsayılan olarak aynı metni kullan (çeviri yapılacak)
        };
        
        campaign.description = {
          tr: oldDescription,
          en: oldDescription
        };
        
        // Content array'ini dönüştür
        if (Array.isArray(campaign.content)) {
          campaign.content = campaign.content.map(item => ({
            itemTitle: {
              tr: item.itemTitle || '',
              en: item.itemTitle || ''
            },
            itemDescription: {
              tr: item.itemDescription || '',
              en: item.itemDescription || ''
            },
            itemImage: item.itemImage || '',
            itemVideo: item.itemVideo || '',
            itemIndex: item.itemIndex || 1
          }));
        }
        
        await campaign.save();
        console.log(`✅ Kampanya ${campaign._id} migrate edildi`);
        migratedCount++;
      }
    }
    
    console.log('\n📊 Migration Özeti:');
    console.log(`✅ Migrate edilen: ${migratedCount}`);
    console.log(`⏭️  Atlanan: ${skippedCount}`);
    console.log(`📝 Toplam: ${campaigns.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Migration tamamlandı!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  }
}

migrateCampaigns();
```

**Kontrol Listesi:**
- [x] Migration script oluşturuldu ✅
- [x] Eski format kontrolü eklendi ✅
- [x] Yeni format kontrolü eklendi ✅
- [x] Hata yönetimi eklendi ✅
- [x] Loglama eklendi ✅
- [ ] Test edildi (Manuel test gerekiyor)

---

### 📦 FAZ 2: QUESTION MODEL GÜNCELLEMESİ

#### TASK-006: Question Model Şemasını Güncelle

**Dosya:** `models/questions.model.js`

**Yapılacaklar:**

1. **QuestionText alanını güncelle:**
```javascript
// ÖNCE
questionText: {
  type: String,
  required: true,
  maxlength: 300,
}

// SONRA
questionText: {
  tr: { type: String, required: true, maxlength: 300 },
  en: { type: String, required: true, maxlength: 300 }
}
```

2. **Options array'ini güncelle:**
```javascript
// ÖNCE
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isTrue: {
    type: Boolean,
    default: false,
  },
});

// SONRA
const optionSchema = new mongoose.Schema({
  text: {
    tr: { type: String, required: true },
    en: { type: String, required: true }
  },
  isTrue: {
    type: Boolean,
    default: false,
  },
});
```

**Kontrol Listesi:**
- [x] questionText alanı güncellendi ✅
- [x] optionSchema güncellendi ✅
- [x] Required validasyonları korundu ✅
- [x] Maxlength validasyonları korundu ✅

---

#### TASK-007: Question Validation Şemalarını Güncelle

**Dosya:** `validations/questions.validation.js` (veya ilgili validation dosyası)

**Yapılacaklar:**

1. **Option schema güncelle:**
```javascript
const optionSchema = Joi.object({
  text: localizedStringSchema.required(),
  isTrue: Joi.boolean().default(false)
});
```

2. **Create question schema güncelle:**
```javascript
const createQuestionSchema = Joi.object({
  questionText: localizedStringSchema
    .custom((value, helpers) => {
      if (value.tr && value.tr.length > 300) {
        return helpers.error('string.max', { limit: 300 });
      }
      if (value.en && value.en.length > 300) {
        return helpers.error('string.max', { limit: 300 });
      }
      return value;
    })
    .required(),
  
  options: Joi.array()
    .items(optionSchema)
    .length(4)
    .required()
    .custom((value, helpers) => {
      // En az bir doğru cevap olmalı
      const hasTrue = value.some(opt => opt.isTrue === true);
      if (!hasTrue) {
        return helpers.error('any.custom', { message: 'At least one option must be correct' });
      }
      return value;
    })
});
```

**Kontrol Listesi:**
- [x] Option schema güncellendi ✅
- [x] Question schema güncellendi ✅
- [x] Validasyon kuralları korundu ✅

---

#### TASK-008: Question Service Fonksiyonlarını Güncelle

**Dosya:** `services/questions.service.js`

**Yapılacaklar:**

1. **Helper fonksiyon oluştur:**
```javascript
function transformQuestionByLanguage(question, lang = 'tr', fallbackLang = 'tr') {
  if (!question) return null;
  
  const questionObj = question.toObject ? question.toObject() : question;
  
  return {
    ...questionObj,
    questionText: questionObj.questionText?.[lang] || questionObj.questionText?.[fallbackLang] || '',
    options: (questionObj.options || []).map(option => ({
      text: option.text?.[lang] || option.text?.[fallbackLang] || '',
      isTrue: option.isTrue || false
    })),
    language: lang
  };
}
```

2. **Service fonksiyonlarını güncelle:**
- `create` - Çoklu dil verisi kaydet
- `getById` - Dil parametresine göre döndür
- `getAll` - Dil parametresine göre döndür
- `update` - Çoklu dil güncelle

**Kontrol Listesi:**
- [x] transformQuestionByLanguage helper oluşturuldu ✅
- [x] Tüm service fonksiyonları güncellendi ✅

---

#### TASK-009: Question Controller'ları Güncelle

**Dosya:** `controllers/questions.controller.js`

**Kontrol Listesi:**
- [x] Controller'lar service'i doğru çağırıyor ✅
- [x] Dil parametresi geçiriliyor ✅

---

#### TASK-010: Question Migration Script'i Oluştur

**Dosya:** `scripts/migrate_questions_to_multilang.js`

**Yapılacaklar:**

Campaign migration'a benzer şekilde, mevcut question'ları çoklu dil formatına dönüştür.

**Kontrol Listesi:**
- [x] Migration script oluşturuldu ✅
- [ ] Test edildi (Manuel test gerekiyor)

---

### 📦 FAZ 3: API VE HELPER GÜNCELLEMELERİ

#### TASK-011: Dil Algılama Helper Fonksiyonu Oluştur

**Dosya:** `utils/i18n.js` (YENİ DOSYA)

**Yapılacaklar:**

```javascript
/**
 * Request'ten dil bilgisini algılar
 * Öncelik sırası: query param > user preference > Accept-Language header > default
 * @param {Object} req - Express request object
 * @returns {String} Dil kodu (tr, en)
 */
function detectLanguage(req) {
  // 1. Query parameter
  if (req.query && req.query.lang) {
    const lang = req.query.lang.toLowerCase();
    if (['tr', 'en'].includes(lang)) {
      return lang;
    }
  }
  
  // 2. User preference (eğer authenticated ise)
  if (req.user && req.user.preferredLanguage) {
    return req.user.preferredLanguage;
  }
  
  // 3. Accept-Language header
  if (req.headers && req.headers['accept-language']) {
    const acceptLang = req.headers['accept-language'];
    // Basit parsing: "tr-TR,tr;q=0.9,en-US;q=0.8" -> "tr"
    const langMatch = acceptLang.match(/(tr|en)/i);
    if (langMatch) {
      return langMatch[1].toLowerCase();
    }
  }
  
  // 4. Default
  return 'tr';
}

module.exports = {
  detectLanguage
};
```

**Kontrol Listesi:**
- [x] Helper fonksiyon oluşturuldu ✅
- [x] Öncelik sırası doğru ✅
- [ ] Test edildi (Manuel test gerekiyor)

---

#### TASK-012: Response Transform Helper Fonksiyonu Oluştur

**Dosya:** `utils/campaignUtils.js` veya `utils/i18n.js`

**Yapılacaklar:**

Campaign ve Question için transform fonksiyonları zaten service katmanında oluşturuldu. Burada genel bir helper olarak export edilebilir.

**Kontrol Listesi:**
- [x] Helper fonksiyonlar export edildi ✅
- [x] transformCampaignByLanguage utils/i18n.js'de ✅
- [x] transformQuestionByLanguage utils/i18n.js'de ✅
- [x] Service dosyalarından merkezi utils'e taşındı ✅
- [ ] Dokümante edildi (Kod içinde JSDoc var)

---

#### TASK-013: API Endpoint'lerine Lang Query Parameter Desteği Ekle

**Yapılacaklar:**

Tüm campaign ve question endpoint'lerine `?lang=tr` veya `?lang=en` parametresi eklenebilmeli.

**Endpoint'ler:**
- `GET /api/v1/campaigns/all?lang=en`
- `GET /api/v1/campaigns/:id?lang=en`
- `GET /api/v1/questions?lang=en`
- `GET /api/v1/questions/:id?lang=en`

**Kontrol Listesi:**
- [x] Tüm endpoint'ler lang parametresini destekliyor ✅
- [x] detectLanguage helper ile merkezi hale getirildi ✅
- [x] Campaign endpoint'leri güncellendi ✅
- [x] Question endpoint'leri güncellendi ✅
- [ ] Dokümante edildi (API dokümantasyonu güncellenmeli)

---

#### TASK-014: Fallback Mekanizması Implementasyonu

**Yapılacaklar:**

Transform fonksiyonlarında fallback mekanizması zaten var. Sadece test edilmeli.

**Fallback Stratejisi:**
1. İstenen dil varsa onu kullan
2. Yoksa fallback dil (tr) kullan
3. O da yoksa boş string döndür (veya hata fırlat)

**Kontrol Listesi:**
- [x] Fallback mekanizması çalışıyor ✅
- [x] transformCampaignByLanguage'de fallback var ✅
- [x] transformQuestionByLanguage'de fallback var ✅
- [x] Eksik çevirilerde varsayılan dil (tr) kullanılıyor ✅
- [ ] Test edildi (Manuel test gerekiyor)

---

### 📦 FAZ 4: TEST VE DOKÜMANTASYON

#### TASK-015: Unit Testler Yaz

**Dosya:** `tests/unit/campaign.multilang.test.js`

**Test Senaryoları:**
- [ ] Campaign oluşturma (çoklu dil)
- [ ] Campaign getirme (farklı diller)
- [ ] Campaign güncelleme (çoklu dil)
- [ ] Fallback mekanizması
- [ ] Validation testleri

---

#### TASK-016: Integration Testler Yaz

**Dosya:** `tests/integration/campaign.multilang.test.js`

**Test Senaryoları:**
- [ ] API endpoint'leri (farklı diller)
- [ ] Query parameter testi
- [ ] Accept-Language header testi
- [ ] Migration testi

---

#### TASK-017: API Dokümantasyonunu Güncelle

**Dosyalar:**
- `docs/API_ENDPOINTS.md`
- `campaign_api_doc.md`
- `README.md`

**Yapılacaklar:**
- [ ] Çoklu dil request örnekleri ekle
- [ ] Çoklu dil response örnekleri ekle
- [ ] Lang query parameter dokümantasyonu
- [ ] Migration rehberi ekle

---

#### TASK-018: Migration Script'ini Test Et

**Yapılacaklar:**
- [ ] Test database'de migration çalıştır
- [ ] Veri kaybı olmadığını kontrol et
- [ ] Geri alma (rollback) stratejisi hazırla

---

## 🔄 MIGRATION STRATEJİSİ

### Adım 1: Backup
```bash
mongodump --uri="mongodb://..." --out=./backups/before_multilang
```

### Adım 2: Migration Çalıştır
```bash
node scripts/migrate_campaigns_to_multilang.js
node scripts/migrate_questions_to_multilang.js
```

### Adım 3: Doğrulama
- Veri kaybı kontrolü
- Yeni format kontrolü
- API testleri

### Adım 4: Rollback (Gerekirse)
```bash
mongorestore --uri="mongodb://..." ./backups/before_multilang
```

---

## 🧪 TEST PLANI

### 1. Unit Testler
- Model validasyonları
- Transform fonksiyonları
- Helper fonksiyonlar

### 2. Integration Testler
- API endpoint'leri
- Dil algılama
- Fallback mekanizması

### 3. Manual Testler
- Frontend entegrasyonu
- Farklı dil senaryoları
- Eksik çeviri durumları

---

## 📊 API DEĞİŞİKLİKLERİ

### Request Format Değişiklikleri

**ÖNCE:**
```json
{
  "title": "Kampanya Başlığı",
  "description": "Açıklama",
  "content": [{
    "itemTitle": "Başlık",
    "itemDescription": "Açıklama"
  }]
}
```

**SONRA:**
```json
{
  "title": {
    "tr": "Kampanya Başlığı",
    "en": "Campaign Title"
  },
  "description": {
    "tr": "Açıklama",
    "en": "Description"
  },
  "content": [{
    "itemTitle": {
      "tr": "Başlık",
      "en": "Title"
    },
    "itemDescription": {
      "tr": "Açıklama",
      "en": "Description"
    }
  }]
}
```

### Response Format Değişiklikleri

**Query ile:**
```
GET /api/v1/campaigns/:id?lang=en
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Campaign Title",  // Sadece İngilizce
    "description": "Description",
    "language": "en"
  }
}
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Backward Compatibility:** Mevcut API'ler çalışmaya devam etmeli (fallback ile)
2. **Data Migration:** Tüm mevcut veriler migrate edilmeli
3. **Validation:** Her iki dil de required olmalı
4. **Performance:** Transform işlemleri optimize edilmeli
5. **Testing:** Kapsamlı test yapılmalı

---

## 📅 TAHMİNİ SÜRE

| Faz | Süre | Toplam |
|-----|------|--------|
| Faz 1: Campaign Model | 8-10 saat | 8-10 saat |
| Faz 2: Question Model | 4-6 saat | 12-16 saat |
| Faz 3: API & Helper | 3-4 saat | 15-20 saat |
| Faz 4: Test & Docs | 4-6 saat | 19-26 saat |

**Toplam:** 19-26 saat

---

## ✅ BAŞLANGIÇ KONTROL LİSTESİ

- [ ] Backup alındı
- [ ] Test environment hazırlandı
- [ ] Development branch oluşturuldu
- [ ] Görev listesi gözden geçirildi
- [ ] Ekip bilgilendirildi

---

**Son Güncelleme:** 2024-12-19  
**Hazırlayan:** AI Assistant  
**Durum:** 📋 Planlama Tamamlandı - Implementasyona Hazır

