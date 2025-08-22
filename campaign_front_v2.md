# 🎯 Kampanya API Dokümantasyonu v2.0

**Frontend Geliştirici Rehberi - Customer & Admin Panelleri**

![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)
![Auth](https://img.shields.io/badge/Auth-JWT%20Required-red.svg)

---

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🔐 Kimlik Doğrulama](#-kimlik-doğrulama)
- [📊 Veri Modelleri](#-veri-modelleri)
- [📡 Kampanya API Endpoints](#-kampanya-api-endpoints)
- [❓ Soru API Endpoints](#-soru-api-endpoints)
- [❌ Hata Yönetimi](#-hata-yönetimi)
- [🔧 Entegrasyon Örnekleri](#-entegrasyon-örnekleri)
- [🎨 UI/UX Önerileri](#-uiux-önerileri)

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

### Kullanıcı Rolleri
| Rol | Açıklama | Kampanya Yetkileri |
|-----|----------|-------------------|
| `admin` | Sistem yöneticisi | Tüm kampanyaları görür, düzenler, siler |
| `customer` | Kampanya sahibi | Kendi kampanyalarını oluşturur, düzenler |
| `user` | Normal kullanıcı | Kampanyaları görür, katılır |

---

## 📊 Veri Modelleri

### Campaign Model
```typescript
interface Campaign {
  _id: string;
  title: string;                    // 1-100 karakter
  description: string;              // 1-500 karakter
  content: CampaignContent[];       // İçerik dizisi
  reward: number;                   // Ödül miktarı
  maxParticipants: {                // Segment bazlı limitler
    A: number;
    B: number;
    C: number;
    D: number;
  };
  currentParticipants: {            // Mevcut katılımcılar
    A: number;
    B: number;
    C: number;
    D: number;
  };
  category: CampaignCategory;       // Kategori
  startDate: string;                // ISO date string
  endDate: string;                  // ISO date string
  questions: number;                // Soru sayısı
  estimatedDuration: number;        // Dakika cinsinden
  questionIds: string[];            // Soru ID'leri
  images: string[];                 // Resim URL'leri
  videoUrl: string;                 // Video URL'i
  tags: string[];                   // Etiketler
  createdUserId: string;            // Oluşturan kullanıcı ID'si
  status: CampaignStatus;           // Durum
  isActive: boolean;                // Aktif mi? (Customer: false, Admin: true)
  isAdminAccept: boolean;           // Admin onayı (Customer: false, Admin: true)
  createdAt: string;                // ISO date string
  updatedAt: string;                // ISO date string
}

interface CampaignContent {
  itemImage: string;                // Resim URL'i
  itemVideo: string;                // Video URL'i
  itemTitle: string;                // Başlık (max 500 karakter)
  itemDescription: string;          // Açıklama (max 500 karakter)
  itemIndex: number;                // Sıra numarası
}

type CampaignCategory = 
  | 'education' 
  | 'technology' 
  | 'health' 
  | 'finance' 
  | 'sports' 
  | 'entertainment' 
  | 'other';

type CampaignStatus = 
  | 'active' 
  | 'inactive' 
  | 'expired' 
  | 'upcoming';
```

### UserProgress Model
```typescript
interface UserProgress {
  _id: string;
  userId: string;
  campaignId: string;
  joined: boolean;
  completed: boolean;
  score: number | null;             // 0-100 arası
  timeSpent: number;                // Saniye cinsinden
  progress: {
    currentQuestion: number;
    totalQuestions: number;
    answeredQuestions: number[];
    correctAnswers: number;
    wrongAnswers: number;
    lastActivity: string;           // ISO date string
  };
  startedAt: string | null;         // ISO date string
  completedAt: string | null;       // ISO date string
}
```

### Question Model
```typescript
interface Question {
  _id: string;
  questionText: string;             // 1-300 karakter
  options: QuestionOption[];        // Tam olarak 4 seçenek
  createdUserId: string;            // Oluşturan kullanıcı ID'si
  order: number;                    // Soru sırası
  createdAt: string;                // ISO date string
  updatedAt: string;                // ISO date string
}

interface QuestionOption {
  text: string;                     // Seçenek metni
  isTrue: boolean;                  // Doğru cevap mı?
}
```

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
  "description": "Blockchain teknolojilerini öğrenin ve ödül kazanın",
  "content": [
    {
      "itemImage": "https://example.com/image1.jpg",
      "itemVideo": "https://youtube.com/watch?v=example1",
      "itemTitle": "Bölüm 1: Blockchain Temelleri",
      "itemDescription": "Blockchain'in temel kavramlarını öğrenin",
      "itemIndex": 1
    },
    {
      "itemImage": "https://example.com/image2.jpg",
      "itemVideo": "https://youtube.com/watch?v=example2",
      "itemTitle": "Bölüm 2: Smart Contracts",
      "itemDescription": "Akıllı kontratların nasıl çalıştığını keşfedin",
      "itemIndex": 2
    }
  ],
  "reward": 100,
  "maxParticipants": {
    "A": 50,
    "B": 100,
    "C": 150,
    "D": 200
  },
  "category": "education",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-02-15T23:59:59.000Z",
  "questions": 10,
  "estimatedDuration": 30,
  "images": [
    "https://example.com/campaign-banner.jpg"
  ],
  "videoUrl": "https://youtube.com/watch?v=campaign-intro",
  "tags": ["blockchain", "eğitim", "crypto"]
}
```

**Validation Kuralları:**
- `title`: 1-100 karakter, zorunlu
- `description`: 1-500 karakter, zorunlu
- `content`: Array, her item için:
  - `itemTitle`: max 500 karakter
  - `itemDescription`: max 500 karakter
  - `itemIndex`: 0+ sayı
- `reward`: 0+ sayı, zorunlu
- `maxParticipants`: Her segment için 0+ sayı
- `category`: Geçerli kategori değeri
- `startDate`: Geçerli tarih, zorunlu
- `endDate`: startDate'den sonra olmalı
- `questions`: 1+ sayı, varsayılan 5
- `estimatedDuration`: 1+ dakika, varsayılan 15
- `images`: max 10 URL
- `videoUrl`: Geçerli URL (opsiyonel)

**Önemli Notlar:**
- **Customer** oluşturursa: `isActive: false`, `isAdminAccept: false`
- **Admin** oluşturursa: `isActive: true`, `isAdminAccept: true`

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya başarıyla oluşturuldu",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Blockchain Eğitimi",
    "description": "Blockchain teknolojilerini öğrenin ve ödül kazanın",
    "content": [...],
    "reward": 100,
    "maxParticipants": {
      "A": 50,
      "B": 100,
      "C": 150,
      "D": 200
    },
    "currentParticipants": {
      "A": 0,
      "B": 0,
      "C": 0,
      "D": 0
    },
    "category": "education",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T23:59:59.000Z",
    "questions": 10,
    "estimatedDuration": 30,
    "images": ["https://example.com/campaign-banner.jpg"],
    "videoUrl": "https://youtube.com/watch?v=campaign-intro",
    "tags": ["blockchain", "eğitim", "crypto"],
    "createdUserId": "507f1f77bcf86cd799439012",
    "status": "upcoming",
    "isActive": false,
    "isAdminAccept": false,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 201,
  "isAdmin": false,
  "isAdminAccept": false
}
```

### 2. Tüm Kampanyaları Getir

**Endpoint:** `GET /campaigns/all`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?category=education&status=active&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Tüm kampanyalar getirildi",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Blockchain Eğitimi",
      "description": "Blockchain teknolojilerini öğrenin",
      "reward": 100,
      "maxParticipants": {
        "A": 50,
        "B": 100,
        "C": 150,
        "D": 200
      },
      "currentParticipants": {
        "A": 25,
        "B": 45,
        "C": 60,
        "D": 80
      },
      "category": "education",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-02-15T23:59:59.000Z",
      "questions": 10,
      "estimatedDuration": 30,
      "images": ["https://example.com/banner.jpg"],
      "status": "active",
      "isActive": true,
      "isAdminAccept": true,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "code": 200
}
```

### 3. Kampanya Detayı Getir

**Endpoint:** `GET /campaigns/:id`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya getirildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Blockchain Eğitimi",
    "description": "Blockchain teknolojilerini öğrenin ve ödül kazanın",
    "content": [
      {
        "itemImage": "https://example.com/image1.jpg",
        "itemVideo": "https://youtube.com/watch?v=example1",
        "itemTitle": "Bölüm 1: Blockchain Temelleri",
        "itemDescription": "Blockchain'in temel kavramlarını öğrenin",
        "itemIndex": 1
      }
    ],
    "reward": 100,
    "maxParticipants": {
      "A": 50,
      "B": 100,
      "C": 150,
      "D": 200
    },
    "currentParticipants": {
      "A": 25,
      "B": 45,
      "C": 60,
      "D": 80
    },
    "category": "education",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T23:59:59.000Z",
    "questions": 10,
    "estimatedDuration": 30,
    "images": ["https://example.com/banner.jpg"],
    "videoUrl": "https://youtube.com/watch?v=intro",
    "tags": ["blockchain", "eğitim"],
    "status": "active",
    "isActive": true,
    "isAdminAccept": true,
    "createdUserId": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 4. Kullanıcı Progress'i Getir

**Endpoint:** `GET /campaigns/:id/user-progress`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kullanıcı progress'i getirildi",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "joined": true,
    "completed": false,
    "score": null,
    "timeSpent": 450,
    "progress": {
      "currentQuestion": 3,
      "totalQuestions": 10,
      "answeredQuestions": [0, 1, 2],
      "correctAnswers": 3,
      "wrongAnswers": 0,
      "lastActivity": "2024-01-10T10:30:00.000Z"
    },
    "startedAt": "2024-01-10T10:00:00.000Z",
    "completedAt": null
  },
  "code": 200
}
```

### 5. Kampanyaya Katıl

**Endpoint:** `POST /campaigns/:id/join`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:** (Boş)

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanyaya başarıyla katıldınız",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "joined": true,
    "message": "Successfully joined/continued the campaign."
  },
  "code": 200
}
```

### 6. Progress Güncelle

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
  "questionId": "507f1f77bcf86cd799439013",
  "selectedAnswer": 2,
  "isCorrect": true,
  "timeSpent": 30,
  "completed": false
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Progress güncellendi",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "progress": {
      "currentQuestion": 4,
      "totalQuestions": 10,
      "answeredQuestions": [0, 1, 2, 3],
      "correctAnswers": 4,
      "wrongAnswers": 0,
      "lastActivity": "2024-01-10T10:35:00.000Z"
    },
    "score": null,
    "completed": false
  },
  "code": 200
}
```

### 7. Quiz Tamamla

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
  "totalTimeSpent": 1800,
  "score": 100,
  "questionsAnswered": 10,
  "totalQuestions": 10
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Quiz tamamlandı",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "completed": true,
    "completedAt": "2024-01-10T11:00:00.000Z",
    "score": 100,
    "totalTimeSpent": 1800
  },
  "code": 200
}
```

### 8. Kampanya Güncelle

**Endpoint:** `PUT /campaigns/:id`

**Yetki:** Admin veya kampanya sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Güncellenmiş Blockchain Eğitimi",
  "description": "Güncellenmiş açıklama",
  "reward": 150,
  "maxParticipants": {
    "A": 60,
    "B": 120,
    "C": 180,
    "D": 240
  },
  "isAdminAccept": true
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya güncellendi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Güncellenmiş Blockchain Eğitimi",
    "description": "Güncellenmiş açıklama",
    "reward": 150,
    "maxParticipants": {
      "A": 60,
      "B": 120,
      "C": 180,
      "D": 240
    },
    "isAdminAccept": true,
    "updatedAt": "2024-01-10T12:00:00.000Z"
  },
  "code": 200,
  "isAdmin": true,
  "isAdminAccept": true
}
```

### 9. Müşteri Kampanyaları

**Endpoint:** `GET /campaigns/customer/list`

**Yetki:** Customer rolü

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Müşteriye ait kampanyalar getirildi",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Benim Kampanyam",
      "description": "Kendi oluşturduğum kampanya",
      "reward": 100,
      "status": "active",
      "isActive": false,
      "isAdminAccept": false,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "code": 200
}
```

### 10. Kampanya Silme İsteği

**Endpoint:** `DELETE /campaigns/:id/request-delete`

**Yetki:** Admin veya kampanya sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya silme isteği gönderildi. Admin onayı bekleniyor.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Silinecek Kampanya",
    "isActive": false,
    "status": "pending_deletion",
    "updatedAt": "2024-01-10T12:00:00.000Z"
  },
  "code": 200
}
```

