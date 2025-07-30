# 🔐 Authentication API Dokümantasyonu

**Frontend Geliştirici Rehberi**

![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)

---

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🔐 Kimlik Doğrulama Sistemi](#-kimlik-doğrulama-sistemi)
- [📡 Auth API Endpoints](#-auth-api-endpoints)
- [📊 Token Yapısı](#-token-yapısı)
- [❌ Hata Yönetimi](#-hata-yönetimi)
- [🔧 Entegrasyon Örnekleri](#-entegrasyon-örnekleri)
- [🛡️ Güvenlik Önlemleri](#️-güvenlik-önlemleri)

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

## 🔐 Kimlik Doğrulama Sistemi

### Özellikler

- ✅ **JWT Token Authentication** - 128-bit secret key
- ✅ **Email Verification** - Güvenli email doğrulama
- ✅ **Account Locking** - 5 başarısız deneme → 30 dk kilit
- ✅ **Password Security** - bcrypt + complexity rules
- ✅ **Rate Limiting** - Multi-level protection
- ✅ **Refresh Token** - Otomatik token yenileme

### Kullanıcı Rolleri

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| `admin` | Sistem yöneticisi | Tüm işlemler |
| `customer` | Kampanya sahibi | Kendi kampanyalarını yönetebilir |
| `user` | Normal kullanıcı | Kampanyalara katılabilir |

---

## 📡 Auth API Endpoints

### 1. Kullanıcı Kaydı

**Endpoint:** `POST /user/register`

**Rate Limit:** 3 istek/saat per IP

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

**Validation Kuralları:**
- `name`: 2-50 karakter, sadece harf ve boşluk, zorunlu
- `email`: Geçerli email formatı, zorunlu
- `password`: 8-128 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter (@$!%*?&), zorunlu
- `role`: customer, user, admin (varsayılan: user)

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false,
      "createdAt": "2024-01-10T10:00:00.000Z"
    },
    "token": "jwt_access_token_here",
    "refreshToken": "jwt_refresh_token_here"
  },
  "code": 201
}
```

### 2. Kullanıcı Girişi

**Endpoint:** `POST /user/login`

**Rate Limit:** 5 istek/15dk per IP

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation Kuralları:**
- `email`: Geçerli email formatı, zorunlu
- `password`: Boş olmamalı, zorunlu

**Response (Email doğrulanmamış):**
```json
{
  "success": true,
  "error": false,
  "message": "Doğrulama kodu e-posta adresinize gönderildi",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false
    },
    "requiresVerification": true,
    "message": "Email doğrulama kodu gönderildi"
  },
  "code": 200
}
```

**Response (Email doğrulanmış):**
```json
{
  "success": true,
  "error": false,
  "message": "Giriş başarılı",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "jwt_access_token_here",
    "refreshToken": "jwt_refresh_token_here",
    "expiresIn": 3600
  },
  "code": 200
}
```

### 3. Email Doğrulama

**Endpoint:** `POST /user/verify-login`

**Rate Limit:** 5 istek/15dk per IP

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "verificationCode": "123456"
}
```

**Validation Kuralları:**
- `email`: Geçerli email formatı, zorunlu
- `verificationCode`: 6 haneli kod, zorunlu

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Doğrulama başarılı. Giriş yapıldı.",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "jwt_access_token_here",
    "refreshToken": "jwt_refresh_token_here",
    "expiresIn": 3600
  },
  "code": 200
}
```

### 4. Doğrulama Kodu Yeniden Gönder

**Endpoint:** `POST /user/resend-verification-code`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Code has been sent",
  "data": {
    "email": "john@example.com",
    "message": "Doğrulama kodu yeniden gönderildi"
  },
  "code": 200
}
```

### 5. Kullanıcı Profili Getir

**Endpoint:** `GET /user/profile`

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
  "message": "Profil bilgileri başarıyla getirildi",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "wallets": [
      {
        "_id": "wallet_id",
        "network": "Ethereum",
        "address": "0x123..."
      }
    ],
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 6. Token Yenileme

**Endpoint:** `POST /user/refresh-token`

**Rate Limit:** 5 istek/15dk per IP

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token_here"
}
```

**Validation Kuralları:**
- `refreshToken`: Geçerli refresh token, zorunlu

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Token başarıyla yenilendi",
  "data": {
    "token": "new_jwt_access_token_here",
    "refreshToken": "new_jwt_refresh_token_here",
    "expiresIn": 3600
  },
  "code": 200
}
```

