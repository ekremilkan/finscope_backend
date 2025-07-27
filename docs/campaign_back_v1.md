# Kampanya API Dokümantasyonu v1.0

## 📋 Genel Bilgiler

**Base URL:** `http://localhost:5005/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** Bearer Token (JWT)

---

## 🔐 Kimlik Doğrulama

Tüm endpoint'ler (public olanlar hariç) için Authorization header'ı gereklidir:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 📊 Kampanya Endpoint'leri

### 1. Tüm Kampanyaları Getir (Public)

**Endpoint:** `GET /campaigns/all`

**Açıklama:** Tüm aktif kampanyaları listeler. Public endpoint, authentication gerektirmez.

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Tüm kampanyalar getirildi",
  "data": [
    {
      "_id": "688658eed04926ca6613d942",
      "title": "Blockchain ve Kripto Para Eğitimi",
      "description": "Blockchain teknolojisi, kripto para birimleri ve DeFi uygulamaları hakkında kapsamlı eğitim...",
      "content": "Detaylı kampanya içeriği...",
      "reward": 150,
      "maxParticipants": 200,
      "participants": 87,
      "currentParticipants": 83,
      "category": "education",
      "difficulty": "Beginner",
      "startDate": "2024-12-20T00:00:00.000Z",
      "endDate": "2024-12-25T23:59:59.000Z",
      "questions": 5,
      "estimatedDuration": 29,
      "questionIds": ["688658f0d04926ca6613d94f", "688658f1d04926ca6613d95a"],
      "images": [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
        "https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800"
      ],
      "imageUrls": [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
        "https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800"
      ],
      "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "tags": ["blockchain", "crypto", "bitcoin", "ethereum", "defi"],
      "createdUserId": {
        "_id": "686a80ad4df8b694b1e90140",
        "name": "cnosmn",
        "email": "cnosman14043@gmail.com"
      },
      "status": "upcoming",
      "isActive": true,
      "createdAt": "2025-07-27T16:50:54.687Z",
      "updatedAt": "2025-07-27T16:50:54.690Z",
      
      // User-specific data (Auth required)
      "userJoined": false,
      "userCompleted": false,
      "userScore": null,
      "userTimeSpent": null,
      "userProgress": null
    }
  ]
}
```

**Status Değerleri:**
- `upcoming`: Yaklaşan kampanya
- `active`: Aktif kampanya
- `expired`: Süresi dolmuş kampanya

---

### 2. Kampanya Detayı Getir (Auth Required)

**Endpoint:** `GET /campaigns/:id`

**Açıklama:** Belirli bir kampanyanın detaylarını getirir. Authentication gereklidir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kampanya detayı getirildi",
  "data": {
    "_id": "688658eed04926ca6613d942",
    "title": "Blockchain ve Kripto Para Eğitimi",
    "description": "Blockchain teknolojisi, kripto para birimleri ve DeFi uygulamaları hakkında kapsamlı eğitim...",
    "content": "Detaylı kampanya içeriği...",
    "reward": 150,
    "maxParticipants": 200,
    "participants": 87,
    "currentParticipants": 83,
    "category": "education",
    "difficulty": "Beginner",
    "startDate": "2024-12-20T00:00:00.000Z",
    "endDate": "2024-12-25T23:59:59.000Z",
    "questions": 5,
    "estimatedDuration": 29,
    "questionIds": ["688658f0d04926ca6613d94f", "688658f1d04926ca6613d95a"],
    "images": [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800"
    ],
    "imageUrls": [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800"
    ],
    "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "tags": ["blockchain", "crypto", "bitcoin", "ethereum", "defi"],
    "createdUserId": {
      "_id": "686a80ad4df8b694b1e90140",
      "name": "cnosmn",
      "email": "cnosman14043@gmail.com"
    },
    "status": "upcoming",
    "isActive": true,
    "createdAt": "2025-07-27T16:50:54.687Z",
    "updatedAt": "2025-07-27T16:50:54.690Z",
    
    // User-specific data
    "userJoined": false,
    "userCompleted": false,
    "userScore": null,
    "userTimeSpent": null,
    "userProgress": {
      "currentQuestion": 0,
      "totalQuestions": 5,
      "answeredQuestions": [],
      "correctAnswers": 0,
      "wrongAnswers": 0,
      "lastActivity": null
    }
  }
}
```

---

### 3. Kullanıcı Progress'ini Getir (Auth Required)

**Endpoint:** `GET /campaigns/:id/user-progress`

**Açıklama:** Kullanıcının belirli bir kampanyadaki ilerleme durumunu getirir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kullanıcı progress'i getirildi",
  "data": {
    "campaignId": "688658eed04926ca6613d942",
    "userId": "686a80ad4df8b694b1e90140",
    "joined": true,
    "completed": false,
    "score": null,
    "timeSpent": 120,
    "progress": {
      "currentQuestion": 2,
      "totalQuestions": 5,
      "answeredQuestions": [0, 1],
      "correctAnswers": 2,
      "wrongAnswers": 0,
      "lastActivity": "2024-12-20T10:30:00.000Z"
    },
    "startedAt": "2024-12-20T10:00:00.000Z",
    "completedAt": null
  }
}
```

