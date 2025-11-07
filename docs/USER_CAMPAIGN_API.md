# UserCampaign API Dokümantasyonu

## Genel Bilgi
UserCampaign API'si, kullanıcıların kampanyalara katılım durumlarını ve sınıflarını yönetmek için kullanılır.

## Base URL
```
/api/v1/user-campaigns
```

## Authentication
Tüm endpoint'ler için `Authorization: Bearer <token>` header'ı gereklidir.

## Endpoints

### 1. UserCampaign Oluşturma
**POST** `/api/v1/user-campaigns`

**Request Body:**
```json
{
  "user_id": "656f3c2c3a9f3e2b1c0a1234",
  "campaign_id": "656f3c2c3a9f3e2b1c0a5678",
  "class": "A"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "656f3c2c3a9f3e2b1c0a9999",
    "user_id": "656f3c2c3a9f3e2b1c0a1234",
    "campaign_id": "656f3c2c3a9f3e2b1c0a5678",
    "class": "A",
    "createdAt": "2024-12-19T10:30:00.000Z",
    "updatedAt": "2024-12-19T10:30:00.000Z"
  },
  "message": "UserCampaign created successfully",
  "code": 201
}
```

### 2. UserCampaign Getirme
**GET** `/api/v1/user-campaigns/:userId/:campaignId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "656f3c2c3a9f3e2b1c0a9999",
    "user_id": "656f3c2c3a9f3e2b1c0a1234",
    "campaign_id": "656f3c2c3a9f3e2b1c0a5678",
    "class": "A",
    "createdAt": "2024-12-19T10:30:00.000Z",
    "updatedAt": "2024-12-19T10:30:00.000Z"
  },
  "message": "UserCampaign retrieved successfully",
  "code": 200
}
```

### 3. Class Güncelleme
**PUT** `/api/v1/user-campaigns/:userId/:campaignId/class`

**Request Body:**
```json
{
  "class": "B"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "656f3c2c3a9f3e2b1c0a9999",
    "user_id": "656f3c2c3a9f3e2b1c0a1234",
    "campaign_id": "656f3c2c3a9f3e2b1c0a5678",
    "class": "B",
    "createdAt": "2024-12-19T10:30:00.000Z",
    "updatedAt": "2024-12-19T10:35:00.000Z"
  },
  "message": "UserCampaign class updated successfully",
  "code": 200
}
```

## Validation Kuralları

### Oluşturma (POST)
- `user_id`: MongoDB ObjectId formatında, zorunlu
- `campaign_id`: MongoDB ObjectId formatında, zorunlu
- `class`: String, zorunlu, trim edilir

### Class Güncelleme (PUT)
- `userId`: URL parametresi, MongoDB ObjectId formatında, zorunlu
- `campaignId`: URL parametresi, MongoDB ObjectId formatında, zorunlu
- `class`: Request body'de, String, zorunlu, trim edilir

### Getirme (GET)
- `userId`: URL parametresi, MongoDB ObjectId formatında, zorunlu
- `campaignId`: URL parametresi, MongoDB ObjectId formatında, zorunlu

## Hata Durumları

### 400 Bad Request
```json
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "code": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": true,
  "message": "Yetkilendirme token'ı gerekli",
  "code": 401
}
```

### 404 Not Found (Class güncelleme için)
```json
{
  "success": false,
  "error": true,
  "message": "UserCampaign not found",
  "code": 404
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": true,
  "message": "Sunucu hatası",
  "code": 500
}
```

## Önemli Notlar

1. **Unique Constraint**: Aynı kullanıcı ve kampanya kombinasyonu için sadece bir UserCampaign kaydı olabilir.

2. **Timestamps**: Her kayıt otomatik olarak `createdAt` ve `updatedAt` alanlarına sahiptir.

3. **Class Değerleri**: Class alanı string olarak saklanır, özel enum kısıtlaması yoktur.

4. **Referanslar**: `user_id` User modeline, `campaign_id` Campaign modeline referans verir.

## Frontend Kullanım Örnekleri

### React/JavaScript Örneği
```javascript
// UserCampaign oluşturma
const createUserCampaign = async (userId, campaignId, className) => {
  const response = await fetch('/api/v1/user-campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: userId,
      campaign_id: campaignId,
      class: className
    })
  });
  return response.json();
};

// Class güncelleme
const updateClass = async (userId, campaignId, newClass) => {
  const response = await fetch(`/api/v1/user-campaigns/${userId}/${campaignId}/class`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ class: newClass })
  });
  return response.json();
};
```

## Test Senaryoları

1. **Başarılı Oluşturma**: Geçerli user_id, campaign_id ve class ile
2. **Duplicate Error**: Aynı user_id ve campaign_id ile tekrar oluşturma
3. **Invalid ObjectId**: Geçersiz MongoDB ObjectId formatı
4. **Missing Fields**: Zorunlu alanların eksik olması
5. **Class Update**: Mevcut kaydın class'ını güncelleme
6. **Not Found**: Var olmayan kaydı güncelleme

---
**Son Güncelleme**: 2024-12-19  
**Versiyon**: 1.0.0