### 7. Çıkış Yap

**Endpoint:** `POST /user/logout/:userId`

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
  "message": "Başarıyla çıkış yapıldı",
  "data": {
    "userId": "user_id",
    "loggedOutAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 8. Şifre Sıfırlama İsteği

**Endpoint:** `POST /user/forgot-password`

**Rate Limit:** 10 istek/15dk per IP

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Validation Kuralları:**
- `email`: Geçerli email formatı, zorunlu

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Şifre sıfırlama kodu e-posta adresinize gönderildi",
  "data": {
    "email": "john@example.com",
    "message": "Şifre sıfırlama kodu gönderildi"
  },
  "code": 200
}
```

### 9. Şifre Sıfırlama Kodu Doğrula

**Endpoint:** `POST /user/verify-reset-code`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "resetCode": "123456"
}
```

**Validation Kuralları:**
- `email`: Geçerli email formatı, zorunlu
- `resetCode`: 6 haneli kod, zorunlu

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Şifre sıfırlama kodu doğrulandı",
  "data": {
    "email": "john@example.com",
    "resetToken": "temporary_reset_token",
    "message": "Kod doğrulandı, yeni şifre belirleyebilirsiniz"
  },
  "code": 200
}
```

### 10. Şifre Sıfırlama

**Endpoint:** `POST /user/reset-password`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "resetToken": "temporary_reset_token",
  "newPassword": "NewSecurePass123!"
}
```

**Validation Kuralları:**
- `email`: Geçerli email formatı, zorunlu
- `resetToken`: Geçerli reset token, zorunlu
- `newPassword`: 8-128 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter, zorunlu

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Şifre başarıyla sıfırlandı",
  "data": {
    "email": "john@example.com",
    "message": "Şifre başarıyla güncellendi"
  },
  "code": 200
}
```

### 11. Kullanıcı Bilgisi Getir (ID ile)

**Endpoint:** `GET /user/getUserById/:userId`

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
  "message": "Kullanıcı bilgileri getirildi",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

### 12. Kullanıcı Bilgisi Getir (İsim ile)

**Endpoint:** `GET /user/getUserByName/:name`

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
  "message": "Kullanıcı bilgileri getirildi",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "code": 200
}
```

---

## 📊 Token Yapısı

### Access Token Payload

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
    "role": "user",
    "iat": 1640995200,
    "exp": 1640998800
  }
}
```

### Refresh Token Payload

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "_id": "user_id",
    "type": "refresh",
    "iat": 1640995200,
    "exp": 1641600000
  }
}
```

### Token Süreleri

| Token Tipi | Süre | Açıklama |
|------------|------|----------|
| Access Token | 1 saat | API istekleri için |
| Refresh Token | 7 gün | Token yenileme için |
| Reset Token | 15 dakika | Şifre sıfırlama için |
| Verification Code | 10 dakika | Email doğrulama için |

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
| 401 | Unauthorized - Token gerekli/geçersiz |
| 403 | Forbidden - Yetki yetersiz |
| 404 | Not Found - Kullanıcı bulunamadı |
| 409 | Conflict - Email zaten kayıtlı |
| 423 | Locked - Hesap kilitli |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

### Validation Hataları

```json
{
  "success": false,
  "error": true,
  "message": "Validation hatası",
  "errors": [
    "İsim sadece harf ve boşluk içerebilir",
    "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir",
    "Geçerli bir e-posta adresi giriniz"
  ],
  "code": 400
}
```

### Hesap Kilitlenme Hatası

```json
{
  "success": false,
  "error": true,
  "message": "Hesap geçici olarak kilitlenmiştir",
  "data": {
    "lockUntil": "2024-01-10T10:30:00.000Z",
    "remainingTime": 1800
  },
  "code": 423
}
```

---

## 🔧 Entegrasyon Örnekleri

### JavaScript/React Örneği