---

### 4. Kampanyaya Katıl (Auth Required)

**Endpoint:** `POST /campaigns/:id/join`

**Açıklama:** Kullanıcının kampanyaya katılmasını sağlar.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response (Başarılı):**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kampanyaya başarıyla katıldınız",
  "data": {
    "campaignId": "688658eed04926ca6613d942",
    "userId": "686a80ad4df8b694b1e90140",
    "joined": true,
    "joinedAt": "2024-12-20T10:00:00.000Z",
    "message": "Kampanyaya başarıyla katıldınız",
    "participants": 88,
    "maxParticipants": 200,
    "remainingSlots": 112
  }
}
```

**Response (Hata - Kampanya Aktif Değil):**
```json
{
  "code": 400,
  "error": true,
  "success": false,
  "message": "Bu kampanya aktif değil.",
  "data": null
}
```

**Response (Hata - Zaten Katılmış):**
```json
{
  "code": 400,
  "error": true,
  "success": false,
  "message": "Bu kampanyaya zaten katılmışsınız.",
  "data": null
}
```

**Response (Hata - Kontenjan Dolu):**
```json
{
  "code": 400,
  "error": true,
  "success": false,
  "message": "Kampanya kontenjanı dolmuştur.",
  "data": null
}
```

---

### 5. Progress Güncelle (Auth Required)

**Endpoint:** `PUT /campaigns/:id/progress`

**Açıklama:** Kullanıcının kampanya progress'ini günceller.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionId": "688658f0d04926ca6613d94f",
  "selectedAnswer": 1,
  "isCorrect": true,
  "timeSpent": 30,
  "completed": false
}
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Progress güncellendi",
  "data": {
    "campaignId": "688658eed04926ca6613d942",
    "userId": "686a80ad4df8b694b1e90140",
    "progress": {
      "currentQuestion": 2,
      "totalQuestions": 5,
      "answeredQuestions": [0, 1],
      "correctAnswers": 2,
      "wrongAnswers": 0,
      "lastActivity": "2024-12-20T10:30:00.000Z"
    },
    "score": null,
    "completed": false
  }
}
```

---

### 6. Quiz Tamamla (Auth Required)

**Endpoint:** `POST /campaigns/:id/complete`

**Açıklama:** Quiz tamamlandığında çağrılır ve kullanıcının progress'ini finalize eder.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "totalTimeSpent": 183,
  "score": 100,
  "questionsAnswered": 7,
  "totalQuestions": 7
}
```

**Response (Başarılı):**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Quiz completed successfully",
  "data": {
    "campaignId": "688658eed04926ca6613d942",
    "userId": "686a80ad4df8b694b1e90140",
    "completed": true,
    "completedAt": "2024-12-20T10:30:00.000Z",
    "score": 100,
    "totalTimeSpent": 183
  }
}
```