### 11. Kampanya Sil (Kalıcı)

**Endpoint:** `DELETE /campaigns/:id`

**Yetki:** Sadece Admin

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Önemli Not:** Admin kampanyayı sildiğinde veritabanından **tamamen silinir**.

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanya silindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Silinen Kampanya"
  },
  "code": 200
}
```

### 12. Silme İstekleri

**Endpoint:** `GET /campaigns/admin/delete-requests`

**Yetki:** Sadece Admin

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Silme istekleri getirildi",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Silme İsteği Olan Kampanya",
      "description": "Bu kampanya silinmek istiyor",
      "createdUserId": "507f1f77bcf86cd799439012",
      "status": "pending_deletion",
      "isActive": false,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
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
  "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
  "options": [
    {
      "text": "Merkezi kontrol",
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
  "campaignId": "507f1f77bcf86cd799439011",
  "order": 1
}
```

**Validation Kuralları:**
- `questionText`: 1-300 karakter, zorunlu
- `options`: Tam olarak 4 seçenek, zorunlu
- `campaignId`: Geçerli kampanya ID'si, zorunlu
- `order`: Soru sırası (opsiyonel)
- **Sadece 1 seçenek `isTrue: true` olmalı**

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla oluşturuldu",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
    "options": [
      {
        "text": "Merkezi kontrol",
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
    "createdUserId": "507f1f77bcf86cd799439012",
    "order": 1,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 201
}
```

### 2. Tüm Soruları Getir

**Endpoint:** `GET /questions/all`

**Yetki:** Sadece Admin

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Tüm sorular getirildi",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
      "options": [...],
      "createdUserId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "order": 1,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "code": 200
}
```

### 3. Kampanyaya Ait Soruları Getir

**Endpoint:** `GET /questions/campaign/:campaignId`

**Yetki:** Giriş yapmış kullanıcılar

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kampanyaya ait sorular getirildi",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
      "options": [...],
      "createdUserId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "order": 1,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "code": 200
}
```

### 4. Müşteriye Ait Soruları Getir

**Endpoint:** `GET /questions/customer`

**Yetki:** Customer rolü

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Müşteriye ait sorular getirildi",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
      "options": [...],
      "order": 1,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "code": 200
}
```

