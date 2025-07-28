# Email Verification Sistemi - Frontend Dokümantasyonu

## 📋 Genel Bilgiler

**Proje:** Finscope Frontend - React Native  
**Modül:** Email Verification Sistemi  
**Hedef:** Kullanıcı doğrulama sistemi implementasyonu  
**Versiyon:** 1.0  
**Tarih:** 2024-12-20  

---

## 🎯 Sistem Mimarisi

### Backend Değişiklikleri ✅ **TAMAMLANDI**

1. **User Model Güncellemesi:**
   - `isVerified` alanı eklendi (Boolean, default: false)
   - Kullanıcı ilk kez doğrulama kodunu girdiğinde `isVerified: true` olur

2. **Login Sistemi Güncellemesi:**
   - Kullanıcı login olduğunda `isVerified` kontrolü yapılır
   - `isVerified: true` ise direkt token döndürülür
   - `isVerified: false` ise verification code gönderilir

3. **Verification Sistemi:**
   - İlk kez doğrulama yapan kullanıcı `isVerified: true` olarak işaretlenir
   - Sonraki girişlerde verification code istenmez

---

## 🔄 Frontend Implementation

### 1. Login Flow Güncellemesi

#### **Mevcut Login Response:**
```javascript
// isVerified: false ise
{
  "success": true,
  "data": {
    "message": "Doğrulama kodu e-posta adresinize gönderildi.",
    "isVerified": false,
    "email": "user@example.com"
  }
}

// isVerified: true ise
{
  "success": true,
  "data": {
    "user": { /* user data */ },
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "isVerified": true,
    "message": "Giriş başarılı"
  }
}
```

#### **Frontend Login Logic:**
```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.data.isVerified) {
        // Kullanıcı zaten doğrulanmış, direkt giriş yap
        await storeUserData(data.data);
        navigateToHome();
      } else {
        // Doğrulama kodu gerekli
        setShowVerificationModal(true);
        setUserEmail(data.data.email);
      }
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### 2. Verification Modal Component

#### **VerificationModal.js:**
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

const VerificationModal = ({ 
  visible, 
  onClose, 
  email, 
  onVerificationSuccess 
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Hata', '6 haneli kodu giriniz');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          verificationCode: code 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Doğrulama başarılı
        await storeUserData(data.data);
        onVerificationSuccess();
        onClose();
      } else {
        Alert.alert('Hata', data.message);
      }
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Başarılı', 'Yeni kod gönderildi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Kod gönderilemedi');
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Email Doğrulama</Text>
        <Text style={styles.subtitle}>
          {email} adresine gönderilen 6 haneli kodu giriniz
        </Text>
        
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          keyboardType="numeric"
          maxLength={6}
        />
        
        <TouchableOpacity 
          style={styles.verifyButton}
          onPress={handleVerifyCode}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.resendButton}
          onPress={handleResendCode}
        >
          <Text style={styles.resendText}>Yeni Kod Gönder</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666'
  },
  input: {
    width: '80%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  verifyButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  resendButton: {
    marginBottom: 10
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14
  },
  cancelButton: {
    marginTop: 10
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 14
  }
});

export default VerificationModal;
```

### 3. Login Screen Güncellemesi

