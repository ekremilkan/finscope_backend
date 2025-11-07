# 📊 Campaign Earnings Analysis API

## 🎯 Amaç

Bu endpoint, kullanıcının UserCampaign kayıtlarına göre potansiyel kazanç analizi yapar. Her kampanyada kullanıcının gerçek segment bilgisini kullanarak, kullanıcının mevcut kampanyalara katılmış olsaydı kazanacağı potansiyel ödül ile gerçekte kazandığı ödül arasındaki farkı hesaplar.

## 🔗 Endpoint

```http
GET /api/v1/campaigns/user/segment-earnings-analysis
Authorization: Bearer <jwt_token>
```

## 📋 Gereksinimler

### Kullanıcı Gereksinimleri
- ✅ Giriş yapmış olmalı (JWT token gerekli)
- ✅ UserCampaign kayıtları mevcut olmalı (kampanyalara katılmış olmalı)

### Veri Gereksinimleri
- ✅ UserCampaign modelinde kullanıcının kampanya-segment bilgileri
- ✅ Campaign modelinde segment bazlı kontenjan bilgileri
- ✅ UserProgress modelinde kullanıcının kampanya katılımları

## 📊 Response Formatı

### Başarılı Response (200)
```json
{
  "success": true,
  "data": {
    "userCampaigns": {
      "totalUserCampaigns": 5,
      "segments": ["A", "B", "C"]
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
          "userSegment": "A",
          "completedAt": "2024-12-15T14:30:00.000Z"
        }
      ],
      "potential": [
        {
          "campaignId": "507f1f77bcf86cd799439012",
          "title": "DeFi Kampanyası",
          "reward": 200,
          "userSegment": "B",
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
          "userSegment": "C"
        }
      ]
    },
    "summary": {
      "totalCompletedCampaigns": 3,
      "totalPotentialCampaigns": 8,
      "totalMissedCampaigns": 5,
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

### userCampaigns
- **totalUserCampaigns**: Kullanıcının toplam UserCampaign kayıt sayısı
- **segments**: Kullanıcının farklı kampanyalarda bulunduğu segmentlerin listesi

### earnings
- **actualEarnings**: Gerçekte kazanılan toplam ödül
- **potentialEarnings**: Potansiyel kazanılabilecek toplam ödül
- **missedEarnings**: Kaçırılan ödül (potentialEarnings - actualEarnings)
- **completionRate**: Tamamlama oranı (%)

### campaigns
- **completed**: Tamamlanan kampanyalar listesi (her birinde userSegment bilgisi)
- **potential**: Kullanıcının UserCampaign'de kaydı olan geçmiş kampanyalar
- **inProgress**: Katıldığı ama tamamlamadığı kampanyalar

### summary
- **totalCompletedCampaigns**: Toplam tamamlanan kampanya sayısı
- **totalPotentialCampaigns**: Toplam potansiyel kampanya sayısı
- **totalMissedCampaigns**: Toplam kaçırılan kampanya sayısı
- **totalInProgressCampaigns**: Toplam devam eden kampanya sayısı

## 🧮 Hesaplama Mantığı

### 1. UserCampaign Kayıtlarını Alma
```javascript
// Kullanıcının tüm UserCampaign kayıtlarını al
const userCampaigns = await UserCampaign.find({ user_id: userId }).lean();

// Campaign ID'ye göre segment map'i oluştur
const userCampaignMap = new Map();
userCampaigns.forEach(uc => {
  userCampaignMap.set(uc.campaign_id.toString(), uc.class);
});
```

### 2. Gerçek Kazanç Hesaplama
```javascript
const completedCampaigns = await UserProgress.find({
  userId,
  completed: true
}).populate('campaignId', 'title segments');

let actualEarnings = 0;
for (const progress of completedCampaigns) {
  // Bu kampanyada kullanıcının gerçek segmentini bul
  const userSegment = userCampaignMap.get(progress.campaignId._id.toString());
  
  if (userSegment) {
    const segment = progress.campaignId.segments.find(s => s.name === userSegment);
    actualEarnings += segment?.reward || 0;
  }
}
```

### 3. Potansiyel Kazanç Hesaplama
```javascript
const userSegmentCampaigns = await Campaign.find({
  status: { $in: ['active', 'expired', 'inactive'] },
  isActive: true,
  isAdminAccept: true,
  endDate: { $lte: new Date() }
});

let potentialEarnings = 0;
for (const campaign of userSegmentCampaigns) {
  // Bu kampanyada kullanıcının segmentini kontrol et
  const userSegment = userCampaignMap.get(campaign._id.toString());
  
  if (userSegment) {
    const segment = campaign.segments?.find(s => s.name === userSegment);
    if (segment && segment.maxParticipants > 0) {
      potentialEarnings += segment.reward || 0;
    }
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

### Test 2: UserCampaign Kaydı Yok
```bash
# UserCampaign kaydı olmayan kullanıcı ile test
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

### v2.1.0 (2024-12-19)
- ✅ Segment parametresi kaldırıldı
- ✅ UserCampaign tabanlı analiz eklendi
- ✅ Her kampanya için gerçek segment bilgisi kullanılıyor
- ✅ Kullanıcının farklı kampanyalarda farklı segmentleri destekleniyor

### v2.0.0 (2024-12-19)
- ✅ İlk sürüm
- ✅ Temel segment earnings analysis
- ✅ Campaign completion tracking
- ✅ Potential vs actual earnings calculation