### 5. Soru Güncelle

**Endpoint:** `PUT /questions/:id`

**Yetki:** Admin veya soru sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionText": "Güncellenmiş soru metni",
  "options": [
    {
      "text": "Seçenek 1",
      "isTrue": false
    },
    {
      "text": "Seçenek 2",
      "isTrue": true
    },
    {
      "text": "Seçenek 3",
      "isTrue": false
    },
    {
      "text": "Seçenek 4",
      "isTrue": false
    }
  ],
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla güncellendi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "questionText": "Güncellenmiş soru metni",
    "options": [...],
    "createdUserId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "order": 2,
    "updatedAt": "2024-01-10T12:00:00.000Z"
  },
  "code": 200
}
```

### 6. Soru Sil

**Endpoint:** `DELETE /questions/:id`

**Yetki:** Admin veya soru sahibi

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Önemli Not:** Soru silindiğinde, bu soruyu içeren tüm kampanyalardan da otomatik olarak çıkarılır.

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Soru başarıyla silindi",
  "data": {
    "message": "Soru silindi."
  },
  "code": 200
}
```

---

## ❌ Hata Yönetimi

### Hata Response Formatı
```json
{
  "success": false,
  "error": true,
  "message": "Hata mesajı",
  "code": 400
}
```

### Yaygın Hata Kodları

