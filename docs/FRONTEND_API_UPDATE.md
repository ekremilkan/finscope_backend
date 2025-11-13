# 🚀 Frontend API Güncellemeleri - Backend Değişiklikleri

**Tarih:** 2025-01-XX  
**Versiyon:** 2.0.0  
**Öncelik:** 🔴 Yüksek

---

## 📋 Özet

Backend'de yapılan önemli değişiklikler:

1. ✅ **Race Condition Fix** - Quiz tamamlama endpoint'ine atomic işlem eklendi
2. ✅ **wonReward Alanı** - Response'a ödül kazanma durumu eklendi
3. ✅ **Model Birleştirme** - CampaignParticipation modeli kaldırıldı, UserProgress'e birleştirildi
4. ✅ **Response Formatı Güncellendi** - Yeni alanlar ve yapı

---

## 🔄 API Endpoint Değişiklikleri

### 1. Quiz Tamamlama Endpoint'i

**Endpoint:** `POST /api/v1/campaigns/:id/complete`

#### Yeni Response Formatı

```json
{
  "success": true,
  "data": {
    "campaignId": "65f3c2c3a9f3e2b1c0a1234",
    "userId": "65f3c2c3a9f3e2b1c0a5678",
    "completed": true,
    "wonReward": true,              // ⚠️ YENİ ALAN - ÖNEMLİ!
    "reward": 1000,                  // ⚠️ YENİ ALAN (opsiyonel)
    "completedAt": "2025-01-15T11:05:00.000Z",
    "totalTimeSpent": 300,
    "rewardEligibility": true,      // Backward compatibility için
    "earnedAmount": 1000,
    "message": "Quiz completed. You are eligible for the reward."
  },
  "message": "Quiz tamamlandı",
  "code": 200
}
```

#### wonReward Alanı Açıklaması

| Değer | Açıklama | Senaryo |
|-------|----------|---------|
| `true` | ✅ Ödül kazandı | Kullanıcı quiz'i tamamladı ve kota uygundu |
| `false` | ❌ Ödül kazanamadı | Quiz tamamlandı ama kota dolu (race condition veya önceden dolu) |

#### Örnek Senaryolar

**Senaryo 1: Ödül Kazandı**
```json
{
  "success": true,
  "data": {
    "completed": true,
    "wonReward": true,
    "reward": 1000,
    "message": "Quiz completed. You are eligible for the reward."
  }
}
```

**Senaryo 2: Kota Dolu (Race Condition)**
```json
{
  "success": true,
  "data": {
    "completed": true,
    "wonReward": false,
    "reward": null,
    "message": "Quiz completed but quota was filled by another user. You are not eligible for the reward."
  }
}
```

---

## 📝 Frontend'de Yapılması Gereken Değişiklikler

### 1. Quiz Completion Handler Güncelleme

**Dosya:** `src/pages/Quiz.jsx` veya ilgili component

#### Önceki Kod (Eski)
```javascript
const handleQuizCompletion = async () => {
  try {
    const result = await campaignService.completeQuiz(campaignId, {
      totalTimeSpent: timeSpent,
    });
    
    // Eski kod - manuel kota kontrolü
    const finalQuotaCheck = await checkQuotaBeforeComplete();
    const wonReward = !finalQuotaCheck.isQuotaFull;
    
    setQuizResult({ 
      visible: true, 
      wonReward,
    });
  } catch (err) {
    // ...
  }
};
```

#### Yeni Kod (Güncellenmiş)
```javascript
const handleQuizCompletion = async () => {
  clearInterval(timerIntervalRef.current);
  localStorage.removeItem(`penalty_endTime_${campaignId}`);
  
  try {
    const result = await campaignService.completeQuiz(campaignId, {
      totalTimeSpent: timeSpent,
    });
    
    // ⚠️ ÖNEMLİ: Backend'den gelen wonReward değerini kullan
    const wonReward = result?.data?.wonReward ?? false;
    const reward = result?.data?.reward ?? null;
    
    setQuizResult({ 
      visible: true, 
      wonReward,
      quotaFull: !wonReward, // Backend'den false gelirse kota dolu
      reward: reward,
    });
  } catch (err) {
    console.error("Error completing quiz:", err);
    
    // Backend hatası kontrolü
    const isQuotaError = err?.response?.data?.message?.toLowerCase().includes("quota") ||
                         err?.response?.data?.message?.toLowerCase().includes("full");
    
    setQuizResult({ 
      visible: true, 
      wonReward: false, 
      error: true,
      quotaFull: isQuotaError,
    });
  }
};
```

**Değişiklikler:**
- ✅ `finalQuotaCheck` kaldırılabilir (backend artık kontrol ediyor)
- ✅ Backend'den gelen `wonReward` değeri kullanılmalı
- ✅ `quotaFull` durumu `wonReward: false` ile belirlenmeli

---

### 2. QuizResultModal Component Güncelleme

**Dosya:** `src/components/quiz/QuizResultModal.jsx`

