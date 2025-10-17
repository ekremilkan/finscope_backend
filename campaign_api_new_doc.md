# 📚 Campaign API - Frontend Developer Documentation (v2.0)

> **Son Güncelleme:** 15 Ekim 2025  
> **Versiyon:** 2.0 (Segment-Based Architecture)  
> **Base URL:** `/api/v1/campaigns`

---

## 🔄 ÖNEMLİ DEĞİŞİKLİKLER (v1 → v2)

### ❌ Kaldırılan Alanlar:
- `rewards` (Object: {A, B, C, D})
- `maxParticipants` (Object: {A, B, C, D})
- `currentParticipants` (Object: {A, B, C, D})
- `maxTotalParticipants` (Number)

### ✅ Yeni Alanlar:
- `segments` (Array): Her segment kendi reward, maxParticipants ve filters'a sahip
- Her segment'te `filters` array'i (chain, tx_types, token_types)

---

## 🎯 YENİ SEGMENT YAPISI

### Segment Nedir?

Her kampanya artık birden fazla **segment** içerir. Her segment:
- Belirli kullanıcı gruplarını hedefler (filtreler ile)
- Kendi ödül miktarına sahiptir
- Kendi kontenjanına sahiptir
- Kendi filtreleme kriterlerine sahiptir

### Segment Yapısı:

```typescript
interface Segment {
  name: string;                    // Segment adı (örn: "PREMIUM", "GOLD", "BASIC")
  reward: number;                  // Bu segment için ödül miktarı
  maxParticipants: number;         // Maksimum katılımcı sayısı
  currentParticipants: number;     // Mevcut katılımcı sayısı (otomatik güncellenir)
  description?: string;            // Segment açıklaması (opsiyonel)
  filters: Filter[];               // Filtreleme kriterleri
}

interface Filter {
  field: string;                   // Filtre alanı (örn: "transaction_activity")
  chain: 'ETH' | 'BNB' | 'ARB' | 'ETC';  // Blockchain
  tx_types?: {
    state: 'and' | 'or';
    types: Array<{
      name: 'bridge' | 'lending' | 'swap' | 'other';
      min_value: number;
      min_count: number;
    }>;
  };
  token_types?: {
    state: 'and' | 'or';
    types: Array<{
      name: 'meme' | 'ai' | 'stable' | 'defi' | 'nft';
      min_value: number;
      min_count: number;
    }>;
  };
}
```

---

## 🔐 Authentication

Tüm endpoint'ler **JWT token** gerektirir.

### Header:
```http
Authorization: Bearer <your-jwt-token>
```

### Roller:
- **admin**: Tüm işlemlere erişim
- **customer**: Kampanya oluşturma ve kendi kampanyalarını yönetme
- **user**: Kampanyalara katılma ve görüntüleme

---

## 📋 ENDPOINT LİSTESİ

| Method | Endpoint | Rol | Açıklama |
|--------|----------|-----|----------|
| POST | `/create` | admin/customer | Yeni kampanya oluştur |
| GET | `/all` | all | Tüm kampanyaları listele |
| GET | `/:id` | all | Kampanya detayı |
| GET | `/:id/user-progress` | all | Kullanıcının kampanya ilerlemesi |
| POST | `/:id/join` | all | Kampanyaya katıl |
| PUT | `/:id/progress` | all | Quiz ilerlemesini güncelle |
| POST | `/:id/complete` | all | Quiz'i tamamla |
| PUT | `/:id` | admin/customer | Kampanyayı güncelle |
| DELETE | `/:id/request-delete` | admin/customer | Silme isteği |
| DELETE | `/:id` | admin | Kampanyayı sil (kalıcı) |
| GET | `/customer/list` | customer | Kendi kampanyalarını listele |
| GET | `/admin/delete-requests` | admin | Silme isteklerini listele |
| GET | `/admin/completed-users` | admin | Tamamlayan kullanıcıları listele |
| PATCH | `/admin/completed-users/:userId/:campaignId/purchase` | admin | Purchase durumu güncelle |
| GET | `/user/segment-earnings-analysis` | all | Kazanç analizi |
| GET | `/:id/reward-status` | all | Segment kontenjan durumu |

---

## 📝 DETAYLI ENDPOINT DOKÜMANTASYONU

---

### 1. 🆕 Kampanya Oluştur

**Endpoint:** `POST /api/v1/campaigns/create`  
**Rol:** `admin` veya `customer`  
**Açıklama:** Yeni bir kampanya oluşturur.

