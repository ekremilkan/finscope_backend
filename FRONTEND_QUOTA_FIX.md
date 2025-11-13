# 🎨 Frontend: Quiz Completion Quota Handling

## 📋 Durum

Backend geliştirici `POST /api/v1/campaigns/:id/complete` endpoint'ine **kota kontrolü** ve **`wonReward`** alanını ekledi.

Bu değişiklikten sonra frontend'de yapılması gereken güncellemeler:

---

## ✅ Yapılması Gereken Değişiklikler

### 1. Quiz.jsx - Backend Response'unu Kullan

**Dosya:** `src/pages/Quiz.jsx`

**Mevcut Kod:**
```javascript
const handleQuizCompletion = async () => {
  // ... mevcut kod ...
  const wonReward = !finalQuotaCheck.isQuotaFull && !finalQuotaCheck.segmentNotFound;
  // ...
};
```

**Güncellenmiş Kod:**
```javascript
const handleQuizCompletion = async () => {
  clearInterval(timerIntervalRef.current);
  localStorage.removeItem(`penalty_endTime_${campaignId}`);
  
  try {
    const result = await campaignService.completeQuiz(campaignId, {
      totalTimeSpent: timeSpent,
    });
    
    // Backend'den gelen wonReward değerini kullan
    // Backend artık wonReward döndürüyor
    const wonReward = result?.wonReward ?? false;
    
    setQuizResult({ 
      visible: true, 
      wonReward,
      quotaFull: !wonReward // Backend'den false gelirse kota dolu demektir
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
      quotaFull: isQuotaError
    });
  }
};
```

**Değişiklikler:**
- ✅ Frontend'deki `finalQuotaCheck` kaldırılabilir (artık backend kontrol ediyor)
- ✅ Backend'den gelen `result.wonReward` kullanılmalı
- ✅ `quotaFull` durumu backend'den gelen `wonReward: false` ile belirlenmeli

---

### 2. QuizResultModal - Quota Full Durumunu Göster

**Dosya:** `src/components/quiz/QuizResultModal.jsx`

**Eklenmesi Gereken:**
- `quotaFull` prop'u eklenmeli
- Kota dolu durumunda özel mesaj gösterilmeli
- Ödül kazanılamadı mesajı gösterilmeli

**Örnek Kod:**
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
  wonReward = false,  // ⚠️ Bu prop zaten var
  quotaFull = false, // ⚠️ Bu prop eklenmeli
  twitterUrl,
  telegramUrl,
  websiteUrl,
}) => {
  const passed = isQuizPassed(score, passPercentage);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 px-5">
      {/* ... mevcut kod ... */}
      
      {/* ⚠️ YENİ: Quota Full Durumu */}
      {passed && quotaFull && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-500/50 bg-yellow-900/20">
          <p className="text-yellow-400 font-semibold text-center">
            ⚠️ Quiz Completed Successfully
          </p>
          <p className="text-gray-300 text-sm text-center mt-2">
            Unfortunately, the reward quota for your segment was filled by other users. 
            You completed the quiz but are not eligible for a reward.
          </p>
        </div>
      )}
      
      {/* Mevcut kod devam ediyor... */}
    </div>
  );
};
```

---

### 3. Çeviri Dosyalarına Mesajlar Eklenmeli

**Dosya:** `src/i18n/locales/tr/quiz.json` ve `src/i18n/locales/en/quiz.json`

**Eklenmesi Gereken:**
```json
{
  "result": {
    "quotaFull": {
      "title": "Kota Dolu",
      "message": "Quiz'i başarıyla tamamladınız ancak segmentinizin ödül kotası diğer kullanıcılar tarafından dolduruldu. Ödül kazanamadınız.",
      "subtitle": "Quiz Tamamlandı"
    },
    "wonReward": {
      "title": "Tebrikler!",
      "message": "Quiz'i başarıyla tamamladınız ve ödül kazandınız!",
      "rewardAmount": "Ödül: {{amount}}"
    }
  }
}
```

---

### 4. Quiz.jsx - QuizResultModal'a quotaFull Prop'u Ekle

**Dosya:** `src/pages/Quiz.jsx`

**Mevcut Kod:**
```javascript
<QuizResultModal
  visible={quizResult.visible}
  score={{...}}
  campaignTitle={campaignDetails?.title}
  reward={rewardForSegment}
  onHome={handleGoHome}
  timeSpent={timeSpent}
  wonReward={quizResult.wonReward}
  // quotaFull prop'u eksik
