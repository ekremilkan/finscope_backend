### Arkham Segmentasyon İşleri (ETH Demo)

Bu döküman, demo versiyonda yalnızca Ethereum ağı için (çoklu cüzdan desteğiyle) Arkham entegrasyonu kullanılarak kullanıcı puanlama ve A/B/C/D segmentasyonunun nasıl yapılacağını tanımlar.

---

## 1) Amaç ve Kapsam
- Sadece Ethereum ağı (demo kapsamı).
- Kullanıcının uygulamaya bağladığı tüm ETH cüzdanları (her kullanıcı için max 3) birlikte değerlendirilir.
- Her cüzdan için metrikler çıkarılır → cüzdan skoru hesaplanır → kullanıcı düzeyinde (ETH) ağırlıklı ortalama ile tek skora indirilir → tüm kullanıcı skor dağılımına göre z‑score ile A/B/C/D sınıfları atanır.
- B2B kampanya hedefleme için aynı yaklaşım, hedef protokol seti (örn. Uniswap/Sushi/Curve/Balancer) filtresiyle de çalıştırılabilir.

---

## 2) Yapılandırma (ENV)
- `ARKHAM_API_KEY`: Arkham API erişim anahtarı
- `ARKHAM_BASE_URL`: Arkham API base URL (örn. `https://api.arkham.com/v1`)
- `SEGMENT_WINDOW_DAYS`: Varsayılan zaman penceresi (öneri: `90`)
- `SEGMENT_MODE`: `zscore` (varsayılan) veya `quantile`
- `SEGMENT_QUANTILE_CUTS`: Persentil kesimleri (örn. `0.25,0.5,0.75`)
- `SEGMENT_RETRY_POLICY`: Backoff ve tekrar deneme (örn. `exponential`)

Not: Rate limit/loglama için opsiyonel Redis cache ileride eklenebilir.

---

## 3) Dosya ve Modül Planı
- `utils/arkham.client.js`
  - Axios instance (baseURL, Authorization header, timeout, retry/backoff)
  - Yardımcılar: `getEthTransactions(address, since, until)`, `getEthBalances(address)`, `getLabels(address)`
- `services/segmentation.service.js`
  - `fetchUserEthIntel(userId, windowDays)`
  - `computeWalletMetrics(intel)` → wallet bazlı metrik objeleri
  - `scoreWalletsWithZScores(walletMetricsAllUsers)` → zincir-içi normalize + S_wallet
  - `aggregateUserEthScore(userWalletScores)` → wallet ağırlıklarıyla kullanıcı skoru
  - `assignSegmentsByZScore(allUserScores)` veya `assignSegmentsByQuantile(allUserScores)`
  - `recomputeAllUsers({ windowDays, mode })`
- `models/userSegment.model.js`
  - Şema: kullanıcı birleşik skor, cüzdan skor/ ağırlıkları, zScore/percentile/segment, açıklayıcı metrikler
- `controllers/segments.controller.js`
  - `recompute` (admin), `getUserSegment`, `getDistribution`
- `routers/segments.router.js`
  - POST `/segments/recompute` (admin)
  - GET `/segments/user/:userId`
  - GET `/segments/distribution`
- `scripts/segments.recompute.js`
  - CLI/cron tetikleyicisi; env’den parametre alır ve servis çağırır

Router kaydı: `routers/index.js` ve `server.js` içine `segments` router eklenir.

---

## Durum (Güncel)
- [x] Arkham client modülü eklendi: `utils/arkham.client.js`
- [x] UserSegment modeli eklendi: `models/userSegment.model.js`
- [x] Segmentation servisi: `services/segmentation.service.js`
- [x] Segments controller/router: `controllers/segments.controller.js`, `routers/segments.router.js`
- [x] Recompute script: `scripts/segments.recompute.js`
- [x] Router kaydı ve endpointler
- [x] Batch/cron entegrasyonu
- [x] Testler

---

