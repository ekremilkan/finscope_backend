### FinScope Segmentasyon Modülü (ETH Demo)

Bu doküman, kullanıcıların Learn-to-Earn (B2C) ve hedefleme (B2B) amaçları için A/B/C/D segmentlerine nasıl ayrıldığını, kullanılan veri kaynaklarını (Arkham), metrikleri, formülleri, cron işlerini ve entegrasyon ayrıntılarını açıklar.

---

## 1) Kapsam ve Amaç
- Demo sürüm: Sadece Ethereum ağı.
- Dahil kullanıcılar: `role=user` olanlar.
- Hedef: Kullanıcıların on-chain davranışlarını (işlem akışı, bakiye, etiket) kullanarak dinamik bir puan üretmek ve çan benzeri dağılıma göre A/B/C/D segmentlerini belirlemek.

---

## 2) Veri Kaynağı ve Entegrasyon
- Sağlayıcı: Arkham Intelligence.
- Base URL: `https://api.arkm.com`
- Kimlik doğrulama: HTTP Header `API-Key: <YOUR_KEY>`
- Kullanılan endpointler (ETH):
  - Balans: `GET /balances/address/{address}?chain=eth`
  - Akış (hacim/frekans proxy): `GET /flow/address/{address}?chain=eth&start_time=<unix>&end_time=<unix>`
  - Zekâ/etiket: `GET /intelligence/address/{address}?chain=eth`
- Zaman penceresi: Varsayılan 90 gün (30/180 gün konfigüre edilebilir)
  - `start_time` ve `end_time` UNIX saniye formatındadır.

---

## 3) İşleyiş (Uçtan Uca)
1) Kullanıcı kayıt olur, login ve e-posta doğrulamasını tamamlar (rolü `user`).
2) Kullanıcı Ethereum cüzdan(lar)ını bağlar (max 3).
3) Segment job çalıştığında:
   - Kullanıcının tüm ETH cüzdanları toplanır.
   - Arkham’dan her cüzdan için son 90 güne ait akış/bakiye/etiket verisi çekilir.
   - Cüzdan bazında metrikler hesaplanır ve normalize edilir (z-score).
   - Cüzdan skorları ağırlıklı ortalama ile kullanıcı skoruna dönüştürülür.
   - Tüm kullanıcı skorları dağılımına göre A/B/C/D sınıfları atanır ve veritabanına kaydedilir.

---

## 4) Metrikler (Cüzdan Bazında)
- Hacim (USD): Akış noktalarındaki USD değerlerinin toplamı.
- İşlem sayısı: Akış noktası sayısı (flow point count).
- Protokol çeşitliliği: Intelligence etiketi ve karşı taraf sinyallerine dayalı basit çeşitlilik (demo sürümünde konservatif).
- Bakiye (USD): Arkham balances yanıtından toplanan USD.
  - Farklı formatlar desteklenir: `balances[]`, `balances.balances[]`, `totalBalance{}`, `tokens[]`, `assets[]`.
- Yakınlık (recency): `recency = exp(−λ · days_since_last_activity)`; öneri `λ ≈ 0.07`.
- non_cex_ratio: CEX dışındaki etkileşim oranı (kalite sinyali, demo’da konservatif).
- penalty: Riskli patern sinyali (örn. aşırı CEX yönelim) varsa 0–0.4 arası ceza.

---

## 5) Normalizasyon ve Cüzdan Skoru
- Z-score normalizasyonu (ETH içinde):
  - `z(x) = (x − μ_eth) / σ_eth` (hacim/bakiye için `log1p` uygulanır)
- Bileşik cüzdan skoru:
  - `S_wallet = 0.30·z(volume) + 0.20·z(txCount) + 0.15·z(uniqueProtocols) + 0.15·z(balanceUsd) + 0.10·recency + 0.10·nonCex − penalty`

---

