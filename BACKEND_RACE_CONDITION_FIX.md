# 🚨 Backend: Race Condition Fix - Quiz Completion Quota Check

## 📋 Sorun

Quiz tamamlama (`POST /api/v1/campaigns/:id/complete`) endpoint'inde **race condition** sorunu var.

### Senaryo:
1. İki kullanıcı (A ve B) aynı anda aynı kampanyada aynı segment'te quiz'e başlar
2. Her ikisi de başlarken kota kontrolünden geçer (kota dolu değil)
3. Her ikisi de quiz'i çözer
4. Kullanıcı A bitirir → kotayı doldurur
5. Kullanıcı B bitirir → ama kota artık dolu

**Sorun:** Kullanıcı B quiz'i tamamladığında backend'de kota kontrolü yapılmıyor, bu yüzden kullanıcı B de ödül kazanabiliyor (yanlış).

---

## ✅ Çözüm Önerisi

### 1. Complete Endpoint'inde Kota Kontrolü

`POST /api/v1/campaigns/:id/complete` endpoint'inde quiz tamamlanmadan **önce** son bir kota kontrolü yapılmalı:

```javascript
// Pseudo-code
async function completeQuiz(campaignId, userId, completionData) {
  // 1. Kullanıcının segment'ini bul
  const userSegment = await getUserSegment(userId, campaignId);
  
  // 2. Kampanyanın segment bilgilerini getir
  const campaign = await Campaign.findById(campaignId);
  const segmentData = campaign.segments.find(s => s.name === userSegment);
  
  // 3. KOTA KONTROLÜ (ÖNEMLİ!)
  if (!segmentData) {
    throw new Error("Segment not found for this campaign");
  }
  
  const available = segmentData.maxParticipants - segmentData.currentParticipants;
  
  if (available <= 0) {
    // Kota dolu - quiz tamamlanabilir ama ödül verilmez
    // Response'da wonReward: false döndür
    await updateUserProgress(userId, campaignId, { 
      completed: true,
      wonReward: false 
    });
    
    // CampaignParticipation güncelle (status: completed, wonReward: false)
    await updateCampaignParticipation(userId, campaignId, {
      status: "completed",
      wonReward: false
    });
    
    return {
      success: true,
      data: {
        completed: true,
        wonReward: false, // ⚠️ ÖNEMLİ: Bu alan eklenmeli
        message: "Quiz completed but quota is full"
      }
    };
  }
  
  // 4. Database transaction ile atomic işlem
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 5. Kota kontrolü ve güncelleme (atomic)
    const updatedSegment = await Campaign.findOneAndUpdate(
      { 
        _id: campaignId,
        "segments.name": userSegment,
        "segments.currentParticipants": { $lt: segmentData.maxParticipants }
      },
      { $inc: { "segments.$.currentParticipants": 1 } },
      { new: true, session }
    );
    
    if (!updatedSegment) {
      // Başka bir kullanıcı kotayı doldurmuş (race condition)
      await session.abortTransaction();
      await updateUserProgress(userId, campaignId, { 
        completed: true,
        wonReward: false 
      });
      
      // CampaignParticipation güncelle (status: completed, wonReward: false)
      await updateCampaignParticipation(userId, campaignId, {
        status: "completed",
        wonReward: false
      });
      
      return {
        success: true,
        data: {
          completed: true,
          wonReward: false, // ⚠️ ÖNEMLİ
          message: "Quiz completed but quota was filled by another user"
        }
      };
    }
    
    // 6. Ödül hesapla ve ver
    const reward = segmentData.reward;
    await giveReward(userId, reward);
    
    // 7. UserProgress güncelle
    await updateUserProgress(userId, campaignId, { 
      completed: true,
      wonReward: true 
    });
    
    // 8. CampaignParticipation güncelle (status: completed)
    await updateCampaignParticipation(userId, campaignId, {
      status: "completed",
      wonReward: true
    });
    
    await session.commitTransaction();
    
    return {
      success: true,
      data: {
        completed: true,
        wonReward: true, // ⚠️ ÖNEMLİ
        reward: reward
      }
    };
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## 🔑 Önemli Noktalar

### 1. Database Transaction Kullanımı
- **MUTLAKA** MongoDB transaction kullanılmalı
- `findOneAndUpdate` ile atomic işlem yapılmalı
- Race condition'ı tamamen çözer

### 2. Response'a `wonReward` Alanı Eklenmeli
```json
{
  "success": true,
  "data": {
    "completed": true,
    "wonReward": true,  // ⚠️ Bu alan eklenmeli
    "reward": 1000,
    "completedAt": "2025-10-15T11:05:00.000Z"
  }
}
```

### 3. CampaignParticipation Güncellemesi
- Quiz tamamlandığında `CampaignParticipation` koleksiyonu güncellenmeli
- `status: "completed"` olarak güncellenmeli
- **YENİ:** `wonReward: true/false` alanı eklenmeli
- Bu bilgi kullanıcının kampanya geçmişini göstermek için kullanılabilir

### 4. Kota Dolu Durumu
- Quiz tamamlanabilir (kullanıcı çalışması boşa gitmesin)
- Ama `wonReward: false` döndürülmeli
- `CampaignParticipation.wonReward: false` olarak kaydedilmeli
- Kullanıcıya açıklayıcı mesaj verilmeli

---

## 📝 Mevcut API Response (Eksik)

**Şu anki response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "...",
    "userId": "...",
    "completed": true,
    "completedAt": "...",
    "totalTimeSpent": 300
  }
}
```