#### Request Body:

```json
{
  "title": "Defi Warriors Campaign",
  "description": "Join and win rewards based on your activity",
  "content": [
    {
      "itemImage": "https://example.com/image1.jpg",
      "itemVideo": "https://example.com/video1.mp4",
      "itemTitle": "Step 1: Connect Wallet",
      "itemDescription": "Connect your Ethereum wallet",
      "itemIndex": 0
    }
  ],
  "segments": [
    {
      "name": "PREMIUM",
      "reward": 1000,
      "maxParticipants": 100,
      "description": "Premium tier for high-activity users",
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
              },
              {
                "name": "lending",
                "min_value": 5000,
                "min_count": 5
              }
            ]
          },
          "token_types": {
            "state": "or",
            "types": [
              {
                "name": "defi",
                "min_value": 100,
                "min_count": 3
              }
            ]
          }
        }
      ]
    },
    {
      "name": "BASIC",
      "reward": 100,
      "maxParticipants": 1000,
      "description": "Basic tier for all users",
      "filters": [
        {
          "field": "basic",
          "chain": "ETH",
          "tx_types": {
            "state": "and",
            "types": []
          },
          "token_types": {
            "state": "and",
            "types": []
          }
        }
      ]
    }
  ],
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-30T23:59:59.000Z",
  "questions": 5,
  "questionIds": ["67123abc...", "67123def..."],
  "tags": ["defi", "ethereum", "trading"],
  "company_logo": "https://example.com/logo.png",
  "twitter_url": "https://twitter.com/company"
}
```

#### Response (Success - 201):

```json
{
  "success": true,
  "error": false,
  "message": "Kampanya başarıyla oluşturuldu",
  "code": 201,
  "isAdmin": true,
  "isAdminAccept": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Defi Warriors Campaign",
    "description": "Join and win rewards based on your activity",
    "segments": [
      {
        "_id": "671234567890abcdef123457",
        "name": "PREMIUM",
        "reward": 1000,
        "maxParticipants": 100,
        "currentParticipants": 0,
        "description": "Premium tier for high-activity users",
        "filters": [...],
        "createdAt": "2025-10-15T10:00:00.000Z",
        "updatedAt": "2025-10-15T10:00:00.000Z"
      },
      {
        "_id": "671234567890abcdef123458",
        "name": "BASIC",
        "reward": 100,
        "maxParticipants": 1000,
        "currentParticipants": 0,
        "description": "Basic tier for all users",
        "filters": [...],
        "createdAt": "2025-10-15T10:00:00.000Z",
        "updatedAt": "2025-10-15T10:00:00.000Z"
      }
    ],
    "status": "upcoming",
    "isActive": true,
    "isAdminAccept": true,
    "createdUserId": "670123456789abcdef654321",
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
}
```

#### Validation Kuralları:

- ✅ `title`: Zorunlu, max 100 karakter
- ✅ `description`: Zorunlu, max 500 karakter
- ✅ `segments`: Zorunlu, en az 1 segment olmalı
- ✅ `segments[].name`: Zorunlu, benzersiz olmalı, büyük harfe çevrilir
- ✅ `segments[].reward`: Zorunlu, >= 0
- ✅ `segments[].maxParticipants`: Zorunlu, >= 0
- ✅ `segments[].filters`: Zorunlu, en az 1 filter olmalı
- ✅ `startDate`: Zorunlu
- ✅ `endDate`: Zorunlu, startDate'den sonra olmalı
- ✅ `company_logo`: Zorunlu, geçerli URL veya base64
- ✅ `twitter_url`: Zorunlu, geçerli Twitter/X URL

#### Hata Örnekleri:

```json
// 400 - Validation Error
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "code": 400,
  "errors": [
    "Kampanya en az bir segment içermelidir",
    "Her segment en az bir filtre içermelidir"
  ]
}

// 403 - Forbidden
{
  "success": false,
  "error": true,
  "message": "Bu işlem için yetkiniz yok",
  "code": 403
}
```

---

### 2. 📋 Tüm Kampanyaları Listele

**Endpoint:** `GET /api/v1/campaigns/all`  
**Rol:** `all` (authenticated)  
**Açıklama:** Tüm kampanyaları listeler. Admin tümünü, diğer roller sadece onaylanmış kampanyaları görür.

#### Query Parameters:

```
Yok
```

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Kampanyalar başarıyla getirildi",
  "code": 200,
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "title": "Defi Warriors Campaign",
      "description": "Join and win rewards",
      "segments": [
        {
          "name": "PREMIUM",
          "reward": 1000,
          "maxParticipants": 100,
          "currentParticipants": 15,
          "description": "Premium tier"
        },
        {
          "name": "BASIC",
          "reward": 100,
          "maxParticipants": 1000,
          "currentParticipants": 234
        }
      ],
      "status": "active",
      "isActive": true,
      "isAdminAccept": true,
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": "2025-11-30T23:59:59.000Z",
      "company_logo": "https://example.com/logo.png",
      "twitter_url": "https://twitter.com/company",
      "tags": ["defi", "ethereum"],
      "createdAt": "2025-10-15T10:00:00.000Z"
    }
  ]
}
```

---

### 3. 🔍 Kampanya Detayı

**Endpoint:** `GET /api/v1/campaigns/:id`  
**Rol:** `all` (authenticated)  
**Açıklama:** Belirli bir kampanyanın detaylarını getirir.

#### URL Parameters:

```
:id - Campaign ID (MongoDB ObjectId)
```

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Kampanya başarıyla getirildi",
  "code": 200,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Defi Warriors Campaign",
    "description": "Join and win rewards based on your activity",
    "content": [
      {
        "itemImage": "https://example.com/image1.jpg",
        "itemVideo": "",
        "itemTitle": "Step 1",
        "itemDescription": "Connect wallet",
        "itemIndex": 0
      }
    ],
    "segments": [
      {
        "_id": "671234567890abcdef123457",
        "name": "PREMIUM",
        "reward": 1000,
        "maxParticipants": 100,
        "currentParticipants": 15,
        "description": "Premium tier for high-activity users",
        "filters": [
          {
            "_id": "671234567890abcdef123459",
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
              "state": "or",
              "types": []
            }
          }
        ],
        "createdAt": "2025-10-15T10:00:00.000Z",
        "updatedAt": "2025-10-15T10:15:00.000Z"
      }
    ],
    "status": "active",
    "isActive": true,
    "isAdminAccept": true,
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-30T23:59:59.000Z",
    "questions": 5,
    "questionIds": ["67123abc...", "67123def..."],
    "tags": ["defi", "ethereum", "trading"],
    "company_logo": "https://example.com/logo.png",
    "twitter_url": "https://twitter.com/company",
    "createdUserId": "670123456789abcdef654321",
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:15:00.000Z"
  }
}
```

#### Hata:

```json
// 404 - Not Found
{
  "success": false,
  "error": true,
  "message": "Campaign not found.",
  "code": 404
}
```

---

### 4. 🎮 Kampanyaya Katıl

**Endpoint:** `POST /api/v1/campaigns/:id/join`  
**Rol:** `all` (authenticated)  
**Açıklama:** Kullanıcı kampanyaya katılır. Kullanıcının segmenti otomatik belirlenir ve ilgili segment'in kontenjanı kontrol edilir.

#### URL Parameters:

```
:id - Campaign ID
```

#### Request Body:

```json
{}
// Boş body gönderilir
```

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Successfully joined/continued the campaign.",
  "code": 200,
  "data": {
    "campaignId": "671234567890abcdef123456",
    "userId": "670123456789abcdef654321",
    "joined": true,
    "segment": "PREMIUM",
    "segmentQuota": {
      "current": 16,
      "max": 100,
      "available": 84
    },
    "reward": 1000
  }
}
```

#### Önemli Notlar:

- 🔹 Kullanıcının segmenti `UserSegment` koleksiyonundan otomatik belirlenir
- 🔹 Segment bulunamazsa varsayılan olarak "D" segmenti kullanılır
- 🔹 İlgili segment'in kontenjanı doluysa hata döner
- 🔹 Admin kullanıcılar kontenjan kontrolünden muaftır
- 🔹 Daha önce katıldıysa progress sıfırlanır, kontenjan artmaz

#### Hata Örnekleri:

```json
// 400 - Campaign not active
{
  "success": false,
  "error": true,
  "message": "This campaign is not active.",
  "code": 400
}

// 400 - Already completed
{
  "success": false,
  "error": true,
  "message": "You have already completed this campaign.",
  "code": 400
}

// 400 - Segment quota full
{
  "success": false,
  "error": true,
  "message": "The quota for segment PREMIUM is full.",
  "code": 400
}