## 4) Metrikler (Wallet Bazında, ETH, Varsayılan 90g)
- `dex_swap_volume_usd_90d`: DEX swap toplam hacmi (USD) [log1p uygula]
- `dex_swap_count_90d`: DEX swap işlem sayısı
- `lp_events_count_90d`: Add/Remove Liquidity olay sayısı (ve mümkünse `lp_volume_usd_90d`)
- `balance_usd_latest`: Güncel ETH + önemli ERC‑20 toplam USD değeri
- `recency_score`: `exp(−λ·days_since_last_tx)`; öneri λ ≈ 0.07
- `unique_protocols_90d`: DEX/Lending/DeFi protokol çeşitliliği (Uniswap, Curve, Balancer, 1inch vb.)
- `non_cex_ratio`: (DEX/protokol etkileşimleri) / (toplam tx) — CEX/bridge/MEV/mixer etkisini törpüler
- `penalty`: Risk/ceza (0–0.4) — faucet/sybil, CEX hotwallet hop, mixer/MEV etiketi vs.

Etiketleme ve sınıflandırma Arkham label/protokol bilgileriyle yapılır; CEX/bridge/MEV işlemleri hacimden hariç tutulmalı veya düşük ağırlık verilmelidir.

---

## 5) Normalizasyon ve Wallet Skoru
- Zincir-içi normalizasyon (ETH): Tüm wallet’lar için metrikler z‑score’a çevrilir.
  - Gerekli yerlerde önce `log1p(x)` (örn. hacim/bakiye) sonra z‑score.
  - `z = (x − μ_eth) / σ_eth` (batch kapsamındaki wallet’lar üzerinden hesaplanır)
- Bileşik wallet skoru:
  - `S_wallet = 0.30·z(volume) + 0.20·z(tx_count) + 0.15·z(unique_protocols) + 0.15·z(balance_usd) + 0.10·recency_score + 0.10·non_cex_ratio − penalty`

---

## 6) Çoklu Cüzdanı Kullanıcı Düzeyine Toplama (ETH)
- Ağırlıklar (kullanıcıya ait ETH cüzdanları):
  - `volume_share = vol_wallet / Σ vol_wallet`
  - `activity_share = tx_wallet / Σ tx_wallet`
  - `recency_weight = exp(−λ·days_since_last_tx)`
  - `weight_wallet = normalize(0.5·volume_share + 0.3·activity_share + 0.2·recency_weight)`
- Kullanıcı ETH skoru:
  - `S_user_eth = Σ (weight_wallet · S_wallet)`
- Gürbüzlük: Uç değer etkisi belirginse trimmed mean (en yüksek/en düşük 1 cüzdanı at) fallback uygulanabilir.

---

## 7) Dinamik Segmentasyon (Standart Sapma veya Persentil)
- Tüm kullanıcılar için `S_user_eth` seti oluşturulur.
- Varsayılan: z‑score tabanlı kesimler (çan benzeri paylaştırma):
  - `A: z ≥ +1.0`, `B: 0 ≤ z < +1.0`, `C: −1.0 ≤ z < 0`, `D: z < −1.0`
- Alternatif: persentil kesimleri (daha dengeli oran):
  - `A: P≥75`, `B: 50–75`, `C: 25–50`, `D: <25`
- Mod ve eşikler konfigüre edilebilir.

Kaydedilecek alanlar: `compositeScore`, `zScore` ve/veya `percentile`, `class`, `insufficientData`, `asOf`.

---

## 8) Veri Modeli (Öneri) — `models/userSegment.model.js`
- `userId: ObjectId`
- `chain: 'ethereum'`
- `window: '90d' | '30d' | '180d'`
- `wallets: [{ address, score, weight, metrics: {...} }]`
- `metricsAggregate: { volume, txCount, uniqueProtocols, balanceUsd, recency, nonCex, penalty }`
- `compositeScore: Number`
- `zScore: Number`
- `percentile: Number`
- `class: 'A' | 'B' | 'C' | 'D'`
- `insufficientData: Boolean`
- `confidence: Number` (0–1)
- `asOf: Date`

Index önerileri: `(userId, chain, window)`, `class`, `asOf`.

---

## 9) API Tasarımı
- `POST /api/v1/segments/recompute?chain=ethereum&period=90d` (admin)
  - Açıklama: Tüm kullanıcılar için yeniden hesaplama başlatır; özet döner (A/B/C/D dağılımı, N, süre).
- `GET /api/v1/segments/user/:userId?chain=ethereum`
  - Açıklama: Kullanıcının güncel segmentini ve detay skorlarını döner.
- `GET /api/v1/segments/distribution?chain=ethereum&period=90d`
  - Açıklama: Skor ve sınıf dağılımlarını (histogram verisi, kesimler) döner.

Router: `routers/segments.router.js` → `server.js` içinde `/api/v1/segments` altına bağlanır.

