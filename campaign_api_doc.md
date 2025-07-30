# 🎯 Kampanya ve Soru Yönetimi API Dokümantasyonu

**Frontend Geliştirici Rehberi**

![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)

---

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🔐 Kimlik Doğrulama](#-kimlik-doğrulama)
- [📡 Kampanya API Endpoints](#-kampanya-api-endpoints)
- [❓ Soru API Endpoints](#-soru-api-endpoints)
- [📊 Veri Modelleri](#-veri-modelleri)
- [❌ Hata Yönetimi](#-hata-yönetimi)
- [🔧 Entegrasyon Örnekleri](#-entegrasyon-örnekleri)

---

## 🚀 Hızlı Başlangıç

### Base URL
```
Development: http://localhost:5005/api/v1
Production: https://your-domain.com/api/v1
```

### Content-Type
```
Content-Type: application/json
```

### Response Format
Tüm API yanıtları aşağıdaki standart formatta döner:

```json
{
  "success": true,
  "error": false,
  "message": "İşlem başarılı",
  "data": { /* response data */ },
  "code": 200
}
```

---

## 🔐 Kimlik Doğrulama

### JWT Token Kullanımı

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Gerekli Roller:**
- `admin`: Tüm işlemler
- `customer`: Kendi kampanyalarını yönetebilir
- `user`: Kampanyaları görüntüleyebilir ve katılabilir

---

## 📡 Kampanya API Endpoints

### 1. Kampanya Oluşturma

**Endpoint:** `POST /campaigns/create`

**Yetki:** Admin veya Customer

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Blockchain Eğitimi",
  "description": "Blockchain teknolojilerini öğrenin",
  "content": "Detaylı eğitim içeriği burada yer alacak...",
  "reward": 100,
  "maxParticipants": 50,
  "category": "education",
  "difficulty": "Beginner",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-02-15T23:59:59.000Z",
  "questions": 5,
  "estimatedDuration": 20,
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "videoUrl": "https://www.youtube.com/watch?v=example"
}
```

**Validation Kuralları:**
- `title`: 1-100 karakter, zorunlu
- `description`: 1-500 karakter, zorunlu
- `content`: 0-2000 karakter, opsiyonel
- `reward`: 0+ sayı, zorunlu
- `maxParticipants`: 1+ sayı, varsayılan 100
- `category`: education, technology, health, finance, sports, entertainment, other
- `difficulty`: Beginner, Intermediate, Advanced
- `startDate`: Geçerli tarih, zorunlu
- `endDate`: Geçerli tarih, zorunlu (startDate'den sonra olmalı)
- `questions`: 1+ sayı, varsayılan 5
- `estimatedDuration`: 1+ dakika, varsayılan 15
- `imageUrls`: Maksimum 10 URL
- `videoUrl`: YouTube, Vimeo vb. geçerli URL

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya başarıyla oluşturuldu",
  "data": {
    "_id": "campaign_id",
    "title": "Blockchain Eğitimi",
    "description": "Blockchain teknolojilerini öğrenin",
    "content": "Detaylı eğitim içeriği...",
    "reward": 100,
    "maxParticipants": 50,
    "participants": 0,
    "currentParticipants": 0,
    "category": "education",
    "difficulty": "Beginner",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T23:59:59.000Z",
    "questions": 5,
    "estimatedDuration": 20,
    "imageUrls": ["https://example.com/image1.jpg"],
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "isActive": true,
    "createdBy": "user_id",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 201
}
```

### 2. Tüm Kampanyaları Getir

**Endpoint:** `GET /campaigns/all`

**Yetki:** Public (herkes)

**Headers:**
```
Content-Type: application/json
```

**Query Parameters:**
```
?category=education&difficulty=Beginner&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Tüm kampanyalar getirildi",
  "data": {
    "campaigns": [
      {
        "_id": "campaign_id",
        "title": "Blockchain Eğitimi",
        "description": "Blockchain teknolojilerini öğrenin",
        "reward": 100,
        "maxParticipants": 50,
        "participants": 25,
        "currentParticipants": 20,
        "category": "education",
        "difficulty": "Beginner",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-02-15T23:59:59.000Z",
        "questions": 5,
        "estimatedDuration": 20,
        "imageUrls": ["https://example.com/image1.jpg"],
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  },
  "code": 200
}
```

### 3. Kampanya Detayı Getir

**Endpoint:** `GET /campaigns/:id`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya getirildi",
  "data": {
    "_id": "campaign_id",
    "title": "Blockchain Eğitimi",
    "description": "Blockchain teknolojilerini öğrenin",
    "content": "Detaylı eğitim içeriği...",
    "reward": 100,
    "maxParticipants": 50,
    "participants": 25,
    "currentParticipants": 20,
    "category": "education",
    "difficulty": "Beginner",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T23:59:59.000Z",
    "questions": 5,
    "estimatedDuration": 20,
    "imageUrls": ["https://example.com/image1.jpg"],
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "isActive": true,
    "createdBy": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 4. Kampanyaya Katıl

**Endpoint:** `POST /campaigns/:id/join`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanyaya başarıyla katıldınız",
  "data": {
    "campaignId": "campaign_id",
    "userId": "user_id",
    "status": "active",
    "progress": 0,
    "startedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 5. Progress Güncelle

**Endpoint:** `PUT /campaigns/:id/progress`

**Yetki:** Kampanyaya katılmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "progress": 60,
  "currentQuestion": 3,
  "answers": [
    {
      "questionId": "question_id_1",
      "selectedOption": 2,
      "isCorrect": true
    },
    {
      "questionId": "question_id_2",
      "selectedOption": 1,
      "isCorrect": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Progress başarıyla güncellendi",
  "data": {
    "campaignId": "campaign_id",
    "userId": "user_id",
    "progress": 60,
    "currentQuestion": 3,
    "totalQuestions": 5,
    "correctAnswers": 2,
    "lastUpdated": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 6. Quiz Tamamla

**Endpoint:** `POST /campaigns/:id/complete`

**Yetki:** Kampanyaya katılmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question_id_1",
      "selectedOption": 2
    },
    {
      "questionId": "question_id_2",
      "selectedOption": 1
    },
    {
      "questionId": "question_id_3",
      "selectedOption": 3
    },
    {
      "questionId": "question_id_4",
      "selectedOption": 0
    },
    {
      "questionId": "question_id_5",
      "selectedOption": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Quiz başarıyla tamamlandı",
  "data": {
    "campaignId": "campaign_id",
    "userId": "user_id",
    "score": 80,
    "totalQuestions": 5,
    "correctAnswers": 4,
    "reward": 100,
    "completedAt": "2024-01-10T10:00:00.000Z",
    "certificate": "https://example.com/certificate.pdf"
  },
  "code": 200
}
```

### 7. Kampanya Güncelle

**Endpoint:** `PUT /campaigns/:id`

**Yetki:** Admin veya Kampanya Sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:** (Oluşturma ile aynı format, tüm alanlar opsiyonel)

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya başarıyla güncellendi",
  "data": {
    "_id": "campaign_id",
    "title": "Güncellenmiş Blockchain Eğitimi",
    "description": "Güncellenmiş açıklama",
    "updatedAt": "2024-01-10T11:00:00.000Z"
  },
  "code": 200
}
```

### 8. Kampanya Silme İsteği

**Endpoint:** `DELETE /campaigns/:id/request-delete`

**Yetki:** Admin veya Kampanya Sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya silme isteği gönderildi",
  "data": {
    "campaignId": "campaign_id",
    "status": "pending_deletion",
    "requestedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

---

## ❓ Soru API Endpoints

### 1. Soru Oluşturma

**Endpoint:** `POST /questions/create`

**Yetki:** Admin veya Customer

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionText": "Blockchain'in temel özelliği nedir?",
  "options": [
    {
      "text": "Merkezi yönetim",
      "isTrue": false
    },
    {
      "text": "Değiştirilemezlik",
      "isTrue": true
    },
    {
      "text": "Hızlı işlem",
      "isTrue": false
    },
    {
      "text": "Düşük maliyet",
      "isTrue": false
    }
  ],
  "campaignId": "campaign_id",
  "order": 1
}
```

**Validation Kuralları:**
- `questionText`: 1-300 karakter, zorunlu
- `options`: Tam olarak 4 seçenek, zorunlu
- `campaignId`: Geçerli kampanya ID, zorunlu
- `order`: 0+ sayı, varsayılan 0
- **Önemli:** Sadece bir seçenek `isTrue: true` olmalı

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla oluşturuldu",
  "data": {
    "_id": "question_id",
    "questionText": "Blockchain'in temel özelliği nedir?",
    "options": [
      {
        "text": "Merkezi yönetim",
        "isTrue": false
      },
      {
        "text": "Değiştirilemezlik",
        "isTrue": true
      },
      {
        "text": "Hızlı işlem",
        "isTrue": false
      },
      {
        "text": "Düşük maliyet",
        "isTrue": false
      }
    ],
    "campaignId": "campaign_id",
    "order": 1,
    "createdBy": "user_id",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 201
}
```

### 2. Kampanyaya Ait Soruları Getir

**Endpoint:** `GET /questions/campaign/:campaignId`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanyaya ait sorular getirildi",
  "data": [
    {
      "_id": "question_id_1",
      "questionText": "Blockchain'in temel özelliği nedir?",
      "options": [
        {
          "text": "Merkezi yönetim",
          "isTrue": false
        },
        {
          "text": "Değiştirilemezlik",
          "isTrue": true
        },
        {
          "text": "Hızlı işlem",
          "isTrue": false
        },
        {
          "text": "Düşük maliyet",
          "isTrue": false
        }
      ],
      "order": 1
    },
    {
      "_id": "question_id_2",
      "questionText": "Bitcoin'in yaratıcısı kimdir?",
      "options": [
        {
          "text": "Vitalik Buterin",
          "isTrue": false
        },
        {
          "text": "Satoshi Nakamoto",
          "isTrue": true
        },
        {
          "text": "Mark Zuckerberg",
          "isTrue": false
        },
        {
          "text": "Elon Musk",
          "isTrue": false
        }
      ],
      "order": 2
    }
  ],
  "code": 200
}
```

### 3. Soru Güncelleme

**Endpoint:** `PUT /questions/:id`

**Yetki:** Admin veya Soru Sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:** (Oluşturma ile aynı format, tüm alanlar opsiyonel)

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla güncellendi",
  "data": {
    "_id": "question_id",
    "questionText": "Güncellenmiş soru metni",
    "options": [
      {
        "text": "Güncellenmiş seçenek 1",
        "isTrue": false
      },
      {
        "text": "Güncellenmiş seçenek 2",
        "isTrue": true
      },
      {
        "text": "Güncellenmiş seçenek 3",
        "isTrue": false
      },
      {
        "text": "Güncellenmiş seçenek 4",
        "isTrue": false
      }
    ],
    "order": 2,
    "updatedAt": "2024-01-10T11:00:00.000Z"
  },
  "code": 200
}
```

### 4. Soru Silme

**Endpoint:** `DELETE /questions/:id`

**Yetki:** Admin veya Soru Sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla silindi",
  "data": {
    "deletedQuestionId": "question_id",
    "deletedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

---

## 📊 Veri Modelleri

### Kampanya Modeli

```json
{
  "_id": "ObjectId",
  "title": "String (1-100 karakter)",
  "description": "String (1-500 karakter)",
  "content": "String (0-2000 karakter)",
  "reward": "Number (0+)",
  "maxParticipants": "Number (1+)",
  "participants": "Number (0+)",
  "currentParticipants": "Number (0+)",
  "category": "String (enum)",
  "difficulty": "String (enum)",
  "startDate": "Date",
  "endDate": "Date",
  "questions": "Number (1+)",
  "estimatedDuration": "Number (1+)",
  "imageUrls": "Array<String> (max 10)",
  "videoUrl": "String (URL)",
  "isActive": "Boolean",
  "createdBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Soru Modeli

```json
{
  "_id": "ObjectId",
  "questionText": "String (1-300 karakter)",
  "options": [
    {
      "text": "String",
      "isTrue": "Boolean"
    }
  ],
  "campaignId": "ObjectId (ref: Campaign)",
  "order": "Number (0+)",
  "createdBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Kullanıcı Progress Modeli

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "campaignId": "ObjectId (ref: Campaign)",
  "status": "String (active, completed, abandoned)",
  "progress": "Number (0-100)",
  "currentQuestion": "Number",
  "answers": [
    {
      "questionId": "ObjectId",
      "selectedOption": "Number",
      "isCorrect": "Boolean"
    }
  ],
  "score": "Number",
  "startedAt": "Date",
  "completedAt": "Date"
}
```

---

## ❌ Hata Yönetimi

### Hata Response Formatı

```json
{
  "success": false,
  "error": true,
  "message": "Hata açıklaması",
  "errors": ["Detaylı hata listesi"],
  "code": 400
}
```

### Yaygın Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Bad Request - Validation hatası |
| 401 | Unauthorized - Token gerekli |
| 403 | Forbidden - Yetki yetersiz |
| 404 | Not Found - Kaynak bulunamadı |
| 409 | Conflict - Çakışma (örn: zaten katılmış) |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

### Validation Hataları

```json
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "errors": [
    "Kampanya başlığı boş olamaz",
    "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
    "Sadece bir adet doğru cevap olmalıdır"
  ],
  "code": 400
}
```

---

## 🔧 Entegrasyon Örnekleri

### JavaScript/React Örneği

```javascript
// Kampanya oluşturma
const createCampaign = async (campaignData) => {
  try {
    const response = await fetch('/api/v1/campaigns/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(campaignData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Kampanya oluşturuldu:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Kampanya oluşturma hatası:', error);
    throw error;
  }
};

// Soru oluşturma
const createQuestion = async (questionData) => {
  try {
    const response = await fetch('/api/v1/questions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(questionData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Soru oluşturuldu:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Soru oluşturma hatası:', error);
    throw error;
  }
};

// Kampanya listesi getirme
const getCampaigns = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/v1/campaigns/all?${queryParams}`);
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Kampanya listesi hatası:', error);
    throw error;
  }
};
```

### Form Validation Örneği

```javascript
// Kampanya form validation
const validateCampaignForm = (data) => {
  const errors = [];
  
  if (!data.title || data.title.length < 1) {
    errors.push('Kampanya başlığı zorunludur');
  }
  
  if (data.title && data.title.length > 100) {
    errors.push('Kampanya başlığı en fazla 100 karakter olmalıdır');
  }
  
  if (!data.description || data.description.length < 1) {
    errors.push('Kampanya açıklaması zorunludur');
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('Kampanya açıklaması en fazla 500 karakter olmalıdır');
  }
  
  if (!data.reward || data.reward < 0) {
    errors.push('Ödül miktarı 0 veya daha büyük olmalıdır');
  }
  
  if (!data.startDate || !data.endDate) {
    errors.push('Başlangıç ve bitiş tarihi zorunludur');
  }
  
  if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
    errors.push('Bitiş tarihi başlangıç tarihinden sonra olmalıdır');
  }
  
  return errors;
};

// Soru form validation
const validateQuestionForm = (data) => {
  const errors = [];
  
  if (!data.questionText || data.questionText.length < 1) {
    errors.push('Soru metni zorunludur');
  }
  
  if (data.questionText && data.questionText.length > 300) {
    errors.push('Soru metni en fazla 300 karakter olmalıdır');
  }
  
  if (!data.options || data.options.length !== 4) {
    errors.push('Tam olarak 4 seçenek olmalıdır');
  }
  
  if (data.options) {
    const trueCount = data.options.filter(opt => opt.isTrue === true).length;
    if (trueCount !== 1) {
      errors.push('Sadece bir adet doğru cevap olmalıdır');
    }
    
    data.options.forEach((option, index) => {
      if (!option.text || option.text.length < 1) {
        errors.push(`Seçenek ${index + 1} metni zorunludur`);
      }
    });
  }
  
  if (!data.campaignId) {
    errors.push('Kampanya ID zorunludur');
  }
  
  return errors;
};
```

---

## 📝 Notlar

1. **Rate Limiting**: API istekleri rate limiting ile korunmaktadır
2. **Validation**: Tüm input'lar server-side validation'dan geçer
3. **Error Handling**: Hatalar standart format ile döner
4. **Pagination**: Liste endpoint'leri pagination destekler
5. **File Upload**: Resim yükleme için ayrı upload endpoint'i kullanın

---

**Son güncelleme**: 2024-12-19  
**Versiyon**: 2.0.0  
**Status**: ✅ Production Ready 