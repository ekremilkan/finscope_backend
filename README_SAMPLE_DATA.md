# 📊 Örnek Veriler ve API Kullanımı

Bu dokümantasyon, FinScope Backend API'sine örnek veriler ekleme ve API'yi test etme konularını içerir.

## 🚀 Örnek Verileri Ekleme

### 1. Script Çalıştırma

Örnek verileri veritabanına eklemek için aşağıdaki komutu çalıştırın:

```bash
node scripts/sample_data.js
```

### 2. Oluşturulan Veriler

Script çalıştırıldığında aşağıdaki veriler oluşturulur:

#### 👥 Kullanıcılar (4 adet)
- **Admin:** `admin@finscope.com` / `Admin123!`
- **Customer 1:** `john@finscope.com` / `Customer123!`
- **Customer 2:** `jane@finscope.com` / `Customer123!`
- **User:** `bob@finscope.com` / `User123!`

#### 📝 Kampanyalar (4 adet)

1. **Blockchain Eğitimi Kampanyası**
   - Kategori: Education
   - Zorluk: Beginner
   - Ödül: 150
   - Durum: Upcoming
   - Resimler: 3 adet
   - Video: YouTube linki
   - Etiketler: blockchain, crypto, bitcoin, ethereum, defi

2. **Modern Web Geliştirme Teknikleri**
   - Kategori: Technology
   - Zorluk: Intermediate
   - Ödül: 200
   - Durum: Active
   - Resimler: 2 adet
   - Video: Vimeo linki
   - Etiketler: web-development, react, nodejs, javascript, api

3. **Dijital Sağlık ve Fitness Rehberi**
   - Kategori: Health
   - Zorluk: Beginner
   - Ödül: 100
   - Durum: Active
   - Resimler: 2 adet
   - Video: Yok
   - Etiketler: health, fitness, wellness, digital-health

4. **Kişisel Finans ve Yatırım Stratejileri**
   - Kategori: Finance
   - Zorluk: Advanced
   - Ödül: 250
   - Durum: Active
   - Resimler: 3 adet
   - Video: YouTube linki
   - Etiketler: finance, investment, budgeting, retirement, financial-literacy

#### ❓ Sorular (10 adet)

Her kampanya için farklı sayıda soru oluşturulur:
- **Blockchain:** 3 soru
- **Web Geliştirme:** 3 soru
- **Sağlık:** 2 soru
- **Finans:** 2 soru

## 🧪 API Test Senaryoları

### Senaryo 1: Customer Kampanya Oluşturma

```bash
# 1. Customer olarak giriş yap
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@finscope.com",
    "password": "Customer123!"
  }'

# 2. Token'ı al ve kampanya oluştur
curl -X POST http://localhost:3000/api/v1/campaigns/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yeni Test Kampanyası",
    "description": "Bu bir test kampanyasıdır",
    "reward": 100,
    "startDate": "2024-12-20T00:00:00.000Z",
    "endDate": "2024-12-25T23:59:59.000Z",
    "category": "education",
    "difficulty": "Beginner",
    "images": [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800"
    ],
    "videoLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "tags": ["test", "education"]
  }'
```

### Senaryo 2: Admin Tüm Kampanyaları Görüntüleme

```bash
# Admin olarak giriş yap
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finscope.com",
    "password": "Admin123!"
  }'

# Tüm kampanyaları getir
curl -X GET http://localhost:3000/api/v1/campaigns/all \
  -H "Authorization: Bearer <admin_token>"
```

### Senaryo 3: Soru Ekleme

```bash
# Customer olarak giriş yap
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@finscope.com",
    "password": "Customer123!"
  }'

# Soru ekle (campaignId'yi gerçek ID ile değiştirin)
curl -X POST http://localhost:3000/api/v1/questions/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Blockchain teknolojisinin avantajları nelerdir?",
    "options": [
      {"text": "Merkezi kontrol", "isTrue": false},
      {"text": "Şeffaflık ve güvenlik", "isTrue": true},
      {"text": "Hızlı işlem", "isTrue": false},
      {"text": "Düşük maliyet", "isTrue": false}
    ],
    "campaignId": "REAL_CAMPAIGN_ID_HERE",
    "order": 1
  }'
```