**Response (Hata - Quiz Zaten Tamamlanmış):**
```json
{
  "code": 400,
  "error": true,
  "success": false,
  "message": "Bu quiz zaten tamamlanmış.",
  "data": null
}
```

**Response (Hata - Score 100 Değil):**
```json
{
  "code": 400,
  "error": true,
  "success": false,
  "message": "Quiz tamamlanması için tüm sorular doğru cevaplanmalıdır.",
  "data": null
}
```

**Response (Hata - Tüm Sorular Cevaplanmamış):**
```json
{
  "code": 400,
  "error": true,
  "success": false,
  "message": "Quiz tamamlanması için tüm sorular cevaplanmalıdır.",
  "data": null
}
```

---

### 7. Kampanya Oluştur (Admin/Customer)

**Endpoint:** `POST /campaigns/create`

**Açıklama:** Yeni kampanya oluşturur. Admin ve Customer rolleri kampanya oluşturabilir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Yeni Kampanya",
  "description": "Kampanya açıklaması",
  "content": "Detaylı kampanya içeriği...",
  "reward": 100,
  "maxParticipants": 150,
  "category": "education",
  "difficulty": "Beginner",
  "startDate": "2024-12-20T00:00:00.000Z",
  "endDate": "2024-12-25T23:59:59.000Z",
  "questions": 5,
  "estimatedDuration": 15,
  "images": [
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
  ],
  "imageUrls": [
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
  ],
  "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "tags": ["tag1", "tag2"]
}
```

**Zorunlu Alanlar:**
- `title`: Kampanya başlığı (string)
- `description`: Kampanya açıklaması (string)
- `reward`: Ödül miktarı (number)
- `maxParticipants`: Maksimum katılımcı sayısı (number)
- `category`: Kategori (string)
- `difficulty`: Zorluk seviyesi (string)
- `startDate`: Başlangıç tarihi (ISO string)
- `endDate`: Bitiş tarihi (ISO string)

**Opsiyonel Alanlar:**
- `content`: Detaylı kampanya içeriği (string)
- `questions`: Soru sayısı (number, default: 5)
- `estimatedDuration`: Tahmini süre (number, default: 15)
- `images`: Resim URL'leri array'i (array)
- `imageUrls`: Resim URL'leri array'i (array)
- `videoLink`: Video linki (string)
- `videoUrl`: Video URL'i (string)
- `tags`: Etiketler array'i (array)

**Response:**
```json
{
  "code": 201,
  "error": false,
  "success": true,
  "message": "Kampanya başarıyla oluşturuldu",
  "data": {
    "_id": "688658eed04926ca6613d942",
    "title": "Yeni Kampanya",
    "description": "Kampanya açıklaması",
    "content": "Detaylı kampanya içeriği...",
    "reward": 100,
    "maxParticipants": 150,
    "participants": 0,
    "currentParticipants": 0,
    "category": "education",
    "difficulty": "Beginner",
    "startDate": "2024-12-20T00:00:00.000Z",
    "endDate": "2024-12-25T23:59:59.000Z",
    "questions": 5,
    "estimatedDuration": 15,
    "questionIds": [],
    "images": [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
    ],
    "imageUrls": [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
    ],
    "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "tags": ["tag1", "tag2"],
    "createdUserId": "686a80ad4df8b694b1e90140",
    "status": "upcoming",
    "isActive": true,
    "createdAt": "2025-07-27T16:50:54.687Z",
    "updatedAt": "2025-07-27T16:50:54.690Z"
  }
}
```

---

### 8. Kampanya Güncelle (Admin/Customer)

**Endpoint:** `PUT /campaigns/:id`

**Açıklama:** Kampanya bilgilerini günceller. Admin tüm kampanyaları, Customer sadece kendi kampanyalarını güncelleyebilir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Güncellenmiş Kampanya",
  "description": "Güncellenmiş açıklama",
  "content": "Güncellenmiş detaylı içerik",
  "reward": 200,
  "maxParticipants": 200,
  "category": "technology",
  "difficulty": "Intermediate",
  "startDate": "2024-12-22T00:00:00.000Z",
  "endDate": "2024-12-28T23:59:59.000Z",
  "estimatedDuration": 20,
  "images": [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"
  ],
  "imageUrls": [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"
  ],
  "videoLink": "https://vimeo.com/123456789",
  "videoUrl": "https://vimeo.com/123456789",
  "tags": ["web-development", "react", "nodejs"]
}
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kampanya başarıyla güncellendi",
  "data": {
    "_id": "688658eed04926ca6613d942",
    "title": "Güncellenmiş Kampanya",
    "description": "Güncellenmiş açıklama",
    "content": "Güncellenmiş detaylı içerik",
    "reward": 200,
    "maxParticipants": 200,
    "participants": 87,
    "currentParticipants": 83,
    "category": "technology",
    "difficulty": "Intermediate",
    "startDate": "2024-12-22T00:00:00.000Z",
    "endDate": "2024-12-28T23:59:59.000Z",
    "questions": 5,
    "estimatedDuration": 20,
    "questionIds": ["688658f0d04926ca6613d94f"],
    "images": [
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"
    ],
    "imageUrls": [
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"
    ],
    "videoLink": "https://vimeo.com/123456789",
    "videoUrl": "https://vimeo.com/123456789",
    "tags": ["web-development", "react", "nodejs"],
    "createdUserId": "686a80ad4df8b694b1e90140",
    "status": "upcoming",
    "isActive": true,
    "createdAt": "2025-07-27T16:50:54.687Z",
    "updatedAt": "2025-07-27T16:51:00.000Z"
  }
}
```

