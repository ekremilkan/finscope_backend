# 📚 API Endpoints Dokümantasyonu

Bu dokümantasyon, FinScope Backend API'sinin tüm endpoint'lerini ve kullanım örneklerini içerir.

## 🔐 Authentication Endpoints

### Kullanıcı Kaydı
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "customer" // Opsiyonel: "user", "customer", "admin"
}
```

### Kullanıcı Girişi
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

## 📝 Campaign Endpoints

### Kampanya Oluşturma
```http
POST /api/v1/campaigns/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Blockchain Eğitimi",
  "description": "Blockchain teknolojisi ve kripto para birimleri hakkında kapsamlı eğitim",
  "reward": 150,
  "maxParticipants": 200,
  "category": "education",
  "difficulty": "Beginner",
  "startDate": "2024-12-20T00:00:00.000Z",
  "endDate": "2024-12-25T23:59:59.000Z",
  "questions": 10,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "tags": ["blockchain", "crypto", "education"]
}
```

**Yetki:** Admin ve Customer

### Tüm Kampanyaları Getirme (Public)
```http
GET /api/v1/campaigns/all
```

**Yetki:** Herkes (auth gerekmez)

### Kampanya Detayı Getirme
```http
GET /api/v1/campaigns/:id
Authorization: Bearer <token>
```

**Yetki:** Giriş yapmış herkes

### Kampanya Güncelleme
```http
PUT /api/v1/campaigns/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Güncellenmiş Başlık",
  "description": "Güncellenmiş açıklama",
  "images": [
    "https://example.com/new-image1.jpg",
    "https://example.com/new-image2.jpg"
  ],
  "videoLink": "https://vimeo.com/123456789"
}
```

**Yetki:** Admin (tümü), Customer (kendi kampanyaları)

### Müşteri Kampanyalarını Getirme
```http
GET /api/v1/campaigns/customer/list
Authorization: Bearer <token>
```

**Yetki:** Giriş yapmış herkes

### Kampanya Silme İsteği (Customer için)
```http
DELETE /api/v1/campaigns/:id/request-delete
Authorization: Bearer <token>
```

**Yetki:** Admin ve Customer
**İşlem:** Customer için isActive false yapar, Admin için direkt siler

### Kampanya Silme (Admin için)
```http
DELETE /api/v1/campaigns/:id
Authorization: Bearer <token>
```

**Yetki:** Sadece Admin
**İşlem:** Kampanyayı kalıcı olarak siler

### Silme İsteklerini Getirme (Admin için)
```http
GET /api/v1/campaigns/admin/delete-requests
Authorization: Bearer <token>
```

**Yetki:** Sadece Admin
**İşlem:** isActive false olan kampanyaları listeler

## ❓ Question Endpoints

### Soru Oluşturma
```http
POST /api/v1/questions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionText": "Blockchain teknolojisinin temel özelliği nedir?",
  "options": [
    {
      "text": "Merkezi kontrol",
      "isTrue": false
    },
    {
      "text": "Değiştirilemezlik (Immutability)",
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

**Yetki:** Admin ve Customer

### Tüm Soruları Getirme (Admin)
```http
GET /api/v1/questions/all
Authorization: Bearer <token>
```

**Yetki:** Admin

### Kampanya Sorularını Getirme
```http
GET /api/v1/questions/campaign/:campaignId
Authorization: Bearer <token>
```

### Müşteri Sorularını Getirme
```http
GET /api/v1/questions/customer
Authorization: Bearer <token>
```

### Soru Güncelleme
```http
PUT /api/v1/questions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionText": "Güncellenmiş soru metni",
  "options": [
    {
      "text": "Yeni seçenek 1",
      "isTrue": false
    },
    {
      "text": "Yeni seçenek 2",
      "isTrue": true
    },
    {
      "text": "Yeni seçenek 3",
      "isTrue": false
    },
    {
      "text": "Yeni seçenek 4",
      "isTrue": false
    }
  ],
  "order": 2
}
```

**Yetki:** Admin ve Customer (kendi soruları)

### Soru Silme
```http
DELETE /api/v1/questions/:id
Authorization: Bearer <token>
```

**Yetki:** Admin ve Customer (kendi soruları)

## 👥 User Endpoints

### Kullanıcı Profili Getirme
```http
GET /api/v1/users/profile
Authorization: Bearer <token>
```

### Kullanıcı Profili Güncelleme
```http
PUT /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Güncellenmiş İsim",
  "email": "newemail@example.com"
}
```

## 🔐 Role-Based Access Control

### Roller:
- **Admin:** Tüm işlemleri yapabilir
- **Customer:** Kendi kampanya ve sorularını yönetebilir
- **User:** Sadece okuma işlemleri yapabilir

### Yetki Kontrolü:
- Kampanya/Soru oluşturma: Admin + Customer
- Kampanya/Soru güncelleme: Admin + Customer (kendi verileri)
- Kampanya/Soru silme: Admin + Customer (kendi verileri)
- Veri okuma: Tüm roller

## 📊 Response Formatları

### Başarılı Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "İşlem başarılı"
}
```

### Hata Response
```json
{
  "success": false,
  "error": true,
  "message": "Hata mesajı",
  "errors": ["Detaylı hata listesi"],
  "code": 400
}
```

## 🔧 Validation Kuralları

### Campaign Validation:
- `title`: Maksimum 100 karakter
- `description`: Maksimum 500 karakter
- `reward`: Minimum 0
- `maxParticipants`: Minimum 1
- `startDate`: Bitiş tarihinden önce olmalı
- `endDate`: Başlangıç tarihinden sonra olmalı
- `images`: Maksimum 10 resim, URL formatı
- `videoLink`: Desteklenen video platformları

### Question Validation:
- `questionText`: Maksimum 300 karakter
- `options`: Tam olarak 4 seçenek
- En az bir doğru seçenek olmalı

## 🚀 Örnek Kullanım Senaryoları

### 1. Customer Kampanya Oluşturma
```bash
# 1. Giriş yap
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@finscope.com", "password": "Customer123!"}'

# 2. Kampanya oluştur
curl -X POST http://localhost:3000/api/v1/campaigns/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yeni Kampanya",
    "description": "Kampanya açıklaması",
    "reward": 100,
    "startDate": "2024-12-20T00:00:00.000Z",
    "endDate": "2024-12-25T23:59:59.000Z"
  }'
```

### 2. Admin Tüm Kampanyaları Görüntüleme
```bash
curl -X GET http://localhost:3000/api/v1/campaigns/all \
  -H "Authorization: Bearer <admin_token>"
```

### 3. Soru Ekleme
```bash
curl -X POST http://localhost:3000/api/v1/questions/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Soru metni?",
    "options": [
      {"text": "Seçenek 1", "isTrue": false},
      {"text": "Seçenek 2", "isTrue": true},
      {"text": "Seçenek 3", "isTrue": false},
      {"text": "Seçenek 4", "isTrue": false}
    ],
    "campaignId": "campaign_id_here",
    "order": 1
  }'
```

## 📝 Notlar

- Tüm tarihler ISO 8601 formatında gönderilmelidir
- Token'lar Authorization header'ında "Bearer" prefix'i ile gönderilmelidir
- Medya dosyaları URL olarak gönderilmelidir (dosya upload özelliği henüz mevcut değil)
- Video linkleri desteklenen platformlardan olmalıdır (YouTube, Vimeo, vb.) 