### Senaryo 4: Kampanya Güncelleme

```bash
# Kampanya güncelle
curl -X PUT http://localhost:3000/api/v1/campaigns/CAMPAIGN_ID \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Güncellenmiş Kampanya Başlığı",
    "description": "Güncellenmiş açıklama",
    "images": [
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800"
    ],
    "videoLink": "https://vimeo.com/123456789"
  }'
```

## 🔍 Veri Kontrolü

### Kampanyaları Listeleme

```bash
# Tüm kampanyaları getir
curl -X GET http://localhost:3000/api/v1/campaigns/all \
  -H "Authorization: Bearer <token>"

# Belirli kampanya detayını getir
curl -X GET http://localhost:3000/api/v1/campaigns/CAMPAIGN_ID

# Müşteri kampanyalarını getir
curl -X GET http://localhost:3000/api/v1/campaigns/customer/list \
  -H "Authorization: Bearer <token>"
```

### Soruları Listeleme

```bash
# Kampanya sorularını getir
curl -X GET http://localhost:3000/api/v1/questions/campaign/CAMPAIGN_ID \
  -H "Authorization: Bearer <token>"

# Müşteri sorularını getir
curl -X GET http://localhost:3000/api/v1/questions/customer \
  -H "Authorization: Bearer <token>"

# Tüm soruları getir (Admin)
curl -X GET http://localhost:3000/api/v1/questions/all \
  -H "Authorization: Bearer <admin_token>"
```

## 🗑️ Veri Temizleme

Eğer verileri temizlemek isterseniz:

```bash
# MongoDB'ye bağlan
mongosh

# Veritabanını seç
use finscope_backend

# Koleksiyonları temizle
db.users.deleteMany({})
db.campaigns.deleteMany({})
db.questions.deleteMany({})
```

## 📋 Test Kontrol Listesi

- [ ] Script başarıyla çalıştı
- [ ] 4 kullanıcı oluşturuldu
- [ ] 4 kampanya oluşturuldu
- [ ] 10 soru oluşturuldu
- [ ] Admin girişi çalışıyor
- [ ] Customer girişi çalışıyor
- [ ] User girişi çalışıyor
- [ ] Kampanya oluşturma çalışıyor
- [ ] Soru oluşturma çalışıyor
- [ ] Role-based access control çalışıyor
- [ ] Medya alanları (images, videoLink) çalışıyor

## 🚨 Önemli Notlar

1. **MongoDB Bağlantısı:** Script çalıştırmadan önce MongoDB'nin çalıştığından emin olun
2. **Environment Variables:** Gerekirse `.env` dosyasında `MONGODB_URI` tanımlayın
3. **Token Kullanımı:** API testlerinde gerçek token'ları kullanın
4. **ID Değiştirme:** Örneklerdeki ID'leri gerçek ID'lerle değiştirin
5. **Validation:** Tüm validation kurallarına uygun veri gönderin

## 📞 Sorun Giderme

### Yaygın Hatalar:

1. **MongoDB Bağlantı Hatası:**
   ```bash
   # MongoDB servisini başlat
   sudo systemctl start mongod
   ```

2. **Validation Hatası:**
   - Tarih formatını kontrol edin (ISO 8601)
   - URL formatını kontrol edin
   - Zorunlu alanları doldurun

3. **Authorization Hatası:**
   - Token'ın geçerli olduğundan emin olun
   - Role yetkilerini kontrol edin

4. **Role Yetki Hatası:**
   - Admin: Tüm işlemler
   - Customer: Kendi verileri
   - User: Sadece okuma 