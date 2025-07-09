# Finscope Cüzdan API Dokümantasyonu

## Genel Bilgiler

**Base URL**: `{API_URL}/api/v1/wallets`

**Kimlik Doğrulama**: Çoğu endpoint için JWT token gereklidir. Token'ı request header'ında şu şekilde gönderin:
```
Authorization: Bearer {your_jwt_token}
```

**⚠️ Kimlik Doğrulama Gerektirmeyen Endpoint'ler:**
- `POST /validate-address` - Adres doğrulama
- `GET /supported-networks` - Desteklenen ağlar

**Content-Type**: `application/json`

**Yanıt Formatı**:
```json
{
  "success": true,
  "error": false,
  "data": {},
  "message": "İşlem mesajı",
  "code": 200
}
```

## Desteklenen Blockchain Ağları

- **Ethereum** (EIP-55 Checksum destekli)
- **Solana** (Base58 format)
- **Tron** (Base58 format, T prefix)
- **BNBChain** (Ethereum uyumlu)
- **SUI** (64 hex karakter)
- **Base** (Ethereum uyumlu)

## 💰 **Bakiye Yönetimi Özellikleri**

### 🔒 **Güvenlik Odaklı Bakiye Sistemi:**
- **SADECE Otomatik Bakiye**: Blockchain'den gerçek zamanlı çekilen
- **🚫 Manuel Bakiye**: GÜVENLİK RİSKİ nedeniyle kaldırıldı
- **✅ Doğrulanmış Veriler**: Sadece blockchain kaynaklı veriler