// 400 - Segment not found
{
  "success": false,
  "error": true,
  "message": "Segment PREMIUM not found in this campaign.",
  "code": 400
}
```

---

### 5. 📊 Kullanıcı İlerlemesini Getir

**Endpoint:** `GET /api/v1/campaigns/:id/user-progress`  
**Rol:** `all` (authenticated)  
**Açıklama:** Kullanıcının kampanyadaki ilerlemesini getirir.

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "User progress retrieved successfully",
  "code": 200,
  "data": {
    "_id": "671234567890abcdef123999",
    "userId": "670123456789abcdef654321",
    "campaignId": "671234567890abcdef123456",
    "joined": true,
    "completed": false,
    "timeSpent": 120,
    "startedAt": "2025-10-15T11:00:00.000Z",
    "completedAt": null,
    "isPurchase": false,
    "createdAt": "2025-10-15T11:00:00.000Z",
    "updatedAt": "2025-10-15T11:02:00.000Z"
  }
}
```

---

### 6. ✏️ Quiz İlerlemesini Güncelle

**Endpoint:** `PUT /api/v1/campaigns/:id/progress`  
**Rol:** `all` (authenticated)  
**Açıklama:** Quiz'deki ilerlemeyi günceller (soru cevaplandığında).

#### Request Body:

```json
{
  "questionId": "67123abc...",
  "selectedAnswer": 2,
  "isCorrect": true,
  "timeSpent": 15,
  "completed": false
}
```

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Progress updated successfully",
  "code": 200,
  "data": {
    "_id": "671234567890abcdef123999",
    "userId": "670123456789abcdef654321",
    "campaignId": "671234567890abcdef123456",
    "joined": true,
    "completed": false,
    "timeSpent": 135,
    "updatedAt": "2025-10-15T11:02:15.000Z"
  }
}
```

---

### 7. ✅ Quiz'i Tamamla

**Endpoint:** `POST /api/v1/campaigns/:id/complete`  
**Rol:** `all` (authenticated)  
**Açıklama:** Quiz'i tamamlar ve ödül hesaplar. Referral bonusu varsa davet eden kullanıcıya %3 bonus verir.

#### Request Body:

```json
{
  "totalTimeSpent": 300
}
```

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Quiz completed successfully",
  "code": 200,
  "data": {
    "campaignId": "671234567890abcdef123456",
    "userId": "670123456789abcdef654321",
    "completed": true,
    "completedAt": "2025-10-15T11:05:00.000Z",
    "totalTimeSpent": 300
  }
}
```

#### Otomatik İşlemler:

- ✅ UserProgress `completed: true` olarak güncellenir
- ✅ CampaignParticipation `status: completed` olarak güncellenir
- ✅ Kullanıcının segmentine göre reward hesaplanır
- ✅ Davet eden kullanıcı varsa %3 referral bonus eklenir
- ✅ Referral history'e kayıt eklenir

#### Hata:

```json
// 400 - Not joined
{
  "success": false,
  "error": true,
  "message": "You have not joined this campaign.",
  "code": 400
}

// 400 - Already completed
{
  "success": false,
  "error": true,
  "message": "This quiz has already been completed.",
  "code": 400
}
```

---

### 8. 🔄 Kampanyayı Güncelle

**Endpoint:** `PUT /api/v1/campaigns/:id`  
**Rol:** `admin` veya `customer` (sadece kendi kampanyası)  
**Açıklama:** Kampanya bilgilerini günceller.

#### Request Body:

```json
{
  "title": "Updated Campaign Title",
  "segments": [
    {
      "name": "PREMIUM",
      "reward": 1500,
      "maxParticipants": 150,
      "description": "Updated premium tier",
      "filters": [...]
    }
  ]
}
```

#### Önemli Notlar:

- 🔹 `currentParticipants` otomatik olarak korunur (istemci değiştiremez)
- 🔹 `isAdminAccept` sadece admin değiştirebilir
- 🔹 `createdUserId` değiştirilemez
- 🔹 Customer sadece kendi kampanyasını güncelleyebilir

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Campaign updated successfully",
  "code": 200,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Updated Campaign Title",
    "segments": [...],
    "updatedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

---

### 9. 💰 Segment Kontenjan Durumu