**Olması gereken:**
```json
{
  "success": true,
  "data": {
    "campaignId": "...",
    "userId": "...",
    "completed": true,
    "wonReward": true,  // ⚠️ EKLENMELİ
    "reward": 1000,      // ⚠️ EKLENMELİ (opsiyonel)
    "completedAt": "...",
    "totalTimeSpent": 300
  }
}
```

---

## 🧪 Test Senaryoları

### Senaryo 1: Normal Tamamlama
- Kullanıcı quiz'i tamamlar
- Kota dolu değil
- **Beklenen:** `wonReward: true`, ödül verilir

### Senaryo 2: Race Condition
- İki kullanıcı aynı anda bitirir
- İlk kullanıcı kotayı doldurur
- İkinci kullanıcı
- **Beklenen:** `wonReward: false`, ödül verilmez

### Senaryo 3: Kota Dolu
- Kullanıcı quiz'i tamamlar
- Kota zaten dolu
- **Beklenen:** `wonReward: false`, ödül verilmez

---

## ⚠️ Kritik Notlar

1. **Database Transaction ZORUNLU**
   - Race condition'ı çözmek için transaction şart
   - `findOneAndUpdate` ile atomic işlem yapılmalı

2. **Response Formatı**
   - `wonReward` alanı mutlaka eklenmeli
   - Frontend bu alana göre kullanıcıya bilgi veriyor

3. **CampaignParticipation Güncellemesi** ⚠️ ÖNEMLİ
   - Quiz tamamlandığında `CampaignParticipation` koleksiyonu **MUTLAKA** güncellenmeli
   - `status: "completed"` olarak güncellenmeli
   - **YENİ:** `wonReward: true/false` alanı eklenmeli
   - Bu bilgi kullanıcının kampanya geçmişini göstermek için kullanılabilir
   - Frontend'de kullanıcı hangi kampanyalarda ödül kazandığını görebilir
   - **Tüm durumlarda güncellenmeli:**
     - ✅ Ödül kazanıldı: `wonReward: true`
     - ✅ Kota dolu: `wonReward: false`
     - ✅ Race condition: `wonReward: false`

4. **Kullanıcı Deneyimi**
   - Quiz tamamlanabilir (kullanıcı çalışması boşa gitmesin)
   - Ama ödül verilmezse açıklayıcı mesaj gösterilmeli

---

## 📞 İletişim

Frontend'de şu an geçici bir çözüm var (quiz bitirilirken son bir kota kontrolü), ama **asıl çözüm backend'de olmalı**.

**Öncelik:** Yüksek  
**Etki:** Kullanıcılar yanlış ödül kazanabilir (mali kayıp)

---

**Hazırlayan:** Frontend Team  
**Tarih:** 2025-01-XX  
**Versiyon:** 1.0

