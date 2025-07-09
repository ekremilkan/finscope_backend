# 💳 Wallet API Kullanım Kılavuzu

Bu dosya FinScope Backend'e yeni eklenen cüzdan yönetimi endpoint'lerini açıklar.

## 🛡️ Kimlik Doğrulama

Tüm endpoint'ler JWT authentication gerektirir:
```
Authorization: Bearer <jwt_token>
```

## 📱 Endpoint'ler

### 1. Cüzdan Listeleme

**GET** `/api/v1/wallets/`

Kullanıcının tüm cüzdanlarını listeler.

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Cüzdanlar başarıyla getirildi.",
  "data": {
    "wallets": [
      {
        "_id": "wallet_id",
        "user": "user_id", 
        "network": "Ethereum",
        "address": "0x742d35cc...",
        "isAirdropAddress": true,
        "createdAt": "2024-12-19T...",
        "updatedAt": "2024-12-19T..."
      }
    ],
    "totalCount": 3
  },
  "code": 200
}
```

### 2. Cüzdan Silme

**DELETE** `/api/v1/wallets/:walletId`

Belirtilen cüzdanı siler.

**Önemli:** Airdrop cüzdanını silmeden önce başka bir cüzdan seçmeniz gerekir.

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Cüzdan başarıyla silindi.",
  "data": {
    "message": "Cüzdan başarıyla silindi."
  },
  "code": 200
}
```

### 3. Cüzdan İşlem Geçmişi

**GET** `/api/v1/wallets/:walletId/transactions?page=1&limit=20`

Belirtilen cüzdanın işlem geçmişini getirir (sayfalama destekli).

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "İşlem geçmişi başarıyla getirildi.",
  "data": {
    "transactions": [
      {
        "_id": "transaction_id",
        "wallet": "wallet_id",
        "user": "user_id",
        "type": "send",
        "amount": "0.5",
        "currency": "ETH",
        "txHash": "0xabc123...",
        "fromAddress": "0x123...",
        "toAddress": "0x456...",
        "status": "success",
        "createdAt": "2024-12-19T..."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 89,
      "hasNextPage": true
    }
  },
  "code": 200
}
```

### 4. İşlem Ekleme (Demo/Test)

**POST** `/api/v1/wallets/:walletId/transactions`

Cüzdana yeni işlem kaydı ekler.

**Request Body:**
```json
{
  "type": "send",
  "amount": "0.5",
  "currency": "ETH",
  "txHash": "0xabc123def456...",
  "fromAddress": "0x123...",
  "toAddress": "0x456...",
  "description": "Test işlemi"
}
```

**Validation Kuralları:**
- `type`: "send", "receive", "swap", "stake", "unstake", "airdrop", "other"
- `amount`: Pozitif sayısal değer (string format)
- `currency`: 2-10 karakter, büyük harf
- `txHash`: 20-200 karakter, benzersiz
- `fromAddress/toAddress`: 26-100 karakter (optional)
- `description`: Max 500 karakter (optional)

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "İşlem başarıyla eklendi.",
  "data": {
    "_id": "transaction_id",
    "wallet": "wallet_id",
    "user": "user_id",
    "type": "send",
    "amount": "0.5",
    "currency": "ETH",
    "txHash": "0xabc123...",
    "status": "success",
    "createdAt": "2024-12-19T..."
  },
  "code": 201
}
```

## 🚨 Hata Durumları

### Yaygın Hatalar:
```json
// Cüzdan bulunamadı
{
  "success": false,
  "error": true,
  "message": "Cüzdan bulunamadı veya size ait değil.",
  "code": 404
}

// Airdrop cüzdanını silme
{
  "success": false,
  "error": true,
  "message": "Airdrop cüzdanını silmeden önce başka bir cüzdan seçin.",
  "code": 400
}

// Validation hatası
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "errors": [
    "Geçerli bir işlem tipi seçiniz",
    "İşlem miktarı zorunludur"
  ],
  "code": 400
}
```

## 📊 İşlem Tipleri

- **send**: Gönderim işlemi
- **receive**: Alma işlemi  
- **swap**: Token takası
- **stake**: Stake etme
- **unstake**: Stake'i bozma
- **airdrop**: Airdrop alma
- **other**: Diğer işlemler

## 🔧 Kullanım Örnekleri

### cURL ile Test:

```bash
# Cüzdanları listele
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5005/api/v1/wallets/

# Cüzdan sil
curl -X DELETE \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5005/api/v1/wallets/WALLET_ID

# İşlem geçmişi
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:5005/api/v1/wallets/WALLET_ID/transactions?page=1&limit=10"

# İşlem ekle
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "send",
       "amount": "0.5",
       "currency": "ETH", 
       "txHash": "0xabc123...",
       "fromAddress": "0x123...",
       "toAddress": "0x456..."
     }' \
     http://localhost:5005/api/v1/wallets/WALLET_ID/transactions
```

## 💡 Notlar

- İşlem kayıtları cüzdan silindiğinde otomatik olarak silinir
- Transaction hash'leri sistem genelinde benzersiz olmalıdır
- Sayfalama performance için optimize edilmiştir
- Tüm endpoint'ler rate limiting kapsamındadır 