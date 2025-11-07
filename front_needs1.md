

## Backend Geliştirici İsteği: Kampanya Listesi API'sine Kullanıcı Segment Bilgisi Ekleme

### Mevcut Durum
Frontend'de kampanya kartlarında kullanıcının o kampanyadaki segmentine göre ödül gösterilmesi gerekiyor. Şu anda her kampanya kartı için ayrı ayrı `GET /api/v1/user-campaigns/:userId/:campaignId` çağrısı yapıyoruz, bu da performans sorunu yaratıyor.

### İstenen Değişiklik
`GET /api/v1/campaigns/all` endpoint'ini güncelleyerek, her kampanya objesine kullanıcının o kampanyadaki segment bilgisini eklemenizi istiyoruz.

### Teknik Detaylar

#### 1. Mevcut Campaign Model Yapısı
Kampanya modelinde `segments` array'i var ve her segment şu yapıda:
```javascript
{
  name: "A", // Segment adı (A, B, C, D, E)
  reward: 100, // Bu segment için ödül
  maxParticipants: 50,
  currentParticipants: 10,
  // ... diğer alanlar
}
```

#### 2. UserCampaign Model Yapısı
UserCampaign modelinde:
```javascript
{
  user_id: ObjectId,
  campaign_id: ObjectId,
  class: "A" // Kullanıcının bu kampanyadaki segmenti
}
```

#### 3. İstenen API Response Formatı
```javascript
// GET /api/v1/campaigns/all
{
  "success": true,
  "data": [
    {
      "_id": "campaign_id_1",
      "title": "Campaign 1",
      "description": "Description",
      "segments": [
        { "name": "A", "reward": 100, "maxParticipants": 50 },
        { "name": "B", "reward": 50, "maxParticipants": 30 }
      ],
      "userSegment": "A", // ✅ YENİ: Kullanıcının bu kampanyadaki segmenti
      "userReward": 100,  // ✅ YENİ: Kullanıcının segmentine göre ödül
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.000Z",
      "status": "active",
      // ... diğer kampanya alanları
    }
  ]
}
```

#### 4. Backend Implementation Önerisi
```javascript
// campaigns/all endpoint'inde
const getAllCampaigns = async (req, res) => {
  try {
    const userId = req.user._id; // JWT'den gelen user ID
    
    // Kampanyaları getir
    const campaigns = await Campaign.find({
      isActive: true,
      isAdminAccept: true
    }).sort({ startDate: -1 });
    
    // Her kampanya için kullanıcının segmentini bul
    const campaignsWithUserSegment = await Promise.all(
      campaigns.map(async (campaign) => {
        // UserCampaign'den kullanıcının segmentini bul
        const userCampaign = await UserCampaign.findOne({
          user_id: userId,
          campaign_id: campaign._id
        });
        
        const userSegment = userCampaign?.class || null;
        let userReward = null;
        
        // Eğer segment bulunduysa, o segmentin ödülünü al
        if (userSegment) {
          const segment = campaign.segments.find(s => s.name === userSegment);
          userReward = segment?.reward || null;
        }
        
        return {
          ...campaign.toObject(),
          userSegment,
          userReward
        };
      })
    );
    
    res.json({
      success: true,
      data: campaignsWithUserSegment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

#### 5. Performance Optimizasyonu
Daha iyi performans için aggregation pipeline kullanabilirsiniz:
```javascript
const campaignsWithUserSegment = await Campaign.aggregate([
  {
    $match: {
      isActive: true,
      isAdminAccept: true
    }
  },
  {
    $lookup: {
      from: "usercampaigns", // UserCampaign collection adı
      let: { campaignId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$campaign_id", "$$campaignId"] },
                { $eq: ["$user_id", new ObjectId(userId)] }
              ]
            }
          }
        }
      ],
      as: "userCampaign"
    }
  },
  {
    $addFields: {
      userSegment: {
        $ifNull: [{ $arrayElemAt: ["$userCampaign.class", 0] }, null]
      }
    }
  },
  {
    $addFields: {
      userReward: {
        $let: {
          vars: {
            segment: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$segments",
                    cond: { $eq: ["$$this.name", "$userSegment"] }
                  }
                },
                0
              ]
            }
          },
          in: "$$segment.reward"
        }
      }
    }
  },
  {
    $project: {
      userCampaign: 0 // Gereksiz alanı kaldır
    }
  },
  {
    $sort: { startDate: -1 }
  }
]);
```

### Önemli Notlar
1. **Authentication**: Endpoint JWT token gerektiriyor, `req.user._id` ile kullanıcı ID'sini alabilirsiniz
2. **Fallback**: Eğer kullanıcının kampanyada segmenti yoksa `userSegment: null` döndürün
3. **Performance**: Aggregation pipeline kullanarak tek sorguda tüm veriyi alabilirsiniz
4. **Backward Compatibility**: Mevcut API yapısını bozmadan yeni alanları ekleyin

### Test Senaryoları
1. Kullanıcının segmenti olan kampanyalar
2. Kullanıcının segmenti olmayan kampanyalar  
3. Birden fazla segmenti olan kullanıcılar
4. Segmenti olmayan kullanıcılar

Bu değişiklik ile frontend'de performans önemli ölçüde artacak ve kullanıcı deneyimi iyileşecek.

---
