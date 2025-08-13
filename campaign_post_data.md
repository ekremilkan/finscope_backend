### Base
- Base URL: `http://localhost:5000`
- API Prefix: `/api/v1`
- Tüm isteklerde header ekleyin:
  - Authorization: `Bearer <JWT_TOKEN>`
  - Content-Type: `application/json`

### Notlar
- Kampanya oluşturma ve soru oluşturma endpoint’leri için `admin` veya `customer` rolü gerekir.
- `createdUserId` istemciden gönderilmez; kimlik token’ından alınır.
- Kampanya oluştururken `isAdminAccept` alanı gönderilmez. Admin oluşturursa otomatik `true`, customer oluşturursa `false` kaydedilir.
- Tarihler ISO 8601 formatında olmalı.

---

### 1) Kampanya Oluştur
- Method: POST
- URL: `http://localhost:5000/api/v1/campaigns/create`
- Headers:
  - Authorization: `Bearer <JWT_TOKEN>`
  - Content-Type: `application/json`
- Body (raw JSON):
```json
{
  "title": "Blockchain ve Kripto Para Eğitimi",
  "description": "Blockchain temelleri, kripto paralar ve DeFi üzerine giriş seviyesi kampanya.",
  "content": [
    {
      "itemImage": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "itemVideo": "",
      "itemTitle": "Giriş",
      "itemDescription": "Eğitim planı ve beklentiler",
      "itemIndex": 1
    },
    {
      "itemImage": "",
      "itemVideo": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "itemTitle": "Temel Kavramlar",
      "itemDescription": "Blok, zincir, konsensüs, hash",
      "itemIndex": 2
    }
  ],
  "reward": 150,
  "maxParticipants": { "A": 100, "B": 100, "C": 50, "D": 25 },
  "category": "education",
  "startDate": "2025-08-20T09:00:00.000Z",
  "endDate": "2025-08-31T21:00:00.000Z",
  "questions": 5,
  "estimatedDuration": 20,
  "images": [
    "https://cdn.example.com/banners/blockchain-101.png"
  ],
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "tags": ["blockchain", "crypto", "defi"]
}
```
- Başarılı cevapta dönen `data._id` kampanya ID’sidir. Bunu aşağıdaki soru ekleme isteklerinde `campaignId` olarak kullanın.

---

### 2) Kampanyaya Soru Ekle (1)
- Method: POST
- URL: `http://localhost:5000/api/v1/questions/create`
- Headers:
  - Authorization: `Bearer <JWT_TOKEN>`
  - Content-Type: `application/json`
- Body (raw JSON):
```json
{
  "questionText": "Bitcoin'in mucidi kimdir?",
  "options": [
    { "text": "Vitalik Buterin", "isTrue": false },
    { "text": "Satoshi Nakamoto", "isTrue": true },
    { "text": "Charles Hoskinson", "isTrue": false },
    { "text": "Gavin Wood", "isTrue": false }
  ],
  "campaignId": "<REPLACE_WITH_CAMPAIGN_ID>",
  "order": 1
}
```

### 3) Kampanyaya Soru Ekle (2)
- Method: POST
- URL: `http://localhost:5000/api/v1/questions/create`
- Headers: aynı
- Body:
```json
{
  "questionText": "Ethereum'un kurucusu kimdir?",
  "options": [
    { "text": "Vitalik Buterin", "isTrue": true },
    { "text": "Satoshi Nakamoto", "isTrue": false },
    { "text": "Elon Musk", "isTrue": false },
    { "text": "Changpeng Zhao", "isTrue": false }
  ],
  "campaignId": "<REPLACE_WITH_CAMPAIGN_ID>",
  "order": 2
}
```

### 4) Kampanyaya Soru Ekle (3)
- Method: POST
- URL: `http://localhost:5000/api/v1/questions/create`
- Headers: aynı
- Body:
```json
{
  "questionText": "DeFi nedir?",
  "options": [
    { "text": "Merkeziyetsiz Finans", "isTrue": true },
    { "text": "Merkezi Banka", "isTrue": false },
    { "text": "Fiziksel Bankacılık", "isTrue": false },
    { "text": "Sadece nakit", "isTrue": false }
  ],
  "campaignId": "<REPLACE_WITH_CAMPAIGN_ID>",
  "order": 3
}
```

---

### 5) Kampanyaya Ait Soruları Listele (Doğrulama)
- Method: GET
- URL: `http://localhost:5000/api/v1/questions/campaign/<REPLACE_WITH_CAMPAIGN_ID>`
- Headers:
  - Authorization: `Bearer <JWT_TOKEN>`

---

### 6) Kampanyaları Listele (Rol Bazlı)
- Method: GET
- URL: `http://localhost:5000/api/v1/campaigns/all`
- Headers:
  - Authorization: `Bearer <JWT_TOKEN>`
- Davranış:
  - Admin token’ı: tüm kampanyaları görür.
  - Admin değil: yalnızca `isAdminAccept=true` ve `isActive=true` olanları görür.

---

### 7) (Opsiyonel) Kampanyaya Katılma – Kontenjan Kontrolünü Test Etmek için
- Method: POST
- URL: `http://localhost:5000/api/v1/campaigns/<REPLACE_WITH_CAMPAIGN_ID>/join`
- Headers:
  - Authorization: `Bearer <JWT_TOKEN>`
- Body: boş bırakabilirsiniz `{}` (kullanıcının segmenti token/DB’den alınır)
- Not: Kullanıcının segmenti için `currentParticipants[segment]` < `maxParticipants[segment]` olmalı, aksi halde “kontenjan dolu” hatası döner. 