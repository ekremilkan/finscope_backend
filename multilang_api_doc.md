# 🌍 Çoklu Dil API Dokümantasyonu

**Frontend Geliştirici Rehberi**

**Versiyon:** 1.0.0  
**Tarih:** 2024-12-19  
**Durum:** ✅ Production Ready

---

## 📋 Hızlı Özet

### ⚠️ ÖNEMLİ DEĞİŞİKLİKLER

1. **Request Format Değişti:** Artık `title`, `description` gibi alanlar **çoklu dil objesi** olarak gönderilmeli
2. **Response Format Değişti:** GET endpoint'lerinde `title`, `description` artık **string** olarak döner (dil parametresine göre)
3. **Yeni Query Parameter:** Tüm GET endpoint'lerine `?lang=tr` veya `?lang=en` eklenebilir

---

## 🎯 Ne Değişti?

### Campaign Model Değişiklikleri

| Alan | ÖNCE | SONRA |
|------|------|--------|
| `title` | `String` | `{ tr: String, en: String }` |
| `description` | `String` | `{ tr: String, en: String }` |
| `content[].itemTitle` | `String` | `{ tr: String, en: String }` |
| `content[].itemDescription` | `String` | `{ tr: String, en: String }` |
| `segments[].description` | `String` (opsiyonel) | `{ tr: String, en: String }` (opsiyonel) |

### Question Model Değişiklikleri

| Alan | ÖNCE | SONRA |
|------|------|--------|
| `questionText` | `String` | `{ tr: String, en: String }` |
| `options[].text` | `String` | `{ tr: String, en: String }` |

---

## 🌐 Dil Parametresi Kullanımı

### Query Parameter ile Dil Belirleme

Tüm GET endpoint'lerine `lang` query parametresi eklenebilir:

```http
GET /api/v1/campaigns/all?lang=en
GET /api/v1/campaigns/:id?lang=tr
GET /api/v1/questions/campaign/:campaignId?lang=en
```

**Geçerli Değerler:**
- `tr` - Türkçe (varsayılan)
- `en` - İngilizce

**Dil Algılama Öncelik Sırası:**
1. Query parameter (`?lang=tr`)
2. User preference (kullanıcı tercihi)
3. Accept-Language header
4. Varsayılan (Türkçe)

---

## 📡 Campaign API Değişiklikleri

### 1. POST /api/v1/campaigns/create - Kampanya Oluşturma

#### ❌ ESKİ FORMAT (ARTIK ÇALIŞMAZ)

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

#### ✅ YENİ FORMAT (ZORUNLU)

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

#### 📤 Response

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
    // ... diğer alanlar
  }
}
```

---

### 2. GET /api/v1/campaigns/all - Tüm Kampanyaları Listele

#### ✨ YENİ: Dil Parametresi

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
      "title": "Campaign Title",  // ⚠️ Sadece İngilizce (string)
      "description": "Campaign description",  // ⚠️ Sadece İngilizce (string)
      "content": [{
        "itemTitle": "Content Title",  // ⚠️ Sadece İngilizce (string)
        "itemDescription": "Content description",  // ⚠️ Sadece İngilizce (string)
        "itemImage": "https://example.com/image.jpg",
        "itemVideo": "https://example.com/video.mp4",
        "itemIndex": 1
      }],
      "segments": [{
        "name": "PREMIUM",
        "reward": 1000,
        "maxParticipants": 100,
        "currentParticipants": 15,
        "description": "Premium segment description"  // ⚠️ Sadece İngilizce (string)
      }],
      "language": "en",  // ⚠️ YENİ: Hangi dil döndürüldüğünü gösterir
      "status": "active",
      "isActive": true,
      "isAdminAccept": true
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
      "title": "Kampanya Başlığı",  // ⚠️ Sadece Türkçe (string)
      "description": "Kampanya açıklaması",  // ⚠️ Sadece Türkçe (string)
      "content": [{
        "itemTitle": "İçerik Başlığı",  // ⚠️ Sadece Türkçe (string)
        "itemDescription": "İçerik açıklaması",  // ⚠️ Sadece Türkçe (string)
        "itemImage": "https://example.com/image.jpg",
        "itemVideo": "https://example.com/video.mp4",
        "itemIndex": 1
      }],
      "segments": [{
        "name": "PREMIUM",
        "reward": 1000,
        "maxParticipants": 100,
        "currentParticipants": 15,
        "description": "Premium segment açıklaması"  // ⚠️ Sadece Türkçe (string)
      }],
      "language": "tr",  // ⚠️ YENİ: Hangi dil döndürüldüğünü gösterir
      "status": "active",
      "isActive": true,
      "isAdminAccept": true
    }
  ]
}
```

