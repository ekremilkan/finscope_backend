# Kullanıcı Ödeme (Purchase) Görevi

- [x] 1) `UserProgress` şemasına `isPurchase: Boolean` (default: false) alanını ekle
- [x] 2) Tamamlanan kullanıcıları listelemek için service metodu yaz (`campaign.service.js` → `listCompletedUsers`)
- [x] 3) Controller metodu ekle (`campaign.controller.js` → `listCompletedUsers`)
- [x] 4) Admin-only endpoint ekle (`campaign.router.js` → `GET /admin/completed-users`)
- [x] 5) Ödeme durumunu güncelleme endpoint'i: `PATCH /campaigns/admin/completed-users/:userId/:campaignId/purchase`

## Detaylar

- `UserProgress.isPurchase`: Kullanıcının ilgili kampanya ödülünün ödenip ödenmediğini temsil eder.
- Listeleme endpoint'i response alanları:
  - `userId`, `userName`
  - `campaignId`, `campaignTitle`
  - `completedAt`
  - `segment` (UserSegment.class)
  - `reward` (Campaign.reward)
  - `isPurchase` (ödenme durumu)
  - `airdropWallet` (kullanıcının airdrop için işaretli cüzdanı)

### Ödeme Durumu Güncelleme Endpoint'i
- Method: PATCH
- Path: `${APP_PREFIX}/campaigns/admin/completed-users/:userId/:campaignId/purchase`
- Body: `{ "isPurchase": true | false }`
- Auth: Admin token zorunlu 