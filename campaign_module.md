# 📊 KAMPANYA MODÜLÜ DETAYLI ANALİZ VE DOKÜMANTASYON

**Versiyon:** 3.0.0  
**Son Güncelleme:** 15 Ekim 2025  
**Proje:** FinScope Backend

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Yeni Kampanya Modeli Yapısı](#yeni-kampanya-modeli-yapısı)
3. [İlişkili Modeller](#ilişkili-modeller)
4. [Veri Akışı ve Mimari](#veri-akışı-ve-mimari)
5. [Dosya Bağımlılıkları](#dosya-bağımlılıkları)
6. [API Endpoints](#api-endpoints)
7. [Servis Katmanı](#servis-katmanı)
8. [Controller Katmanı](#controller-katmanı)
9. [Validation Katmanı](#validation-katmanı)
10. [Router Yapısı](#router-yapısı)
11. [Segmentasyon Entegrasyonu](#segmentasyon-entegrasyonu)
12. [Referral Sistemi](#referral-sistemi)
13. [Utility Functions](#utility-functions)
14. [Scripts ve Toollar](#scripts-ve-toollar)
15. [Test Altyapısı](#test-altyapısı)
16. [Değişiklik Gereksinimleri](#değişiklik-gereksinimleri)

---

## 📌 GENEL BAKIŞ

Kampanya modülü, FinScope platformunun temel özelliklerinden biridir. Kullanıcılar, kampanyalara katılarak eğitim içeriklerini tamamlar ve segment bazlı ödüller kazanır. Yeni model, **segment-based reward system** ve **advanced filtering** özellikleri ekler.

### Ana Özellikler:
- ✅ **Segment Bazlı Ödüller** - Her segment (A, B, C, D) için farklı ödül miktarları
- ✅ **Segment Bazlı Kontenjan** - Her segment için ayrı katılımcı limitleri
- ✅ **Gelişmiş Filtreleme** - Chain, transaction type, token type bazlı filtreleme
- ✅ **İçerik Yönetimi** - Çoklu medya (resim, video, başlık, açıklama) desteği
- ✅ **Progress Tracking** - Kullanıcı ilerleme takibi
- ✅ **Referral System** - Davetiye sistemi ve bonus kazancı
- ✅ **Admin Approval** - Admin onay mekanizması

---

## 🔧 YENİ KAMPANYA MODELİ YAPISI

### 📁 Dosya: `models/campaign.model.js`

#### 1. **Filter Schema (Segment Filtreleri)**
```javascript
const filterSchema = new mongoose.Schema({
  field: String,           // Filtre alanı
  chain: String,           // Blockchain (ETH, BNB, ARB, ETC)
  tx_types: {              // Transaction tipleri
    state: String,         // 'and' veya 'or'
    types: [{
      name: String,        // bridge, lending, swap, other
      min_value: Number,
      min_count: Number
    }]
  },
  token_types: {           // Token tipleri
    state: String,         // 'and' veya 'or'
    types: [{
      name: String,        // meme, ai, stable
      min_value: Number,
      min_count: Number
    }]
  }
});
```

**Amaç:** Her segment için blockchain aktivite kriterlerini tanımlar.

**Kullanım Senaryosu:**
- A segmenti: ETH chain'de 1000+ USD swap işlemi yapmış kullanıcılar
- B segmenti: Herhangi bir chain'de 500+ USD lending işlemi yapmış kullanıcılar

---

#### 2. **Segment Schema**
```javascript
const segmentSchema = new mongoose.Schema({
  name: String,              // Segment adı (A, B, C, D)
  reward: Number,            // Bu segment için ödül miktarı
  maxParticipants: Number,   // Maksimum katılımcı sayısı
  currentParticipants: Number, // Mevcut katılımcı sayısı
  description: String,       // Segment açıklaması
  filters: [filterSchema]    // Segment filtreleri
});
```

**Validasyon Kuralları:**
- ✅ Segment isimleri benzersiz olmalı
- ✅ Her segment en az 1 filtre içermeli
- ✅ Reward değeri 0 veya üzeri olmalı

---

#### 3. **Campaign Schema (Ana Şema)**
```javascript
const campaignSchema = new mongoose.Schema({
  // Temel Bilgiler
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  
  // İçerik Yönetimi
  content: [{
    itemImage: String,
    itemVideo: String,
    itemTitle: String,
    itemDescription: String,
    itemIndex: Number
  }],
  
  // Segment Yapısı (YENİ!)
  segments: {
    type: [segmentSchema],
    validate: {
      validator: function(segments) {
        return segments && segments.length > 0;
      },
      message: 'Kampanya en az bir segment içermelidir'
    }
  },
  
  // Tarih Bilgileri
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Soru Bilgileri
  questions: { type: Number, default: 5, min: 1 },
  questionIds: [{ type: ObjectId, ref: "Question" }],
  
  // Meta Bilgiler
  tags: [String],
  company_logo: { type: String, required: true },
  twitter_url: { type: String, required: true },
  
  // Yetkilendirme
  createdUserId: { type: ObjectId, ref: "User", required: true },
  
  // Durum Bilgileri
  status: {
    type: String,
    enum: ["active", "inactive", "expired", "upcoming"],
    default: "upcoming"
  },
  isActive: { type: Boolean, default: true },
  isAdminAccept: { type: Boolean, default: false }
});
```

#### Pre-Save Hooks
```javascript
// 1. Segment isimlerinin benzersizliği kontrolü
// 2. Tarih bazlı status güncelleme
// 3. UpdatedAt timestamp güncelleme
```

#### Instance Methods
```javascript
- addSegment(segmentData)   // Yeni segment ekleme
- activate()                // Kampanyayı aktif etme
- inactive()                // Kampanyayı pasif etme
- expired()                 // Kampanyayı sona erdirme
- upcoming()                // Kampanyayı yaklaşan olarak işaretleme
```

---

## 🔗 İLİŞKİLİ MODELLER

### 1. **CampaignParticipation Model**
**Dosya:** `models/campaignParticipation.model.js`

```javascript
{
  campaignId: ObjectId,      // Kampanya referansı
  userId: ObjectId,          // Kullanıcı referansı
  joinedAt: Date,            // Katılım tarihi
  status: String,            // active, completed, abandoned
  score: Number,             // Kullanıcı skoru (0-100)
  timeSpent: Number,         // Harcanan süre (saniye)
  completedAt: Date          // Tamamlanma tarihi
}
```

**Amaç:** Kullanıcının kampanyaya katılımını ve durumunu takip eder.

**Index:** `{ userId: 1, campaignId: 1 }` - Unique composite index

---

### 2. **UserProgress Model**
**Dosya:** `models/userProgress.model.js`

```javascript
{
  userId: ObjectId,          // Kullanıcı referansı
  campaignId: ObjectId,      // Kampanya referansı
  joined: Boolean,           // Katılım durumu
  completed: Boolean,        // Tamamlanma durumu
  timeSpent: Number,         // Toplam harcanan süre
  startedAt: Date,           // Başlangıç tarihi
  completedAt: Date,         // Tamamlanma tarihi
  isPurchase: Boolean,       // Ödeme yapıldı mı?
  isPaymentEarned: Boolean   // Ödeme kazanıldı mı?
}
```

**Amaç:** Kullanıcının kampanya içindeki ilerleme durumunu saklar.

**Index:** `{ userId: 1, campaignId: 1 }` - Unique composite index

---

### 3. **UserSegment Model**
**Dosya:** `models/userSegment.model.js`

```javascript
{
  userId: ObjectId,          // Kullanıcı referansı
  chain: String,             // Blockchain (ethereum)
  window: String,            // Zaman penceresi (30d, 90d, 180d)
  wallets: [{                // Wallet bilgileri ve skorları
    address: String,
    score: Number,
    weight: Number,
    metrics: { ... }
  }],
  compositeScore: Number,    // Toplam skor
  zScore: Number,            // Z-score
  percentile: Number,        // Yüzdelik dilim
  class: String,             // Segment sınıfı (A, B, C, D)
  insufficientData: Boolean, // Yetersiz veri durumu
  confidence: Number,        // Güven skoru (0-1)
  asOf: Date                 // Hesaplama tarihi
}
```

**Amaç:** Kullanıcının blockchain aktivitesine göre segment sınıflandırmasını saklar.

**Index:** `{ userId: 1, chain: 1, window: 1 }` - Unique composite index

---

### 4. **User Model (Referral İlişkisi)**
**Dosya:** `models/user.model.js`

```javascript
{
  // Referral alanları
  referralCode: String,           // Benzersiz referans kodu
  invitedBy: ObjectId,            // Davet eden kullanıcı
  invitedAt: Date,                // Davet tarihi
  invitees: [ObjectId],           // Davet edilen kullanıcılar
  referralRewards: Number,        // Toplam referral kazancı
  referralHistory: [{             // Referral geçmişi
    inviteeId: ObjectId,
    campaignId: ObjectId,
    bonus: Number,
    at: Date
  }]
}
```

**Kampanya İlişkisi:** 
- Kullanıcı kampanyayı tamamladığında davet eden kullanıcıya %3 bonus eklenir
- Bonus miktarı kullanıcının segmentine göre belirlenir

---

## 🏗️ VERİ AKIŞI VE MİMARİ

### Kampanya Oluşturma Akışı

```
1. Frontend Request
   ↓
2. Router (campaign.router.js)
   ├─ Authentication Middleware (authMiddleware)
   ├─ Role Middleware (requireAdminOrCustomer)
   └─ Validation (validateCreateCampaign)
   ↓
3. Controller (campaign.controller.js)
   └─ create()
   ↓
4. Service (campaign.service.js)
   └─ create()
   ↓
5. Model (campaign.model.js)
   ├─ Pre-save hooks çalışır
   ├─ Validation kontrolü
   └─ Database'e kayıt
   ↓
6. Response → Frontend
```

### Kampanyaya Katılım Akışı

```
1. Frontend Request (POST /campaigns/:id/join)
   ↓
2. Authentication & Authorization
   ↓
3. Controller → Service
   ↓
4. Service katılım kontrolü:
   ├─ Kampanya aktif mi?
   ├─ Kullanıcı zaten katılmış mı?
   ├─ Kullanıcı tamamlamış mı?
   ├─ Kontenjan dolu mu?
   └─ Admin ise kontenjan kontrolü atlanır
   ↓
5. UserProgress kaydı oluştur/güncelle
   ↓
6. CampaignParticipation kaydı oluştur
   ↓
7. Kullanıcının segmentini belirle (UserSegment)
   ↓
8. Campaign.currentParticipants güncelle
   ↓
9. Response → Frontend
```

### Quiz Tamamlama Akışı

```
1. Frontend Request (POST /campaigns/:id/complete)
   ↓
2. Service katılım kontrolü
   ↓
3. UserProgress güncelleme:
   ├─ completed = true
   ├─ completedAt = now
   └─ timeSpent güncelle
   ↓
4. CampaignParticipation güncelleme:
   ├─ status = "completed"
   └─ completedAt = now
   ↓
5. Referral Bonus Hesaplama:
   ├─ User invitedBy kontrolü
   ├─ UserSegment'ten segment sınıfı al
   ├─ Campaign rewards'tan ödül miktarı al
   ├─ %3 hesapla
   └─ inviter.referralRewards güncelle
   ↓
6. Response → Frontend
```

---

## 📂 DOSYA BAĞIMLILIKLARI

### Core Files (Temel Dosyalar)

#### 1. **Models (Veri Modelleri)**
```
models/
├── campaign.model.js              [Ana kampanya modeli - YENİ SEGMENT YAPISI]
├── campaignParticipation.model.js [Katılım takibi]
├── userProgress.model.js          [İlerleme takibi]
├── userSegment.model.js           [Segment sınıflandırması]
├── user.model.js                  [Kullanıcı ve referral]
└── questions.model.js             [Soru yönetimi]
```

**Bağımlılıklar:**
- `campaign.model.js` → Mongoose (ODM)
- `userSegment.model.js` → Segmentasyon servisi tarafından kullanılır
- `user.model.js` → Referral bonus hesaplamasında kullanılır

---

#### 2. **Services (İş Mantığı Katmanı)**
```
services/
├── campaign.service.js            [Kampanya CRUD ve mantık]
├── segmentation.service.js        [Segment hesaplama]
├── user.service.js                [Kullanıcı işlemleri]
└── questions.service.js           [Soru yönetimi]
```

**Bağımlılıklar:**
```javascript
// campaign.service.js
const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const CampaignParticipation = require("../models/campaignParticipation.model");
const UserSegment = require("../models/userSegment.model");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
```

---

#### 3. **Controllers (HTTP İstek Yöneticileri)**
```
controllers/
├── campaign.controller.js         [14 endpoint]
├── questions.controller.js        [Soru CRUD]
└── segments.controller.js         [Segment API]
```

**Endpoint Sayısı:**
- `create` - Kampanya oluşturma
- `getAll` - Tüm kampanyalar
- `getById` - Kampanya detayı
- `getUserProgress` - Kullanıcı ilerlemesi
- `joinCampaign` - Kampanyaya katılım
- `updateProgress` - İlerleme güncelleme
- `completeQuiz` - Quiz tamamlama
- `update` - Kampanya güncelleme
- `remove` - Kampanya silme (admin)
- `requestDelete` - Silme isteği (customer)
- `getByCustomer` - Müşteri kampanyaları
- `getDeleteRequests` - Silme istekleri
- `listCompletedUsers` - Tamamlayan kullanıcılar
- `updatePurchaseStatus` - Ödeme durumu
- `getUserSegmentEarningsAnalysis` - Kazanç analizi
- `getRewardStatus` - Ödül durumu

---

#### 4. **Validations (Veri Doğrulama)**
```
validations/
└── campaign.validation.js         [Joi validation schemas]
```

**Validation Schemas:**
```javascript
- createCampaignSchema       // Kampanya oluşturma
- updateCampaignSchema       // Kampanya güncelleme
- updateProgressSchema       // İlerleme güncelleme
- completeQuizSchema         // Quiz tamamlama
- validateUpdatePurchase     // Ödeme durumu
```

**Yeni Model İçin Eklenmesi Gerekenler:**
- Segment array validasyonu
- Filter schema validasyonu
- Chain enum validasyonu
- Transaction type validasyonu

---

#### 5. **Routers (URL Yönlendirme)**
```
routers/
├── campaign.router.js             [16 route]
├── questions.router.js            [Soru routes]
└── segments.router.js             [Segment routes]
```

---

#### 6. **Utilities (Yardımcı Fonksiyonlar)**
```
utils/
├── campaignUtils.js               [Kampanya yardımcı fonksiyonlar]
├── arkham.client.js               [Blockchain data client]
└── balanceFetcher.js              [Wallet balance fetcher]
```

**campaignUtils.js Fonksiyonları:**
```javascript
- updateExpiredCampaigns()        // Süresi dolmuş kampanyaları güncelle
- getActiveCampaigns()            // Aktif kampanyaları getir
- getUpcomingCampaigns()          // Yaklaşan kampanyaları getir
- checkAndUpdateCampaignStatus()  // Kampanya durumunu kontrol et
```

---

#### 7. **Scripts (Otomasyon ve Araçlar)**
```
scripts/
├── create_active_campaign.js     [Test kampanyası oluşturma]
├── add_campaign_data.js          [Örnek veri ekleme]
├── update_campaign_data.js       [Kampanya verileri güncelleme]
├── segments.cron.js              [Segment hesaplama cronjob]
└── segments.recompute.js         [Segment yeniden hesaplama]
```

---

#### 8. **Tests (Test Dosyaları)**
```
tests/
├── campaign_validation.test.js   [Validation testleri]
├── integration/
│   └── segmentation.int.test.js  [Segment entegrasyon testi]
test/
├── simple_campaign_test.js       [Basit kampanya testi]
├── create_segment_campaign.js    [Segment kampanya testi]
├── segment_earnings_test.js      [Kazanç analizi testi]
└── debug_user_progress.js        [Progress debug testi]
```

---

#### 9. **Documentation (Dokümantasyon)**
```
docs/
├── campaign_back_v1.md           [Backend API v1]
├── API_ENDPOINTS.md              [Tüm endpoint listesi]
├── SEGMENTATION_MODULE.md        [Segment modülü]
campaign_api_doc.md               [Kampanya API dokümantasyonu]
campaign_api_front.md             [Frontend API dokümantasyonu]
SEGMENT_EARNINGS_ANALYSIS.md     [Kazanç analizi dokümantasyonu]
```

---

## 🌐 API ENDPOINTS

### Public Endpoints (Authentication Gerektirmez)
Yok - Tüm kampanya endpoint'leri authentication gerektirir.

---

### Authenticated Endpoints

#### 1. **Kampanya Listeleme**
```http
GET /api/v1/campaigns/all
Authorization: Bearer <token>
```

**Response:**
- Admin: Tüm kampanyalar (isAdminAccept filtresiz)
- User/Customer: Sadece onaylanmış ve aktif kampanyalar

---

#### 2. **Kampanya Detayı**
```http
GET /api/v1/campaigns/:id
Authorization: Bearer <token>
```

---

#### 3. **Kampanya Oluşturma (Admin/Customer)**
```http
POST /api/v1/campaigns/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Blockchain Eğitimi",
  "description": "Detaylı açıklama",
  "content": [
    {
      "itemImage": "https://example.com/image.jpg",
      "itemTitle": "Bölüm 1",
      "itemDescription": "Açıklama",
      "itemIndex": 1
    }
  ],
  "segments": [
    {
      "name": "A",
      "reward": 1000,
      "maxParticipants": 100,
      "currentParticipants": 0,
      "description": "Premium segment",
      "filters": [
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
          }
        }
      ]
    }
  ],
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z",
  "questions": 5,
  "tags": ["blockchain", "defi"],
  "company_logo": "https://example.com/logo.png",
  "twitter_url": "https://twitter.com/company"
}
```

**Validation:**
- ✅ segments array minimum 1 eleman içermeli
- ✅ Her segment benzersiz name içermeli
- ✅ Her segment en az 1 filter içermeli
- ✅ chain enum değeri kontrol edilmeli

---

#### 4. **Kampanyaya Katılma**
```http
POST /api/v1/campaigns/:id/join
Authorization: Bearer <token>
```

**Kontroller:**
1. Kampanya aktif mi?
2. Kullanıcı daha önce katılmış mı?
3. Kullanıcı kampanyayı tamamlamış mı?
4. Kontenjan dolu mu?

**Segment Belirleme:**
```javascript
const userSegment = await UserSegment.findOne({
  userId,
  chain: "ethereum"
}).sort({ asOf: -1 });

const segmentClass = userSegment?.class || "D"; // Varsayılan D
```

**Katılımcı Sayısı Güncelleme:**
```javascript
campaign.currentParticipants[segmentClass] += 1;
campaign.participants = Object.values(campaign.currentParticipants).reduce((a,b) => a+b, 0);
```

---

#### 5. **Quiz Tamamlama**
```http
POST /api/v1/campaigns/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalTimeSpent": 183
}
```

**Referral Bonus Hesaplama:**
```javascript
const user = await User.findById(userId, "invitedBy");
const inviterId = user?.invitedBy;

if (inviterId) {
  const userSegment = await UserSegment.findOne({ userId, chain: "ethereum" });
  const segmentClass = userSegment?.class || "D";
  
  // Kampanyanın ilgili segment'indeki reward'ı al
  const segment = campaign.segments.find(s => s.name === segmentClass);
  const rewardAmount = segment?.reward || 0;
  
  const referralBonus = (rewardAmount * 0.03).toFixed(2);
  
  await User.findByIdAndUpdate(inviterId, {
    $inc: { referralRewards: referralBonus },
    $push: {
      referralHistory: {
        inviteeId: userId,
        campaignId,
        bonus: referralBonus,
        at: new Date()
      }
    }
  });
}
```

---

#### 6. **Segment Earnings Analysis**
```http
GET /api/v1/campaigns/user/segment-earnings-analysis
Authorization: Bearer <token>
```

**Response Structure:**
```json
{
  "userSegment": {
    "class": "A",
    "compositeScore": 85.5,
    "percentile": 92.3
  },
  "earnings": {
    "actualEarnings": 450,
    "potentialEarnings": 1200,
    "missedEarnings": 750,
    "completionRate": 37.5
  },
  "campaigns": {
    "completed": [...],
    "potential": [...],
    "inProgress": [...]
  }
}
```

---

## 🧩 SEGMENTAsyon ENTEGRASYONU

### Segment Hesaplama Süreci

**Dosya:** `services/segmentation.service.js`

#### 1. **Veri Toplama**
```javascript
async function fetchUserEthIntel(userId, windowDays = 90) {
  const wallets = await Wallet.find({ user: userId, network: "Ethereum" });
  
  for (const wallet of wallets) {
    const [txs, balances, labels] = await Promise.all([
      getEthTransactions(wallet.address),
      getEthBalances(wallet.address),
      getLabels(wallet.address)
    ]);
  }
}
```

#### 2. **Metrik Hesaplama**
```javascript
function computeWalletMetricsForOne({ txs, balances }) {
  return {
    volume: dexVolumeUsd,
    txCount,
    uniqueProtocols: uniqueProtocolsSet.size,
    balanceUsd,
    recency,
    nonCex: nonCexRatio,
    penalty
  };
}
```

#### 3. **Z-Score Normalizasyonu**
```javascript
function buildZScoredWalletScores(allWalletMetrics) {
  const score = 
    0.30 * zVolume +
    0.20 * zTxCount +
    0.15 * zUniqueProtocols +
    0.15 * zBalance +
    0.10 * zRecency +
    0.10 * zNonCex -
    penalty;
}
```

#### 4. **Segment Sınıflandırması**
```javascript
function assignSegmentsByZScore(userScores) {
  let klass = "D";
  if (zScore >= 1.0) klass = "A";
  else if (zScore >= 0.0) klass = "B";
  else if (zScore >= -1.0) klass = "C";
}
```

### Kampanya - Segment İlişkisi

**Filter Matching Mantığı:**
```javascript
// Örnek: A segmenti için ETH chain'de swap işlemi kriteri
{
  "name": "A",
  "filters": [
    {
      "field": "transaction_activity",
      "chain": "ETH",
      "tx_types": {
        "state": "and",
        "types": [
          {
            "name": "swap",
            "min_value": 1000,  // Min $1000 değerinde
            "min_count": 10      // En az 10 işlem
          }
        ]
      }
    }
  ]
}
```

**Kullanıcı Uygunluk Kontrolü:**
```javascript
async function checkUserEligibility(userId, segment) {
  const userSegment = await UserSegment.findOne({ userId, chain: "ethereum" });
  
  for (const filter of segment.filters) {
    // Chain kontrolü
    if (filter.chain !== userSegment.chain) continue;
    
    // Transaction type kontrolü
    const userTxs = await getEthTransactions(userWallets);
    const swapTxs = userTxs.filter(tx => tx.type === 'swap');
    
    const totalValue = swapTxs.reduce((sum, tx) => sum + tx.value, 0);
    const count = swapTxs.length;
    
    if (totalValue >= filter.tx_types.types[0].min_value && 
        count >= filter.tx_types.types[0].min_count) {
      return true;
    }
  }
  
  return false;
}
```

---

## 🎁 REFERRAL SİSTEMİ

### Referral Code Oluşturma

**Dosya:** `models/user.model.js`

```javascript
userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    const userIdStr = this._id.toString();
    this.referralCode = userIdStr.slice(-8).toUpperCase();
  }
  next();
});
```

**Örnek:** 
- User ID: `686a80ad4df8b694b1e90140`
- Referral Code: `1E90140`

---

### Davet Sistemi

**Kayıt Sırasında:**
```javascript
// User signup isteğinde
{
  "email": "newuser@example.com",
  "password": "password123",
  "referralCode": "1E90140"  // Davet kodu
}

// Service katmanında
const inviter = await User.findOne({ referralCode: body.referralCode });
if (inviter) {
  newUser.invitedBy = inviter._id;
  newUser.invitedAt = new Date();
  
  await User.findByIdAndUpdate(inviter._id, {
    $push: { invitees: newUser._id }
  });
}
```

---

### Bonus Hesaplama

**Quiz Tamamlama Sonrası:**
```javascript
// campaign.service.js - completeQuiz()

const user = await User.findById(userId, "invitedBy");
const inviterId = user?.invitedBy;

if (inviterId) {
  const userSegment = await UserSegment.findOne({ userId, chain: "ethereum" });
  const segmentClass = userSegment?.class || "D";
  
  // Kullanıcının segmentine göre reward bulma
  const segment = campaign.segments.find(s => s.name === segmentClass);
  let rewardAmount = segment?.reward || 0;
  
  // %3 bonus hesaplama
  const referralBonus = Number((rewardAmount * 0.03).toFixed(2));
  
  if (referralBonus > 0) {
    await User.findByIdAndUpdate(inviterId, {
      $inc: { referralRewards: referralBonus },
      $push: {
        referralHistory: {
          inviteeId: userId,
          campaignId,
          bonus: referralBonus,
          at: new Date()
        }
      }
    });
  }
}
```

**Bonus Hesaplama Örnekleri:**

| Segment | Reward | Bonus (%3) |
|---------|--------|------------|
| A       | 1000   | 30.00      |
| B       | 750    | 22.50      |
| C       | 500    | 15.00      |
| D       | 250    | 7.50       |

---

## 🔧 UTILITY FUNCTIONS

### campaignUtils.js

#### 1. **Süresi Dolmuş Kampanyaları Güncelleme**
```javascript
exports.updateExpiredCampaigns = async () => {
  const now = new Date();
  
  const result = await Campaign.updateMany(
    { 
      endDate: { $lt: now },
      status: { $ne: 'expired' }
    },
    { 
      status: 'expired',
      isActive: false
    }
  );
  
  console.log(`✅ ${result.modifiedCount} kampanya süresi doldu`);
};
```

**Kullanım:** Cronjob ile günlük çalıştırılabilir.

---

#### 2. **Aktif Kampanyaları Getirme**
```javascript
exports.getActiveCampaigns = async () => {
  const now = new Date();
  
  return await Campaign.find({
    status: 'active',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gt: now }
  }).populate('createdUserId', 'name email');
};
```

---

#### 3. **Kampanya Durum Kontrolü**
```javascript
exports.checkAndUpdateCampaignStatus = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId);
  const now = new Date();
  
  if (campaign.endDate < now) {
    campaign.status = 'expired';
    campaign.isActive = false;
  } else if (campaign.startDate <= now && campaign.endDate > now) {
    campaign.status = 'active';
  } else if (campaign.startDate > now) {
    campaign.status = 'upcoming';
  }
  
  await campaign.save();
};
```

---

## 🤖 SCRIPTS VE TOOLLAR

### 1. **create_active_campaign.js**
**Amaç:** Test amaçlı aktif kampanya oluşturma

```bash
node scripts/create_active_campaign.js
```

**Özellikler:**
- Admin token ile otomatik kampanya oluşturma
- Bugünden başlayıp 7 gün süren kampanya
- Varsayılan segment yapısı

---

### 2. **add_campaign_data.js**
**Amaç:** Örnek kampanya ve soru verileri ekleme

```bash
node scripts/add_campaign_data.js
```

**İçerik:**
- 4 farklı kategoride kampanya
- Her kampanya için 5-7 soru
- Segment bazlı reward yapıları

---

### 3. **segments.cron.js**
**Amaç:** Periyodik segment yeniden hesaplama

```bash
node scripts/segments.cron.js
```

**Çalışma Mantığı:**
- Tüm kullanıcılar için segment hesaplama
- 90 günlük pencere
- UserSegment koleksiyonunu güncelleme

---

### 4. **segments.recompute.js**
**Amaç:** Manuel segment yeniden hesaplama

```bash
node scripts/segments.recompute.js
```

---

## 🧪 TEST ALTYAPISI

### Test Kategorileri

#### 1. **Unit Tests**
```
tests/unit/
├── models/
│   └── user.model.test.js
└── services/
    └── user.service.test.js
```

---

#### 2. **Integration Tests**
```
tests/integration/
├── api/
│   └── user.api.test.js
└── segmentation.int.test.js
```

---

#### 3. **Manual Tests**
```
test/
├── simple_campaign_test.js
├── create_segment_campaign.js
├── segment_earnings_test.js
└── debug_user_progress.js
```

### Test Senaryoları

#### Segment Earnings Test
**Dosya:** `test/segment_earnings_test.js`

```javascript
async function testSegmentEarningsAnalysis() {
  // 1. Login
  const loginResponse = await axios.post('/auth/login', testUser);
  const token = loginResponse.data.data.token;
  
  // 2. Segment earnings analysis
  const analysisResponse = await axios.get(
    '/campaigns/user/segment-earnings-analysis',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // 3. Sonuçları göster
  console.log(`Segment: ${data.userSegment.class}`);
  console.log(`Gerçek Kazanç: ${data.earnings.actualEarnings}`);
  console.log(`Potansiyel Kazanç: ${data.earnings.potentialEarnings}`);
}
```

---

## 🔄 DEĞİŞİKLİK GEREKSİNİMLERİ

### Yeni Kampanya Modeline Geçiş İçin Yapılması Gerekenler

#### 1. **Model Güncellemesi** ✅ TAMAMLANDI
- [x] Filter schema eklendi
- [x] Segment schema eklendi
- [x] Validation kuralları eklendi
- [x] Pre-save hooks güncellendi

---

#### 2. **Validation Güncellemesi** ⚠️ GEREKLİ

**Dosya:** `validations/campaign.validation.js`

```javascript
// EKLENECEK:
const filterSchema = Joi.object({
  field: Joi.string().required(),
  chain: Joi.string().valid('ETH', 'BNB', 'ARB', 'ETC').required(),
  tx_types: Joi.object({
    state: Joi.string().valid('and', 'or').required(),
    types: Joi.array().items(
      Joi.object({
        name: Joi.string().valid('bridge', 'lending', 'swap', 'other').required(),
        min_value: Joi.number().min(0).default(0),
        min_count: Joi.number().min(0).default(0)
      })
    )
  }),
  token_types: Joi.object({
    state: Joi.string().valid('and', 'or').required(),
    types: Joi.array().items(
      Joi.object({
        name: Joi.string().valid('meme', 'ai', 'stable').required(),
        min_value: Joi.number().min(0).default(0),
        min_count: Joi.number().min(0).default(0)
      })
    )
  })
});

const segmentSchema = Joi.object({
  name: Joi.string().uppercase().required(),
  reward: Joi.number().min(0).required(),
  maxParticipants: Joi.number().min(0).required(),
  currentParticipants: Joi.number().min(0).default(0),
  description: Joi.string().max(500).allow(''),
  filters: Joi.array().items(filterSchema).min(1).required()
});

// createCampaignSchema'ya ekle:
segments: Joi.array().items(segmentSchema).min(1).required()
```

---

#### 3. **Service Katmanı Güncellemesi** ⚠️ GEREKLİ

**Dosya:** `services/campaign.service.js`

**Değiştirilecek Fonksiyonlar:**

##### a) `create()` Fonksiyonu
```javascript
// ESKİ:
const campaign = new Campaign({
  // ...
  rewards: { A: 100, B: 75, C: 50, D: 25 }
});

// YENİ:
const campaign = new Campaign({
  // ...
  segments: req.body.segments  // Frontend'den gelen segment array'i
});
```

##### b) `joinCampaign()` Fonksiyonu
```javascript
// ESKİ:
const userSegment = "D"; // Sabit

// YENİ:
const userSegmentDoc = await UserSegment.findOne({ 
  userId, 
  chain: "ethereum" 
}).sort({ asOf: -1 });

const userSegmentClass = userSegmentDoc?.class || "D";

// Segment kontenjan kontrolü
const segment = campaign.segments.find(s => s.name === userSegmentClass);
if (!segment) {
  throw new Error("Segment bulunamadı");
}

if (segment.currentParticipants >= segment.maxParticipants) {
  throw new Error("Bu segment için kontenjan dolu");
}

// Segment katılımcı sayısını artır
segment.currentParticipants += 1;
await campaign.save();
```

##### c) `completeQuiz()` Fonksiyonu
```javascript
// ESKİ:
let rewardAmount = Number(campaign?.rewards?.[segmentClass]);

// YENİ:
const segment = campaign.segments.find(s => s.name === segmentClass);
let rewardAmount = Number(segment?.reward || 0);
```

##### d) `getUserSegmentEarningsAnalysis()` Fonksiyonu
```javascript
// Potansiyel kazanç hesaplama güncellenmeli
for (const campaign of userSegmentCampaigns) {
  const segment = campaign.segments.find(s => s.name === userSegmentClass);
  
  if (segment && segment.maxParticipants > 0) {
    potentialEarnings += segment.reward;
    potentialCampaignDetails.push({
      campaignId: campaign._id,
      title: campaign.title,
      reward: segment.reward,
      segmentMaxParticipants: segment.maxParticipants,
      segmentCurrentParticipants: segment.currentParticipants,
      endDate: campaign.endDate
    });
  }
}
```

##### e) `listCompletedUsers()` Fonksiyonu
```javascript
// Segment reward hesaplama
const segment = p.campaignId.segments.find(s => s.name === segmentClass);
const segmentReward = segment?.reward || 0;

results.push({
  // ...
  segment: segmentClass,
  reward: segmentReward,
  segmentReward: segmentReward
});
```

##### f) `getRewardStatus()` Fonksiyonu
```javascript
// ESKİ:
return {
  rewardQuotas: campaign.maxParticipants,
  currentWinners: campaign.currentParticipants
};

// YENİ:
const segmentStatus = campaign.segments.map(segment => ({
  name: segment.name,
  reward: segment.reward,
  maxParticipants: segment.maxParticipants,
  currentParticipants: segment.currentParticipants,
  availableSlots: segment.maxParticipants - segment.currentParticipants
}));

return {
  segments: segmentStatus,
  totalMaxParticipants: campaign.segments.reduce((sum, s) => sum + s.maxParticipants, 0),
  totalCurrentParticipants: campaign.segments.reduce((sum, s) => sum + s.currentParticipants, 0)
};
```

---

#### 4. **Frontend Entegrasyon** ⚠️ GEREKLİ

**Kampanya Oluşturma Formu:**
```javascript
// Segment builder UI
const [segments, setSegments] = useState([
  {
    name: 'A',
    reward: 1000,
    maxParticipants: 100,
    currentParticipants: 0,
    description: '',
    filters: [
      {
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
      }
    ]
  }
]);

// Segment ekleme fonksiyonu
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

// Filter ekleme fonksiyonu
const addFilter = (segmentIndex) => {
  const newSegments = [...segments];
  newSegments[segmentIndex].filters.push({
    field: '',
    chain: 'ETH',
    tx_types: { state: 'and', types: [] },
    token_types: { state: 'and', types: [] }
  });
  setSegments(newSegments);
};
```

**Kampanya Görüntüleme:**
```javascript
// Segment bazlı bilgi gösterimi
{campaign.segments.map((segment, index) => (
  <div key={index} className="segment-card">
    <h3>Segment {segment.name}</h3>
    <p>Ödül: {segment.reward}</p>
    <p>Kontenjan: {segment.currentParticipants}/{segment.maxParticipants}</p>
    
    {/* Kullanıcının bu segmente uygun olup olmadığını göster */}
    {userSegment === segment.name && (
      <Badge color="green">Bu segment sizin için uygun!</Badge>
    )}
  </div>
))}
```

---

#### 5. **Migration Script** ⚠️ GEREKLİ

**Dosya:** `scripts/migrate_campaigns_to_segments.js`

```javascript
const mongoose = require('mongoose');
const Campaign = require('../models/campaign.model');

async function migrateCampaigns() {
  console.log('🔄 Kampanya migrasyonu başlıyor...');
  
  const campaigns = await Campaign.find();
  
  for (const campaign of campaigns) {
    // Eski rewards yapısını yeni segment yapısına dönüştür
    if (campaign.rewards && !campaign.segments) {
      const segments = Object.entries(campaign.rewards).map(([name, reward]) => ({
        name,
        reward,
        maxParticipants: campaign.maxParticipants?.[name] || 0,
        currentParticipants: campaign.currentParticipants?.[name] || 0,
        description: `${name} segment`,
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
      }));
      
      campaign.segments = segments;
      
      // Eski alanları sil (opsiyonel)
      campaign.rewards = undefined;
      
      await campaign.save();
      console.log(`✅ ${campaign.title} güncellendi`);
    }
  }
  
  console.log('🎉 Migrasyon tamamlandı!');
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => migrateCampaigns())
  .then(() => mongoose.disconnect());
```

**Çalıştırma:**
```bash
node scripts/migrate_campaigns_to_segments.js
```

---

#### 6. **Database Index Güncellemesi** ⚠️ GEREKLİ

```javascript
// campaign.model.js

// Segment name için index
campaignSchema.index({ "segments.name": 1 });

// Segment filters için index
campaignSchema.index({ "segments.filters.chain": 1 });

// Aktif kampanyalar ve segment filtreleme için compound index
campaignSchema.index({ 
  status: 1, 
  isActive: 1, 
  isAdminAccept: 1,
  "segments.name": 1 
});
```

---

#### 7. **API Dokümantasyon Güncellemesi** ⚠️ GEREKLİ

**Güncellenecek Dosyalar:**
- `campaign_api_doc.md`
- `docs/campaign_back_v1.md`
- `docs/API_ENDPOINTS.md`

**Eklenecek Bölümler:**
- Segment schema açıklaması
- Filter yapısı detayları
- Segment bazlı kontenjan sistemi
- Örnek request/response'lar

---

## 📊 VERİ AKIŞ DİYAGRAMLARI

### Kampanya Oluşturma
```
┌─────────────┐
│  Frontend   │
│  (Customer/ │
│   Admin)    │
└──────┬──────┘
       │ POST /campaigns/create
       │ {
       │   segments: [...],
       │   ...
       │ }
       ↓
┌──────────────────────┐
│  campaign.router.js  │
│  - authMiddleware    │
│  - roleMiddleware    │
│  - validation        │
└──────┬───────────────┘
       ↓
┌───────────────────────┐
│ campaign.controller   │
│ .create()             │
└──────┬────────────────┘
       ↓
┌───────────────────────┐
│ campaign.service      │
│ .create()             │
│ - Segment validation  │
│ - Filter validation   │
│ - isAdminAccept set   │
└──────┬────────────────┘
       ↓
┌───────────────────────┐
│  campaign.model.js    │
│  - Pre-save hooks     │
│  - Segment uniqueness │
│  - Status calculation │
└──────┬────────────────┘
       ↓
┌───────────────────────┐
│    MongoDB            │
│  campaigns collection │
└───────────────────────┘
```

### Kampanyaya Katılım
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ POST /campaigns/:id/join
       ↓
┌──────────────────────┐
│  Service Layer       │
│  1. Katılım kontrolü │
│  2. Tamamlanma       │
│  3. Kontenjan        │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│  UserSegment Query   │
│  - Find user segment │
│  - Get class (A/B/C/D)│
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│  Segment Matching    │
│  - Find campaign seg │
│  - Check quota       │
│  - Check filters     │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│  Update Records      │
│  1. UserProgress     │
│  2. Participation    │
│  3. Campaign counter │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│  Response            │
│  - Success message   │
│  - Segment info      │
│  - Reward info       │
└──────────────────────┘
```

### Quiz Tamamlama ve Referral
```
┌─────────────┐
│   User      │
│ Complete    │
│   Quiz      │
└──────┬──────┘
       │ POST /campaigns/:id/complete
       ↓
┌────────────────────────┐
│  Update UserProgress   │
│  - completed: true     │
│  - completedAt: now    │
└──────┬─────────────────┘
       ↓
┌────────────────────────┐
│  Get User Segment      │
│  - Query UserSegment   │
│  - Get class           │
└──────┬─────────────────┘
       ↓
┌────────────────────────┐
│  Find Campaign Segment │
│  - Match by class      │
│  - Get reward amount   │
└──────┬─────────────────┘
       ↓
┌────────────────────────┐
│  Check Referral        │
│  - user.invitedBy?     │
└──────┬─────────────────┘
       │ Yes
       ↓
┌────────────────────────┐
│  Calculate Bonus       │
│  - reward * 3%         │
│  - Round to 2 decimal  │
└──────┬─────────────────┘
       ↓
┌────────────────────────┐
│  Update Inviter        │
│  - $inc referralRewards│
│  - $push history       │
└──────┬─────────────────┘
       ↓
┌────────────────────────┐
│  Response              │
│  - Completion info     │
│  - Reward earned       │
└────────────────────────┘
```

---

## 🎯 ÖNERİLER VE EN İYİ PRATİKLER

### 1. **Segment Yönetimi**
- Her kampanya için en az 1 segment tanımlanmalı
- Segment isimleri benzersiz olmalı
- Default segment (D) her zaman bulunmalı

### 2. **Filter Tasarımı**
- Filter kriterlerini çok karmaşık yapmayın
- `and` operatörü tercih edilmeli (daha kesin sonuç)
- Min value ve count değerleri makul olmalı

### 3. **Kontenjan Yönetimi**
- Segment kontenjanları toplam hedef kullanıcı sayısına göre ayarlanmalı
- Premium segmentler (A, B) için daha düşük kontenjan
- Kontenjan dolduğunda otomatik bildirim sistemi

### 4. **Performance**
- Segment hesaplama cronjob ile günlük çalıştırılmalı
- Campaign queries için index kullanımı
- Populate işlemlerini minimize edin

### 5. **Security**
- Admin approval mecburi olmalı
- Rate limiting uygulanmalı
- Input validation katı olmalı

---

## 📝 SONUÇ

Bu dokümantasyon, kampanya modülünün **mevcut durumunu** ve **yeni segment-based yapısını** detaylı olarak açıklamaktadır. 

### Yapılması Gerekenler Özet:
1. ✅ Model güncellendi
2. ⚠️ Validation güncellemesi gerekli
3. ⚠️ Service katmanı güncellemesi gerekli
4. ⚠️ Frontend entegrasyonu gerekli
5. ⚠️ Migration script gerekli
6. ⚠️ Index güncellemesi gerekli
7. ⚠️ Dokümantasyon güncellemesi gerekli

### Tahmini Süre:
- Backend güncellemeleri: 2-3 gün
- Frontend entegrasyonu: 3-4 gün
- Test ve debug: 2-3 gün
- **Toplam:** 7-10 gün

---

**Hazırlayan:** AI Assistant  
**Tarih:** 15 Ekim 2025  
**Versiyon:** 3.0.0