#### ⚠️ ÖNEMLİ NOTLAR

1. **Response formatı değişti:** `title`, `description` artık **string** olarak döner (çoklu dil objesi değil)
2. **Yeni alan:** `language` alanı hangi dilin döndürüldüğünü gösterir (`"tr"` veya `"en"`)
3. **Fallback:** Eğer istenen dil yoksa, varsayılan olarak Türkçe (`tr`) döndürülür

---

### 3. GET /api/v1/campaigns/:id - Kampanya Detayı

#### ✨ YENİ: Dil Parametresi

```http
GET /api/v1/campaigns/671234567890abcdef123456?lang=en
GET /api/v1/campaigns/671234567890abcdef123456?lang=tr
```

#### 📤 Response Format

Response formatı `GET /api/v1/campaigns/all` ile aynıdır. Tek bir kampanya objesi döner.

---

### 4. PUT /api/v1/campaigns/:id - Kampanya Güncelleme

#### ❌ ESKİ FORMAT (ARTIK ÇALIŞMAZ)

```json
{
  "title": "Yeni Başlık",
  "description": "Yeni Açıklama"
}
```

#### ✅ YENİ FORMAT

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

**❌ YANLIŞ:**
```json
{
  "title": {
    "tr": "Yeni Başlık"
    // "en" eksik - Validation hatası
  }
}
```

**✅ DOĞRU:**
```json
{
  "title": {
    "tr": "Yeni Başlık",
    "en": "New Title"
  }
}
```

---

### 5. Diğer Campaign Endpoint'leri

Aşağıdaki endpoint'ler de dil parametresini destekler:

- `GET /api/v1/campaigns/customer/list?lang=en` - Müşteri kampanyaları
- `GET /api/v1/campaigns/:id/reward-status?lang=en` - Ödül durumu

**Response formatı:** Tüm endpoint'lerde `title` ve `description` alanları dil parametresine göre string olarak döner.

---

## ❓ Question API Değişiklikleri

### 1. POST /api/v1/questions/create - Soru Oluşturma

#### ❌ ESKİ FORMAT (ARTIK ÇALIŞMAZ)

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

#### ✅ YENİ FORMAT (ZORUNLU)

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

---

### 2. GET /api/v1/questions/campaign/:campaignId - Kampanya Soruları

#### ✨ YENİ: Dil Parametresi

```http
GET /api/v1/questions/campaign/671234567890abcdef123456?lang=en
GET /api/v1/questions/campaign/671234567890abcdef123456?lang=tr
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
      "questionText": "Question text?",  // ⚠️ Sadece İngilizce (string)
      "options": [
        {
          "text": "Option 1",  // ⚠️ Sadece İngilizce (string)
          "isTrue": true
        },
        {
          "text": "Option 2",  // ⚠️ Sadece İngilizce (string)
          "isTrue": false
        },
        {
          "text": "Option 3",  // ⚠️ Sadece İngilizce (string)
          "isTrue": false
        },
        {
          "text": "Option 4",  // ⚠️ Sadece İngilizce (string)
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
      "questionText": "Soru metni?",  // ⚠️ Sadece Türkçe (string)
      "options": [
        {
          "text": "Seçenek 1",  // ⚠️ Sadece Türkçe (string)
          "isTrue": true
        },
        {
          "text": "Seçenek 2",  // ⚠️ Sadece Türkçe (string)
          "isTrue": false
        },
        {
          "text": "Seçenek 3",  // ⚠️ Sadece Türkçe (string)
          "isTrue": false
        },
        {
          "text": "Seçenek 4",  // ⚠️ Sadece Türkçe (string)
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

### 3. PUT /api/v1/questions/:id - Soru Güncelleme

#### ❌ ESKİ FORMAT (ARTIK ÇALIŞMAZ)

```json
{
  "questionText": "Yeni soru metni?",
  "options": [
    { "text": "Yeni seçenek 1", "isTrue": true }
  ]
}
```

#### ✅ YENİ FORMAT

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

### 4. Diğer Question Endpoint'leri

Aşağıdaki endpoint'ler de dil parametresini destekler:

- `GET /api/v1/questions/all?lang=en` - Tüm sorular (Admin)
- `GET /api/v1/questions/customer?lang=en` - Müşteri soruları

**Response formatı:** Tüm endpoint'lerde `questionText` ve `options[].text` alanları dil parametresine göre string olarak döner.

---

## 💻 Frontend Güncelleme Adımları

### 1. Request Format Güncellemesi

#### Campaign Oluşturma/Güncelleme

**ÖNCE:**
```javascript
const campaignData = {
  title: "Kampanya Başlığı",
  description: "Açıklama"
};
```

**SONRA:**
```javascript
const campaignData = {
  title: {
    tr: "Kampanya Başlığı",
    en: "Campaign Title"
  },
  description: {
    tr: "Açıklama",
    en: "Description"
  }
};
```

#### Question Oluşturma/Güncelleme

**ÖNCE:**
```javascript
const questionData = {
  questionText: "Soru metni?",
  options: [
    { text: "Seçenek 1", isTrue: true }
  ]
};
```

**SONRA:**
```javascript
const questionData = {
  questionText: {
    tr: "Soru metni?",
    en: "Question text?"
  },
  options: [
    {
      text: {
        tr: "Seçenek 1",
        en: "Option 1"
      },
      isTrue: true
    }
  ]
};
```

---

### 2. Response Format Güncellemesi

#### GET Endpoint'leri

**ÖNCE:**
```javascript
const response = await fetch('/api/v1/campaigns/all');
const data = await response.json();
console.log(data.data[0].title); // "Kampanya Başlığı" (string)
```

**SONRA:**
```javascript
// Dil parametresi ekle
const response = await fetch('/api/v1/campaigns/all?lang=en');
const data = await response.json();
console.log(data.data[0].title); // "Campaign Title" (string - dil parametresine göre)
console.log(data.data[0].language); // "en" (hangi dil döndürüldüğünü gösterir)
```

---

### 3. Dil Parametresi Ekleme

#### Tüm GET Request'lerine Dil Parametresi Ekle

```javascript
// Dil state'i tut
const [language, setLanguage] = useState('tr');