### 💱 **Desteklenen Para Birimleri:**
- **ETH** (Ethereum)
- **SOL** (Solana) 
- **TRX** (Tron)
- **BNB** (BNB Chain)
- **SUI** (SUI Network)
- **USDC, USDT** (Stablecoin'ler)
- **Diğer ERC-20 token'lar**

### 💵 **USD Değeri:**
- Gerçek zamanlı fiyat dönüşümü
- CoinGecko/CoinMarketCap entegrasyonu
- Toplam portföy değeri hesaplama

### 🔐 **Güvenlik Önlemleri:**
- **❌ Kullanıcı Manuel Girişi**: Kullanıcılar bakiye değiştiremez
- **✅ Blockchain Doğrulama**: Sadece blockchain verisi kabul edilir
- **🔄 Otomatik Güncelleme**: Sistem kontrollü bakiye yenileme
- **🛡️ Sahtecilik Koruması**: Gerçek blockchain verilerini garanti eder

## API Endpoint'leri

### 1. Adres Doğrulama ⭐ **MEVCUT**
**Endpoint**: `POST /validate-address`
**🔓 Kimlik doğrulama gerektirmez**

Cüzdan adresinin format ve checksum doğruluğunu kontrol eder.

**Request Body**:
```json
{
  "network": "Ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "valid": true,
    "normalizedAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "network": "Ethereum",
    "message": "Adres geçerli"
  },
  "message": "Adres doğrulama başarılı",
  "code": 200
}
```

**Hatalı Adres Yanıtı (400)**:
```json
{
  "success": false,
  "error": true,
  "data": {
    "valid": false,
    "error": "Ethereum adresi checksum hatası",
    "suggestion": "Doğru format: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "network": "Ethereum"
  },
  "message": "Adres doğrulama başarısız",
  "code": 400
}
```

---

### 2. Desteklenen Ağlar ⭐ **MEVCUT**
**Endpoint**: `GET /supported-networks`
**🔓 Kimlik doğrulama gerektirmez**

Desteklenen blockchain ağları ve format bilgilerini döndürür.

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "supportedNetworks": ["Ethereum", "Solana", "Tron", "BNBChain", "SUI", "Base"],
    "networkFormats": {
      "Ethereum": {
        "format": "0x + 40 hex karakter",
        "example": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "length": 42,
        "features": ["EIP-55 Checksum"]
      },
      "Solana": {
        "format": "Base58 encoded, 32-44 karakter",
        "example": "DhJ4mFqBfbfHkuDrBpBxjy1w2pQW2pQW2pQW2pQW2pQW",
        "length": "32-44",
        "features": ["Base58 Encoding"]
      }
    },
    "totalNetworks": 6
  },
  "message": "Desteklenen ağlar başarıyla getirildi",
  "code": 200
}
```

---

### 3. Cüzdan Bağlama ⚡ **Güncellenmiş**
**Endpoint**: `POST /connect`
**🔒 JWT Token gerekli**

Kullanıcının blockchain cüzdanını sisteme bağlar. **Artık bakiye takibi ile!**

**Request Body**:
```json
{
  "network": "Ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**✅ Yeni Özellikler:**
- **Gerçek adres formatı doğrulama**
- **EIP-55 Checksum kontrolü** (Ethereum, BNBChain, Base için)
- **Base58 format kontrolü** (Solana, Tron için)
- **Ağa özel validasyon kuralları**
- **Normalize edilmiş adres döndürme**

**Parametreler**:
- `network` (zorunlu): Desteklenen ağlardan biri
- `address` (zorunlu): Cüzdan adresi (26-100 karakter arası)

**Başarılı Yanıt (200)** - **YENİ: Bakiye Bilgileri Dahil:**
```json
{
  "success": true,
  "error": false,
  "data": {
    "_id": "user_id",
    "name": "Kullanıcı Adı",
    "email": "user@example.com",
    "wallets": [
      {
        "_id": "wallet_id",
        "user": "user_id",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": false,
        "balances": [],
        "isManualBalance": false,
        "totalUsdValue": "0",
        "lastBalanceCheck": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Cüzdan başarıyla bağlandı.",
  "code": 200
}
```

**Hata Yanıtları**:
- `400`: Cüzdan adresi zaten kullanımda / Ağ için maksimum cüzdan sayısı aşıldı
- `404`: Kullanıcı bulunamadı

---

### 4. Airdrop Cüzdanı Ayarlama
**Endpoint**: `POST /set-airdrop`

Kullanıcının airdrop alacağı cüzdanı belirler. Sadece kullanıcının mevcut cüzdanları airdrop cüzdanı olarak seçilebilir.

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Parametreler**:
- `address` (zorunlu): Mevcut cüzdan adresi

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "_id": "user_id",
    "name": "Kullanıcı Adı",
    "email": "user@example.com",
    "wallets": [
      {
        "_id": "wallet_id",
        "user": "user_id",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Airdrop cüzdanı başarıyla ayarlandı.",
  "code": 200
}
```

**Hata Yanıtları**:
- `400`: Belirtilen adres kullanıcının cüzdanları arasında bulunamadı

---

### 5. Airdrop Cüzdanını Kaldırma ⭐ **YENİ**
**Endpoint**: `DELETE /remove-airdrop`
**🔒 JWT Token gerekli**

Kullanıcının mevcut airdrop cüzdanı ayarını kaldırır.

**Request Body**: Yok

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "Kullanıcı Adı",
      "email": "user@example.com",
      "wallets": [
        {
          "_id": "wallet_id",
          "user": "user_id",
          "network": "Ethereum",
          "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          "isAirdropAddress": false,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    },
    "removedAirdropAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "message": "Airdrop cüzdanı kaldırıldı"
  },
  "message": "Airdrop cüzdanı kaldırıldı.",
  "code": 200
}
```

**Hata Yanıtları**:
- `400`: Airdrop olarak ayarlanmış cüzdan bulunamadı

---

### 6. Mevcut Airdrop Cüzdanını Görüntüleme ⭐ **YENİ**
**Endpoint**: `GET /airdrop`
**🔒 JWT Token gerekli**

Kullanıcının mevcut airdrop cüzdanını gösterir.

**Query Parametreleri**: Yok

**Airdrop Var - Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "hasAirdrop": true,
    "airdropWallet": {
      "_id": "wallet_id",
      "user": "user_id",
      "network": "Ethereum",
      "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "isAirdropAddress": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "message": "Airdrop cüzdanı bulundu"
  },
  "message": "Airdrop cüzdanı getirildi.",
  "code": 200
}
```

**Airdrop Yok - Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "hasAirdrop": false,
    "airdropWallet": null,
    "message": "Airdrop cüzdanı ayarlanmamış"
  },
  "message": "Airdrop cüzdanı ayarlanmamış.",
  "code": 200
}
```

---

### 7. Cüzdanları Listeleme ⚡ **Güncellenmiş**
**Endpoint**: `GET /`
**🔒 JWT Token gerekli**

Kullanıcının tüm cüzdanlarını bakiye bilgileri ile listeler.

**Query Parametreleri**: Yok

**Başarılı Yanıt (200)** - **YENİ: Bakiye Bilgileri Dahil:**
```json
{
  "success": true,
  "error": false,
  "data": {
    "wallets": [
      {
        "_id": "wallet_id_1",
        "user": "user_id",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": true,
        "balances": [
          {
            "currency": "ETH",
            "amount": "2.5",
            "usdValue": "4250.00",
            "lastUpdated": "2024-01-01T00:00:00.000Z"
          },
          {
            "currency": "USDC",
            "amount": "500.00",
            "usdValue": "500.00",
            "lastUpdated": "2024-01-01T00:00:00.000Z"
          }
        ],
        "isManualBalance": false,
        "lastBalanceCheck": "2024-01-01T00:00:00.000Z",
        "totalUsdValue": "4750.00",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "_id": "wallet_id_2",
        "user": "user_id",
        "network": "Solana",
        "address": "DhJ4mFqBfbfHkuDrBpBxjy1w2pQW2pQW2pQW2pQW2pQW",
        "isAirdropAddress": false,
        "balances": [],
        "isManualBalance": false,
        "lastBalanceCheck": "2024-01-01T00:00:00.000Z",
        "totalUsdValue": "0",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCount": 2
  },
  "message": "Cüzdanlar başarıyla getirildi.",
  "code": 200
}
```

---

### 8. Cüzdan Silme
**Endpoint**: `DELETE /{walletId}`

Belirtilen cüzdanı sistemden siler. Airdrop cüzdanı silinmek isteniyorsa önce başka bir cüzdan airdrop olarak seçilmelidir.

**URL Parametreleri**:
- `walletId`: Silinecek cüzdanın ID'si

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "message": "Cüzdan başarıyla silindi."
  },
  "message": "Cüzdan başarıyla silindi.",
  "code": 200
}
```

**Hata Yanıtları**:
- `400`: Airdrop cüzdanını silmeden önce başka bir cüzdan seçin
- `404`: Cüzdan bulunamadı veya size ait değil

---

### 7. Cüzdan İşlem Geçmişi
**Endpoint**: `GET /{walletId}/transactions`

Belirtilen cüzdanın işlem geçmişini sayfalama ile getirir.

**URL Parametreleri**:
- `walletId`: İşlem geçmişi görüntülenecek cüzdanın ID'si

**Query Parametreleri**:
- `page` (opsiyonel): Sayfa numarası (varsayılan: 1)
- `limit` (opsiyonel): Sayfa başına kayıt sayısı (varsayılan: 20)

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "transactions": [
      {
        "_id": "transaction_id",
        "wallet": "wallet_id",
        "user": "user_id",
        "type": "send",
        "amount": "0.5",
        "currency": "ETH",
        "txHash": "0x123...abc",
        "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "toAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "gasUsed": "21000",
        "gasPrice": "20000000000",
        "status": "success",
        "blockNumber": 18500000,
        "description": "Test işlemi",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 95,
      "hasNextPage": true
    }
  },
  "message": "İşlem geçmişi başarıyla getirildi.",
  "code": 200
}
```

