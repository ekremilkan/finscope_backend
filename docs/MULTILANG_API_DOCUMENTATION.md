# 🌍 Çoklu Dil (Multilingual) API Dokümantasyonu

**Frontend Geliştirici Rehberi**

![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)

**Son Güncelleme:** 2024-12-19

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Dil Parametresi Kullanımı](#dil-parametresi-kullanımı)
3. [Campaign API Değişiklikleri](#campaign-api-değişiklikleri)
4. [Question API Değişiklikleri](#question-api-değişiklikleri)
5. [Örnekler](#örnekler)
6. [Önemli Notlar](#önemli-notlar)
7. [Migration Rehberi](#migration-rehberi)

---

## 🎯 Genel Bakış

### Ne Değişti?

API artık **çoklu dil desteği** sunuyor. Kampanya ve soru içerikleri artık **Türkçe (tr)** ve **İngilizce (en)** olarak saklanıyor ve istenen dile göre döndürülüyor.

### Desteklenen Diller

- 🇹🇷 **Türkçe (tr)** - Varsayılan dil
- 🇬🇧 **İngilizce (en)**

### Değişen Modeller

1. **Campaign Model**
   - `title` → `{ tr: String, en: String }`
   - `description` → `{ tr: String, en: String }`
   - `content[].itemTitle` → `{ tr: String, en: String }`
   - `content[].itemDescription` → `{ tr: String, en: String }`
   - `segments[].description` → `{ tr: String, en: String }` (opsiyonel)

2. **Question Model**
   - `questionText` → `{ tr: String, en: String }`
   - `options[].text` → `{ tr: String, en: String }`

---

## 🌐 Dil Parametresi Kullanımı

### Dil Algılama Öncelik Sırası

API, dil bilgisini şu sırayla algılar:

1. **Query Parameter** (`?lang=tr` veya `?lang=en`) - En yüksek öncelik
2. **User Preference** (Kullanıcının tercih ettiği dil - eğer authenticated ise)
3. **Accept-Language Header** (Tarayıcı dil ayarı)
4. **Varsayılan** (Türkçe - `tr`)

### Query Parameter ile Dil Belirleme

Tüm GET endpoint'lerine `lang` query parametresi eklenebilir:

```http
GET /api/v1/campaigns/all?lang=en
GET /api/v1/campaigns/:id?lang=tr
GET /api/v1/questions/campaign/:campaignId?lang=en
```

**Geçerli Değerler:**
- `tr` - Türkçe
- `en` - İngilizce

**Örnek:**
```javascript
// Türkçe içerik için
fetch('/api/v1/campaigns/all?lang=tr', {
  headers: { 'Authorization': 'Bearer ' + token }
})

// İngilizce içerik için
fetch('/api/v1/campaigns/all?lang=en', {
  headers: { 'Authorization': 'Bearer ' + token }
})
```

### Accept-Language Header ile Dil Belirleme

Tarayıcı dil ayarını kullanmak için:

```http
GET /api/v1/campaigns/all
Accept-Language: en-US,en;q=0.9,tr;q=0.8
```

API otomatik olarak `en` veya `tr` algılar.

---

## 📡 Campaign API Değişiklikleri

### 1. 🆕 Kampanya Oluşturma

**Endpoint:** `POST /api/v1/campaigns/create`

#### ⚠️ ÖNEMLİ DEĞİŞİKLİK: Request Format

**ÖNCE (ESKİ FORMAT - ARTIK ÇALIŞMAZ):**
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

**SONRA (YENİ FORMAT - ZORUNLU):**
```json
{
  "title": {
    "tr": "Kampanya Başlığı",
    "en": "Campaign Title"
  },
  "description": {
    "tr": "Kampanya açıklaması",
    "en": "Campaign description"
  },
  "content": [{
    "itemTitle": {
      "tr": "İçerik Başlığı",
      "en": "Content Title"
    },
    "itemDescription": {
      "tr": "İçerik açıklaması",
      "en": "Content description"
    },
    "itemImage": "https://example.com/image.jpg",
    "itemVideo": "https://example.com/video.mp4",
    "itemIndex": 1
  }],
  "segments": [{
    "name": "PREMIUM",
    "reward": 1000,
    "maxParticipants": 100,
    "currentParticipants": 0,
    "description": {
      "tr": "Premium segment açıklaması",
      "en": "Premium segment description"
    },
    "filters": [...]
  }],
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.000Z",
  "company_logo": "https://example.com/logo.png",
  "twitter_url": "https://twitter.com/company",
  "tags": ["tag1", "tag2"]
}
```

#### ✅ Validation Kuralları

- **Her iki dil zorunlu:** `title.tr`, `title.en`, `description.tr`, `description.en` mutlaka gönderilmeli
- **Boş string kabul edilmez:** Her iki dil için de dolu string gönderilmeli
- **Maxlength:** 
  - `title`: 100 karakter (her dil için)
  - `description`: 500 karakter (her dil için)
  - `content[].itemTitle`: 500 karakter (her dil için)
  - `content[].itemDescription`: 500 karakter (her dil için)

#### 📤 Response Format

Response, gönderilen formatı aynen döndürür (çoklu dil formatında):

```json
{
  "success": true,
  "error": false,
  "message": "Kampanya başarıyla oluşturuldu",
  "code": 201,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": {
      "tr": "Kampanya Başlığı",
      "en": "Campaign Title"
    },
    "description": {
      "tr": "Kampanya açıklaması",
      "en": "Campaign description"
    },
    "content": [{
      "itemTitle": {
        "tr": "İçerik Başlığı",
        "en": "Content Title"
      },
      "itemDescription": {
        "tr": "İçerik açıklaması",
        "en": "Content description"
      },
      "itemImage": "https://example.com/image.jpg",
      "itemVideo": "https://example.com/video.mp4",
      "itemIndex": 1
    }],
    "segments": [{
      "name": "PREMIUM",
      "reward": 1000,
      "maxParticipants": 100,
      "currentParticipants": 0,
      "description": {
        "tr": "Premium segment açıklaması",
        "en": "Premium segment description"
      }
    }],
    "status": "upcoming",
    "isActive": false,
    "isAdminAccept": false,
    "createdAt": "2024-12-19T10:00:00.000Z",
    "updatedAt": "2024-12-19T10:00:00.000Z"
  }
}
```

---

### 2. 📋 Tüm Kampanyaları Listele

**Endpoint:** `GET /api/v1/campaigns/all`

#### ✨ YENİ ÖZELLİK: Dil Parametresi

```http
GET /api/v1/campaigns/all?lang=en
GET /api/v1/campaigns/all?lang=tr
```

#### 📤 Response Format (Dil Parametresi ile)

**Query:** `?lang=en`

```json
{
  "success": true,
  "error": false,
  "message": "Tüm kampanyalar getirildi",
  "code": 200,
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "title": "Campaign Title",  // ⚠️ Sadece İngilizce
      "description": "Campaign description",  // ⚠️ Sadece İngilizce
      "content": [{
        "itemTitle": "Content Title",  // ⚠️ Sadece İngilizce
        "itemDescription": "Content description",  // ⚠️ Sadece İngilizce
        "itemImage": "https://example.com/image.jpg",
        "itemVideo": "https://example.com/video.mp4",
        "itemIndex": 1
      }],
      "segments": [{
        "name": "PREMIUM",
        "reward": 1000,
        "maxParticipants": 100,
        "currentParticipants": 15,
        "description": "Premium segment description"  // ⚠️ Sadece İngilizce
      }],
      "language": "en",  // ⚠️ YENİ: Hangi dil döndürüldüğünü gösterir
      "status": "active",
      "isActive": true,
      "isAdminAccept": true,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.000Z"
    }
  ]
}
```

**Query:** `?lang=tr` veya dil parametresi yok

```json
{
  "success": true,
  "error": false,
  "message": "Tüm kampanyalar getirildi",
  "code": 200,
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "title": "Kampanya Başlığı",  // ⚠️ Sadece Türkçe
      "description": "Kampanya açıklaması",  // ⚠️ Sadece Türkçe
      "content": [{
        "itemTitle": "İçerik Başlığı",  // ⚠️ Sadece Türkçe
        "itemDescription": "İçerik açıklaması",  // ⚠️ Sadece Türkçe
        "itemImage": "https://example.com/image.jpg",
        "itemVideo": "https://example.com/video.mp4",
        "itemIndex": 1
      }],
      "segments": [{
        "name": "PREMIUM",
        "reward": 1000,
        "maxParticipants": 100,
        "currentParticipants": 15,
        "description": "Premium segment açıklaması"  // ⚠️ Sadece Türkçe
      }],
      "language": "tr",  // ⚠️ YENİ: Hangi dil döndürüldüğünü gösterir
      "status": "active",
      "isActive": true,
      "isAdminAccept": true,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.000Z"
    }
  ]
}
```

#### ⚠️ ÖNEMLİ NOTLAR

1. **Response formatı değişti:** Artık `title`, `description` gibi alanlar **string** değil, **dil parametresine göre seçilmiş string** döndürülüyor
2. **Yeni alan:** `language` alanı hangi dilin döndürüldüğünü gösterir (`"tr"` veya `"en"`)
3. **Fallback mekanizması:** Eğer istenen dil yoksa, varsayılan olarak Türkçe (`tr`) döndürülür

---

### 3. 🔍 Kampanya Detayı

**Endpoint:** `GET /api/v1/campaigns/:id`

#### ✨ YENİ ÖZELLİK: Dil Parametresi

```http
GET /api/v1/campaigns/671234567890abcdef123456?lang=en
GET /api/v1/campaigns/671234567890abcdef123456?lang=tr
```

#### 📤 Response Format

Response formatı `GET /api/v1/campaigns/all` ile aynıdır. Tek bir kampanya objesi döner.

---

### 4. ✏️ Kampanya Güncelleme

**Endpoint:** `PUT /api/v1/campaigns/:id`

#### ⚠️ ÖNEMLİ DEĞİŞİKLİK: Request Format

**ÖNCE (ESKİ FORMAT - ARTIK ÇALIŞMAZ):**
```json
{
  "title": "Yeni Başlık",
  "description": "Yeni Açıklama"
}
```

**SONRA (YENİ FORMAT):**
```json
{
  "title": {
    "tr": "Yeni Başlık",
    "en": "New Title"
  },
  "description": {
    "tr": "Yeni Açıklama",
    "en": "New Description"
  },
  "content": [{
    "itemTitle": {
      "tr": "Yeni İçerik Başlığı",
      "en": "New Content Title"
    },
    "itemDescription": {
      "tr": "Yeni İçerik Açıklaması",
      "en": "New Content Description"
    },
    "itemImage": "https://example.com/new-image.jpg",
    "itemVideo": "https://example.com/new-video.mp4",
    "itemIndex": 1
  }]
}
```

#### ✅ Güncelleme Kuralları

- **Kısmi güncelleme desteklenir:** Sadece gönderilen alanlar güncellenir
- **Her iki dil zorunlu:** Eğer `title` güncelleniyorsa, hem `title.tr` hem de `title.en` gönderilmeli
- **Mevcut değerler korunur:** Eğer sadece bir dil gönderilirse, diğer dil mevcut değerini korur

**Örnek - Sadece Türkçe güncelleme (YANLIŞ):**
```json
{
  "title": {
    "tr": "Yeni Başlık"
    // ❌ "en" eksik - Validation hatası
  }
}
```

**Örnek - Her iki dil güncelleme (DOĞRU):**
```json
{
  "title": {
    "tr": "Yeni Başlık",
    "en": "New Title"
  }
}
```

#### 📤 Response Format

Response, güncellenmiş kampanyayı çoklu dil formatında döndürür (oluşturma response'u ile aynı format).

---

### 5. 📊 Diğer Campaign Endpoint'leri

Aşağıdaki endpoint'ler de dil parametresini destekler:

- `GET /api/v1/campaigns/customer/list?lang=en` - Müşteri kampanyaları
- `GET /api/v1/campaigns/:id/reward-status?lang=en` - Ödül durumu

**Response formatı:** Tüm endpoint'lerde `title` ve `description` alanları dil parametresine göre string olarak döner.

---

## ❓ Question API Değişiklikleri

### 1. 🆕 Soru Oluşturma

**Endpoint:** `POST /api/v1/questions/create`

#### ⚠️ ÖNEMLİ DEĞİŞİKLİK: Request Format

**ÖNCE (ESKİ FORMAT - ARTIK ÇALIŞMAZ):**
```json
{
  "questionText": "Soru metni?",
  "options": [
    { "text": "Seçenek 1", "isTrue": true },
    { "text": "Seçenek 2", "isTrue": false },
    { "text": "Seçenek 3", "isTrue": false },
    { "text": "Seçenek 4", "isTrue": false }
  ],
  "campaignId": "671234567890abcdef123456",
  "order": 1
}
```

**SONRA (YENİ FORMAT - ZORUNLU):**
```json
{
  "questionText": {
    "tr": "Soru metni?",
    "en": "Question text?"
  },
  "options": [
    {
      "text": {
        "tr": "Seçenek 1",
        "en": "Option 1"
      },
      "isTrue": true
    },
    {
      "text": {
        "tr": "Seçenek 2",
        "en": "Option 2"
      },
      "isTrue": false
    },
    {
      "text": {
        "tr": "Seçenek 3",
        "en": "Option 3"
      },
      "isTrue": false
    },
    {
      "text": {
        "tr": "Seçenek 4",
        "en": "Option 4"
      },
      "isTrue": false
    }
  ],
  "campaignId": "671234567890abcdef123456",
  "order": 1
}
```

#### ✅ Validation Kuralları

- **Her iki dil zorunlu:** `questionText.tr`, `questionText.en`, her `option.text.tr`, `option.text.en` mutlaka gönderilmeli
- **Boş string kabul edilmez:** Her iki dil için de dolu string gönderilmeli
- **Maxlength:** `questionText`: 300 karakter (her dil için)
- **4 seçenek zorunlu:** Tam olarak 4 seçenek gönderilmeli
- **1 doğru cevap:** Sadece bir seçenek `isTrue: true` olmalı

#### 📤 Response Format

Response, gönderilen formatı aynen döndürür (çoklu dil formatında):

```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla oluşturuldu",
  "code": 201,
  "data": {
    "_id": "671234567890abcdef123457",
    "questionText": {
      "tr": "Soru metni?",
      "en": "Question text?"
    },
    "options": [
      {
        "text": {
          "tr": "Seçenek 1",
          "en": "Option 1"
        },
        "isTrue": true
      },
      {
        "text": {
          "tr": "Seçenek 2",
          "en": "Option 2"
        },
        "isTrue": false
      },
      {
        "text": {
          "tr": "Seçenek 3",
          "en": "Option 3"
        },
        "isTrue": false
      },
      {
        "text": {
          "tr": "Seçenek 4",
          "en": "Option 4"
        },
        "isTrue": false
      }
    ],
    "order": 1,
    "createdUserId": "671234567890abcdef123458",
    "createdAt": "2024-12-19T10:00:00.000Z",
    "updatedAt": "2024-12-19T10:00:00.000Z"
  }
}
```

---

### 2. 📋 Soruları Listele

**Endpoint:** `GET /api/v1/questions/all` (Admin)  
**Endpoint:** `GET /api/v1/questions/campaign/:campaignId` (Kampanya soruları)  
**Endpoint:** `GET /api/v1/questions/customer` (Müşteri soruları)

#### ✨ YENİ ÖZELLİK: Dil Parametresi

```http
GET /api/v1/questions/campaign/671234567890abcdef123456?lang=en
GET /api/v1/questions/customer?lang=tr
```

#### 📤 Response Format (Dil Parametresi ile)

**Query:** `?lang=en`

```json
{
  "success": true,
  "error": false,
  "message": "Kampanyaya ait sorular getirildi",
  "code": 200,
  "data": [
    {
      "_id": "671234567890abcdef123457",
      "questionText": "Question text?",  // ⚠️ Sadece İngilizce
      "options": [
        {
          "text": "Option 1",  // ⚠️ Sadece İngilizce
          "isTrue": true
        },
        {
          "text": "Option 2",  // ⚠️ Sadece İngilizce
          "isTrue": false
        },
        {
          "text": "Option 3",  // ⚠️ Sadece İngilizce
          "isTrue": false
        },
        {
          "text": "Option 4",  // ⚠️ Sadece İngilizce
          "isTrue": false
        }
      ],
      "language": "en",  // ⚠️ YENİ: Hangi dil döndürüldüğünü gösterir
      "order": 1,
      "createdAt": "2024-12-19T10:00:00.000Z"
    }
  ]
}
```

**Query:** `?lang=tr` veya dil parametresi yok

```json
{
  "success": true,
  "error": false,
  "message": "Kampanyaya ait sorular getirildi",
  "code": 200,
  "data": [
    {
      "_id": "671234567890abcdef123457",
      "questionText": "Soru metni?",  // ⚠️ Sadece Türkçe
      "options": [
        {
          "text": "Seçenek 1",  // ⚠️ Sadece Türkçe
          "isTrue": true
        },
        {
          "text": "Seçenek 2",  // ⚠️ Sadece Türkçe
          "isTrue": false
        },
        {
          "text": "Seçenek 3",  // ⚠️ Sadece Türkçe
          "isTrue": false
        },
        {
          "text": "Seçenek 4",  // ⚠️ Sadece Türkçe
          "isTrue": false
        }
      ],
      "language": "tr",  // ⚠️ YENİ: Hangi dil döndürüldüğünü gösterir
      "order": 1,
      "createdAt": "2024-12-19T10:00:00.000Z"
    }
  ]
}
```

---

### 3. ✏️ Soru Güncelleme

**Endpoint:** `PUT /api/v1/questions/:id`

#### ⚠️ ÖNEMLİ DEĞİŞİKLİK: Request Format

**ÖNCE (ESKİ FORMAT - ARTIK ÇALIŞMAZ):**
```json
{
  "questionText": "Yeni soru metni?",
  "options": [
    { "text": "Yeni seçenek 1", "isTrue": true }
  ]
}
```

**SONRA (YENİ FORMAT):**
```json
{
  "questionText": {
    "tr": "Yeni soru metni?",
    "en": "New question text?"
  },
  "options": [
    {
      "text": {
        "tr": "Yeni seçenek 1",
        "en": "New option 1"
      },
      "isTrue": true
    },
    {
      "text": {
        "tr": "Yeni seçenek 2",
        "en": "New option 2"
      },
      "isTrue": false
    },
    {
      "text": {
        "tr": "Yeni seçenek 3",
        "en": "New option 3"
      },
      "isTrue": false
    },
    {
      "text": {
        "tr": "Yeni seçenek 4",
        "en": "New option 4"
      },
      "isTrue": false
    }
  ]
}
```

#### ✅ Güncelleme Kuralları

- **Kısmi güncelleme desteklenir:** Sadece gönderilen alanlar güncellenir
- **Her iki dil zorunlu:** Eğer `questionText` veya `options[].text` güncelleniyorsa, hem `tr` hem de `en` gönderilmeli
- **Mevcut değerler korunur:** Eğer sadece bir dil gönderilirse, diğer dil mevcut değerini korur

---

## 💡 Örnekler

### React/JavaScript Örneği

```javascript
// Dil seçimi için state
const [language, setLanguage] = useState('tr');

// Kampanyaları getir
const fetchCampaigns = async () => {
  const response = await fetch(
    `/api/v1/campaigns/all?lang=${language}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  // Response'da title artık string (dil parametresine göre)
  data.data.forEach(campaign => {
    console.log(campaign.title); // "Kampanya Başlığı" veya "Campaign Title"
    console.log(campaign.language); // "tr" veya "en"
  });
};

// Kampanya oluştur
const createCampaign = async (campaignData) => {
  const response = await fetch('/api/v1/campaigns/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: {
        tr: campaignData.titleTr,
        en: campaignData.titleEn
      },
      description: {
        tr: campaignData.descriptionTr,
        en: campaignData.descriptionEn
      },
      content: campaignData.content.map(item => ({
        itemTitle: {
          tr: item.titleTr,
          en: item.titleEn
        },
        itemDescription: {
          tr: item.descriptionTr,
          en: item.descriptionEn
        },
        itemImage: item.image,
        itemVideo: item.video,
        itemIndex: item.index
      })),
      segments: campaignData.segments.map(segment => ({
        name: segment.name,
        reward: segment.reward,
        maxParticipants: segment.maxParticipants,
        currentParticipants: 0,
        description: {
          tr: segment.descriptionTr,
          en: segment.descriptionEn
        },
        filters: segment.filters
      })),
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      company_logo: campaignData.companyLogo,
      twitter_url: campaignData.twitterUrl,
      tags: campaignData.tags
    })
  });
  
  return await response.json();
};
```

### Axios Örneği

```javascript
import axios from 'axios';

// Axios instance oluştur
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token ekle
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dil parametresi ile kampanya getir
const getCampaigns = async (lang = 'tr') => {
  const response = await api.get(`/campaigns/all?lang=${lang}`);
  return response.data;
};

// Kampanya oluştur
const createCampaign = async (campaignData) => {
  const response = await api.post('/campaigns/create', {
    title: {
      tr: campaignData.titleTr,
      en: campaignData.titleEn
    },
    description: {
      tr: campaignData.descriptionTr,
      en: campaignData.descriptionEn
    },
    // ... diğer alanlar
  });
  return response.data;
};
```

---

## ⚠️ Önemli Notlar

### 1. Backward Compatibility

⚠️ **ÖNEMLİ:** Eski format (tek dil string) artık **çalışmaz**. Tüm request'ler yeni çoklu dil formatında gönderilmeli.

### 2. Response Format Değişikliği

- **GET endpoint'leri:** Response'da `title`, `description` gibi alanlar artık **string** olarak döner (dil parametresine göre seçilmiş)
- **POST/PUT endpoint'leri:** Request ve response'da çoklu dil formatı (`{ tr: String, en: String }`) kullanılır

### 3. Fallback Mekanizması

- Eğer istenen dil yoksa, varsayılan olarak Türkçe (`tr`) döndürülür
- Eğer Türkçe de yoksa, boş string (`""`) döndürülür

### 4. Validation Hataları

Eğer çoklu dil formatı doğru gönderilmezse:

```json
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "code": 400,
  "errors": [
    "Turkish translation is required",
    "English translation is required",
    "Both Turkish and English translations are required"
  ]
}
```

### 5. Dil Parametresi Kullanımı

- **Query parameter:** `?lang=tr` veya `?lang=en`
- **User preference:** Kullanıcı profilinde `preferredLanguage` alanı varsa otomatik kullanılır
- **Accept-Language header:** Tarayıcı dil ayarı otomatik algılanır
- **Varsayılan:** Türkçe (`tr`)

---

## 🔄 Migration Rehberi

### Frontend Güncelleme Adımları

1. **Request Format Güncellemesi**
   - Tüm `title`, `description` alanlarını `{ tr: String, en: String }` formatına çevir
   - Tüm `content[].itemTitle`, `content[].itemDescription` alanlarını çoklu dil formatına çevir
   - Tüm `questionText`, `options[].text` alanlarını çoklu dil formatına çevir

2. **Response Format Güncellemesi**
   - GET endpoint'lerinde `title`, `description` artık string döner (dil parametresine göre)
   - `language` alanını kontrol et (hangi dil döndürüldüğünü gösterir)

3. **Dil Parametresi Ekleme**
   - Tüm GET request'lerine `?lang=tr` veya `?lang=en` parametresi ekle
   - Kullanıcı dil tercihini state'te tut ve tüm API çağrılarında kullan

4. **Form Güncellemeleri**
   - Kampanya/soru oluşturma formlarında her alan için iki input ekle (TR ve EN)
   - Validation'da her iki dilin dolu olduğundan emin ol

### Örnek Form Yapısı

```jsx
// React örneği
const CampaignForm = () => {
  const [formData, setFormData] = useState({
    title: { tr: '', en: '' },
    description: { tr: '', en: '' },
    content: [{
      itemTitle: { tr: '', en: '' },
      itemDescription: { tr: '', en: '' }
    }]
  });

  const handleTitleChange = (lang, value) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [lang]: value }
    }));
  };

  return (
    <form>
      <div>
        <label>Başlık (TR)</label>
        <input
          value={formData.title.tr}
          onChange={(e) => handleTitleChange('tr', e.target.value)}
        />
      </div>
      <div>
        <label>Title (EN)</label>
        <input
          value={formData.title.en}
          onChange={(e) => handleTitleChange('en', e.target.value)}
        />
      </div>
      {/* ... diğer alanlar */}
    </form>
  );
};
```

---

## 📞 Destek

Sorularınız için:
- **Backend Team:** [Backend ekibi ile iletişime geçin]
- **API Docs:** [Diğer API dokümantasyonlarına bakın]

---

**Son Güncelleme:** 2024-12-19  
**Versiyon:** 1.0.0  
**Durum:** ✅ Production Ready