```javascript
// Kullanıcı kaydı
const register = async (userData) => {
  try {
    const response = await fetch('/api/v1/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Token'ları localStorage'a kaydet
      localStorage.setItem('accessToken', result.data.token);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Kayıt hatası:', error);
    throw error;
  }
};

// Kullanıcı girişi
const login = async (credentials) => {
  try {
    const response = await fetch('/api/v1/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.data.requiresVerification) {
        // Email doğrulama gerekli
        return { requiresVerification: true, user: result.data.user };
      } else {
        // Token'ları localStorage'a kaydet
        localStorage.setItem('accessToken', result.data.token);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        return result.data;
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    throw error;
  }
};

// Email doğrulama
const verifyLogin = async (email, code) => {
  try {
    const response = await fetch('/api/v1/user/verify-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, verificationCode: code })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Token'ları localStorage'a kaydet
      localStorage.setItem('accessToken', result.data.token);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Doğrulama hatası:', error);
    throw error;
  }
};

// Token yenileme
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('Refresh token bulunamadı');
    }
    
    const response = await fetch('/api/v1/user/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Yeni token'ları localStorage'a kaydet
      localStorage.setItem('accessToken', result.data.token);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    // Token yenileme başarısız, kullanıcıyı logout yap
    logout();
    throw error;
  }
};

// Kullanıcı profili getir
const getProfile = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Token bulunamadı');
    }
    
    const response = await fetch('/api/v1/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    throw error;
  }
};

// Çıkış yap
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Kullanıcıyı login sayfasına yönlendir
  window.location.href = '/login';
};

// Axios interceptor örneği
const setupAxiosInterceptors = (axios) => {
  // Request interceptor - her istekte token ekle
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - 401 hatası durumunda token yenile
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await refreshToken();
          const token = localStorage.getItem('accessToken');
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};
```

### Form Validation Örneği

```javascript
// Kayıt form validation
const validateRegisterForm = (data) => {
  const errors = [];
  
  // İsim kontrolü
  if (!data.name || data.name.length < 2) {
    errors.push('İsim en az 2 karakter olmalıdır');
  }
  
  if (data.name && data.name.length > 50) {
    errors.push('İsim en fazla 50 karakter olmalıdır');
  }
  
  if (data.name && !/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(data.name)) {
    errors.push('İsim sadece harf ve boşluk içerebilir');
  }
  
  // Email kontrolü
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Geçerli bir e-posta adresi giriniz');
  }
  
  // Şifre kontrolü
  if (!data.password || data.password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  
  if (data.password && data.password.length > 128) {
    errors.push('Şifre en fazla 128 karakter olmalıdır');
  }
  
  if (data.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(data.password)) {
    errors.push('Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&) içermelidir');
  }
  
  return errors;
};

// Giriş form validation
const validateLoginForm = (data) => {
  const errors = [];
  
  // Email kontrolü
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Geçerli bir e-posta adresi giriniz');
  }
  
  // Şifre kontrolü
  if (!data.password || data.password.length < 1) {
    errors.push('Şifre boş olamaz');
  }
  
  return errors;
};

// Doğrulama kodu validation
const validateVerificationCode = (code) => {
  const errors = [];
  
  if (!code || code.length !== 6) {
    errors.push('Doğrulama kodu 6 haneli olmalıdır');
  }
  
  if (code && !/^\d{6}$/.test(code)) {
    errors.push('Doğrulama kodu sadece rakam içermelidir');
  }
  
  return errors;
};
```

---

## 🛡️ Güvenlik Önlemleri

### Uygulanan Güvenlik Önlemleri

1. **JWT Authentication**
   - 128-bit secret key
   - Access ve refresh token ayrımı
   - Token expiration kontrolü

2. **Password Security**
   - bcrypt ile hash'leme
   - Güçlü şifre politikası
   - Şifre değişiklik takibi

3. **Account Protection**
   - 5 başarısız deneme → 30 dk kilit
   - Email doğrulama zorunluluğu
   - Hesap kilitlenme mekanizması

4. **Rate Limiting**
   - Kayıt: 3 istek/saat per IP
   - Giriş: 5 istek/15dk per IP
   - Şifre sıfırlama: 10 istek/15dk per IP

5. **Input Validation**
   - Server-side validation
   - SQL injection koruması
   - XSS koruması

### Güvenlik Skoru: 8.5/10 🔒

---

## 📝 Notlar

1. **Token Management**: Access token'ları kısa süreli, refresh token'ları uzun süreli tutun
2. **Error Handling**: 401 hatası durumunda token yenileme deneyin
3. **Rate Limiting**: API istekleri rate limiting ile korunmaktadır
4. **Email Verification**: İlk girişte email doğrulama gerekebilir
5. **Account Locking**: Çok fazla başarısız deneme hesabı kilitler

---

**Son güncelleme**: 2024-12-19  
**Versiyon**: 2.0.0  
**Status**: ✅ Production Ready 