#### **LoginScreen.js:**
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import VerificationModal from '../components/VerificationModal';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre gerekli');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.data.isVerified) {
          // Kullanıcı zaten doğrulanmış
          await storeUserData(data.data);
          navigation.replace('Home');
        } else {
          // Doğrulama kodu gerekli
          setUserEmail(data.data.email);
          setShowVerificationModal(true);
        }
      } else {
        Alert.alert('Hata', data.message);
      }
    } catch (error) {
      Alert.alert('Hata', 'Giriş sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Text>
      </TouchableOpacity>
      
      <VerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={userEmail}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16
  },
  loginButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default LoginScreen;
```

### 4. User Data Storage

#### **UserStorage.js:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(userData.user));
    await AsyncStorage.setItem('token', userData.token);
    await AsyncStorage.setItem('refreshToken', userData.refreshToken);
    await AsyncStorage.setItem('isVerified', 'true');
  } catch (error) {
    console.error('User data storage error:', error);
  }
};

export const getUserData = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const isVerified = await AsyncStorage.getItem('isVerified');
    
    return {
      user: user ? JSON.parse(user) : null,
      token,
      refreshToken,
      isVerified: isVerified === 'true'
    };
  } catch (error) {
    console.error('User data retrieval error:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.multiRemove(['user', 'token', 'refreshToken', 'isVerified']);
  } catch (error) {
    console.error('User data clear error:', error);
  }
};
```

---

## 🔄 API Endpoint'leri

### 1. Login Endpoint
```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (isVerified: false):**
```json
{
  "success": true,
  "data": {
    "message": "Doğrulama kodu e-posta adresinize gönderildi.",
    "isVerified": false,
    "email": "user@example.com"
  }
}
```

**Response (isVerified: true):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "isVerified": true,
    "message": "Giriş başarılı"
  }
}
```

### 2. Verify Login Endpoint
```
POST /api/v1/auth/verify-login
```

**Request:**
```json
{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "isVerified": true,
    "message": "Doğrulama başarılı. Giriş yapıldı."
  }
}
```

### 3. Resend Verification Code Endpoint
```
POST /api/v1/auth/resend-verification
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Verification code resent successfully."
  }
}
```

---

## 🎨 UI/UX Önerileri

### 1. Verification Modal Tasarımı
- **Minimalist tasarım:** Sadece gerekli bilgileri göster
- **Büyük input alanı:** 6 haneli kod için kolay giriş
- **Otomatik odaklanma:** Modal açıldığında input'a odaklan
- **Geri sayım:** Kod süresi dolmadan önce uyarı

### 2. Loading States
- **Login loading:** "Giriş yapılıyor..."
- **Verification loading:** "Doğrulanıyor..."
- **Resend loading:** "Kod gönderiliyor..."

### 3. Error Handling
- **Network errors:** "İnternet bağlantısı hatası"
- **Invalid code:** "Geçersiz kod"
- **Expired code:** "Kod süresi dolmuş"
- **Server errors:** "Sunucu hatası"

### 4. Success States
- **Verification success:** "Doğrulama başarılı"
- **Login success:** "Giriş başarılı"
- **Resend success:** "Yeni kod gönderildi"

---

## 🔧 Implementation Checklist

### ✅ Backend (TAMAMLANDI)
- [x] User model'e `isVerified` alanı eklendi
- [x] Login service güncellendi
- [x] Verification service güncellendi
- [x] Controller response'ları güncellendi
- [x] Mevcut kullanıcıları doğrulanmış yapma scripti oluşturuldu

### 🟡 Frontend (YAPILACAK)
- [ ] Login screen güncellendi
- [ ] Verification modal component oluşturuldu
- [ ] User data storage güncellendi
- [ ] Navigation flow güncellendi
- [ ] Error handling eklendi
- [ ] Loading states eklendi
- [ ] UI/UX iyileştirmeleri yapıldı

---

## 🚀 Test Senaryoları

### 1. İlk Kez Giriş Yapan Kullanıcı
1. Email/şifre ile giriş yap
2. Verification modal açılmalı
3. 6 haneli kodu gir
4. Doğrulama başarılı olmalı
5. Ana sayfaya yönlendirilmeli

### 2. Daha Önce Doğrulanmış Kullanıcı
1. Email/şifre ile giriş yap
2. Direkt ana sayfaya yönlendirilmeli
3. Verification modal açılmamalı

### 3. Yanlış Kod Girme
1. Email/şifre ile giriş yap
2. Yanlış kod gir
3. Hata mesajı gösterilmeli

### 4. Kod Süresi Dolma
1. Email/şifre ile giriş yap
2. 10 dakika bekle
3. Kod süresi dolmuş hatası al

### 5. Yeni Kod Gönderme
1. Email/şifre ile giriş yap
2. "Yeni Kod Gönder" butonuna bas
3. Yeni kod gönderilmeli

---

## 📝 Notlar

### Backend Değişiklikleri
- Mevcut kullanıcıları doğrulanmış yapmak için script çalıştırılmalı
- Email service'in çalıştığından emin olunmalı
- Rate limiting ayarları kontrol edilmeli

### Frontend Değişiklikleri
- AsyncStorage kullanımı
- Modal component'i
- Error handling
- Loading states
- Navigation flow

### Güvenlik
- Token'lar güvenli şekilde saklanmalı
- Network errors handle edilmeli
- Input validation yapılmalı

---

**Son Güncelleme:** 2024-12-20  
**Versiyon:** 1.0  
**Durum:** ✅ **Backend Tamamlandı** - Frontend Implementation Bekleniyor 