#### Yeni Prop Ekleme
```javascript
const QuizResultModal = ({
  visible,
  score,
  campaignTitle,
  reward,
  onRetry,
  onHome,
  passPercentage = 100,
  timeSpent = 0,
  wonReward = false,    // Mevcut prop
  quotaFull = false,    // ⚠️ YENİ PROP - EKLENMELİ
  twitterUrl,
  telegramUrl,
  websiteUrl,
}) => {
  const passed = isQuizPassed(score, passPercentage);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 px-5">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        
        {/* ⚠️ YENİ: Quota Full Durumu */}
        {passed && quotaFull && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-500/50 bg-yellow-900/20">
            <div className="flex items-center justify-center mb-2">
              <span className="text-yellow-400 text-2xl">⚠️</span>
            </div>
            <p className="text-yellow-400 font-semibold text-center text-lg">
              Quiz Completed Successfully
            </p>
            <p className="text-gray-300 text-sm text-center mt-2">
              Unfortunately, the reward quota for your segment was filled by other users. 
              You completed the quiz but are not eligible for a reward.
            </p>
          </div>
        )}
        
        {/* Başarılı ve Ödül Kazandı Durumu */}
        {passed && wonReward && (
          <div className="mb-6 p-4 rounded-lg border border-green-500/50 bg-green-900/20">
            <div className="flex items-center justify-center mb-2">
              <span className="text-green-400 text-2xl">🎉</span>
            </div>
            <p className="text-green-400 font-semibold text-center text-lg">
              Congratulations!
            </p>
            <p className="text-gray-300 text-sm text-center mt-2">
              You completed the quiz and earned a reward!
            </p>
            {reward && (
              <p className="text-green-400 text-center mt-2 font-bold">
                Reward: {reward}
              </p>
            )}
          </div>
        )}
        
        {/* Mevcut kod devam ediyor... */}
      </div>
    </div>
  );
};
```

---

### 3. Campaign Service Güncelleme

**Dosya:** `src/services/campaignService.js` veya ilgili service dosyası

#### Response Parsing
```javascript
export const completeQuiz = async (campaignId, data) => {
  const response = await api.post(`/campaigns/${campaignId}/complete`, data);
  
  // ⚠️ YENİ: wonReward alanını kontrol et
  return {
    ...response.data,
    wonReward: response.data.data?.wonReward ?? false,
    reward: response.data.data?.reward ?? null,
  };
};
```

---

## 🎨 UI/UX Önerileri

### 1. Quiz Result Durumları

#### Durum 1: Ödül Kazandı ✅
```
┌─────────────────────────────────┐
│         🎉 Congratulations!     │
│                                 │
│  You completed the quiz and     │
│  earned a reward!               │
│                                 │
│      Reward: 1000               │
└─────────────────────────────────┘
```

#### Durum 2: Quiz Tamamlandı Ama Ödül Yok ⚠️
```
┌─────────────────────────────────┐
│    ⚠️ Quiz Completed           │
│                                 │
│  Unfortunately, the reward      │
│  quota for your segment was     │
│  filled by other users.         │
│                                 │
│  You completed the quiz but     │
│  are not eligible for a reward. │
└─────────────────────────────────┘
```

---

## 🔍 API Response Detayları

### Complete Quiz Response

| Alan | Tip | Açıklama | Zorunlu |
|------|-----|----------|---------|
| `completed` | Boolean | Quiz tamamlandı mı? | ✅ |
| `wonReward` | Boolean | **YENİ** - Ödül kazandı mı? | ✅ |
| `reward` | Number/null | **YENİ** - Ödül miktarı (wonReward: true ise) | ❌ |
| `completedAt` | Date | Tamamlanma tarihi | ✅ |
| `totalTimeSpent` | Number | Toplam harcanan süre (saniye) | ✅ |
| `rewardEligibility` | Boolean | Backward compatibility için | ✅ |
| `earnedAmount` | Number | Kazanılan miktar | ✅ |
| `message` | String | Durum mesajı | ✅ |

---

## ⚠️ Breaking Changes

### 1. Response Yapısı Değişti

**Önceki Response:**
```json
{
  "data": {
    "completed": true,
    "rewardEligibility": true
  }
}
```

**Yeni Response:**
```json
{
  "data": {
    "completed": true,
    "wonReward": true,      // ⚠️ YENİ
    "reward": 1000,           // ⚠️ YENİ
    "rewardEligibility": true // Backward compatibility
  }
}
```

### 2. CampaignParticipation Kaldırıldı

⚠️ **ÖNEMLİ:** `CampaignParticipation` modeli kaldırıldı, tüm bilgiler `UserProgress` modelinde.

**Etkilenen Endpoint'ler:**
- ❌ Artık `CampaignParticipation` koleksiyonundan veri çekilmemeli
- ✅ Tüm kullanıcı-kampanya ilişkisi `UserProgress` koleksiyonundan geliyor