---

## 10) Batch/Job ve Komutlar
- Script: `scripts/segments.recompute.js`
  - Parametreler: `--chain=ethereum --period=90d --mode=zscore`
  - Çalışma: Arkham’dan veri çek → metrik/normalize → skor/segment → DB’ye yaz.
- NPM script:
  - `"segments:recompute": "node scripts/segments.recompute.js --chain=ethereum --period=90d --mode=zscore"`
- Zamanlama: Günlük gece çalıştır (cron veya dış orchestrator). Kampanya öncesi manuel tetikleme opsiyonu.

---

## 11) Kenar Durumları ve Kalite
- `insufficient_data`: `tx_count≈0` ve `balance_usd≈0` → `true` ve sınıf genellikle `D`.
- CEX/MEV/bridge/mixer etkileri: hacimden ayrıştır veya `non_cex_ratio` ile doğal olarak düşür.
- Outlier kontrolü: `log1p`, winsorize/trim; dağılım raporu ile gözlemle.
- Idempotency: Aynı pencere için tekrar çalıştırma aynı sonucu üretmeli (aynı veri koşullarında).

---

## 12) Güvenlik ve Uyum
- Arkham ToS’e uygun kullanım; yalnızca hedefleme/segment amaçlı saklama.
- Kişisel veri tutulmaz; yalnızca halka açık on‑chain ve Arkham etiket verileri.
- Hata yönetimi: timeout/retry/backoff; ratelimit ihlallerinde bekleme.

---

## 13) Test Planı
- Unit
  - `computeWalletMetrics`: doğru metrik çıkarımı (mock intel)
  - `scoreWalletsWithZScores`: normalizasyon ve skor formülü testleri
  - `aggregateUserEthScore`: ağırlıkların etkisi ve trimmed mean fallback
  - `assignSegmentsByZScore/Quantile`: kesimler, sınır değerler
- Integration
  - Fixture adresler için uçtan uca (Arkham client mock) recompute akışı
  - API endpoint’leri: yetki, yanıt şeması, hata durumları
- Performans
  - 10k kullanıcıya kadar batch örnekleri; concurrency ve sayfalama davranışı

---

## 14) Kabul Kriterleri
- [ ] ENV tanımlandı ve gizli anahtarlar .env’de (prod’da secret store).
- [ ] Arkham client ile ETH işlemleri/bakiyeler/etiketler çekilebiliyor.
- [ ] Metrikler wallet bazında doğru hesaplanıyor; CEX/MEV ayrıştırması uygulanıyor.
- [ ] Wallet skorları z‑score ile normalize edilip formüle göre hesaplanıyor.
- [ ] Çoklu cüzdandan kullanıcı ETH skoru ağırlıklı ortalama ile üretiliyor.
- [ ] Tüm kullanıcılar için z‑score tabanlı A/B/C/D ataması yapılıyor ve DB’ye yazılıyor.
- [ ] `recompute`, `user segment`, `distribution` endpoint’leri çalışıyor.
- [ ] Günlük batch çalıştırılabiliyor; kampanya öncesi manuel tetikleme mümkün.
- [ ] Raporlama: sınıf dağılımı, kesimler ve özet metrikler elde edilebiliyor.

---

## 15) Örnek Pseudo Akış
```js
// 1) Kullanıcı → ETH cüzdanları
const wallets = await getUserEthWallets(userId);

// 2) Arkham’dan veri (son 90g)
const intel = await arkham.fetchEthIntel(wallets, { since: now-90d });

// 3) Wallet metrikleri
const walletMetrics = computeWalletMetrics(intel);

// 4) Wallet skorları (z‑score normalize)
const walletScores = scoreWalletsWithZScores(walletMetricsAllUsers);

// 5) Kullanıcı ETH skoru (ağırlıklı ortalama)
const userScore = aggregateUserEthScore(walletScores[userId]);

// 6) Tüm kullanıcı skor dağılımı → z‑score → A/B/C/D
const segments = assignSegmentsByZScore(allUserScores);

// 7) Kaydet ve raporla
await persistSegments(segments);
```

---

Bu plan, demo sürümde yalnızca Ethereum ağı için üretime alınabilecek net bir yol haritasıdır. Sonraki sürümlerde Solana/Tron/BNB/SUI/Base eklemek için aynı yapı zincir parametreleri ile genişletilecektir. 