# Admin Panel API Rehberi

Bu doküman, admin panel için eklenen yeni uç noktaları ve kullanım detaylarını içerir.

## Ortak Bilgiler
- Base URL: `${APP_PREFIX}` (örn. `http://localhost:5005/api/v1`)
- Kimlik Doğrulama: Tüm endpoint'ler için admin rolüne sahip access token gereklidir.
  - Header: `Authorization: Bearer <admin_access_token>`

---

## 1) Toplam Kullanıcı Sayısı
- Method: GET
- Path: `/user/admin/total-count`
- Auth: Admin zorunlu

Örnek istek (curl):
```bash
curl -X GET \
  -H "Authorization: Bearer <admin_access_token>" \
  http://localhost:5005/api/v1/user/admin/total-count
```

Örnek yanıt:
```json
{
  "success": true,
  "error": false,
  "message": "Total user count retrieved successfully",
  "data": { "totalUsers": 123 },
  "code": 200
}
```

Alanlar:
- `data.totalUsers`: Sistem genelindeki toplam kullanıcı sayısı

---

## 2) Tamamlanan Kullanıcılar Listesi (Kampanya Kazananları)
- Method: GET
- Path: `/campaigns/admin/completed-users`
- Auth: Admin zorunlu
- Query Parametreleri:
  - `campaignId` (opsiyonel): Belirli bir kampanyanın kazananlarını listelemek için filtre

Örnek istek (tüm kampanyalar):
```bash
curl -X GET \
  -H "Authorization: Bearer <admin_access_token>" \
  "http://localhost:5005/api/v1/campaigns/admin/completed-users"
```

Örnek istek (tek kampanya filtreli):
```bash
curl -X GET \
  -H "Authorization: Bearer <admin_access_token>" \
  "http://localhost:5005/api/v1/campaigns/admin/completed-users?campaignId=<CAMP_ID>"
```

Örnek yanıt:
```json
[
  {
    "userId": "665f...",
    "userName": "Jane Doe",
    "campaignId": "66ab...",
    "campaignTitle": "Kampanya X",
    "completedAt": "2025-01-01T12:34:56.000Z",
    "segment": "A",
    "reward": 25,
    "isPurchase": false
  }
]
```

Alanlar:
- `userId`: Kullanıcı ID
- `userName`: Kullanıcı adı
- `campaignId`: Kampanya ID
- `campaignTitle`: Kampanya adı
- `completedAt`: Kampanyanın kullanıcı tarafından tamamlanma zamanı
- `segment`: Kullanıcının segment sınıfı (`A|B|C|D` veya segment yoksa `null`)
- `reward`: Kampanyanın baz ödülü (segment başına ödül politikası UI tarafında hesaplanacaksa kullanılabilir)
- `isPurchase`: Ödemenin yapılıp yapılmadığı bilgisi (varsayılan `false`)
- `airdropWallet`: Kullanıcının airdrop için işaretli cüzdan adresi (yoksa `null`)

Notlar:
- Liste, `UserProgress.completed = true` kayıtlarından oluşturulur.
- Kullanıcı segmenti, `UserSegment` koleksiyonundan `${SEGMENT_WINDOW_DAYS || 90}d` penceresi öncelikli olacak şekilde çekilir; bulunamazsa `null` gelebilir.
- Büyük listeler için sayfalama şu an yoktur. Gerekirse `?limit` ve `?page` parametreleri ile genişletilebilir.
- Ödeme işaretleme (purchase) için ayrı bir endpoint planlanmıştır (bkz. `docs/user_purchase.md`, madde 5). Şu an `isPurchase` yalnızca görüntülenir.

---

## 3) Ödeme Durumu Güncelle (isPurchase)
- Method: PATCH
- Path: `/campaigns/admin/completed-users/:userId/:campaignId/purchase`
- Auth: Admin zorunlu
- Body:
```json
{ "isPurchase": true }
```

Örnek istek (curl):
```bash
curl -X PATCH \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"isPurchase": true}' \
  "http://localhost:5005/api/v1/campaigns/admin/completed-users/USER_ID/CAMPAIGN_ID/purchase"
```

Örnek yanıt:
```json
{
  "success": true,
  "error": false,
  "message": "Purchase status updated",
  "data": {
    "userId": "USER_ID",
    "campaignId": "CAMPAIGN_ID",
    "isPurchase": true,
    "updatedAt": "2025-01-01T12:34:56.000Z"
  },
  "code": 200
}
```

Hata durumları:
- 400: Geçersiz `userId`/`campaignId` veya body
- 404: İlgili `UserProgress` bulunamadı

---

## Hata Durumları
Standart hata formatı:
```json
{
  "success": false,
  "error": true,
  "message": "Hata mesajı",
  "code": 4xx/5xx
}
```

- 401: Geçersiz/eksik token
- 403: Admin yetkisi yok
- 404: Filtrelenen kampanya veya veri bulunamadı (duruma göre)

---

## Sürümleme ve Değişiklikler
- 2025-08-22: İlk sürüm — iki endpoint eklendi. 