**Hata Yanıtları**:
- `404`: Cüzdan bulunamadı veya size ait değil

---

### 8. İşlem Ekleme
**Endpoint**: `POST /{walletId}/transactions`

Cüzdana yeni bir işlem ekler (demo/test amaçlı).

**URL Parametreleri**:
- `walletId`: İşlem eklenecek cüzdanın ID'si

**Request Body**:
```json
{
  "type": "send",
  "amount": "0.5",
  "currency": "ETH",
  "txHash": "0x123...abc",
  "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "description": "Test transaction"
}
```

**Parametreler**:
- `type` (zorunlu): İşlem tipi ("send", "receive", "swap", "stake", "unstake", "airdrop", "other")
- `amount` (zorunlu): İşlem miktarı (string formatında)
- `currency` (zorunlu): Para birimi (2-10 karakter, büyük harf)
- `txHash` (zorunlu): İşlem hash'i (20-200 karakter, benzersiz)
- `fromAddress` (opsiyonel): Gönderen adres
- `toAddress` (opsiyonel): Alıcı adres
- `description` (opsiyonel): İşlem açıklaması (max: 500 karakter)

**Başarılı Yanıt (201)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "_id": "transaction_id",
    "wallet": "wallet_id",
    "user": "user_id",
    "type": "send",
    "amount": "0.5",
    "currency": "ETH",
    "txHash": "0x123...abc",
    "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "toAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "gasUsed": "0",
    "gasPrice": "0",
    "status": "success",
    "description": "Test transaction",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "İşlem başarıyla eklendi.",
  "code": 201
}
```

**Hata Yanıtları**:
- `400`: İşlem hash'i zaten kayıtlı / Validation hatası
- `404`: Cüzdan bulunamadı veya size ait değil

---

## İşlem Tipleri

| Tip | Açıklama |
|-----|----------|
| `send` | Gönderme işlemi |
| `receive` | Alma işlemi |
| `swap` | Token değişimi |
| `stake` | Staking işlemi |
| `unstake` | Unstaking işlemi |
| `airdrop` | Airdrop alma |
| `other` | Diğer işlemler |

## İşlem Durumları

| Durum | Açıklama |
|-------|----------|
| `pending` | Beklemede |
| `success` | Başarılı |
| `failed` | Başarısız |

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| `200` | Başarılı |
| `201` | Başarıyla oluşturuldu |
| `400` | Geçersiz istek (validation hatası) |
| `401` | Yetkisiz erişim (token eksik/geçersiz) |
| `403` | Erişim reddedildi |
| `404` | Kaynak bulunamadı |
| `500` | Sunucu hatası |

## Örnek Kullanımlar

### JavaScript/Fetch API

#### 1. Adres Doğrulama
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/validate-address`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    network: 'Ethereum',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  })
});