/>
```

**Güncellenmiş Kod:**
```javascript
<QuizResultModal
  visible={quizResult.visible}
  score={{...}}
  campaignTitle={campaignDetails?.title}
  reward={rewardForSegment}
  onHome={handleGoHome}
  timeSpent={timeSpent}
  wonReward={quizResult.wonReward}
  quotaFull={quizResult.quotaFull} // ⚠️ EKLENMELİ
  twitterUrl={campaignDetails?.twitter_url || ""}
  telegramUrl={campaignDetails?.telegram_url || ""}
  websiteUrl={campaignDetails?.website_url || ""}
/>
```

---

## 🔄 Backend Response Formatı (Güncellenmiş)

Backend'den artık şu format geliyor:

```json
{
  "success": true,
  "data": {
    "campaignId": "...",
    "userId": "...",
    "completed": true,
    "wonReward": true,  // ⚠️ YENİ ALAN
    "reward": 1000,      // ⚠️ OPSİYONEL
    "completedAt": "...",
    "totalTimeSpent": 300
  }
}
```

**Durumlar:**
- `wonReward: true` → Ödül kazandı, ödül verildi
- `wonReward: false` → Quiz tamamlandı ama ödül kazanamadı (kota dolu)

---

## 📝 Yapılacaklar Listesi

### Öncelik 1: Kritik
- [ ] `handleQuizCompletion` fonksiyonunda backend'den gelen `wonReward` değerini kullan
- [ ] Frontend'deki `finalQuotaCheck` kaldırılabilir (backend kontrol ediyor artık)
- [ ] `QuizResultModal`'a `quotaFull` prop'u ekle
- [ ] `QuizResultModal`'da quota full durumunu göster

### Öncelik 2: İyileştirme
- [ ] Çeviri dosyalarına quota full mesajları ekle
- [ ] QuizResultModal'da quota full durumunda özel UI göster
- [ ] Test senaryolarını güncelle

---

## 🧪 Test Senaryoları

### Senaryo 1: Normal Tamamlama (Ödül Kazandı)
1. Kullanıcı quiz'i tamamlar
2. Backend `wonReward: true` döner
3. **Beklenen:** QuizResultModal'da "Tebrikler! Ödül kazandınız" mesajı

### Senaryo 2: Race Condition (Ödül Kazanamadı)
1. Kullanıcı quiz'i tamamlar
2. Backend `wonReward: false` döner (kota dolu)
3. **Beklenen:** QuizResultModal'da "Quiz tamamlandı ama ödül kazanamadınız" mesajı

### Senaryo 3: Hata Durumu
1. Backend hata döner
2. **Beklenen:** Hata mesajı gösterilir

---

## ⚠️ Önemli Notlar

1. **Backend Response'una Güven**
   - Artık backend'den `wonReward` geliyor
   - Frontend'deki manuel kota kontrolü kaldırılabilir (veya sadece bilgilendirme için tutulabilir)

2. **CampaignParticipation Kullanımı** ⚠️ OPSİYONEL
   - Backend'de `CampaignParticipation` koleksiyonu `wonReward` alanı ile güncelleniyor
   - Frontend'de kullanıcının kampanya geçmişini gösterirken bu bilgi kullanılabilir
   - Örnek: "Tamamlanan Kampanyalar" listesinde ödül kazanılan kampanyaları işaretle
   - Örnek: Kullanıcı profilinde "Kazanılan Ödüller" sayısını göster
   - **Not:** Şu an frontend'de doğrudan kullanılmıyor, ama gelecekte kullanılabilir

3. **Kullanıcı Deneyimi**
   - Quiz tamamlandı ama ödül kazanamadı durumunda açıklayıcı mesaj gösterilmeli
   - Kullanıcı neden ödül kazanamadığını anlamalı

4. **Geriye Uyumluluk**
   - Eğer backend henüz güncellenmediyse, frontend'deki mevcut kontrol çalışmaya devam eder
   - Backend güncellendikten sonra frontend'deki kontrol kaldırılabilir

---

## 📞 İletişim

Backend geliştirici `wonReward` alanını ekledikten sonra bu değişiklikler yapılmalı.

**Öncelik:** Orta-Yüksek  
**Etki:** Kullanıcı deneyimi iyileşir, açıklayıcı mesajlar gösterilir

---

**Hazırlayan:** Frontend Team  
**Tarih:** 2025-01-XX  
**Versiyon:** 1.0  
**Bağımlılık:** Backend `wonReward` alanını eklemeli