| Kod | Açıklama | Çözüm |
|-----|----------|-------|
| `400` | Bad Request | Request body'yi kontrol edin |
| `401` | Unauthorized | JWT token'ı kontrol edin |
| `403` | Forbidden | Yetkinizi kontrol edin |
| `404` | Not Found | ID'yi kontrol edin |
| `409` | Conflict | Duplicate kayıt |
| `422` | Validation Error | Validation kurallarını kontrol edin |
| `500` | Server Error | Sunucu hatası |

### Özel Hata Mesajları

#### Kampanya Katılım Hataları
```json
{
  "success": false,
  "error": true,
  "message": "You have already completed this campaign.",
  "code": 400
}
```

```json
{
  "success": false,
  "error": true,
  "message": "The quota for campaign segment A is full.",
  "code": 400
}
```

#### Soru Validation Hataları
```json
{
  "success": false,
  "error": true,
  "message": "Tam olarak 4 seçenek olmalı.",
  "code": 400
}
```

```json
{
  "success": false,
  "error": true,
  "message": "Sadece bir adet doğru cevap olmalıdır.",
  "code": 400
}
```

#### Yetki Hataları
```json
{
  "success": false,
  "error": true,
  "message": "You do not have permission to update this campaign.",
  "code": 403
}
```

---

## 🔧 Entegrasyon Örnekleri