const result = await response.json();
console.log(result);
```

#### 2. Desteklenen Ağlar
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/supported-networks`, {
  method: 'GET',
  headers: {
  }
});

const result = await response.json();
console.log(result.data.supportedNetworks);
```

#### 3. Cüzdan Bağlama
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/connect`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    network: 'Ethereum',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  })
});

const result = await response.json();
console.log(result);
```

#### 4. Cüzdan Listesi Alma
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result.data.wallets);
```

#### 5. İşlem Geçmişi Alma (Sayfalama ile)
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/${walletId}/transactions?page=1&limit=10`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result.data.transactions);
```

#### 6. Airdrop Cüzdanı Ayarlama
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/set-airdrop`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  })
});

const result = await response.json();
console.log(result);
```

#### 7. Airdrop Cüzdanını Kaldırma
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/remove-airdrop`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result);
```

#### 8. Mevcut Airdrop Cüzdanını Görüntüleme
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/airdrop`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result);
```

#### 9. Cüzdan Silme
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/${walletId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result);
```

#### 10. İşlem Ekleme
```javascript
const response = await fetch(`${API_URL}/api/v1/wallets/${walletId}/transactions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'send',
    amount: '0.5',
    currency: 'ETH',
    txHash: '0x123...abc',
    fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    toAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    description: 'Test transaction'
  })
});

const result = await response.json();
console.log(result);
```

#### 11. Cüzdan Bakiyesini Yenileme
```javascript
const refreshWalletBalance = async (walletId) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/wallets/${walletId}/balance/refresh`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log('Güncel bakiye:', result.data.wallet.balances);
    console.log('Toplam USD:', result.data.wallet.totalUsdValue);
    return result;
  } catch (error) {
    console.error('Bakiye yenileme hatası:', error);
    throw error;
  }
};
```

#### 12. Manuel Bakiye Güncelleme
```javascript
const updateManualBalance = async (walletId, balances) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/wallets/${walletId}/balance/manual`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        balances: [
          {
            currency: 'ETH',
            amount: '3.75',
            usdValue: '6375.00'
          },
          {
            currency: 'USDC',
            amount: '1000.00',
            usdValue: '1000.00'
          }
        ]
      })
    });

    const result = await response.json();
    console.log('Manuel bakiye güncellendi:', result.data.wallet);
    return result;
  } catch (error) {
    console.error('Manuel bakiye hatası:', error);
    throw error;
  }
};
```