**Endpoint:** `GET /api/v1/campaigns/:id/reward-status`  
**Rol:** `all` (authenticated)  
**Açıklama:** Kampanyanın segment bazlı kontenjan durumunu getirir.

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Reward status retrieved successfully",
  "code": 200,
  "data": {
    "campaignTitle": "Defi Warriors Campaign",
    "segments": [
      {
        "name": "PREMIUM",
        "maxParticipants": 100,
        "currentParticipants": 15,
        "available": 85,
        "reward": 1000,
        "fillRate": "15.00%"
      },
      {
        "name": "BASIC",
        "maxParticipants": 1000,
        "currentParticipants": 234,
        "available": 766,
        "reward": 100,
        "fillRate": "23.40%"
      }
    ],
    "totalStats": {
      "totalMaxParticipants": 1100,
      "totalCurrentParticipants": 249,
      "totalAvailable": 851,
      "overallFillRate": "22.64%"
    }
  }
}
```

---

### 10. 📈 Kullanıcı Kazanç Analizi

**Endpoint:** `GET /api/v1/campaigns/user/segment-earnings-analysis`  
**Rol:** `all` (authenticated)  
**Açıklama:** Kullanıcının segmentine göre potansiyel ve gerçekleşen kazançlarını analiz eder.

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Earnings analysis retrieved successfully",
  "code": 200,
  "data": {
    "userSegment": {
      "class": "PREMIUM",
      "compositeScore": 85.5,
      "percentile": 92.3,
      "confidence": 0.89,
      "asOf": "2025-10-15T00:00:00.000Z"
    },
    "earnings": {
      "actualEarnings": 5000,
      "potentialEarnings": 15000,
      "missedEarnings": 10000,
      "completionRate": 33.33
    },
    "campaigns": {
      "completed": [
        {
          "campaignId": "671234567890abcdef123456",
          "title": "Campaign 1",
          "reward": 1000,
          "segment": "PREMIUM",
          "completedAt": "2025-10-10T10:00:00.000Z"
        }
      ],
      "potential": [
        {
          "campaignId": "671234567890abcdef123789",
          "title": "Campaign 2",
          "reward": 1500,
          "segment": "PREMIUM",
          "segmentMaxParticipants": 100,
          "segmentCurrentParticipants": 50,
          "endDate": "2025-10-20T23:59:59.000Z"
        }
      ],
      "missed": [
        {
          "campaignId": "671234567890abcdef123999",
          "title": "Expired Campaign",
          "reward": 2000,
          "segment": "PREMIUM",
          "segmentMaxParticipants": 50,
          "segmentCurrentParticipants": 50,
          "endDate": "2025-10-05T23:59:59.000Z"
        }
      ],
      "inProgress": [
        {
          "campaignId": "671234567890abcdef124000",
          "title": "Ongoing Campaign",
          "reward": 1200,
          "segment": "PREMIUM"
        }
      ]
    },
    "summary": {
      "totalCompletedCampaigns": 5,
      "totalPotentialCampaigns": 15,
      "totalMissedCampaigns": 10,
      "totalInProgressCampaigns": 2
    }
  }
}
```

---

### 11. 👥 Tamamlayan Kullanıcılar (Admin)

