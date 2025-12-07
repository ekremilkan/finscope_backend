// scripts/initTelegramSession.js

require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

// .env içinden alıyoruz – DEĞERLERİ BURAYA YAZMA!
const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const existingSession = process.env.TELEGRAM_SESSION || "";

if (!apiId || !apiHash) {
  console.error(
    "❌ TELEGRAM_API_ID veya TELEGRAM_API_HASH .env içinde tanımlı değil."
  );
  process.exit(1);
}

(async () => {
  console.log("🚀 Telegram MTProto Session oluşturucu");

  const stringSession = new StringSession(existingSession);

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  // Eğer zaten session varsa, doğrudan bağlanmayı deniyoruz
  if (existingSession) {
    try {
      console.log("🟡 Var olan TELEGRAM_SESSION ile bağlanmayı deniyor...");
      await client.connect();
      console.log("✅ Mevcut TELEGRAM_SESSION çalışıyor, tekrar login gerekmedi.");
      console.log("\nBu session'ı .env içinde kullanmaya devam edebilirsin.");
      process.exit(0);
    } catch (err) {
      console.log(
        "⚠️ Var olan TELEGRAM_SESSION ile bağlanılamadı, yeniden login gerekiyor."
      );
    }
  }

  await client.start({
    phoneNumber: async () =>
      await input.text("📱 Telefon numaranı gir (+90XXXXXXXXXX): "),
    password: async () =>
      await input.text("🔐 2FA şifren varsa gir (yoksa boş bırak): "),
    phoneCode: async () =>
      await input.text("📩 Telegram'dan gelen kodu gir: "),
    onError: (err) => console.error("❌ Hata:", err),
  });

  console.log("✅ Başarıyla giriş yapıldı!");

  const newSession = client.session.save();
  console.log("\n================ TELEGRAM SESSION ================");
  console.log(newSession);
  console.log("=================================================\n");

  console.log(
    "ℹ️ Bu string'i .env dosyana TELEGRAM_SESSION=... olarak yapıştır."
  );

  await client.disconnect();
  console.log("🔌 Bağlantı kapatıldı.");
})();