#### 13. Portföy Özeti Görüntüleme
```javascript
const getPortfolioSummary = async () => {
  try {
    const response = await fetch(`${API_URL}/api/v1/wallets/portfolio`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    console.log('Toplam Portföy Değeri:', result.data.totalUsdValue, 'USD');
    console.log('Cüzdan Sayısı:', result.data.totalWallets);
    console.log('Para Birimi Dağılımı:', result.data.currencyTotals);
    
    return result.data;
  } catch (error) {
    console.error('Portföy özeti hatası:', error);
    throw error;
  }
};
```

#### 14. Tüm Cüzdan Bakiyelerini Yenileme
```javascript
const refreshAllWalletBalances = async () => {
  try {
    const response = await fetch(`${API_URL}/api/v1/wallets/balance/refresh-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log(`${result.data.updatedCount} cüzdan güncellendi`);
    return result;
  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    throw error;
  }
};
```

### Axios Kullanımı

```javascript
import axios from 'axios';

// Axios instance oluşturma
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

// Portföy yönetimi class'ı
class PortfolioManager {
  
  // Cüzdan bakiyesini yenile
  async refreshWalletBalance(walletId) {
    try {
      const response = await api.put(`/wallets/${walletId}/balance/refresh`);
      return response.data;
    } catch (error) {
      throw new Error(`Bakiye yenileme hatası: ${error.response.data.message}`);
    }
  }
  
  // Manuel bakiye güncelle
  async updateManualBalance(walletId, balances) {
    try {
      const response = await api.put(`/wallets/${walletId}/balance/manual`, {
        balances
      });
      return response.data;
    } catch (error) {
      throw new Error(`Manuel bakiye hatası: ${error.response.data.message}`);
    }
  }
  
  // Portföy özeti
  async getPortfolioSummary() {
    try {
      const response = await api.get('/wallets/portfolio');
      return response.data.data;
    } catch (error) {
      throw new Error(`Portföy özeti hatası: ${error.response.data.message}`);
    }
  }
  
  // Tüm bakiyeleri yenile
  async refreshAllBalances() {
    try {
      const response = await api.put('/wallets/balance/refresh-all');
      return response.data;
    } catch (error) {
      throw new Error(`Toplu güncelleme hatası: ${error.response.data.message}`);
    }
  }
}

// Kullanım örneği
const portfolio = new PortfolioManager();