---

### 9. Kampanya Silme İsteği (Customer)

**Endpoint:** `DELETE /campaigns/:id/request-delete`

**Açıklama:** Customer rolündeki kullanıcılar kendi kampanyalarını silmek için istek gönderir. Kampanya tamamen silinmez, `isActive` değeri `false` yapılır.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kampanya silme isteği gönderildi. Admin onayı bekleniyor.",
  "data": {
    "_id": "688658eed04926ca6613d942",
    "title": "Blockchain ve Kripto Para Eğitimi",
    "isActive": false,
    "status": "pending_deletion"
  }
}
```

---

### 10. Kampanya Kalıcı Sil (Admin)

**Endpoint:** `DELETE /campaigns/:id`

**Açıklama:** Admin rolündeki kullanıcılar kampanyaları kalıcı olarak silebilir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kampanya başarıyla silindi",
  "data": {
    "_id": "688658eed04926ca6613d942",
    "title": "Blockchain ve Kripto Para Eğitimi"
  }
}
```

---

### 11. Silme İsteklerini Listele (Admin)

**Endpoint:** `GET /campaigns/admin/delete-requests`

**Açıklama:** Admin rolündeki kullanıcılar silme isteği bekleyen kampanyaları listeler.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Silme isteği bekleyen kampanyalar getirildi",
  "data": [
    {
      "_id": "688658eed04926ca6613d942",
      "title": "Blockchain ve Kripto Para Eğitimi",
      "description": "Blockchain teknolojisi, kripto para birimleri ve DeFi uygulamaları hakkında kapsamlı eğitim...",
      "content": "Detaylı kampanya içeriği...",
      "reward": 150,
      "maxParticipants": 200,
      "participants": 87,
      "currentParticipants": 83,
      "category": "education",
      "difficulty": "Beginner",
      "startDate": "2024-12-20T00:00:00.000Z",
      "endDate": "2024-12-25T23:59:59.000Z",
      "questions": 5,
      "estimatedDuration": 29,
      "questionIds": ["688658f0d04926ca6613d94f"],
      "images": [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
      ],
      "imageUrls": [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
      ],
      "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "tags": ["blockchain", "crypto", "bitcoin", "ethereum", "defi"],
      "createdUserId": {
        "_id": "686a80ad4df8b694b1e90140",
        "name": "cnosmn",
        "email": "cnosman14043@gmail.com"
      },
      "status": "pending_deletion",
      "isActive": false,
      "createdAt": "2025-07-27T16:50:54.687Z",
      "updatedAt": "2025-07-27T16:50:54.690Z"
    }
  ]
}
```

---

## 📝 Soru Endpoint'leri

### 1. Kampanya Sorularını Getir

**Endpoint:** `GET /questions/campaign/:campaignId`

**Açıklama:** Belirli bir kampanyaya ait soruları getirir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "code": 200,
  "error": false,
  "success": true,
  "message": "Kampanyaya ait sorular getirildi",
  "data": [
    {
      "_id": "688658f0d04926ca6613d94f",
      "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
      "options": [
        {
          "text": "Merkezi kontrol",
          "isTrue": false,
          "_id": "688658f0d04926ca6613d950"
        },
        {
          "text": "Değiştirilemezlik (Immutability)",
          "isTrue": true,
          "_id": "688658f0d04926ca6613d951"
        },
        {
          "text": "Hızlı işlem",
          "isTrue": false,
          "_id": "688658f0d04926ca6613d952"
        },
        {
          "text": "Düşük maliyet",
          "isTrue": false,
          "_id": "688658f0d04926ca6613d953"
        }
      ],
      "createdUserId": {
        "_id": "686a80ad4df8b694b1e90140",
        "name": "cnosmn",
        "email": "cnosman14043@gmail.com"
      },
      "order": 1,
      "createdAt": "2025-07-27T16:50:56.242Z",
      "updatedAt": "2025-07-27T16:50:56.243Z"
    }
  ]
}
```

