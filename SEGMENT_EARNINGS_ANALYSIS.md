# 📊 Segment Earnings Analysis API

## 🎯 Amaç

Bu endpoint, kullanıcının segmentine göre potansiyel kazanç analizi yapar. Kullanıcının mevcut segmentine uygun tüm geçmiş kampanyalara katılmış olsaydı kazanacağı potansiyel ödül ile gerçekte kazandığı ödül arasındaki farkı hesaplar.

## 🔗 Endpoint

```http
GET /api/v1/campaigns/user/segment-earnings-analysis
Authorization: Bearer <jwt_token>
```

## 📋 Gereksinimler

### Kullanıcı Gereksinimleri
- ✅ Giriş yapmış olmalı (JWT token gerekli)
- ✅ Wallet verification tamamlanmış olmalı
- ✅ UserSegment kaydı mevcut olmalı

### Veri Gereksinimleri
- ✅ UserSegment modelinde kullanıcının segment bilgisi
- ✅ Campaign modelinde segment bazlı kontenjan bilgileri
- ✅ UserProgress modelinde kullanıcının kampanya katılımları

## 📊 Response Formatı

### Başarılı Response (200)
```json
{
  "success": true,
  "data": {
    "userSegment": {
      "class": "A",
      "compositeScore": 85.5,
      "percentile": 92.3,
      "confidence": 0.95,
      "asOf": "2024-12-19T10:30:00.000Z"
    },
    "earnings": {
      "actualEarnings": 450,
      "potentialEarnings": 1200,
      "missedEarnings": 750,
      "completionRate": 37.5
    },
    "campaigns": {
      "completed": [
        {
          "campaignId": "507f1f77bcf86cd799439011",
          "title": "Blockchain Eğitimi",
          "reward": 150,
          "completedAt": "2024-12-15T14:30:00.000Z"
        }
      ],
      "potential": [
        {
          "campaignId": "507f1f77bcf86cd799439012",
          "title": "DeFi Kampanyası",
          "reward": 200,
          "segmentMaxParticipants": 100,
          "segmentCurrentParticipants": 85,
          "endDate": "2024-12-20T23:59:59.000Z"
        }
      ],
      "inProgress": [
        {
          "campaignId": "507f1f77bcf86cd799439013",
          "title": "NFT Eğitimi",
          "reward": 100,
          "progress": {
            "currentQuestion": 3,
            "totalQuestions": 5,
            "correctAnswers": 2,
            "wrongAnswers": 1
          }
        }
      ]
    },
    "summary": {
      "totalCompletedCampaigns": 3,
      "totalPotentialCampaigns": 8,
      "totalInProgressCampaigns": 1
    }
  },
  "message": "User segment earnings analysis retrieved successfully",
  "code": 200
}
```

### Hata Response (404)
```json
{
  "success": false,
  "error": true,
  "message": "User segment not found. Please complete wallet verification first.",
  "code": 404
}
```

## 🔍 Response Alanları Açıklaması

### userSegment
- **class**: Kullanıcının segment sınıfı (A, B, C, D)
- **compositeScore**: Segment hesaplama skoru
- **percentile**: Yüzdelik dilim
- **confidence**: Güven skoru (0-1 arası)
- **asOf**: Segment hesaplama tarihi

### earnings
- **actualEarnings**: Gerçekte kazanılan toplam ödül
- **potentialEarnings**: Potansiyel kazanılabilecek toplam ödül
- **missedEarnings**: Kaçırılan ödül (potentialEarnings - actualEarnings)
- **completionRate**: Tamamlama oranı (%)

### campaigns
- **completed**: Tamamlanan kampanyalar listesi
- **potential**: Kullanıcının segmentine uygun geçmiş kampanyalar
- **inProgress**: Katıldığı ama tamamlamadığı kampanyalar