// Portföy verilerini al ve göster
const displayPortfolio = async () => {
  try {
    const data = await portfolio.getPortfolioSummary();
    
    console.log('=== PORTFÖY ÖZETİ ===');
    console.log(`Toplam Değer: $${data.totalUsdValue}`);
    console.log(`Toplam Cüzdan: ${data.totalWallets}`);
    
    console.log('\n=== PARA BİRİMİ DAĞILIMI ===');
    data.currencyTotals.forEach(currency => {
      console.log(`${currency.currency}: ${currency.totalAmount} ($${currency.totalUsdValue})`);
    });
    
    console.log('\n=== CÜZDAN DETAYLARI ===');
    data.portfolioBreakdown.forEach((wallet, index) => {
      console.log(`${index + 1}. ${wallet.network} - $${wallet.usdValue}`);
      wallet.balances.forEach(balance => {
        console.log(`   ${balance.currency}: ${balance.amount} ($${balance.usdValue})`);
      });
    });
    
  } catch (error) {
    console.error('Portföy gösterme hatası:', error.message);
  }
};
```

---

### 9. Cüzdan Bakiyesini Yenileme ⭐ **GÜVENLİ**
**Endpoint**: `PUT /{walletId}/balance/refresh`
**🔒 JWT Token gerekli**

Blockchain'den gerçek zamanlı bakiye çeker ve günceller. **SADECE blockchain verisi kabul edilir.**

**URL Parametreleri**:
- `walletId`: Bakiyesi güncellenecek cüzdanın ID'si

**Request Body**: Yok

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "wallet": {
      "_id": "wallet_id",
      "network": "Ethereum",
      "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "balances": [
        {
          "currency": "ETH",
          "amount": "2.5",
          "usdValue": "4250.00",
          "lastUpdated": "2024-01-01T00:00:00.000Z"
        }
      ],
      "totalUsdValue": "4250.00",
      "lastBalanceCheck": "2024-01-01T00:00:00.000Z"
    },
    "message": "Bakiye blockchain'den başarıyla güncellendi"
  },
  "message": "Bakiye blockchain'den başarıyla güncellendi.",
  "code": 200
}
```

**🔒 Güvenlik Notları:**
- Bakiye SADECE blockchain'den çekilir
- Kullanıcı bakiye değiştiremez
- Sahte veriler kabul edilmez

**Hata Yanıtları**:
- `400`: Blockchain bağlantı hatası
- `404`: Cüzdan bulunamadı

---

### 🚫 **KALDIRILDI: Manuel Bakiye Güncelleme**
**GÜVENLİK RİSKİ nedeniyle kaldırıldı**

Manuel bakiye özelliği güvenlik riski oluşturduğu için kaldırılmıştır. 
Artık **SADECE blockchain'den gelen veriler** kabul edilmektedir.

**❌ Eski Endpoint:** `PUT /{walletId}/balance/manual`
**✅ Yeni Yaklaşım:** Sadece `PUT /{walletId}/balance/refresh` kullanın

---

### 10. Tüm Cüzdan Bakiyelerini Yenileme ⭐ **GÜVENLİ**
**Endpoint**: `PUT /balance/refresh-all`
**🔒 JWT Token gerekli**

Kullanıcının tüm cüzdanlarının bakiyesini blockchain'den günceller. **Tüm cüzdanlar otomatik moda çevrilir.**

