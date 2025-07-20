# 🏦 FinScope Backend API Dokümantasyonu v1.0

**Enterprise-level Finansal Uygulama Backend Servisi**

![Version](https://img.shields.io/badge/Version-1.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)
![Security](https://img.shields.io/badge/Security-8.5%2F10-brightgreen.svg)

---

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🔐 Kimlik Doğrulama](#-kimlik-doğrulama)
- [📡 API Endpoints](#-api-endpoints)
- [🛡️ Güvenlik](#️-güvenlik)
- [❌ Hata Yönetimi](#-hata-yönetimi)
- [📊 Veri Modelleri](#-veri-modelleri)
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

**Token Yapısı:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "iat": 1640995200,
    "exp": 1640998800
  }
}
```

**Token Süresi:** 1 saat (3600 saniye)

---

## 📡 API Endpoints

### 👤 Kullanıcı Yönetimi

#### 1. Kullanıcı Kaydı

**Endpoint:** `POST /user/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation Kuralları:**
- `name`: 2-50 karakter, sadece harf ve boşluk
- `email`: Geçerli email formatı
- `password`: En az 8 karakter, 1 büyük, 1 küçük, 1 rakam, 1 özel karakter

**Response (201):**
```json
{
  "success": true,
  "error": false,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-12-19T10:30:00.000Z",
      "updatedAt": "2024-12-19T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "code": 201
}
```

#### 2. Kullanıcı Girişi

**Endpoint:** `POST /user/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Giriş başarılı",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "wallets": []
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "code": 200
}
```

#### 3. Kullanıcı Profili

**Endpoint:** `GET /user/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Profil bilgileri başarıyla getirildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "wallets": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": false
      }
    ],
    "createdAt": "2024-12-19T10:30:00.000Z",
    "updatedAt": "2024-12-19T10:30:00.000Z"
  },
  "code": 200
}
```

#### 4. Kullanıcı Çıkışı

**Endpoint:** `POST /user/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Başarıyla çıkış yapıldı",
  "data": null,
  "code": 200
}
```

---

### 🏦 Cüzdan Yönetimi

#### 1. Desteklenen Ağlar

**Endpoint:** `GET /wallets/supported-networks`

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Desteklenen ağlar başarıyla getirildi",
  "data": {
    "supportedNetworks": [
      "Ethereum",
      "Solana", 
      "Tron",
      "BNBChain",
      "SUI",
      "Base"
    ],
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
  "code": 200
}
```

#### 2. Adres Doğrulama

**Endpoint:** `POST /wallets/validate-address`

**Request Body:**
```json
{
  "network": "Ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Adres doğrulama başarılı",
  "data": {
    "valid": true,
    "normalizedAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "network": "Ethereum",
    "message": "Adres geçerli"
  },
  "code": 200
}
```

**Hata Response (400):**
```json
{
  "success": false,
  "error": true,
  "message": "Adres doğrulama başarısız",
  "data": {
    "valid": false,
    "error": "Geçersiz Ethereum adresi formatı",
    "suggestion": "Doğru format: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "network": "Ethereum"
  },
  "code": 400
}
```

#### 3. Cüzdan Bağlama

**Endpoint:** `POST /wallets/connect`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "network": "Ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Cüzdan başarıyla bağlandı",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "wallets": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": false,
        "balances": [
          {
            "currency": "ETH",
            "amount": "1.23456789",
            "usdValue": "2098.76",
            "lastUpdated": "2024-12-19T10:30:00.000Z"
          }
        ],
        "totalUsdValue": "2098.76",
        "lastBalanceCheck": "2024-12-19T10:30:00.000Z",
        "createdAt": "2024-12-19T10:30:00.000Z",
        "updatedAt": "2024-12-19T10:30:00.000Z"
      }
    ]
  },
  "code": 200
}
```

#### 4. Cüzdan Listesi

**Endpoint:** `GET /wallets/`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Cüzdanlar başarıyla getirildi",
  "data": {
    "wallets": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "user": "507f1f77bcf86cd799439011",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": true,
        "balances": [
          {
            "currency": "ETH",
            "amount": "1.23456789",
            "usdValue": "2098.76",
            "lastUpdated": "2024-12-19T10:30:00.000Z"
          }
        ],
        "totalUsdValue": "2098.76",
        "lastBalanceCheck": "2024-12-19T10:30:00.000Z",
        "createdAt": "2024-12-19T10:30:00.000Z",
        "updatedAt": "2024-12-19T10:30:00.000Z"
      }
    ],
    "totalCount": 1
  },
  "code": 200
}
```

#### 5. Airdrop Cüzdanı Ayarlama

**Endpoint:** `PUT /wallets/airdrop`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Airdrop cüzdanı başarıyla ayarlandı",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "wallets": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "network": "Ethereum",
        "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "isAirdropAddress": true
      }
    ]
  },
  "code": 200
}
```

#### 6. Airdrop Cüzdanı Kaldırma

**Endpoint:** `DELETE /wallets/airdrop`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Airdrop cüzdanı kaldırıldı",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "wallets": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "network": "Ethereum",
          "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          "isAirdropAddress": false
        }
      ]
    },
    "removedAirdropAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "message": "Airdrop cüzdanı kaldırıldı"
  },
  "code": 200
}
```

#### 7. Airdrop Cüzdanı Görüntüleme

**Endpoint:** `GET /wallets/airdrop`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Airdrop cüzdanı getirildi",
  "data": {
    "hasAirdrop": true,
    "airdropWallet": {
      "_id": "507f1f77bcf86cd799439012",
      "network": "Ethereum",
      "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "isAirdropAddress": true,
      "balances": [
        {
          "currency": "ETH",
          "amount": "1.23456789",
          "usdValue": "2098.76"
        }
      ],
      "totalUsdValue": "2098.76"
    },
    "message": "Airdrop cüzdanı bulundu"
  },
  "code": 200
}
```