### 2. Soru Oluştur

**Endpoint:** `POST /questions/create`

**Açıklama:** Yeni soru oluşturur. Admin ve Customer rolleri soru oluşturabilir.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionText": "Yeni soru metni?",
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
  "campaignId": "688658eed04926ca6613d942",
  "order": 1
}
```

**Zorunlu Alanlar:**
- `questionText`: Soru metni (string)
- `options`: Seçenekler array'i (4 seçenek olmalı, 1 tanesi doğru olmalı)
- `campaignId`: Kampanya ID'si (string)

**Opsiyonel Alanlar:**
- `order`: Sıralama (number, default: 0)

---

## 🔐 Rol Yetkileri

### Admin Rolü
- ✅ Tüm kampanyaları görüntüleyebilir
- ✅ Tüm kampanyaları düzenleyebilir
- ✅ Tüm kampanyaları silebilir
- ✅ Silme isteklerini görüntüleyebilir
- ✅ Soru oluşturabilir
- ✅ Kampanyalara katılabilir
- ✅ Progress güncelleyebilir
- ✅ Quiz tamamlayabilir

### Customer Rolü
- ✅ Tüm kampanyaları görüntüleyebilir
- ✅ Kendi kampanyalarını düzenleyebilir
- ✅ Kendi kampanyalarını silme isteği gönderebilir
- ✅ Soru oluşturabilir
- ✅ Kampanyalara katılabilir
- ✅ Progress güncelleyebilir
- ✅ Quiz tamamlayabilir

### User Rolü
- ✅ Tüm kampanyaları görüntüleyebilir
- ✅ Kampanyalara katılabilir
- ✅ Progress güncelleyebilir
- ✅ Quiz tamamlayabilir
- ❌ Kampanya düzenleyemez
- ❌ Kampanya silemez
- ❌ Soru oluşturamaz

---

## 📊 Veri Tipleri

### Kampanya Alanları
```typescript
interface Campaign {
  _id: string;
  title: string;
  description: string;
  content: string;
  reward: number;
  maxParticipants: number;
  participants: number;
  currentParticipants: number;
  category: 'education' | 'technology' | 'health' | 'finance';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  questions: number;
  estimatedDuration: number;
  questionIds: string[];
  images: string[];
  imageUrls: string[];
  videoLink?: string;
  videoUrl?: string;
  tags: string[];
  createdUserId: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'upcoming' | 'active' | 'expired' | 'pending_deletion';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // User-specific data
  userJoined?: boolean;
  userCompleted?: boolean;
  userScore?: number | null;
  userTimeSpent?: number | null;
  userProgress?: {
    currentQuestion: number;
    totalQuestions: number;
    answeredQuestions: number[];
    correctAnswers: number;
    wrongAnswers: number;
    lastActivity: string | null;
  } | null;
}
```

### Soru Alanları
```typescript
interface Question {
  _id: string;
  questionText: string;
  options: Array<{
    text: string;
    isTrue: boolean;
    _id: string;
  }>;
  createdUserId: {
    _id: string;
    name: string;
    email: string;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### User Progress Alanları
```typescript
interface UserProgress {
  _id: string;
  userId: string;
  campaignId: string;
  joined: boolean;
  completed: boolean;
  score: number | null;
  timeSpent: number;
  progress: {
    currentQuestion: number;
    totalQuestions: number;
    answeredQuestions: number[];
    correctAnswers: number;
    wrongAnswers: number;
    lastActivity: string | null;
  };
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🚨 Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Kimlik doğrulama hatası |
| 403 | Yetki hatası |
| 404 | Bulunamadı |
| 429 | Çok fazla istek |
| 500 | Sunucu hatası |

---

## 📝 Örnek Kullanım

### Frontend'de Kampanya Listesi
```javascript
// Tüm kampanyaları getir
const response = await fetch('http://localhost:5005/api/v1/campaigns/all');
const data = await response.json();

if (data.success) {
  const campaigns = data.data;
  // Kampanyaları görüntüle
}
```

### Kampanya Detayı
```javascript
// Kampanya detayını getir
const token = 'your_jwt_token';
const campaignId = 'campaign_id';

const response = await fetch(`http://localhost:5005/api/v1/campaigns/${campaignId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

if (data.success) {
  const campaign = data.data;
  // Kampanya detayını görüntüle
}
```

### Kampanyaya Katıl
```javascript
// Kampanyaya katıl
const token = 'your_jwt_token';
const campaignId = 'campaign_id';

const response = await fetch(`http://localhost:5005/api/v1/campaigns/${campaignId}/join`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

if (data.success) {
  console.log('Kampanyaya katıldınız!');
}
```

### Progress Güncelle
```javascript
// Progress güncelle
const token = 'your_jwt_token';
const campaignId = 'campaign_id';

const response = await fetch(`http://localhost:5005/api/v1/campaigns/${campaignId}/progress`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionId: 'question_id',
    selectedAnswer: 1,
    isCorrect: true,
    timeSpent: 30,
    completed: false
  })
});
const data = await response.json();