**Endpoint:** `GET /api/v1/campaigns/admin/completed-users`  
**Rol:** `admin`  
**Query:** `?campaignId=671234567890abcdef123456` (opsiyonel)

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Completed users retrieved successfully",
  "code": 200,
  "data": [
    {
      "userId": "670123456789abcdef654321",
      "userName": "John Doe",
      "campaignId": "671234567890abcdef123456",
      "campaignTitle": "Defi Warriors Campaign",
      "completedAt": "2025-10-15T11:05:00.000Z",
      "segment": "PREMIUM",
      "reward": 1000,
      "isPurchase": false,
      "airdropWallet": "0x1234567890abcdef1234567890abcdef12345678"
    }
  ]
}
```

---

### 12. 🛒 Purchase Durumu Güncelle (Admin)

**Endpoint:** `PATCH /api/v1/campaigns/admin/completed-users/:userId/:campaignId/purchase`  
**Rol:** `admin`  
**Açıklama:** Kullanıcının kampanya için ödeme durumunu günceller.

#### Request Body:

```json
{
  "isPurchase": true
}
```

#### Response (Success - 200):

```json
{
  "success": true,
  "error": false,
  "message": "Purchase status updated successfully",
  "code": 200,
  "data": {
    "userId": "670123456789abcdef654321",
    "campaignId": "671234567890abcdef123456",
    "isPurchase": true,
    "updatedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

---

## 🎨 FRONTEND IMPLEMENTATION GUIDE

### Campaign Creation Form

```typescript
// Segment ekleme örneği
const [segments, setSegments] = useState([
  {
    name: 'PREMIUM',
    reward: 1000,
    maxParticipants: 100,
    description: '',
    filters: [
      {
        field: 'transaction_activity',
        chain: 'ETH',
        tx_types: { state: 'and', types: [] },
        token_types: { state: 'or', types: [] }
      }
    ]
  }
]);

const addSegment = () => {
  setSegments([...segments, {
    name: '',
    reward: 0,
    maxParticipants: 0,
    description: '',
    filters: []
  }]);
};

const addFilterToSegment = (segmentIndex) => {
  const newSegments = [...segments];
  newSegments[segmentIndex].filters.push({
    field: '',
    chain: 'ETH',
    tx_types: { state: 'and', types: [] },
    token_types: { state: 'or', types: [] }
  });
  setSegments(newSegments);
};
```

### Campaign Join Flow

```typescript
const joinCampaign = async (campaignId: string) => {
  try {
    const response = await axios.post(
      `/api/v1/campaigns/${campaignId}/join`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const { segment, segmentQuota, reward } = response.data.data;
    
    // UI'da kullanıcıya segment bilgisini göster
    showNotification({
      title: 'Başarılı!',
      message: `${segment} segmentine katıldınız. Ödül: ${reward}`,
      type: 'success'
    });
    
    // Kontenjan durumunu göster
    
  } catch (error) {
    if (error.response?.status === 400) {
      showNotification({
        title: 'Hata',
        message: error.response.data.message,
        type: 'error'
      });
    }
  }
};
```

### Display Segment Information

```typescript
const SegmentCard = ({ segment }) => {
  const fillRate = (segment.currentParticipants / segment.maxParticipants) * 100;
  
  return (
    <div className="segment-card">
      <h3>{segment.name}</h3>
      <p>Ödül: {segment.reward} tokens</p>
      <p>Kontenjan: {segment.currentParticipants}/{segment.maxParticipants}</p>
      <div className="progress-bar">
        <div style={{ width: `${fillRate}%` }}></div>
      </div>
      <p className="fill-rate">{fillRate.toFixed(1)}% Dolu</p>
      {segment.description && <p>{segment.description}</p>}
    </div>
  );
};
```

---

## ⚠️ HATA KODLARI

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Bad Request - Validation hatası |
| 401 | Unauthorized - Token geçersiz |
| 403 | Forbidden - Yetki yok |
| 404 | Not Found - Kayıt bulunamadı |
| 500 | Internal Server Error |

---

## 📌 ÖNEMLİ NOTLAR

### 1. Segment vs User Segment

- **Campaign Segments:** Kampanyanın hedeflediği kullanıcı grupları (PREMIUM, BASIC, vb.)
- **User Segment:** Kullanıcının UserSegment koleksiyonundaki sınıfı (A, B, C, D)

### 2. Kontenjan Kontrolü

- Kullanıcı kampanyaya katıldığında, kendi segment'ine (A/B/C/D) göre kampanyadaki ilgili segment bulunur
- O segment'in kontenjanı kontrol edilir
- Admin kullanıcılar kontenjan kontrolünden muaftır

### 3. Reward Hesaplama

- Kullanıcının segment'i (A/B/C/D) belirlenir
- Kampanyadaki o segment'in reward değeri kullanılır
- Referral bonus varsa ödülün %3'ü davet eden kullanıcıya verilir

### 4. Filter Sistemi

- Her segment birden fazla filter içerebilir
- Filter'lar AND/OR mantığıyla çalışabilir
- tx_types ve token_types için ayrı ayrı filter tanımlanabilir

---

## 🔗 İLGİLİ ENDPOINT'LER

### User Endpoints:
- `POST /api/v1/users/register` - Kullanıcı kaydı
- `POST /api/v1/users/login` - Giriş yapma
- `GET /api/v1/users/profile` - Profil bilgisi

### Wallet Endpoints:
- `POST /api/v1/wallets/verify` - Cüzdan doğrulama
- `GET /api/v1/wallets/list` - Kullanıcı cüzdanları

### Question Endpoints:
- `GET /api/v1/questions/campaign/:campaignId` - Kampanya soruları

---

## 📞 İLETİŞİM ve DESTEK

Herhangi bir sorunuz olduğunda:

1. Bu dokümantasyonu kontrol edin
2. Postman collection'ı kullanarak test edin
3. Backend ekibiyle iletişime geçin

---

**Son Güncelleme:** 15 Ekim 2025  
**Versiyon:** 2.0.0  
**Hazırlayan:** Backend Team