### summary
- **totalCompletedCampaigns**: Toplam tamamlanan kampanya sayısı
- **totalPotentialCampaigns**: Toplam potansiyel kampanya sayısı
- **totalInProgressCampaigns**: Toplam devam eden kampanya sayısı

## 🧮 Hesaplama Mantığı

### 1. Kullanıcı Segmenti Belirleme
```javascript
// Önce tercih edilen window'da segment aranır
let userSegment = await UserSegment.findOne({ 
  userId, 
  chain: 'ethereum', 
  window: '90d' 
}).sort({ asOf: -1 });

// Bulunamazsa en güncel segment alınır
if (!userSegment) {
  userSegment = await UserSegment.findOne({ 
    userId, 
    chain: 'ethereum' 
  }).sort({ asOf: -1 });
}
```

### 2. Gerçek Kazanç Hesaplama
```javascript
const completedCampaigns = await UserProgress.find({
  userId,
  completed: true
}).populate('campaignId', 'title reward');

let actualEarnings = 0;
for (const progress of completedCampaigns) {
  actualEarnings += progress.campaignId.reward || 0;
}
```

### 3. Potansiyel Kazanç Hesaplama
```javascript
const userSegmentCampaigns = await Campaign.find({
  status: { $in: ['active', 'expired'] },
  isActive: true,
  isAdminAccept: true,
  endDate: { $lte: new Date() }
});

let potentialEarnings = 0;
for (const campaign of userSegmentCampaigns) {
  const segmentMaxParticipants = campaign.maxParticipants[userSegmentClass] || 0;
  if (segmentMaxParticipants > 0) {
    potentialEarnings += campaign.reward;
  }
}
```

### 4. Tamamlama Oranı Hesaplama
```javascript
const completionRate = potentialCampaignDetails.length > 0 
  ? (completedCampaignDetails.length / potentialCampaignDetails.length) * 100 
  : 0;
```

## 🚨 Hata Durumları

### 404 - User Segment Not Found
**Sebep:** Kullanıcının wallet verification yapmamış olması
**Çözüm:** Kullanıcının wallet verification sürecini tamamlaması gerekir

### 401 - Unauthorized
**Sebep:** Geçersiz veya eksik JWT token
**Çözüm:** Kullanıcının tekrar giriş yapması gerekir

### 500 - Internal Server Error
**Sebep:** Veritabanı bağlantı hatası veya sistem hatası
**Çözüm:** Sistem yöneticisi ile iletişime geçilmesi gerekir

## 🧪 Test Senaryoları

### Test 1: Başarılı Analiz
```bash
curl -X GET "http://localhost:5005/api/v1/campaigns/user/segment-earnings-analysis" \
  -H "Authorization: Bearer <valid_token>"
```

### Test 2: Segment Bulunamadı
```bash
# Wallet verification yapmamış kullanıcı ile test
```

### Test 3: Geçersiz Token
```bash
curl -X GET "http://localhost:5005/api/v1/campaigns/user/segment-earnings-analysis" \
  -H "Authorization: Bearer invalid_token"
```

## 📈 Kullanım Senaryoları

### Frontend Dashboard
- Kullanıcının performans analizi
- Motivasyon için kaçırılan fırsatları gösterme
- Segment bazlı öneriler sunma

### Analytics
- Segment bazlı katılım oranları
- Kampanya performans analizi
- Kullanıcı davranış analizi

## 🔧 Geliştirme Notları

### Performans Optimizasyonları
- MongoDB aggregation pipeline kullanımı
- Index'lerin doğru yapılandırılması
- Caching stratejileri

### Gelecek Geliştirmeler
- Tarih aralığı filtreleme
- Segment bazlı trend analizi
- Karşılaştırmalı analiz (diğer kullanıcılarla)

## 📝 Changelog

### v2.0.0 (2024-12-19)
- ✅ İlk sürüm
- ✅ Temel segment earnings analysis
- ✅ Campaign completion tracking
- ✅ Potential vs actual earnings calculation