### React Hook Örneği
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.get('/api/v1/campaigns/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { campaigns, loading, error, refetch: fetchCampaigns };
};
```

### Kampanya Oluşturma Örneği
```typescript
const createCampaign = async (campaignData) => {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await axios.post('/api/v1/campaigns/create', campaignData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      // Başarılı oluşturma
      return response.data.data;
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Kampanya oluşturulamadı');
  }
};
```

### Soru Oluşturma Örneği
```typescript
const createQuestion = async (questionData) => {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await axios.post('/api/v1/questions/create', questionData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Soru oluşturulamadı');
  }
};
```

### Progress Takibi Örneği
```typescript
const updateProgress = async (campaignId, progressData) => {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await axios.put(
      `/api/v1/campaigns/${campaignId}/progress`,
      progressData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Progress güncellenemedi');
  }
};
```

---

## 🎨 UI/UX Önerileri

### Admin Panel Önerileri

#### 1. Kampanya Yönetimi Dashboard
```typescript
interface AdminDashboard {
  totalCampaigns: number;
  activeCampaigns: number;
  pendingApprovals: number;
  totalParticipants: number;
  recentCampaigns: Campaign[];
  deleteRequests: Campaign[];
}
```

#### 2. Kampanya Onay Sistemi
- **Onay Bekleyen Kampanyalar** listesi (`isAdminAccept: false`)
- **Toplu Onay** özelliği
- **Reddetme** sebepleri
- **Onay Geçmişi** takibi

#### 3. İstatistik Görünümü
- **Segment Bazlı Katılım** grafikleri
- **Kampanya Performans** metrikleri
- **Kullanıcı İlerleme** raporları
- **Ödül Dağıtım** istatistikleri

### Customer Panel Önerileri

#### 1. Kampanya Oluşturma Formu
```typescript
interface CampaignForm {
  // Temel Bilgiler
  title: string;
  description: string;
  category: CampaignCategory;
  
  // İçerik Yönetimi
  content: CampaignContent[];
  
  // Ayarlar
  reward: number;
  maxParticipants: SegmentLimits;
  startDate: Date;
  endDate: Date;
  questions: number;
  estimatedDuration: number;
  
  // Medya
  images: File[];
  videoUrl: string;
  tags: string[];
}
```

#### 2. Kampanya Durumu Takibi
- **Draft** kampanyalar
- **Onay Bekleyen** kampanyalar (`isAdminAccept: false`)
- **Aktif** kampanyalar (`isActive: true`)
- **Tamamlanan** kampanyalar

#### 3. Soru Yönetimi
- **Soru Oluşturma** formu
- **Soru Listesi** görünümü
- **Soru Düzenleme** modal'ı
- **Soru Silme** onayı

### Genel UI Bileşenleri

#### 1. Kampanya Kartı
```typescript
interface CampaignCard {
  campaign: Campaign;
  userProgress?: UserProgress;
  onJoin: (campaignId: string) => void;
  onView: (campaignId: string) => void;
  showStatus?: boolean; // isActive, isAdminAccept durumları
}
```

#### 2. Progress Bar
```typescript
interface ProgressBar {
  current: number;
  total: number;
  showPercentage: boolean;
  variant: 'primary' | 'success' | 'warning';
}
```

#### 3. Segment Badge
```typescript
interface SegmentBadge {
  segment: 'A' | 'B' | 'C' | 'D';
  current: number;
  max: number;
  variant: 'available' | 'full' | 'limited';
}
```

#### 4. Soru Kartı
```typescript
interface QuestionCard {
  question: Question;
  onEdit: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  showActions?: boolean;
}
```

### Responsive Tasarım Önerileri

#### Mobile-First Yaklaşım
- **Kampanya listesi**: Card layout
- **Form elemanları**: Full-width inputs
- **Progress takibi**: Swipe gestures
- **Navigation**: Bottom tab bar

#### Desktop Optimizasyonu
- **Dashboard**: Multi-column layout
- **Kampanya editörü**: Side-by-side preview
- **İstatistikler**: Interactive charts
- **Bulk actions**: Checkbox selection

---

## 📱 Frontend Framework Önerileri

### React + TypeScript
```bash
npm install @tanstack/react-query axios react-hook-form
```

### Vue.js + TypeScript
```bash
npm install @vueuse/core axios vee-validate
```

### Angular + TypeScript
```bash
ng add @angular/material
npm install @angular/flex-layout
```

---

## 🔒 Güvenlik Notları

### JWT Token Yönetimi
- Token'ları `localStorage` yerine `httpOnly` cookie'de saklayın
- Token yenileme mekanizması implement edin
- Token expiration'da otomatik logout

### Input Validation
- Frontend'de de validation yapın
- XSS koruması için input sanitization
- File upload güvenliği

### Rate Limiting
- API çağrılarını throttle edin
- Debounce kullanın
- Loading state'leri gösterin

---

## 📞 Destek

**API Dokümantasyonu**: [Swagger/OpenAPI](https://your-domain.com/api-docs)  
**GitHub Repository**: [finscope_backend](https://github.com/ekremilkan/finscope_backend)  
**Issues**: [GitHub Issues](https://github.com/ekremilkan/finscope_backend/issues)

---

**Son güncelleme**: 2024-12-19  
**Versiyon**: 2.0.0  
**Status**: �� Production Ready 