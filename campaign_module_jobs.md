# 🎯 KAMPANYA MODÜLÜ GÜNCELLEMESİ - GÖREV LİSTESİ

**Proje:** FinScope Backend  
**Modül:** Campaign Module  
**Versiyon:** v2.0 → v3.0  
**Başlangıç:** 15 Ekim 2025  
**Durum:** 🔴 Planlandı

---

## 📊 PROJE ÖZETİ

### Amaç
Mevcut kampanya sistemini eski `rewards` yapısından yeni **segment-based** yapıya geçirmek. Her segment için ayrı ödül, kontenjan ve filtreleme kriterleri sağlamak.

### Ana Değişiklikler
- ✅ Campaign Model güncellendi (segments array eklendi)
- ⏳ Backend servis katmanı güncellenmeli
- ⏳ Validation katmanı güncellenmeli
- ⏳ Frontend entegrasyonu yapılmalı
- ⏳ Migration script yazılmalı
- ⏳ Test suite güncellenmeli

### Tahmini Toplam Süre: **40-50 saat**

---

## 📋 İÇİNDEKİLER

1. [Görev Kategorileri](#görev-kategorileri)
2. [Backend Görevleri](#backend-görevleri)
3. [Database Görevleri](#database-görevleri)
4. [Test Görevleri](#test-görevleri)
5. [Frontend Görevleri](#frontend-görevleri)
6. [Dokümantasyon Görevleri](#dokümantasyon-görevleri)
7. [Deployment Görevleri](#deployment-görevleri)

---

## 🎯 GÖREV KATEGORİLERİ

| Kategori | Toplam Görev | Tamamlanan | Durum | Süre |
|----------|--------------|------------|-------|------|
| Backend | 8 | 8 | ✅ Tamamlandı | 20h |
| Database | 1 | 1 | ✅ Tamamlandı | 1h |
| Test | 4 | 0 | 🔴 Bekliyor | 8h |
| Frontend | 3 | 0 | 🔴 Bekliyor | 12h |
| Docs | 2 | 1 | 🟡 Devam Ediyor | 4h |
| Deployment | 1 | 0 | 🔴 Bekliyor | 2h |
| **TOPLAM** | **19** | **10** | **53%** | **47h** |

---

## 🔧 BACKEND GÖREVLERİ

### TASK-001: Validation Katmanı Güncelleme
**Öncelik:** 🔴 Kritik  
**Süre:** 4 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `validations/campaign.validation.js`

#### Açıklama
Joi validation şemalarına segment ve filter yapıları eklenmeli. Eski `rewards` ve `maxParticipants` object yapıları kaldırılmalı.

#### Yapılacaklar

##### 1. Filter Schema Ekleme
```javascript
const filterSchema = Joi.object({
  field: Joi.string()
    .required()
    .messages({
      'string.empty': 'Filtre alanı boş olamaz',
      'any.required': 'Filtre alanı zorunludur'
    }),
  
  chain: Joi.string()
    .valid('ETH', 'BNB', 'ARB', 'ETC')
    .required()
    .default('ETH')
    .messages({
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
    )
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
            'any.only': 'Token type geçerli bir kategori olmalıdır'
          }),
        min_value: Joi.number()
          .min(0)
          .default(0),
        min_count: Joi.number()
          .min(0)
          .default(0)
      })
    )
  }).optional()
});
```

##### 2. Segment Schema Ekleme
```javascript
const segmentSchema = Joi.object({
  name: Joi.string()
    .uppercase()
    .required()
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
  
  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Açıklama en fazla 500 karakter olabilir'
    }),
  
  filters: Joi.array()
    .items(filterSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Her segment en az bir filtre içermelidir',
      'any.required': 'Filtreler zorunludur'
    })
});
```

##### 3. createCampaignSchema Güncelleme
```javascript
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
      itemImage: Joi.string().uri().allow('', null),
      itemVideo: Joi.string().uri().allow('', null),
      itemTitle: Joi.string().max(500).allow('', null),
      itemDescription: Joi.string().max(500).allow('', null),
      itemIndex: Joi.number().min(0).default(0)
    })
  ).default([]),
  
  // YENİ: segments array
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
  
  // KALDIRILDI: rewards, maxParticipants, maxTotalParticipants, currentParticipants
  
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
    .default(5),
  
  questionIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .default([]),
  
  tags: Joi.array().items(Joi.string()).default([]),
  
  company_logo: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!/^https?:\/\/.+/.test(value) && !value.startsWith('data:image/')) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  
  twitter_url: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  
  status: Joi.string()
    .valid('active','inactive','expired','upcoming')
    .default('upcoming'),
  
  isActive: Joi.boolean().default(true),
  
  isAdminAccept: Joi.forbidden(),
  createdUserId: Joi.forbidden()
});
```

##### 4. updateCampaignSchema Güncelleme
```javascript
const updateCampaignSchema = createCampaignSchema.fork(
  Object.keys(createCampaignSchema.describe().keys),
  schema => schema.optional()
);
```

#### Test Kriterleri
- [ ] Valid segment array kabul edilmeli
- [ ] Duplicate segment isimleri reddedilmeli
- [ ] En az 1 segment gerekli
- [ ] Her segment en az 1 filter içermeli
- [ ] Chain enum değerleri doğrulanmalı
- [ ] Eski rewards/maxParticipants yapısı reddedilmeli

#### Bağımlılıklar
- Yok

---

### TASK-002: Campaign Service - create() Fonksiyonu
**Öncelik:** 🔴 Kritik  
**Süre:** 2 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Kampanya oluşturma fonksiyonu yeni segment yapısını desteklemeli.

#### Yapılacaklar

##### Kod Değişikliği
```javascript
// ÖNCE (ESKİ):
exports.create = async (req) => {
  const {
    title,
    description,
    content,
    rewards,                    // ❌ KALKACAK
    maxParticipants,            // ❌ KALKACAK
    maxTotalParticipants,       // ❌ KALKACAK
    startDate,
    endDate,
    questions,
    tags,
    segmentation,
    company_logo,
    twitter_url,
  } = req.body;

  const createdUserId = req.user.userId;
  const role = req.user.role;

  const campaign = new Campaign({
    title,
    description,
    content,
    rewards,                    // ❌ KALKACAK
    maxParticipants,            // ❌ KALKACAK
    maxTotalParticipants,       // ❌ KALKACAK
    startDate,
    endDate,
    questions,
    tags,
    segmentation,
    company_logo,
    twitter_url,
    createdUserId,
    currentParticipants: { A: 0, B: 0, C: 0, D: 0 },  // ❌ KALKACAK
    isAdminAccept: role === "admin" ? true : false,
  });

  await campaign.save();
  return campaign;
};
```

```javascript
// SONRA (YENİ):
exports.create = async (req) => {
  const {
    title,
    description,
    content,
    segments,              // ✅ YENİ
    startDate,
    endDate,
    questions,
    tags,
    company_logo,
    twitter_url,
  } = req.body;

  const createdUserId = req.user.userId;
  const role = req.user.role;

  // Segment validation
  if (!segments || segments.length === 0) {
    const err = new Error("Kampanya en az bir segment içermelidir");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Her segment için currentParticipants'ı 0 olarak ayarla
  const processedSegments = segments.map(segment => ({
    ...segment,
    currentParticipants: 0
  }));

  const campaign = new Campaign({
    title,
    description,
    content,
    segments: processedSegments,  // ✅ YENİ
    startDate,
    endDate,
    questions,
    tags,
    company_logo,
    twitter_url,
    createdUserId,
    isAdminAccept: role === "admin" ? true : false,
  });

  await campaign.save();
  return campaign;
};
```

#### Test Kriterleri
- [ ] Admin ve Customer kampanya oluşturabilmeli
- [ ] segments array doğru kaydedilmeli
- [ ] currentParticipants her segment için 0 olmalı
- [ ] isAdminAccept admin için true, diğerleri için false olmalı

#### Bağımlılıklar
- TASK-001 (Validation)

---

### TASK-003: Campaign Service - joinCampaign() Fonksiyonu
**Öncelik:** 🔴 Kritik  
**Süre:** 4 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Kampanyaya katılım fonksiyonu segment bazlı kontenjan kontrolü yapmalı ve doğru segment'e katılımcı eklemeli.

#### Yapılacaklar

##### Kod Değişikliği
```javascript
exports.joinCampaign = async (req) => {
  const { id: campaignId } = req.params;
  const { userId, role } = req.user;

  // 1. Kampanyayı getir
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  if (!campaign.isActive) {
    const err = new Error("This campaign is not active.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 2. Katılım ve ilerleme kontrolü
  const existingProgress = await UserProgress.findOne({ userId, campaignId });
  const existingParticipation = await CampaignParticipation.findOne({
    userId,
    campaignId,
  });

  if (existingProgress && existingProgress.completed) {
    const err = new Error("You have already completed this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 3. Kullanıcının segment'ini belirle
  const userSegmentDoc = await UserSegment.findOne({ 
    userId, 
    chain: "ethereum" 
  }).sort({ asOf: -1 });
  
  const userSegmentClass = userSegmentDoc?.class || "D";
  
  console.log(`User ${userId} segment: ${userSegmentClass}`);

  // 4. Kampanyanın ilgili segment'ini bul
  const segment = campaign.segments.find(s => s.name === userSegmentClass);
  
  if (!segment) {
    const err = new Error(`Segment ${userSegmentClass} not found in this campaign.`);
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 5. Segment kontenjan kontrolü (sadece yeni katılımlarda)
  if (role !== "admin" && !existingParticipation) {
    if (segment.maxParticipants > 0 && 
        segment.currentParticipants >= segment.maxParticipants) {
      const err = new Error(`The quota for segment ${userSegmentClass} is full.`);
      err.statusCode = StatusCodes.BAD_REQUEST;
      throw err;
    }
  }

  // 6. UserProgress kaydını oluştur veya sıfırla
  if (existingProgress) {
    existingProgress.joined = true;
    existingProgress.startedAt = new Date();
    await existingProgress.save();
  } else {
    await UserProgress.create({
      userId,
      campaignId,
      joined: true,
      startedAt: new Date(),
    });
  }

  // 7. Katılım kaydını ve sayacı SADECE İLK GİRİŞTE oluştur/güncelle
  if (!existingParticipation) {
    await CampaignParticipation.create({
      campaignId,
      userId,
      joinedAt: new Date(),
    });

    // Segment katılımcı sayısını artır
    segment.currentParticipants += 1;
    await campaign.save();
    
    console.log(`Segment ${userSegmentClass} participants: ${segment.currentParticipants}/${segment.maxParticipants}`);
  }

  return {
    campaignId,
    userId: userId.toString(),
    joined: true,
    segment: userSegmentClass,
    segmentQuota: {
      current: segment.currentParticipants,
      max: segment.maxParticipants,
      available: segment.maxParticipants - segment.currentParticipants
    },
    reward: segment.reward,
    message: "Successfully joined/continued the campaign.",
  };
};
```

#### Test Kriterleri
- [ ] Kullanıcı doğru segment'e atanmalı
- [ ] Segment kontenjanı kontrol edilmeli
- [ ] Admin kontenjan kontrolünü atlayabilmeli
- [ ] Segment currentParticipants güncellenme
- [ ] UserProgress ve CampaignParticipation oluşturulmalı
- [ ] İkinci katılımda counter artmamalı

#### Bağımlılıklar
- TASK-002 (create fonksiyonu)

---

### TASK-004: Campaign Service - completeQuiz() Fonksiyonu
**Öncelik:** 🔴 Kritik  
**Süre:** 3 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Quiz tamamlama fonksiyonu segment bazlı ödül hesaplaması ve referral bonus hesaplaması yapmalı.

#### Yapılacaklar

##### Kod Değişikliği
```javascript
exports.completeQuiz = async (req) => {
  const { id: campaignId } = req.params;
  const userId = req.user.userId;
  const { totalTimeSpent } = req.body;

  // 1) Katılım kontrolü
  const userProgress = await UserProgress.findOne({ userId, campaignId });
  if (!userProgress || !userProgress.joined) {
    const err = new Error("You have not joined this campaign.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 2) Çift tamamlama engeli
  if (userProgress.completed) {
    const err = new Error("This quiz has already been completed.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 3) İlerleme & katılım güncelle
  const updatedUserProgress = await UserProgress.findByIdAndUpdate(
    userProgress._id,
    {
      completed: true,
      timeSpent: totalTimeSpent,
      completedAt: new Date(),
    },
    { new: true }
  );

  await CampaignParticipation.findOneAndUpdate(
    { userId, campaignId },
    {
      timeSpent: totalTimeSpent,
      status: "completed",
      completedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // 4) Referral bonus (segment-based)
  try {
    const campaign = await Campaign.findById(campaignId).lean();
    if (campaign) {
      const user = await User.findById(userId, "invitedBy").lean();
      const inviterId = user?.invitedBy;

      if (inviterId) {
        // Kullanıcının segment'ini al
        const userSegment = await UserSegment.findOne({
          userId,
          chain: "ethereum",
        })
          .sort({ asOf: -1 })
          .lean();

        const segmentClass = userSegment?.class || "D";
        
        // Kampanyanın ilgili segment'ini bul
        const segment = campaign.segments.find(s => s.name === segmentClass);
        let rewardAmount = Number(segment?.reward || 0);
        
        if (!Number.isFinite(rewardAmount)) rewardAmount = 0;

        // %3'ü hesapla, 2 ondalık sakla
        const referralBonus = Number((rewardAmount * 0.03).toFixed(2));

        if (referralBonus > 0) {
          await User.findByIdAndUpdate(
            inviterId,
            {
              $inc: { referralRewards: referralBonus },
              $push: {
                referralHistory: {
                  inviteeId: userId,
                  campaignId,
                  bonus: referralBonus,
                  segment: segmentClass,
                  at: new Date(),
                },
              },
            },
            { new: true }
          );
          
          console.log(`Referral bonus ${referralBonus} added to user ${inviterId} (segment: ${segmentClass})`);
        }
      }
    }
  } catch (referralErr) {
    console.error("Referral reward error:", referralErr);
  }

  return {
    campaignId,
    userId: userId.toString(),
    completed: true,
    completedAt: updatedUserProgress.completedAt,
    totalTimeSpent,
  };
};
```

#### Test Kriterleri
- [ ] Quiz tamamlandığında UserProgress güncellenme
- [ ] CampaignParticipation status="completed" olmalı
- [ ] Segment bazlı reward hesaplanmalı
- [ ] Referral bonus doğru hesaplanmalı (%3)
- [ ] Referral history'e kayıt atılmalı
- [ ] Çift tamamlama engellenmeli

#### Bağımlılıklar
- TASK-003 (joinCampaign)

---

### TASK-005: Campaign Service - getUserSegmentEarningsAnalysis() Fonksiyonu
**Öncelik:** 🟡 Orta  
**Süre:** 3 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Segment earnings analysis fonksiyonu segment bazlı potansiyel kazanç hesaplaması yapmalı.

#### Yapılacaklar

##### Kod Değişikliği
```javascript
exports.getUserSegmentEarningsAnalysis = async (req) => {
  const userId = req.user.userId;

  // 1. Kullanıcının mevcut segmentini al
  const preferredWindow = `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;
  let userSegment = await UserSegment.findOne({
    userId,
    chain: "ethereum",
    window: preferredWindow,
  })
    .sort({ asOf: -1 })
    .lean();

  if (!userSegment) {
    userSegment = await UserSegment.findOne({
      userId,
      chain: "ethereum",
    })
      .sort({ asOf: -1 })
      .lean();
  }

  if (!userSegment) {
    const err = new Error(
      "User segment not found. Please complete wallet verification first."
    );
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  const userSegmentClass = userSegment.class; // A, B, C, D

  // 2. Tamamlanan kampanyaları ve kazanılan ödülleri hesapla
  const completedCampaigns = await UserProgress.find({
    userId,
    completed: true,
    campaignId: { $exists: true, $ne: null },
  })
    .populate("campaignId")
    .lean();

  let actualEarnings = 0;
  const completedCampaignDetails = [];

  for (const progress of completedCampaigns) {
    if (progress.campaignId && progress.campaignId.segments) {
      // Kullanıcının segmentine göre ödül bul
      const segment = progress.campaignId.segments.find(
        s => s.name === userSegmentClass
      );
      const segmentReward = segment?.reward || 0;
      
      actualEarnings += segmentReward;
      completedCampaignDetails.push({
        campaignId: progress.campaignId._id,
        title: progress.campaignId.title,
        reward: segmentReward,
        segment: userSegmentClass,
        completedAt: progress.completedAt,
      });
    }
  }

  // 3. Potansiyel kampanyaları bul
  const userSegmentCampaigns = await Campaign.find({
    status: { $in: ["active", "expired", "inactive"] },
    isActive: true,
    isAdminAccept: true,
    endDate: { $lte: new Date() },
  }).lean();

  let potentialEarnings = 0;
  const potentialCampaignDetails = [];

  for (const campaign of userSegmentCampaigns) {
    // Kampanyanın kullanıcının segmentine ait segment'ini bul
    const segment = campaign.segments.find(s => s.name === userSegmentClass);

    if (segment && segment.maxParticipants > 0) {
      const segmentReward = segment.reward || 0;
      potentialEarnings += segmentReward;
      potentialCampaignDetails.push({
        campaignId: campaign._id,
        title: campaign.title,
        reward: segmentReward,
        segment: userSegmentClass,
        segmentMaxParticipants: segment.maxParticipants,
        segmentCurrentParticipants: segment.currentParticipants,
        endDate: campaign.endDate,
      });
    }
  }

  // 4. Devam eden kampanyalar
  const joinedButNotCompleted = await UserProgress.find({
    userId,
    joined: true,
    completed: false,
    campaignId: { $exists: true, $ne: null },
  })
    .populate("campaignId")
    .lean();

  const inProgressCampaigns = [];
  for (const progress of joinedButNotCompleted) {
    if (progress.campaignId && progress.campaignId.segments) {
      const segment = progress.campaignId.segments.find(
        s => s.name === userSegmentClass
      );
      const segmentReward = segment?.reward || 0;
      
      inProgressCampaigns.push({
        campaignId: progress.campaignId._id,
        title: progress.campaignId.title,
        reward: segmentReward,
        segment: userSegmentClass,
      });
    }
  }

  // 5. Hesaplamalar
  const missedEarnings = potentialEarnings - actualEarnings;
  const completionRate =
    potentialCampaignDetails.length > 0
      ? (completedCampaignDetails.length / potentialCampaignDetails.length) * 100
      : 0;

  // 6. Kaçırılan kampanyalar
  const missedCampaigns = potentialCampaignDetails.filter(
    (campaign) =>
      !completedCampaignDetails.find(
        (completed) =>
          completed.campaignId.toString() === campaign.campaignId.toString()
      )
  );

  return {
    userSegment: {
      class: userSegmentClass,
      compositeScore: userSegment.compositeScore,
      percentile: userSegment.percentile,
      confidence: userSegment.confidence,
      asOf: userSegment.asOf,
    },
    earnings: {
      actualEarnings,
      potentialEarnings,
      missedEarnings,
      completionRate: Math.round(completionRate * 100) / 100,
    },
    campaigns: {
      completed: completedCampaignDetails,
      potential: potentialCampaignDetails,
      missed: missedCampaigns,
      inProgress: inProgressCampaigns,
    },
    summary: {
      totalCompletedCampaigns: completedCampaignDetails.length,
      totalPotentialCampaigns: potentialCampaignDetails.length,
      totalMissedCampaigns: missedCampaigns.length,
      totalInProgressCampaigns: inProgressCampaigns.length,
    },
  };
};
```

#### Test Kriterleri
- [ ] Segment bazlı kazanç hesaplanmalı
- [ ] Potansiyel kazanç doğru hesaplanmalı
- [ ] Tamamlanma oranı doğru olmalı
- [ ] Kaçırılan kampanyalar listelenmeli

#### Bağımlılıklar
- TASK-004 (completeQuiz)

---

### TASK-006: Campaign Service - listCompletedUsers() Fonksiyonu
**Öncelik:** 🟡 Orta  
**Süre:** 2 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Tamamlanan kullanıcılar listesinde segment bazlı ödül bilgisi gösterilmeli.

#### Yapılacaklar

##### Kod Değişikliği
```javascript
exports.listCompletedUsers = async (req) => {
  const { campaignId } = req.query;
  const filter = { completed: true };
  if (campaignId) {
    filter.campaignId = campaignId;
  }

  const progresses = await UserProgress.find(filter)
    .populate("userId", "name email")
    .populate("campaignId")
    .lean();

  if (!progresses.length) return [];

  const preferredWindow = `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;

  const results = [];
  for (const p of progresses) {
    if (!p.userId || !p.campaignId) {
      continue;
    }

    const userIdVal = String(p.userId._id || p.userId);
    const campaignIdVal = String(p.campaignId._id || p.campaignId);

    // Segment al
    let segDoc = await UserSegment.findOne({
      userId: userIdVal,
      chain: "ethereum",
      window: preferredWindow,
    })
      .sort({ asOf: -1 })
      .lean();
      
    if (!segDoc) {
      segDoc = await UserSegment.findOne({
        userId: userIdVal,
        chain: "ethereum",
      })
        .sort({ asOf: -1 })
        .lean();
    }
    const segmentClass = segDoc?.class || null;

    // Airdrop wallet
    const airdropWalletDoc = await Wallet.findOne({
      user: userIdVal,
      isAirdropAddress: true,
    }).lean();
    const airdropWallet = airdropWalletDoc?.address || null;

    // Segment bazlı ödül hesapla
    const segment = p.campaignId.segments?.find(s => s.name === segmentClass);
    const segmentReward = segment?.reward || 0;

    results.push({
      userId: userIdVal,
      userName: p.userId.name || null,
      campaignId: campaignIdVal,
      campaignTitle: p.campaignId.title || null,
      completedAt: p.completedAt,
      segment: segmentClass,
      reward: segmentReward,
      segmentReward: segmentReward,
      isPurchase: !!p.isPurchase,
      airdropWallet,
    });
  }

  return results;
};
```

#### Test Kriterleri
- [ ] Segment bilgisi doğru gösterilmeli
- [ ] Segment bazlı reward hesaplanmalı
- [ ] Airdrop wallet bilgisi çekilmeli

#### Bağımlılıklar
- TASK-004 (completeQuiz)

---

### TASK-007: Campaign Service - getRewardStatus() Fonksiyonu
**Öncelik:** 🟡 Orta  
**Süre:** 1 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Ödül durumu endpoint'i segment bazlı kontenjan bilgilerini döndürmeli.

#### Yapılacaklar

##### Kod Değişikliği
```javascript
exports.getRewardStatus = async (req) => {
  const { id: campaignId } = req.params;
  const campaign = await Campaign.findById(campaignId).lean();

  if (!campaign) {
    const err = new Error("Campaign not found.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Segment bazlı durum bilgisi
  const segmentStatus = campaign.segments.map(segment => ({
    name: segment.name,
    reward: segment.reward,
    maxParticipants: segment.maxParticipants,
    currentParticipants: segment.currentParticipants,
    availableSlots: Math.max(0, segment.maxParticipants - segment.currentParticipants),
    fillRate: segment.maxParticipants > 0 
      ? ((segment.currentParticipants / segment.maxParticipants) * 100).toFixed(2) + '%'
      : '0%'
  }));

  // Toplam istatistikler
  const totalMaxParticipants = campaign.segments.reduce(
    (sum, s) => sum + s.maxParticipants, 
    0
  );
  const totalCurrentParticipants = campaign.segments.reduce(
    (sum, s) => sum + s.currentParticipants, 
    0
  );

  return {
    campaignId,
    campaignTitle: campaign.title,
    segments: segmentStatus,
    totals: {
      maxParticipants: totalMaxParticipants,
      currentParticipants: totalCurrentParticipants,
      availableSlots: Math.max(0, totalMaxParticipants - totalCurrentParticipants),
      fillRate: totalMaxParticipants > 0
        ? ((totalCurrentParticipants / totalMaxParticipants) * 100).toFixed(2) + '%'
        : '0%'
    }
  };
};
```

#### Test Kriterleri
- [ ] Her segment için durum bilgisi dönmeli
- [ ] Fill rate hesaplanmalı
- [ ] Toplam istatistikler doğru olmalı

#### Bağımlılıklar
- TASK-003 (joinCampaign)

---

### TASK-008: Campaign Service - update() Fonksiyonu
**Öncelik:** 🟡 Orta  
**Süre:** 2 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `services/campaign.service.js`

#### Açıklama
Kampanya güncelleme fonksiyonu segments array'ini güncelleyebilmeli.

#### Yapılacaklar

##### Notlar
- Segment güncellenirken currentParticipants korunmalı
- Segment silindiğinde o segmentteki kullanıcılar kontrol edilmeli
- Validation yapılmalı

##### Kod Değişikliği
```javascript
exports.update = async (req) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  // Müşteri isAdminAccept'i değiştiremez
  if (role !== "admin" && typeof req.body.isAdminAccept !== "undefined") {
    delete req.body.isAdminAccept;
  }

  // createdUserId değiştirilemez
  if (typeof req.body.createdUserId !== "undefined") {
    delete req.body.createdUserId;
  }

  // Segments güncellemesi özel kontrol gerektirir
  if (req.body.segments) {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      const err = new Error("Campaign not found.");
      err.statusCode = StatusCodes.NOT_FOUND;
      throw err;
    }

    // Yeni segments'teki her segment için currentParticipants'ı koru
    req.body.segments = req.body.segments.map(newSegment => {
      const oldSegment = campaign.segments.find(s => s.name === newSegment.name);
      return {
        ...newSegment,
        currentParticipants: oldSegment?.currentParticipants || 0
      };
    });
  }

  const filter =
    role === "admin" ? { _id: id } : { _id: id, createdUserId: userId };
  const updated = await Campaign.findOneAndUpdate(
    filter,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error(
      "You do not have permission to update this campaign or the campaign was not found."
    );
    err.statusCode = StatusCodes.FORBIDDEN;
    throw err;
  }

  return updated;
};
```

#### Test Kriterleri
- [ ] Segment güncellenebilmeli
- [ ] currentParticipants korunmalı
- [ ] Admin ve campaign owner güncelleyebilmeli
- [ ] Validation çalışmalı

#### Bağımlılıklar
- TASK-001 (Validation)

---

## 💾 DATABASE GÖREVLERİ

### TASK-009: Database Index Ekleme
**Öncelik:** 🟡 Orta  
**Süre:** 1 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosya:** `models/campaign.model.js`

#### Açıklama
Performans için segment bazlı sorgular için index'ler eklenmeli.

#### Yapılacaklar

##### Kod Ekleme
```javascript
// campaign.model.js dosyasının sonuna ekle

// Segment name için index
campaignSchema.index({ "segments.name": 1 });

// Segment filters chain için index
campaignSchema.index({ "segments.filters.chain": 1 });

// Aktif kampanyalar ve segment için compound index
campaignSchema.index({ 
  status: 1, 
  isActive: 1, 
  isAdminAccept: 1,
  "segments.name": 1 
});

// Segment kontenjan sorguları için
campaignSchema.index({ 
  "segments.name": 1,
  "segments.currentParticipants": 1,
  "segments.maxParticipants": 1
});
```

#### Test Kriterleri
- [ ] Index'ler oluşturulmalı
- [ ] Query performance iyileşmeli
- [ ] explain() ile index kullanımı doğrulanmalı

#### Bağımlılıklar
- Yok

---

### TASK-010: Migration Script Yazma
**Öncelik:** ⚠️ İPTAL EDİLDİ - ESKİ VERİLER SİLİNECEK  
**Süre:** ~  
**Durum:** ❌ İptal  
**Dosya:** ~

#### Açıklama
⚠️ **NOT:** Eski kampanya verileri silineceği için migration script'e gerek yoktur. Yeni kampanyalar doğrudan yeni segment yapısıyla oluşturulacaktır.

#### Eski Verilerin Silinmesi
Database'deki mevcut campaigns koleksiyonu temizlenecek:

#### Yapılacaklar

##### Script Oluşturma
```javascript
/**
 * Campaign Migration Script
 * Eski rewards yapısını yeni segments yapısına dönüştürür
 * 
 * KULLANIM: node scripts/migrate_campaigns_to_segments.js
 */

const mongoose = require('mongoose');
const Campaign = require('../models/campaign.model');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateCampaigns() {
  try {
    console.log('🔄 Migration başlatılıyor...\n');

    // MongoDB bağlantısı
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Tüm kampanyaları getir
    const campaigns = await Campaign.find({});
    console.log(`📊 Toplam ${campaigns.length} kampanya bulundu\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const campaign of campaigns) {
      try {
        // Zaten segments varsa atla
        if (campaign.segments && campaign.segments.length > 0) {
          console.log(`⏭️  Atlanan: ${campaign.title} (zaten migrate edilmiş)`);
          skippedCount++;
          continue;
        }

        // Eski yapıda rewards var mı kontrol et
        if (!campaign.rewards) {
          console.log(`⚠️  Atlanan: ${campaign.title} (rewards bulunamadı)`);
          skippedCount++;
          continue;
        }

        // Yeni segments array'i oluştur
        const segments = [];

        // Her segment için (A, B, C, D)
        const segmentNames = ['A', 'B', 'C', 'D'];
        
        for (const name of segmentNames) {
          const reward = campaign.rewards[name];
          const maxParticipants = campaign.maxParticipants?.[name] || 0;
          const currentParticipants = campaign.currentParticipants?.[name] || 0;

          // Sadece reward tanımlıysa segment oluştur
          if (reward !== undefined && reward !== null) {
            segments.push({
              name,
              reward,
              maxParticipants,
              currentParticipants,
              description: `Segment ${name}`,
              filters: [
                {
                  field: 'user_segment',
                  chain: 'ETH',
                  tx_types: {
                    state: 'and',
                    types: []
                  },
                  token_types: {
                    state: 'and',
                    types: []
                  }
                }
              ]
            });
          }
        }

        if (segments.length === 0) {
          console.log(`⚠️  Hata: ${campaign.title} (segment oluşturulamadı)`);
          errorCount++;
          continue;
        }

        // Campaign'i güncelle
        campaign.segments = segments;
        
        // Eski alanları temizle (opsiyonel)
        campaign.rewards = undefined;
        campaign.maxParticipants = undefined;
        campaign.currentParticipants = undefined;
        campaign.maxTotalParticipants = undefined;

        await campaign.save();

        console.log(`✅ Migrate edildi: ${campaign.title} (${segments.length} segment)`);
        migratedCount++;

      } catch (err) {
        console.error(`❌ Hata (${campaign.title}):`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Özeti:');
    console.log(`   ✅ Migrate edilen: ${migratedCount}`);
    console.log(`   ⏭️  Atlanan: ${skippedCount}`);
    console.log(`   ❌ Hata: ${errorCount}`);
    console.log(`   📊 Toplam: ${campaigns.length}`);

    console.log('\n🎉 Migration tamamlandı!');

  } catch (error) {
    console.error('💥 Migration hatası:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
migrateCampaigns();
```

#### Test Kriterleri
- [ ] Eski rewards yapısı segments'e dönüşmeli
- [ ] currentParticipants korunmalı
- [ ] Tüm kampanyalar migrate edilmeli
- [ ] Hata durumları loglanmalı
- [ ] Rollback planı olmalı

#### Eski Verileri Silme (MongoDB)
```bash
# MongoDB shell veya Compass kullanarak:

# 1. Campaigns koleksiyonunu temizle
db.campaigns.deleteMany({})

# 2. Campaign Participations temizle
db.campaignparticipations.deleteMany({})

# 3. User Progress temizle
db.userprogresses.deleteMany({})

# 4. Doğrulama
db.campaigns.countDocuments()  // 0 olmalı
db.campaignparticipations.countDocuments()  // 0 olmalı
db.userprogresses.countDocuments()  // 0 olmalı
```

⚠️ **DİKKAT:** Bu işlem geri alınamaz! Production'da kullanmadan önce mutlaka test ortamında deneyin.

#### Bağımlılıklar
- Yok (Eski veriler silineceği için migration gerekmez)

---

## 🧪 TEST GÖREVLERİ

### TASK-011: Unit Test - Validation Testleri
**Öncelik:** 🟡 Orta  
**Süre:** 2 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** `tests/campaign_validation.test.js`

#### Açıklama
Yeni validation kuralları için test case'leri yazılmalı.

#### Yapılacaklar

##### Test Ekleme
```javascript
describe('Campaign Validation - Segments', () => {
  describe('Valid Segments', () => {
    it('should accept valid segments array', () => {
      const data = {
        title: 'Test Campaign',
        description: 'Test Description',
        segments: [
          {
            name: 'A',
            reward: 1000,
            maxParticipants: 100,
            currentParticipants: 0,
            description: 'Premium segment',
            filters: [
              {
                field: 'transaction_activity',
                chain: 'ETH',
                tx_types: {
                  state: 'and',
                  types: [
                    {
                      name: 'swap',
                      min_value: 1000,
                      min_count: 10
                    }
                  ]
                },
                token_types: {
                  state: 'and',
                  types: []
                }
              }
            ]
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(data);
      expect(error).toBeUndefined();
    });
  });

  describe('Invalid Segments', () => {
    it('should reject empty segments array', () => {
      const data = {
        title: 'Test Campaign',
        description: 'Test Description',
        segments: [],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain('en az bir segment');
    });

    it('should reject duplicate segment names', () => {
      const data = {
        title: 'Test Campaign',
        description: 'Test Description',
        segments: [
          {
            name: 'A',
            reward: 1000,
            maxParticipants: 100,
            filters: [{ field: 'test', chain: 'ETH' }]
          },
          {
            name: 'A', // Duplicate
            reward: 500,
            maxParticipants: 50,
            filters: [{ field: 'test', chain: 'ETH' }]
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain('benzersiz');
    });

    it('should reject segment without filters', () => {
      const data = {
        title: 'Test Campaign',
        description: 'Test Description',
        segments: [
          {
            name: 'A',
            reward: 1000,
            maxParticipants: 100,
            filters: [] // Empty
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain('en az bir filtre');
    });

    it('should reject invalid chain value', () => {
      const data = {
        title: 'Test Campaign',
        description: 'Test Description',
        segments: [
          {
            name: 'A',
            reward: 1000,
            maxParticipants: 100,
            filters: [
              {
                field: 'test',
                chain: 'INVALID' // Invalid
              }
            ]
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('Filter Validation', () => {
    it('should accept valid tx_types', () => {
      // Test implementation
    });

    it('should accept valid token_types', () => {
      // Test implementation
    });

    it('should reject invalid tx type name', () => {
      // Test implementation
    });
  });
});
```

#### Test Kriterleri
- [ ] Valid segment kabul edilmeli
- [ ] Empty segment reddedilmeli
- [ ] Duplicate names reddedilmeli
- [ ] Invalid chain reddedilmeli
- [ ] Filter validation çalışmalı

#### Bağımlılıklar
- TASK-001 (Validation)

---

### TASK-012: Integration Test - Campaign Flow
**Öncelik:** 🟡 Orta  
**Süre:** 3 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** `test/segment_campaign_flow.test.js` (YENİ)

#### Açıklama
End-to-end kampanya akışı testi (oluşturma → katılım → tamamlama).

#### Yapılacaklar

##### Test Dosyası Oluşturma
```javascript
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5005/api/v1';
let adminToken = '';
let userToken = '';
let campaignId = '';

describe('Segment-Based Campaign Flow', () => {
  
  beforeAll(async () => {
    // Admin login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    adminToken = adminLogin.data.data.token;

    // User login
    const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@example.com',
      password: 'user123'
    });
    userToken = userLogin.data.data.token;
  });

  describe('Campaign Creation', () => {
    it('should create campaign with segments', async () => {
      const response = await axios.post(
        `${BASE_URL}/campaigns/create`,
        {
          title: 'Segment Test Campaign',
          description: 'Testing segment-based rewards',
          segments: [
            {
              name: 'A',
              reward: 1000,
              maxParticipants: 10,
              currentParticipants: 0,
              description: 'Premium segment',
              filters: [
                {
                  field: 'transaction_activity',
                  chain: 'ETH',
                  tx_types: {
                    state: 'and',
                    types: [
                      {
                        name: 'swap',
                        min_value: 1000,
                        min_count: 10
                      }
                    ]
                  },
                  token_types: {
                    state: 'and',
                    types: []
                  }
                }
              ]
            },
            {
              name: 'D',
              reward: 100,
              maxParticipants: 100,
              currentParticipants: 0,
              description: 'Basic segment',
              filters: [
                {
                  field: 'basic',
                  chain: 'ETH',
                  tx_types: { state: 'and', types: [] },
                  token_types: { state: 'and', types: [] }
                }
              ]
            }
          ],
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          company_logo: 'https://example.com/logo.png',
          twitter_url: 'https://twitter.com/company'
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.data.segments).toHaveLength(2);
      campaignId = response.data.data._id;
    });
  });

  describe('Campaign Join', () => {
    it('should join campaign and get correct segment', async () => {
      const response = await axios.post(
        `${BASE_URL}/campaigns/${campaignId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.segment).toBeDefined();
      expect(response.data.data.segmentQuota).toBeDefined();
      expect(response.data.data.reward).toBeDefined();
    });
  });

  describe('Campaign Complete', () => {
    it('should complete campaign with segment reward', async () => {
      const response = await axios.post(
        `${BASE_URL}/campaigns/${campaignId}/complete`,
        {
          totalTimeSpent: 120
        },
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.completed).toBe(true);
    });
  });

  describe('Reward Status', () => {
    it('should get segment-based reward status', async () => {
      const response = await axios.get(
        `${BASE_URL}/campaigns/${campaignId}/reward-status`,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.segments).toBeDefined();
      expect(response.data.data.totals).toBeDefined();
    });
  });
});
```

#### Test Kriterleri
- [ ] Campaign oluşturulabilmeli
- [ ] Segment bilgileri doğru kaydedilmeli
- [ ] Kullanıcı doğru segmente atanmalı
- [ ] Kontenjan güncellenebilmeli
- [ ] Tamamlama işlemi çalışmalı
- [ ] Segment reward hesaplanmalı

#### Bağımlılıklar
- TASK-002, TASK-003, TASK-004

---

### TASK-013: Performance Test - Segment Queries
**Öncelik:** 🟢 Düşük  
**Süre:** 2 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** `test/performance_segment_queries.test.js` (YENİ)

#### Açıklama
Segment bazlı sorguların performans testleri.

#### Yapılacaklar

- Segment filtreleme sorgu hızı
- Index kullanımı kontrolü
- Large dataset testleri
- Concurrent user testleri

#### Test Kriterleri
- [ ] Segment queries < 100ms
- [ ] Index kullanımı doğrulanmalı
- [ ] 1000+ kampanya ile test edilmeli
- [ ] Concurrent 100+ user test edilmeli

#### Bağımlılıklar
- TASK-009 (Index)

---

### TASK-014: E2E Test - Frontend Integration
**Öncelik:** 🟢 Düşük  
**Süre:** 1 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** `tests/e2e/campaign_segment.spec.js` (YENİ)

#### Açıklama
Frontend ile entegrasyon testleri (Cypress/Playwright).

#### Yapılacaklar

- Campaign creation form testi
- Segment builder UI testi
- Join flow testi
- Reward display testi

#### Bağımlılıklar
- Frontend tasks

---

## 🎨 FRONTEND GÖREVLERİ

### TASK-015: Campaign Form - Segment Builder UI
**Öncelik:** 🔴 Kritik  
**Süre:** 6 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** Frontend component (yeni)

#### Açıklama
Kampanya oluşturma formuna segment builder komponenti eklenmeli.

#### Yapılacaklar

##### Component Yapısı
```jsx
// SegmentBuilder.jsx

import React, { useState } from 'react';

const SegmentBuilder = ({ segments, setSegments }) => {
  
  const addSegment = () => {
    setSegments([...segments, {
      name: '',
      reward: 0,
      maxParticipants: 0,
      currentParticipants: 0,
      description: '',
      filters: []
    }]);
  };

  const removeSegment = (index) => {
    setSegments(segments.filter((_, i) => i !== index));
  };

  const updateSegment = (index, field, value) => {
    const newSegments = [...segments];
    newSegments[index][field] = value;
    setSegments(newSegments);
  };

  const addFilter = (segmentIndex) => {
    const newSegments = [...segments];
    newSegments[segmentIndex].filters.push({
      field: '',
      chain: 'ETH',
      tx_types: {
        state: 'and',
        types: []
      },
      token_types: {
        state: 'and',
        types: []
      }
    });
    setSegments(newSegments);
  };

  return (
    <div className="segment-builder">
      <h3>Campaign Segments</h3>
      
      {segments.map((segment, segmentIndex) => (
        <div key={segmentIndex} className="segment-card">
          <div className="segment-header">
            <input
              type="text"
              placeholder="Segment Name (e.g., A)"
              value={segment.name}
              onChange={(e) => updateSegment(segmentIndex, 'name', e.target.value.toUpperCase())}
              maxLength={1}
            />
            <button onClick={() => removeSegment(segmentIndex)}>
              Remove Segment
            </button>
          </div>

          <div className="segment-details">
            <div className="form-group">
              <label>Reward Amount</label>
              <input
                type="number"
                value={segment.reward}
                onChange={(e) => updateSegment(segmentIndex, 'reward', parseFloat(e.target.value))}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Max Participants</label>
              <input
                type="number"
                value={segment.maxParticipants}
                onChange={(e) => updateSegment(segmentIndex, 'maxParticipants', parseInt(e.target.value))}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={segment.description}
                onChange={(e) => updateSegment(segmentIndex, 'description', e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <div className="segment-filters">
            <h4>Filters</h4>
            <FilterBuilder
              filters={segment.filters}
              segmentIndex={segmentIndex}
              segments={segments}
              setSegments={setSegments}
            />
            <button onClick={() => addFilter(segmentIndex)}>
              Add Filter
            </button>
          </div>
        </div>
      ))}

      <button onClick={addSegment} className="btn-add-segment">
        + Add Segment
      </button>
    </div>
  );
};

export default SegmentBuilder;
```

##### Filter Builder Component
```jsx
// FilterBuilder.jsx

const FilterBuilder = ({ filters, segmentIndex, segments, setSegments }) => {
  
  const updateFilter = (filterIndex, field, value) => {
    const newSegments = [...segments];
    newSegments[segmentIndex].filters[filterIndex][field] = value;
    setSegments(newSegments);
  };

  const removeFilter = (filterIndex) => {
    const newSegments = [...segments];
    newSegments[segmentIndex].filters = newSegments[segmentIndex].filters.filter((_, i) => i !== filterIndex);
    setSegments(newSegments);
  };

  return (
    <div className="filter-builder">
      {filters.map((filter, filterIndex) => (
        <div key={filterIndex} className="filter-card">
          <select
            value={filter.chain}
            onChange={(e) => updateFilter(filterIndex, 'chain', e.target.value)}
          >
            <option value="ETH">Ethereum</option>
            <option value="BNB">BNB Chain</option>
            <option value="ARB">Arbitrum</option>
            <option value="ETC">Ethereum Classic</option>
          </select>

          <input
            type="text"
            placeholder="Field"
            value={filter.field}
            onChange={(e) => updateFilter(filterIndex, 'field', e.target.value)}
          />

          {/* TX Types Builder */}
          <TransactionTypesBuilder
            txTypes={filter.tx_types}
            filterIndex={filterIndex}
            segmentIndex={segmentIndex}
            segments={segments}
            setSegments={setSegments}
          />

          {/* Token Types Builder */}
          <TokenTypesBuilder
            tokenTypes={filter.token_types}
            filterIndex={filterIndex}
            segmentIndex={segmentIndex}
            segments={segments}
            setSegments={setSegments}
          />

          <button onClick={() => removeFilter(filterIndex)}>
            Remove Filter
          </button>
        </div>
      ))}
    </div>
  );
};
```

#### UI Requirements
- [ ] Segment ekleme/silme
- [ ] Filter ekleme/silme
- [ ] Chain dropdown
- [ ] TX types builder
- [ ] Token types builder
- [ ] Real-time validation
- [ ] Preview panel

#### Bağımlılıklar
- TASK-001 (Validation rules)

---

### TASK-016: Campaign Display - Segment Information
**Öncelik:** 🔴 Kritik  
**Süre:** 4 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** Frontend component

#### Açıklama
Kampanya detay sayfasında segment bilgileri gösterilmeli.

#### Yapılacaklar

##### Component
```jsx
// CampaignSegmentInfo.jsx

const CampaignSegmentInfo = ({ campaign, userSegment }) => {
  
  return (
    <div className="campaign-segments">
      <h3>Reward Segments</h3>
      
      <div className="segments-grid">
        {campaign.segments.map((segment) => (
          <div 
            key={segment.name} 
            className={`segment-card ${userSegment === segment.name ? 'user-segment' : ''}`}
          >
            <div className="segment-header">
              <h4>Segment {segment.name}</h4>
              {userSegment === segment.name && (
                <span className="badge-your-segment">Your Segment</span>
              )}
            </div>

            <div className="segment-reward">
              <span className="reward-label">Reward</span>
              <span className="reward-amount">{segment.reward} tokens</span>
            </div>

            <div className="segment-quota">
              <div className="quota-bar">
                <div 
                  className="quota-fill" 
                  style={{ 
                    width: `${(segment.currentParticipants / segment.maxParticipants) * 100}%` 
                  }}
                />
              </div>
              <span className="quota-text">
                {segment.currentParticipants} / {segment.maxParticipants} participants
              </span>
            </div>

            {segment.description && (
              <p className="segment-description">{segment.description}</p>
            )}

            {userSegment === segment.name && (
              <button className="btn-join-campaign">
                Join Campaign
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="segment-info-note">
        <InfoIcon />
        <p>
          Your segment is determined based on your wallet activity and transaction history.
          You can only participate in campaigns that match your segment.
        </p>
      </div>
    </div>
  );
};
```

#### UI Requirements
- [ ] Segment cards grid
- [ ] User's segment highlight
- [ ] Quota progress bar
- [ ] Reward display
- [ ] Info tooltip
- [ ] Responsive design

#### Bağımlılıklar
- Backend API (TASK-003, TASK-007)

---

### TASK-017: User Dashboard - Segment Earnings
**Öncelik:** 🟡 Orta  
**Süre:** 2 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** Frontend component

#### Açıklama
Kullanıcı dashboard'unda segment bazlı kazanç analizi gösterilmeli.

#### Yapılacaklar

##### Component
```jsx
// SegmentEarningsAnalysis.jsx

const SegmentEarningsAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const response = await api.get('/campaigns/user/segment-earnings-analysis');
      setAnalysis(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!analysis) return <NoData />;

  return (
    <div className="segment-earnings-analysis">
      <div className="user-segment-info">
        <h3>Your Segment: {analysis.userSegment.class}</h3>
        <div className="segment-stats">
          <div className="stat">
            <span className="stat-label">Composite Score</span>
            <span className="stat-value">{analysis.userSegment.compositeScore.toFixed(2)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Percentile</span>
            <span className="stat-value">{analysis.userSegment.percentile.toFixed(1)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Confidence</span>
            <span className="stat-value">{(analysis.userSegment.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="earnings-overview">
        <div className="earning-card">
          <h4>Actual Earnings</h4>
          <p className="amount">{analysis.earnings.actualEarnings}</p>
        </div>
        <div className="earning-card">
          <h4>Potential Earnings</h4>
          <p className="amount">{analysis.earnings.potentialEarnings}</p>
        </div>
        <div className="earning-card missed">
          <h4>Missed Earnings</h4>
          <p className="amount">{analysis.earnings.missedEarnings}</p>
        </div>
        <div className="earning-card">
          <h4>Completion Rate</h4>
          <p className="amount">{analysis.earnings.completionRate}%</p>
        </div>
      </div>

      <div className="campaigns-breakdown">
        <h4>Campaign Breakdown</h4>
        
        <div className="campaign-section">
          <h5>Completed ({analysis.summary.totalCompletedCampaigns})</h5>
          {analysis.campaigns.completed.map((campaign) => (
            <div key={campaign.campaignId} className="campaign-item completed">
              <span>{campaign.title}</span>
              <span className="reward">+{campaign.reward}</span>
            </div>
          ))}
        </div>

        <div className="campaign-section">
          <h5>Missed Opportunities ({analysis.summary.totalMissedCampaigns})</h5>
          {analysis.campaigns.missed.slice(0, 5).map((campaign) => (
            <div key={campaign.campaignId} className="campaign-item missed">
              <span>{campaign.title}</span>
              <span className="reward">-{campaign.reward}</span>
            </div>
          ))}
        </div>

        <div className="campaign-section">
          <h5>In Progress ({analysis.summary.totalInProgressCampaigns})</h5>
          {analysis.campaigns.inProgress.map((campaign) => (
            <div key={campaign.campaignId} className="campaign-item in-progress">
              <span>{campaign.title}</span>
              <span className="reward">~{campaign.reward}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### UI Requirements
- [ ] Segment bilgisi gösterimi
- [ ] Earnings cards
- [ ] Campaign breakdown
- [ ] Charts (optional)
- [ ] Export functionality (optional)

#### Bağımlılıklar
- TASK-005 (earnings analysis API)

---

## 📚 DOKÜMANTASYON GÖREVLERİ

### TASK-018: API Documentation Update
**Öncelik:** 🟡 Orta  
**Süre:** 2 saat  
**Durum:** ✅ TAMAMLANDI  
**Dosyalar:** 
- `campaign_api_doc.md`
- `docs/campaign_back_v1.md`
- `docs/API_ENDPOINTS.md`

#### Açıklama
API dokümantasyonu yeni segment yapısını yansıtacak şekilde güncellenmeli.

#### Yapılacaklar

- [ ] Request/Response örnekleri güncellenmeli
- [ ] Segment schema açıklaması eklenmeli
- [ ] Filter yapısı detaylandırılmalı
- [ ] Error cases güncellenmeli
- [ ] Code examples güncellenmeli

#### Güncelleme Alanları

```markdown
# YENİ BÖLÜM EKLE:

## Segment-Based Reward System

### Segment Structure
```json
{
  "name": "A",
  "reward": 1000,
  "maxParticipants": 100,
  "currentParticipants": 0,
  "description": "Premium segment",
  "filters": [...]
}
```

### Filter Structure
```json
{
  "field": "transaction_activity",
  "chain": "ETH",
  "tx_types": {
    "state": "and",
    "types": [
      {
        "name": "swap",
        "min_value": 1000,
        "min_count": 10
      }
    ]
  },
  "token_types": {
    "state": "and",
    "types": []
  }
}
```
```

#### Bağımlılıklar
- Tüm backend tasks

---

### TASK-019: Frontend Integration Guide
**Öncelik:** 🟡 Orta  
**Süre:** 2 saat  
**Durum:** ⏳ Bekliyor  
**Dosya:** `docs/FRONTEND_SEGMENT_INTEGRATION.md` (YENİ)

#### Açıklama
Frontend geliştiriciler için segment entegrasyon rehberi.

#### İçerik

```markdown
# Frontend Segment Integration Guide

## Overview
Bu döküman, segment-based kampanya sistemini frontend'e entegre etmek için gerekli adımları açıklar.

## API Changes

### Old Structure (Deprecated)
```javascript
{
  rewards: { A: 100, B: 75, C: 50, D: 25 },
  maxParticipants: { A: 10, B: 20, C: 30, D: 40 }
}
```

### New Structure
```javascript
{
  segments: [
    {
      name: 'A',
      reward: 100,
      maxParticipants: 10,
      currentParticipants: 0,
      filters: [...]
    }
  ]
}
```

## Component Examples
... (detaylı örnekler)

## Common Patterns
... (best practices)

## Troubleshooting
... (sık karşılaşılan sorunlar)
```

#### Bağımlılıklar
- Frontend tasks

---

## 🚀 DEPLOYMENT GÖREVLERİ

### TASK-020: Production Deployment
**Öncelik:** 🔴 Kritik  
**Süre:** 2 saat  
**Durum:** ⏳ Bekliyor

#### Açıklama
Production ortamına deployment planı ve kontrol listesi.

#### Checklist

##### Pre-Deployment
- [ ] Tüm testler başarılı
- [ ] Code review tamamlandı
- [ ] ⚠️ Eski kampanya verileri silindi (production'da dikkatli!)
- [ ] Yeni test kampanyaları oluşturuldu
- [ ] Monitoring kuruldu

##### Deployment Steps
1. **Maintenance Mode**
   ```bash
   # Enable maintenance mode
   pm2 stop finscope-backend
   ```

2. **Database Temizleme (Eski veriler)**
   ```bash
   # ⚠️ DİKKAT: Bu işlem geri alınamaz!
   # MongoDB'de eski kampanya verilerini sil
   db.campaigns.deleteMany({})
   db.campaignparticipations.deleteMany({})
   db.userprogresses.deleteMany({})
   
   # Verify
   db.campaigns.countDocuments()  # 0 olmalı
   ```

3. **Code Deployment**
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

4. **Restart Services**
   ```bash
   pm2 restart finscope-backend
   pm2 logs
   ```

5. **Smoke Tests**
   ```bash
   # Test critical endpoints
   curl -X GET https://api.finscope.com/campaigns/all
   curl -X POST https://api.finscope.com/campaigns/:id/join
   ```

6. **Monitoring**
   - Check error logs
   - Monitor API response times
   - Check database queries
   - Monitor user activity

##### Rollback Plan
⚠️ **NOT:** Eski veriler silindiği için database rollback mümkün değil!

```bash
# Eğer sorun oluşursa:
1. Stop application
   pm2 stop finscope-backend

2. Eski kod versiyonuna dön
   git checkout <previous-commit>
   npm install

3. Servisleri yeniden başlat
   pm2 restart finscope-backend

4. Yeni kampanyalar oluştur
   # Test kampanyaları script ile ekle
```

#### Post-Deployment
- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Verify user campaigns
- [ ] Update status page
- [ ] Notify stakeholders

#### Bağımlılıklar
- Tüm tasks tamamlanmalı

---

## 📊 İLERLEME TAKİBİ

### Haftalık Plan

#### Hafta 1 (Backend)
- Pazartesi: TASK-001 (Validation)
- Salı: TASK-002, TASK-003 (Service - create, join)
- Çarşamba: TASK-004, TASK-005 (Service - complete, earnings)
- Perşembe: TASK-006, TASK-007, TASK-008 (Service - diğer fonksiyonlar)
- Cuma: TASK-009, TASK-010 (Database - index, migration)

#### Hafta 2 (Test & Frontend)
- Pazartesi: TASK-011, TASK-012 (Tests)
- Salı-Çarşamba: TASK-015 (Frontend - Segment Builder)
- Perşembe: TASK-016, TASK-017 (Frontend - Display, Dashboard)
- Cuma: TASK-013, TASK-014 (Performance & E2E tests)

#### Hafta 3 (Docs & Deploy)
- Pazartesi: TASK-018, TASK-019 (Documentation)
- Salı: Final testing
- Çarşamba: Staging deployment
- Perşembe: TASK-020 (Production deployment)
- Cuma: Monitoring & bug fixes

---

## ✅ KONTROL LİSTESİ

### Backend ✓
- [x] TASK-001: Validation
- [x] TASK-002: Service - create()
- [x] TASK-003: Service - joinCampaign()
- [x] TASK-004: Service - completeQuiz()
- [x] TASK-005: Service - earnings analysis
- [x] TASK-006: Service - listCompletedUsers()
- [x] TASK-007: Service - getRewardStatus()
- [x] TASK-008: Service - update()

### Database ✓
- [x] TASK-009: Index ekleme
- [ ] ~~TASK-010: Migration script~~ (İptal - Eski veriler silinecek)

### Tests ✓
- [ ] TASK-011: Unit tests
- [ ] TASK-012: Integration tests
- [ ] TASK-013: Performance tests
- [ ] TASK-014: E2E tests

### Frontend ✓
- [ ] TASK-015: Segment Builder UI
- [ ] TASK-016: Campaign Display
- [ ] TASK-017: User Dashboard

### Docs ✓
- [x] TASK-018: API Documentation (campaign_api_new_doc.md)
- [ ] TASK-019: Frontend Guide

### Deploy ✓
- [ ] TASK-020: Production Deployment

---

## 📞 DESTEK VE İLETİŞİM

### Sorumlu Kişiler
- Backend Lead: [İsim]
- Frontend Lead: [İsim]
- DevOps: [İsim]
- QA Lead: [İsim]

### Escalation Path
1. Team Lead
2. Tech Lead
3. CTO

### Communication Channels
- Daily Standup: 10:00
- Slack: #campaign-module-v3
- Weekly Review: Cuma 16:00

---

## 📝 NOTLAR

### Önemli Hatırlatmalar
- Her task için branch oluştur (`feature/TASK-XXX`)
- Commit message convention: `[TASK-XXX] Description`
- Code review zorunlu
- Test coverage minimum %80
- Migration script mutlaka test et

### Risk Faktörleri
⚠️ **Yüksek Risk:**
- Migration script hatalı çalışabilir
- Mevcut kullanıcı kampanyaları etkilenebilir
- Performance sorunları olabilir

⚠️ **Orta Risk:**
- Frontend entegrasyon gecikmesi
- Test coverage hedefine ulaşamama

⚠️ **Düşük Risk:**
- Documentation eksiklikleri
- Minor UI bugs

### Başarı Kriterleri
✅ Tüm testler geçmeli  
✅ Migration %100 başarılı  
✅ API response time < 200ms  
✅ Zero downtime deployment  
✅ Kullanıcı deneyimi bozulmamalı

---

**Son Güncelleme:** 15 Ekim 2025  
**Versiyon:** 1.0  
**Durum:** 🔴 Aktif Geliştirme