// API çağrıları
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
  return await response.json();
};

const fetchCampaign = async (id) => {
  const response = await fetch(
    `/api/v1/campaigns/${id}?lang=${language}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
};

const fetchQuestions = async (campaignId) => {
  const response = await fetch(
    `/api/v1/questions/campaign/${campaignId}?lang=${language}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
};
```

---

### 4. Form Güncellemeleri

#### Campaign Form Örneği (React)

```jsx
import { useState } from 'react';

const CampaignForm = () => {
  const [formData, setFormData] = useState({
    title: { tr: '', en: '' },
    description: { tr: '', en: '' },
    content: [{
      itemTitle: { tr: '', en: '' },
      itemDescription: { tr: '', en: '' },
      itemImage: '',
      itemVideo: '',
      itemIndex: 1
    }]
  });

  const handleTitleChange = (lang, value) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [lang]: value }
    }));
  };

  const handleDescriptionChange = (lang, value) => {
    setFormData(prev => ({
      ...prev,
      description: { ...prev.description, [lang]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Her iki dil dolu olmalı
    if (!formData.title.tr || !formData.title.en) {
      alert('Her iki dil için başlık gerekli!');
      return;
    }
    
    if (!formData.description.tr || !formData.description.en) {
      alert('Her iki dil için açıklama gerekli!');
      return;
    }
    
    const response = await fetch('/api/v1/campaigns/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    console.log(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Başlık (TR)</label>
        <input
          value={formData.title.tr}
          onChange={(e) => handleTitleChange('tr', e.target.value)}
          maxLength={100}
        />
      </div>
      <div>
        <label>Title (EN)</label>
        <input
          value={formData.title.en}
          onChange={(e) => handleTitleChange('en', e.target.value)}
          maxLength={100}
        />
      </div>
      
      <div>
        <label>Açıklama (TR)</label>
        <textarea
          value={formData.description.tr}
          onChange={(e) => handleDescriptionChange('tr', e.target.value)}
          maxLength={500}
        />
      </div>
      <div>
        <label>Description (EN)</label>
        <textarea
          value={formData.description.en}
          onChange={(e) => handleDescriptionChange('en', e.target.value)}
          maxLength={500}
        />
      </div>
      
      <button type="submit">Kampanya Oluştur</button>
    </form>
  );
};
```

#### Question Form Örneği (React)

```jsx
import { useState } from 'react';

const QuestionForm = () => {
  const [formData, setFormData] = useState({
    questionText: { tr: '', en: '' },
    options: [
      { text: { tr: '', en: '' }, isTrue: false },
      { text: { tr: '', en: '' }, isTrue: false },
      { text: { tr: '', en: '' }, isTrue: false },
      { text: { tr: '', en: '' }, isTrue: false }
    ],
    campaignId: '',
    order: 1
  });

  const handleQuestionTextChange = (lang, value) => {
    setFormData(prev => ({
      ...prev,
      questionText: { ...prev.questionText, [lang]: value }
    }));
  };

  const handleOptionChange = (index, lang, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index 
          ? { ...opt, text: { ...opt.text, [lang]: value } }
          : opt
      )
    }));
  };

  const handleIsTrueChange = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isTrue: i === index
      }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Her iki dil dolu olmalı
    if (!formData.questionText.tr || !formData.questionText.en) {
      alert('Her iki dil için soru metni gerekli!');
      return;
    }
    
    // Validation: Her seçenek için her iki dil dolu olmalı
    for (const option of formData.options) {
      if (!option.text.tr || !option.text.en) {
        alert('Her seçenek için her iki dil gerekli!');
        return;
      }
    }
    
    // Validation: Sadece bir doğru cevap olmalı
    const trueCount = formData.options.filter(opt => opt.isTrue).length;
    if (trueCount !== 1) {
      alert('Sadece bir doğru cevap seçilmeli!');
      return;
    }
    
    const response = await fetch('/api/v1/questions/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    console.log(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Soru Metni (TR)</label>
        <input
          value={formData.questionText.tr}
          onChange={(e) => handleQuestionTextChange('tr', e.target.value)}
          maxLength={300}
        />
      </div>
      <div>
        <label>Question Text (EN)</label>
        <input
          value={formData.questionText.en}
          onChange={(e) => handleQuestionTextChange('en', e.target.value)}
          maxLength={300}
        />
      </div>
      
      {formData.options.map((option, index) => (
        <div key={index}>
          <div>
            <label>Seçenek {index + 1} (TR)</label>
            <input
              value={option.text.tr}
              onChange={(e) => handleOptionChange(index, 'tr', e.target.value)}
            />
          </div>
          <div>
            <label>Option {index + 1} (EN)</label>
            <input
              value={option.text.en}
              onChange={(e) => handleOptionChange(index, 'en', e.target.value)}
            />
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="correctAnswer"
                checked={option.isTrue}
                onChange={() => handleIsTrueChange(index)}
              />
              Doğru Cevap
            </label>
          </div>
        </div>
      ))}
      
      <button type="submit">Soru Oluştur</button>
    </form>
  );
};
```

---

### 5. Axios/API Client Güncellemesi

```javascript
// api.js
import axios from 'axios';

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
  
  // Dil parametresi ekle (GET request'leri için)
  const language = localStorage.getItem('language') || 'tr';
  if (config.method === 'get' && !config.params) {
    config.params = { lang: language };
  } else if (config.method === 'get' && config.params) {
    config.params.lang = language;
  }
  
  return config;
});