**Request Body**: Yok

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "message": "3 cüzdan bakiyesi blockchain'den güncellendi",
    "updatedCount": 3,
    "totalWallets": 5
  },
  "message": "Tüm cüzdan bakiyeleri blockchain'den güncellendi.",
  "code": 200
}
```

**🔒 Güvenlik Notları:**
- Tüm cüzdanlar otomatik moda çevrilir
- Manuel bakiye geçmişi silinir
- Sadece blockchain verisi kalır

---

### 11. Portföy Özeti ⭐ **GÜVENLİ**
**Endpoint**: `GET /portfolio`
**🔒 JWT Token gerekli**

Kullanıcının toplam portföy değeri ve detaylı bakiye özetini getirir. **Tüm veriler blockchain kaynaklıdır.**

**Query Parametreleri**: Yok

**Başarılı Yanıt (200)**:
```json
{
  "success": true,
  "error": false,
  "data": {
    "totalUsdValue": "15825.55",
    "totalWallets": 4,
    "currencyTotals": [
      {
        "currency": "ETH",
        "totalAmount": "6.25",
        "totalUsdValue": "10625.00"
      },
      {
        "currency": "SOL",
        "totalAmount": "125.75",
        "totalUsdValue": "2515.00"
      },
      {
        "currency": "USDC",
        "totalAmount": "2685.55",
        "totalUsdValue": "2685.55"
      }
    ],
    "portfolioBreakdown": [
      {
        "walletId": "wallet_id_1",
        "network": "Ethereum",
        "address": "0x742d35Cc...",
        "balances": [
          {
            "currency": "ETH",
            "amount": "2.5",
            "usdValue": "4250.00",
            "lastUpdated": "2024-01-01T00:00:00.000Z"
          }
        ],
        "usdValue": "4250.00",
        "lastUpdated": "2024-01-01T00:00:00.000Z",
        "isAutomatic": true
      }
    ],
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "securityNote": "Tüm bakiyeler blockchain'den otomatik olarak güncellenmektedir"
  },
  "message": "Portföy değeri başarıyla getirildi.",
  "code": 200
}
```

**🔒 Güvenlik Özellikleri:**
- `isAutomatic: true` - Tüm bakiyeler otomatik
- `securityNote` - Güvenlik garantisi mesajı
- Sahte veriler mümkün değil

---

## 💰 **Bakiye Yönetimi Akışları**

### 🔒 **Güvenli Otomatik Bakiye Akışı:**
1. **Cüzdan Bağla** → `POST /connect`
2. **Bakiye Yenile** → `PUT /{walletId}/balance/refresh`
3. **Portföy Görüntüle** → `GET /portfolio`

### 🚫 **KALDIRILDI: Manuel Bakiye Akışı**
Manuel bakiye özelliği güvenlik riski nedeniyle kaldırılmıştır.

### 📊 **Güvenli Portföy Takibi:**
1. **Tüm Bakiyeleri Yenile** → `PUT /balance/refresh-all`
2. **Portföy Özeti** → `GET /portfolio`
3. **Detaylı Liste** → `GET /` 

---

## 🔒 **Güvenlik ve Bakiye Sistemi**

### 💎 **Önemli Güvenlik Özellikleri**

### 🛡️ **Sadece Blockchain Verisi:**
- **✅ Otomatik**: Blockchain'den gerçek zamanlı veri
- **❌ Manuel**: GÜVENLİK RİSKİ nedeniyle kaldırıldı
- **🔐 Doğrulanmış**: Tüm veriler blockchain kaynaklı

### 💱 **Para Birimi Desteği:**
- **Ana Tokenlar**: ETH, SOL, TRX, BNB, SUI
- **Stablecoin'ler**: USDC, USDT, DAI
- **Özel Tokenlar**: ERC-20, SPL, TRC-20

### 📊 **Güvenli Portföy Takibi:**
- **Toplam USD Değeri**: Blockchain'den hesaplama
- **Para Birimi Breakdown**: Doğrulanmış token toplamı
- **Cüzdan Analizi**: Gerçek ağ bazında dağılım
- **Tarihçe**: Blockchain'den güncelleme tarihleri

### 🚀 **Performance:**
- **Parallel Fetching**: Birden fazla cüzdan aynı anda
- **Real-time Data**: Gerçek zamanlı blockchain verisi
- **Efficient API**: Optimized blockchain sorgulama

### 🔒 **Güvenlik Kontrolleri:**
- **Sahiplik Kontrolü**: Sadece kendi cüzdanları
- **Rate Limiting**: API çağrı sınırı
- **Data Validation**: Blockchain verisi doğrulama
- **❌ Sahte Veri**: Manuel veri girişi mümkün değil
- **✅ Güvenlik Garantisi**: %100 blockchain kaynaklı

### 🚨 **Önemli Güvenlik Değişiklikleri:**

**❌ KALDIRILDI (Güvenlik Riski):**
- Manuel bakiye girişi
- Kullanıcı kontrollü bakiye değişikliği
- Sahte veri girişi imkanı

**✅ EKLENDİ (Güvenlik Artışı):**
- Sadece blockchain verisi
- Otomatik doğrulama sistemi
- Sahtecilik koruması
- Gerçek zamanlı veri garantisi

---

**🎯 GÜVENLİK ÖZETİ:** 

Artık cüzdanlarınızda ne kadar paranız olduğunu **SADECE blockchain'den gerçek zamanlı** olarak takip edebilirsiniz! 

**❌ Kullanıcılar artık sahte bakiye giremez**
**✅ Sadece gerçek blockchain verisi gösterilir**
**🔒 %100 güvenli ve doğrulanmış veri garantisi**

Bu dokümantasyon, Finscope uygulamasının güvenli cüzdan yönetimi API'sinin tüm özelliklerini kapsamaktadır. 