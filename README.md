# 🏦 FinScope Backend API

**Enterprise-level finansal uygulama backend servisi**

![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Express](https://img.shields.io/badge/Express-v5.1.0-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v8.16.0-brightgreen.svg)
![Security](https://img.shields.io/badge/Security-8.5%2F10-brightgreen.svg)
![License](https://img.shields.io/badge/License-ISC-yellow.svg)

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [⚙️ Kurulum](#️-kurulum)
- [🔧 Yapılandırma](#-yapılandırma)
- [📖 API Dokümantasyonu](#-api-dokümantasyonu)
- [🛡️ Güvenlik](#️-güvenlik)
- [🧪 Test](#-test)
- [🏗️ Proje Yapısı](#️-proje-yapısı)
- [🤝 Katkıda Bulunma](#-katkıda-bulunma)

## 🚀 Hızlı Başlangıç

```bash
# Repository'yi klonla
git clone https://github.com/ekremilkan/finscope_backend.git
cd finscope_backend

# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp .example.env .env

# Geliştirme sunucusunu başlat
npm start
```

## ⚙️ Kurulum

### Gereksinimler

- **Node.js** v18 veya üzeri
- **MongoDB** v5.0 veya üzeri
- **npm** v8 veya üzeri

### Detaylı Kurulum

1. **Repository'yi klonlayın:**
   ```bash
   git clone https://github.com/ekremilkan/finscope_backend.git
   cd finscope_backend
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Environment dosyasını yapılandırın:**
   ```bash
   cp .example.env .env
   # .env dosyasını düzenleyin
   ```

4. **MongoDB bağlantısını test edin:**
   ```bash
   npm run test:db
   ```

## 🔧 Yapılandırma

### Environment Variables

```env
# Server Configuration
PORT=5005
NODE_ENV=development

# Database
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_COLECTION=finscope_db
MONGODB_CONNECTION_TIMEOUT=5000

# Security
SECRETKEY=your-128-bit-secret-key-here
EXPIRESIN=1h

# API
APP_PREFIX=/api/v1
```

### Güvenlik Yapılandırması

- **JWT Secret**: Minimum 128-bit random key kullanın
- **Rate Limiting**: IP bazlı istek sınırlaması
- **CORS**: Production ortamında domain whitelist
- **Helmet**: Güvenlik header'ları otomatik

## 📖 API Dokümantasyonu

### Base URL
```
Development: http://localhost:5005/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication

Tüm korumalı endpoint'ler için Authorization header gereklidir:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### 👤 User Management

##### POST /user/register
Yeni kullanıcı kaydı

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  },
  "code": 201
}
```

##### POST /user/login
Kullanıcı girişi

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "user": {...},
    "token": "jwt_token_here"
  },
  "code": 200
}
```

##### GET /user/profile
Kullanıcı profil bilgileri (🔒 Korumalı)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profil bilgileri başarıyla getirildi",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-12-19T...",
    "updatedAt": "2024-12-19T..."
  }
}
```

### Error Responses

Tüm hatalar standart format ile döner:

```json
{
  "success": false,
  "error": true,
  "message": "Hata mesajı",
  "code": 400
}
```

### Rate Limiting

- **Genel API**: 100 istek/15dk per IP
- **Auth Endpoints**: 5 istek/15dk per IP
- **Register**: 3 istek/1saat per IP

Rate limit bilgileri response header'larında:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## 🛡️ Güvenlik

### Uygulanan Güvenlik Önlemleri

- ✅ **JWT Authentication** - 128-bit secret key
- ✅ **Input Validation** - Joi ile strict validation
- ✅ **Rate Limiting** - Multi-level protection
- ✅ **Password Security** - bcrypt + complexity rules
- ✅ **Account Locking** - 5 failed attempts → 30min lock
- ✅ **Security Headers** - Helmet.js
- ✅ **NoSQL Injection** - MongoDB sanitization
- ✅ **CORS Protection** - Domain whitelist

**Güvenlik Skoru: 8.5/10** 🔒

Detaylı güvenlik bilgileri için: [SECURITY.md](./SECURITY.md)

## 🧪 Test

### Test Çalıştırma

```bash
# Tüm testleri çalıştır
npm test

# Test coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm test user.test.js
```

### Test Yapısı

```
tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── middlewares/
├── integration/
│   └── api/
└── fixtures/
    └── data/
```

## 🏗️ Proje Yapısı

```
finscope_backend/
├── configs/          # Yapılandırma dosyaları
├── controllers/      # Request handler'lar
├── db/              # Veritabanı bağlantısı
├── dto/             # Data Transfer Objects
├── middlewares/     # Express middleware'ler
├── models/          # Mongoose modelleri
├── routers/         # API route tanımları
├── services/        # İş mantığı servisleri
├── utils/           # Yardımcı fonksiyonlar
├── validations/     # Input validation şemaları
├── consts/          # Sabit değerler
├── tests/           # Test dosyaları
├── server.js        # Ana server dosyası
├── package.json     # Proje bağımlılıkları
├── .env.example     # Environment template
├── README.md        # Bu dosya
└── SECURITY.md      # Güvenlik dokümantasyonu
```

### Mimari Pattern

**Layered Architecture** yaklaşımı kullanılmıştır:

```
Request → Router → Middleware → Controller → Service → Model → Database
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Katkı Kuralları

- ✅ Test yazın
- ✅ ESLint kurallarına uyun
- ✅ Commit mesajlarında conventional format kullanın
- ✅ Dokümantasyonu güncelleyin

## 📝 Scripts

```bash
npm start          # Geliştirme sunucusu
npm test           # Testleri çalıştır
npm run test:coverage  # Test coverage
npm run lint       # Code linting
npm run format     # Code formatting
```

## 📄 License

Bu proje [ISC](LICENSE) lisansı altındadır.

## 📞 İletişim

- **Repository**: [github.com/ekremilkan/finscope_backend](https://github.com/ekremilkan/finscope_backend)
- **Issues**: [GitHub Issues](https://github.com/ekremilkan/finscope_backend/issues)

---

**Son güncelleme**: 2024-12-19  
**Versiyon**: 2.0.0  
**Status**: �� Production Ready 