// Campaign API
export const campaignAPI = {
  getAll: () => api.get('/campaigns/all'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns/create', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`)
};

// Question API
export const questionAPI = {
  getAll: () => api.get('/questions/all'),
  getByCampaign: (campaignId) => api.get(`/questions/campaign/${campaignId}`),
  getByCustomer: () => api.get('/questions/customer'),
  create: (data) => api.post('/questions/create', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`)
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

## 📊 Özet Tablo

| Endpoint | Request Format | Response Format | Dil Parametresi |
|----------|---------------|-----------------|-----------------|
| `POST /campaigns/create` | `{ title: { tr, en }, ... }` | `{ title: { tr, en }, ... }` | ❌ |
| `GET /campaigns/all` | - | `{ title: String, language: String }` | ✅ `?lang=tr` |
| `GET /campaigns/:id` | - | `{ title: String, language: String }` | ✅ `?lang=tr` |
| `PUT /campaigns/:id` | `{ title: { tr, en }, ... }` | `{ title: { tr, en }, ... }` | ❌ |
| `POST /questions/create` | `{ questionText: { tr, en }, ... }` | `{ questionText: { tr, en }, ... }` | ❌ |
| `GET /questions/campaign/:id` | - | `{ questionText: String, language: String }` | ✅ `?lang=tr` |
| `PUT /questions/:id` | `{ questionText: { tr, en }, ... }` | `{ questionText: { tr, en }, ... }` | ❌ |

---

## 🔄 Migration Checklist

- [ ] Tüm `title`, `description` alanlarını `{ tr, en }` formatına çevir
- [ ] Tüm `content[].itemTitle`, `content[].itemDescription` alanlarını çoklu dil formatına çevir
- [ ] Tüm `questionText`, `options[].text` alanlarını çoklu dil formatına çevir
- [ ] Tüm GET request'lerine `?lang=tr` veya `?lang=en` parametresi ekle
- [ ] Response'larda `title`, `description` artık string olduğunu kabul et
- [ ] Form'larda her alan için iki input ekle (TR ve EN)
- [ ] Validation'da her iki dilin dolu olduğundan emin ol
- [ ] Dil seçimi için state/context ekle
- [ ] API client'a dil parametresi ekleme mantığı ekle

---

## 📞 Destek

Sorularınız için backend ekibi ile iletişime geçin.

---

**Son Güncelleme:** 2024-12-19  
**Versiyon:** 1.0.0  
**Durum:** ✅ Production Ready