## 6) Çoklu Cüzdanı Kullanıcı Skoruna Çevirme
- Ağırlıklar:
  - `volume_share = vol_wallet / Σ vol_wallet`
  - `activity_share = tx_wallet / Σ tx_wallet`
  - `recency_weight = recency`
  - `weight_wallet = normalize(0.5·volume_share + 0.3·activity_share + 0.2·recency_weight)`
- Kullanıcı skoru:
  - `S_user = Σ (weight_wallet · S_wallet)`

---

## 7) Dinamik Segment Ataması (Z‑Score)
- Tüm kullanıcılar için `S_user` dağılımı z‑score’a çevrilir ve sınıflar atanır:
  - `A: z ≥ +1.0`
  - `B: 0 ≤ z < +1.0`
  - `C: −1.0 ≤ z < 0`
  - `D: z < −1.0`
- Alternatif (opsiyonel): Persentil tabanlı kesimler (P75/P50/P25) istenirse konfigüre edilebilir.

---

## 8) Cron ve Zamanlama
- Varsayılan: Her gün 03:00 (UTC) toplu yeniden hesaplama.
- Script: `scripts/segments.cron.js`
- ENV:
  - `SEGMENT_CRON_EXPR`: Crontab ifadesi (varsayılan `0 3 * * *`).
  - `SEGMENT_WINDOW_DAYS`: Pencere (varsayılan `90`).
  - `CRON_TZ`: Zaman dilimi (varsayılan `UTC`).n
- Çalıştırma:
  - `npm run segments:cron`
  - Üretimde PM2 ile: `pm2 start scripts/segments.cron.js --name finscope-segments-cron`

---

## 9) Veritabanı ve API’ler
- Kayıtlar: `UserSegment` koleksiyonu
  - Alanlar: `userId`, `chain='ethereum'`, `window='90d'`, `wallets[{address,score,weight,metrics}]`, `metricsAggregate`, `compositeScore`, `zScore`, `class`, `insufficientData`, `confidence`, `asOf`.
- API Endpoints:
  - (Admin) `POST /api/v1/segments/recompute?period=90d`
  - (Admin) `GET /api/v1/segments/distribution?period=90d`
  - (Login) `GET /api/v1/segments/user/:userId?period=90d`

---

## 10) Kalite, Gizlilik ve Sınırlar
- Yetersiz veri: İşlem/bakiye yoksa `insufficientData=true` ve cüzdan bağlı değilse ve tipik olarak `D` sınıfı.
- Gizlilik: Arkham verileri kamuya açık on-chain verilerden üretilir; `API-Key` sadece backend’te kullanılır.
- Hata toleransı: 429/5xx için exponential backoff; 400/401 için detay log.
- Gelecek sürüm: DEX/LP/protokol ayrıştırması ve entity bazlı zengin etiketleme.

---

## 11) Örnek Akış (Pseudocode)
```text
for each user (role=user):
  wallets = listEthWallets(user)
  intel = for each wallet => {
    flow = /flow/address/{addr}?chain=eth&start_time&end_time
    balances = /balances/address/{addr}?chain=eth
    intel = /intelligence/address/{addr}?chain=eth
  }
  metrics_wallet = computeMetrics(flow, balances, intel)
  score_wallet = zscoreNormalize(metrics_wallet) -> S_wallet
  S_user = weightedAverage(S_wallets)
all_scores = [S_user...]
segments = assignByZScore(all_scores) -> A/B/C/D
persist(segments)
```

---

## 12) SSS (Kısa)
- Neden z‑score? Çan benzeri dağılıma otomatik uyum sağlar; veri seti büyüdükçe dengeli segmentler üretir.
- Neden flow? Arkham’da doğrudan “transactions” yerine akış ve portföy veri setleri daha kararlı ve zincir-agnostik proxy’ler sunar.
- Çoklu cüzdan etkisi? Hacim ve aktivite ağırlıklarıyla tek kullanıcı skoruna indirgenir; tek cüzdan outlier etkisi azaltılır. 