#### 8. Cüzdan Silme

**Endpoint:** `DELETE /wallets/:walletId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "Cüzdan başarıyla silindi",
  "data": {
    "message": "Cüzdan başarıyla silindi"
  },
  "code": 200
}
```

#### 9. Cüzdan İşlem Geçmişi

**Endpoint:** `GET /wallets/:walletId/transactions`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "error": false,
  "message": "İşlem geçmişi başarıyla getirildi",
  "data": {
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "wallet": "507f1f77bcf86cd799439012",
        "user": "507f1f77bcf86cd799439011",
        "type": "send",
        "amount": "0.5",
        "currency": "ETH",
        "txHash": "0xabc123def456...",
        "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "toAddress": "0x1234567890123456789012345678901234567890",
        "status": "success",
        "description": "Test işlemi",
        "createdAt": "2024-12-19T10:30:00.000Z",
        "updatedAt": "2024-12-19T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 89,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "code": 200
}
```

#### 10. İşlem Ekleme (Demo/Test)

**Endpoint:** `POST /wallets/:walletId/transactions`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "type": "send",
  "amount": "0.5",
  "currency": "ETH",
  "txHash": "0xabc123def4567890123456789012345678901234567890abcdef1234567890",
  "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "toAddress": "0x1234567890123456789012345678901234567890",
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

**Response (201):**
```json
{
  "success": true,
  "error": false,
  "message": "İşlem başarıyla eklendi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "wallet": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "type": "send",
    "amount": "0.5",
    "currency": "ETH",
    "txHash": "0xabc123def456...",
    "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "toAddress": "0x1234567890123456789012345678901234567890",
    "status": "success",
    "description": "Test işlemi",
    "createdAt": "2024-12-19T10:30:00.000Z",
    "updatedAt": "2024-12-19T10:30:00.000Z"
  },
  "code": 201
}
```

---

## 🛡️ Güvenlik

### Rate Limiting

**Genel API:** 100 istek/15dk per IP
**Auth Endpoints:** 5 istek/15dk per IP
**Register:** 3 istek/1saat per IP

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Hesap Kilitleme

**5 başarısız login denemesinden sonra hesap 30 dakika kilitlenir.**

### Password Requirements

- En az 8 karakter
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam
- En az 1 özel karakter (@$!%*?&)

---

## ❌ Hata Yönetimi

### Standart Hata Formatı

```json
{
  "success": false,
  "error": true,
  "message": "Hata mesajı",
  "code": 400
}
```

### HTTP Status Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Yaygın Hata Mesajları

#### Authentication Errors
```json
{
  "success": false,
  "error": true,
  "message": "Geçersiz token",
  "code": 401
}
```

#### Validation Errors
```json
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "errors": [
    "Email geçerli bir format olmalıdır",
    "Şifre en az 8 karakter olmalıdır"
  ],
  "code": 400
}
```

#### Wallet Errors
```json
{
  "success": false,
  "error": true,
  "message": "Bu cüzdan adresi zaten başka bir kullanıcı tarafından bağlanmış",
  "code": 400
}
```

#### Rate Limit Errors
```json
{
  "success": false,
  "error": true,
  "message": "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin",
  "code": 429
}
```

---

## 📊 Veri Modelleri

### User Model
```json
{
  "_id": "ObjectId",
  "name": "String (2-50 chars)",
  "email": "String (unique, lowercase)",
  "password": "String (hashed)",
  "wallets": ["ObjectId (ref: Wallet)"],
  "verificationCode": "String",
  "verificationCodeExpiresAt": "Date",
  "refreshToken": "String",
  "tokenCreatedAt": "Date",
  "passwordChangedAt": "Date",
  "loginAttempts": "Number",
  "lockUntil": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Wallet Model
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "network": "String (enum)",
  "address": "String (unique)",
  "isAirdropAddress": "Boolean",
  "balances": [
    {
      "currency": "String",
      "amount": "String",
      "usdValue": "String",
      "lastUpdated": "Date"
    }
  ],
  "totalUsdValue": "String",
  "lastBalanceCheck": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Transaction Model
```json
{
  "_id": "ObjectId",
  "wallet": "ObjectId (ref: Wallet)",
  "user": "ObjectId (ref: User)",
  "type": "String (enum)",
  "amount": "String",
  "currency": "String",
  "txHash": "String (unique)",
  "fromAddress": "String",
  "toAddress": "String",
  "status": "String",
  "description": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🔧 Entegrasyon Örnekleri

### JavaScript/TypeScript

#### Axios ile API Kullanımı

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5005/api/v1';

// Axios instance oluşturma
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - Token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API fonksiyonları
export const authAPI = {
  // Kullanıcı kaydı
  register: async (userData) => {
    const response = await api.post('/user/register', userData);
    return response.data;
  },

  // Kullanıcı girişi
  login: async (credentials) => {
    const response = await api.post('/user/login', credentials);
    return response.data;
  },

  // Profil bilgileri
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Çıkış
  logout: async () => {
    const response = await api.post('/user/logout');
    return response.data;
  },
};

export const walletAPI = {
  // Desteklenen ağlar
  getSupportedNetworks: async () => {
    const response = await api.get('/wallets/supported-networks');
    return response.data;
  },

  // Adres doğrulama
  validateAddress: async (network, address) => {
    const response = await api.post('/wallets/validate-address', {
      network,
      address,
    });
    return response.data;
  },

  // Cüzdan bağlama
  connectWallet: async (network, address) => {
    const response = await api.post('/wallets/connect', {
      network,
      address,
    });
    return response.data;
  },

  // Cüzdan listesi
  getWallets: async () => {
    const response = await api.get('/wallets/');
    return response.data;
  },

  // Airdrop cüzdanı ayarlama
  setAirdropWallet: async (address) => {
    const response = await api.put('/wallets/airdrop', { address });
    return response.data;
  },

  // Airdrop cüzdanı kaldırma
  removeAirdropWallet: async () => {
    const response = await api.delete('/wallets/airdrop');
    return response.data;
  },

  // Airdrop cüzdanı görüntüleme
  getAirdropWallet: async () => {
    const response = await api.get('/wallets/airdrop');
    return response.data;
  },

  // Cüzdan silme
  deleteWallet: async (walletId) => {
    const response = await api.delete(`/wallets/${walletId}`);
    return response.data;
  },

  // İşlem geçmişi
  getTransactions: async (walletId, page = 1, limit = 20) => {
    const response = await api.get(`/wallets/${walletId}/transactions`, {
      params: { page, limit },
    });
    return response.data;
  },

  // İşlem ekleme
  addTransaction: async (walletId, transactionData) => {
    const response = await api.post(`/wallets/${walletId}/transactions`, transactionData);
    return response.data;
  },
};
```

#### React Hook Örneği

```javascript
import { useState, useEffect } from 'react';
import { walletAPI } from './api';

export const useWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getWallets();
      setWallets(response.data.wallets);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Cüzdanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (network, address) => {
    try {
      const response = await walletAPI.connectWallet(network, address);
      await fetchWallets(); // Listeyi yenile
      return response;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Cüzdan bağlanırken hata oluştu');
    }
  };

  const deleteWallet = async (walletId) => {
    try {
      await walletAPI.deleteWallet(walletId);
      await fetchWallets(); // Listeyi yenile
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Cüzdan silinirken hata oluştu');
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return {
    wallets,
    loading,
    error,
    fetchWallets,
    connectWallet,
    deleteWallet,
  };
};
```

### Python

```python
import requests
import json

class FinScopeAPI:
    def __init__(self, base_url="http://localhost:5005/api/v1"):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
    
    def set_token(self, token):
        self.token = token
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
    
    def _make_request(self, method, endpoint, data=None, params=None):
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url, json=data)
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            print(f"API Error: {e}")
            return None
    
    def register(self, name, email, password):
        data = {
            "name": name,
            "email": email,
            "password": password
        }
        return self._make_request('POST', '/user/register', data)
    
    def login(self, email, password):
        data = {
            "email": email,
            "password": password
        }
        response = self._make_request('POST', '/user/login', data)
        if response and response.get('success'):
            self.set_token(response['data']['token'])
        return response
    
    def get_profile(self):
        return self._make_request('GET', '/user/profile')
    
    def get_wallets(self):
        return self._make_request('GET', '/wallets/')
    
    def connect_wallet(self, network, address):
        data = {
            "network": network,
            "address": address
        }
        return self._make_request('POST', '/wallets/connect', data)

# Kullanım örneği
api = FinScopeAPI()

# Kullanıcı kaydı
register_response = api.register("John Doe", "john@example.com", "SecurePass123!")
print(register_response)

# Giriş
login_response = api.login("john@example.com", "SecurePass123!")
print(login_response)

# Cüzdan listesi
wallets_response = api.get_wallets()
print(wallets_response)

# Cüzdan bağlama
connect_response = api.connect_wallet("Ethereum", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e")
print(connect_response)
```

---

## 📝 Notlar

### Önemli Hatırlatmalar

1. **Token Yönetimi**: JWT token'ları 1 saat geçerlidir. Süre dolduğunda yeniden login gerekir.

2. **Rate Limiting**: API isteklerini makul aralıklarla gönderin.

3. **Error Handling**: Tüm API çağrılarında hata kontrolü yapın.

4. **Validation**: Frontend'de de input validation yapın, backend validation'ı destekleyici olarak kullanın.

5. **Security**: Token'ları güvenli şekilde saklayın (localStorage yerine httpOnly cookie kullanmayı düşünün).

### Desteklenen Blockchain Ağları

| Ağ | Format | Örnek |
|-----|--------|-------|
| Ethereum | 0x + 40 hex | 0x742d35Cc6634C0532925a3b844Bc454e4438f44e |
| Solana | Base58, 32-44 char | DhJ4mFqBfbfHkuDrBpBxjy1w2pQW2pQW2pQW2pQW2pQW |
| Tron | T + 33 Base58 | TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH |
| BNB Chain | 0x + 40 hex | 0x742d35Cc6634C0532925a3b844Bc454e4438f44e |
| Base | 0x + 40 hex | 0x742d35Cc6634C0532925a3b844Bc454e4438f44e |
| SUI | 0x + 64 hex | 0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234 |

### İşlem Tipleri

- `send`: Gönderim işlemi
- `receive`: Alma işlemi
- `swap`: Token takası
- `stake`: Stake etme
- `unstake`: Stake'i bozma
- `airdrop`: Airdrop alma
- `other`: Diğer işlemler

---

**Dokümantasyon Versiyonu:** v1.0  
**Son Güncelleme:** 19 Aralık 2024  
**Backend Versiyonu:** 2.0.0 