**Not:** Bu değişiklik backend'de yapıldı, frontend'de doğrudan etkisi yok (API response'ları aynı).

---

## 🧪 Test Senaryoları

### Senaryo 1: Normal Tamamlama (Ödül Kazandı)
```javascript
// Test Case
const response = {
  success: true,
  data: {
    completed: true,
    wonReward: true,
    reward: 1000,
    message: "Quiz completed. You are eligible for the reward."
  }
};

// Beklenen UI:
// ✅ "Congratulations!" mesajı
// ✅ Ödül miktarı gösterilmeli
// ✅ Başarı ikonu
```

### Senaryo 2: Race Condition (Ödül Kazanamadı)
```javascript
// Test Case
const response = {
  success: true,
  data: {
    completed: true,
    wonReward: false,
    reward: null,
    message: "Quiz completed but quota was filled by another user."
  }
};

// Beklenen UI:
// ⚠️ "Quiz Completed" mesajı
// ⚠️ "Quota was filled" uyarısı
// ⚠️ Ödül gösterilmemeli
```

### Senaryo 3: Hata Durumu
```javascript
// Test Case
const error = {
  response: {
    data: {
      message: "You have not joined this campaign."
    }
  }
};

// Beklenen UI:
// ❌ Hata mesajı gösterilmeli
// ❌ Quiz result modal gösterilmemeli (veya hata mesajı ile)
```

---

## 📚 Örnek Kod - Tam Implementasyon

### Quiz.jsx - Complete Handler
```javascript
import { useState } from 'react';
import { campaignService } from '@/services/campaignService';

const Quiz = ({ campaignId }) => {
  const [quizResult, setQuizResult] = useState({
    visible: false,
    wonReward: false,
    quotaFull: false,
    reward: null,
    error: false,
  });

  const handleQuizCompletion = async () => {
    try {
      // Backend'e quiz tamamlama isteği gönder
      const result = await campaignService.completeQuiz(campaignId, {
        totalTimeSpent: timeSpent,
      });

      // ⚠️ ÖNEMLİ: Backend'den gelen wonReward değerini kullan
      const wonReward = result?.data?.wonReward ?? false;
      const reward = result?.data?.reward ?? null;

      setQuizResult({
        visible: true,
        wonReward,
        quotaFull: !wonReward, // Backend'den false gelirse kota dolu
        reward,
        error: false,
      });
    } catch (err) {
      console.error("Error completing quiz:", err);

      // Backend hatası kontrolü
      const errorMessage = err?.response?.data?.message || err.message || "";
      const isQuotaError = errorMessage.toLowerCase().includes("quota") ||
                          errorMessage.toLowerCase().includes("full");

      setQuizResult({
        visible: true,
        wonReward: false,
        quotaFull: isQuotaError,
        reward: null,
        error: true,
        errorMessage,
      });
    }
  };

  return (
    <>
      {/* Quiz içeriği */}
      
      <QuizResultModal
        visible={quizResult.visible}
        score={score}
        campaignTitle={campaignDetails?.title}
        reward={quizResult.reward}
        onHome={handleGoHome}
        timeSpent={timeSpent}
        wonReward={quizResult.wonReward}
        quotaFull={quizResult.quotaFull} // ⚠️ YENİ PROP
        error={quizResult.error}
        errorMessage={quizResult.errorMessage}
      />
    </>
  );
};
```

---

## 🔄 Migration Guide

### Adım 1: Service Güncelleme
1. `campaignService.completeQuiz()` fonksiyonunu güncelle
2. Response parsing'e `wonReward` ekle

### Adım 2: Component Güncelleme
1. `handleQuizCompletion` fonksiyonunu güncelle
2. Backend'den gelen `wonReward` değerini kullan
3. `finalQuotaCheck` kaldır (opsiyonel - sadece bilgilendirme için tutulabilir)

### Adım 3: Modal Güncelleme
1. `QuizResultModal`'a `quotaFull` prop'u ekle
2. Quota full durumu için UI ekle

### Adım 4: Test
1. Normal tamamlama senaryosunu test et
2. Race condition senaryosunu test et
3. Hata durumlarını test et

---

## 📞 İletişim ve Destek

**Backend Developer:** Backend Team  
**API Base URL:** `/api/v1`  
**Test Environment:** Development server

**Sorular için:**
- Backend repository: [GitHub Link]
- API Documentation: `/docs/API_ENDPOINTS.md`

---

## ✅ Checklist

Frontend geliştiricisi için yapılması gerekenler:

- [ ] `completeQuiz` service fonksiyonunu güncelle
- [ ] `handleQuizCompletion` handler'ını güncelle
- [ ] `QuizResultModal` component'ine `quotaFull` prop'u ekle
- [ ] Quota full durumu için UI ekle
- [ ] Çeviri dosyalarına mesajlar ekle (opsiyonel)
- [ ] Test senaryolarını çalıştır
- [ ] Eski `finalQuotaCheck` kodunu kaldır (opsiyonel)

---

**Son Güncelleme:** 2025-01-XX  
**Versiyon:** 2.0.0  
**Status:** ✅ Backend Hazır - Frontend Güncellemesi Bekleniyor