if (data.success) {
  console.log('Progress güncellendi!');
}
```

### Quiz Tamamla
```javascript
// Quiz tamamla
const token = 'your_jwt_token';
const campaignId = 'campaign_id';

const response = await fetch(`http://localhost:5005/api/v1/campaigns/${campaignId}/complete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    totalTimeSpent: 183,
    score: 100,
    questionsAnswered: 7,
    totalQuestions: 7
  })
});
const data = await response.json();

if (data.success) {
  console.log('Quiz tamamlandı!');
}
```

### Soru Listesi
```javascript
// Kampanya sorularını getir
const token = 'your_jwt_token';
const campaignId = 'campaign_id';

const response = await fetch(`http://localhost:5005/api/v1/questions/campaign/${campaignId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

if (data.success) {
  const questions = data.data;
  // Soruları görüntüle
}
```

---

## 🔄 Güncellemeler

**v1.0** - İlk sürüm
- Kampanya CRUD işlemleri
- Soru yönetimi
- Rol tabanlı yetkilendirme
- Soft delete sistemi

**v1.1** - Yeni özellikler
- User Progress sistemi
- Join Campaign API
- Progress Update API
- Campaign participation tracking
- User-specific data in responses

**v1.2** - Quiz Completion
- Quiz completion endpoint
- Final score validation
- Progress finalization 