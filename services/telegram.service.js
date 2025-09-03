// services/telegram.service.js
const { Telegraf, webhookCallback } = require("telegraf");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // İçinde virgül, çift tırnak veya yeni satır varsa CSV standardına göre kaçır.
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCSV(rows, headers) {
  const headerLine = headers.map(csvEscape).join(",");
  const bodyLines = rows.map((r) =>
    headers.map((h) => csvEscape(r[h])).join(",")
  );
  return [headerLine, ...bodyLines].join("\n");
}

/** ENV kontrolü */
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");

const bot = new Telegraf(token);

/** İzinli chat filtresi (grup güvenliği) */
function isAllowedChat(chatId) {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS || "";
  const allow = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!chatId) return false;
  if (allow.length === 0) return true; // boşsa hepsine izin ver
  return allow.includes(String(chatId));
}

/** Komutlar */
bot.start(async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;
  await ctx.reply(
    "Merhaba! Ben grup botuyum. /help ile komutları görebilirsin."
  );
});

bot.help(async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;
  await ctx.reply(
    [
      "Kullanılabilir komutlar:",
      "/help – Yardım",
      "/ping – Bot canlı mı",
      "/chatid – Bu grubun/sohbetin ID’si",
      "/status – Kısa durum",
    ].join("\n")
  );
});

bot.command("ping", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;
  await ctx.reply("pong ✅");
});

bot.command("chatid", async (ctx) => {
  const id = ctx.chat?.id;
  await ctx.reply(`Chat ID: ${id}`);
});

bot.command("status", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;
  await ctx.reply("🟢 Bot çalışıyor");
});

// /usercount -> toplam kayıtlı kullanıcı sayısı
bot.command("usercount", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    // Kesin/doğru sayı için:
    const count = await User.countDocuments({});

    // Çok büyük koleksiyonlarda daha hızlı (yaklaşık) istersen:
    // const count = await User.estimatedDocumentCount();

    await ctx.reply(
      `Toplam kayıtlı kullanıcı: ${count.toLocaleString("tr-TR")}`
    );
  } catch (err) {
    console.error("usercount error:", err);
    await ctx.reply(
      "Üzgünüm, kullanıcı sayısını şu anda çekemedim. Daha sonra tekrar dener misin?"
    );
  }
});

// /newusers -> son 24 saatte kayıt olan kullanıcı sayısı
bot.command("newusers", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 saat önce
    const count = await User.countDocuments({ createdAt: { $gte: since } });

    await ctx.reply(
      `Son 24 saatte kayıt olan kullanıcı: ${count.toLocaleString("tr-TR")}`
    );
  } catch (err) {
    console.error("newusers error:", err);
    await ctx.reply("Üzgünüm, yeni kullanıcı sayısını şu anda çekemedim.");
  }
});

// /walletcount -> toplam cüzdan sayısı
bot.command("walletcount", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    const count = await Wallet.countDocuments({});
    await ctx.reply(`Toplam cüzdan sayısı: ${count.toLocaleString("tr-TR")}`);
  } catch (err) {
    console.error("walletcount error:", err);
    await ctx.reply("Üzgünüm, cüzdan sayısını şu anda çekemedim.");
  }
});

// /walletstats -> kaç kullanıcıda cüzdan var / yok
bot.command("walletstats", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    // Cüzdanı olan kullanıcı sayısı (wallets array uzunluğu > 0)
    const withWallet = await User.countDocuments({
      wallets: { $exists: true, $ne: [] },
    });

    // Cüzdanı olmayan kullanıcı sayısı
    const withoutWallet = await User.countDocuments({
      $or: [{ wallets: { $exists: false } }, { wallets: { $size: 0 } }],
    });

    const total = withWallet + withoutWallet;

    await ctx.reply(
      [
        `👥 Toplam kullanıcı: ${total.toLocaleString("tr-TR")}`,
        `💳 Cüzdanı olan: ${withWallet.toLocaleString("tr-TR")}`,
        `🚫 Cüzdanı olmayan: ${withoutWallet.toLocaleString("tr-TR")}`,
      ].join("\n")
    );
  } catch (err) {
    console.error("walletstats error:", err);
    await ctx.reply("Üzgünüm, cüzdan istatistiklerini şu anda çekemedim.");
  }
});

// /exportusers -> isim, email, cüzdan bilgileri + kayıt tarihlerini CSV olarak döndürür
bot.command("exportusers", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    // Kullanıcıları çekiyoruz
    const users = await User.find(
      {},
      { name: 1, email: 1, wallets: 1, createdAt: 1, _id: 0 }
    )
      .populate({ path: "wallets", select: "_id address type createdAt" }) // Wallet için createdAt de gelsin
      .lean();

    // Satırları hazırla
    const rows = users.map((u) => {
      const wallets = Array.isArray(u.wallets) ? u.wallets : [];
      const walletIds = wallets
        .map((w) => w?._id)
        .filter(Boolean)
        .join("; ");
      const walletAddresses = wallets
        .map((w) => (w && (w.address || w.addr || w.walletAddress)) || "")
        .filter(Boolean)
        .join("; ");
      const walletDates = wallets
        .map((w) => (w?.createdAt ? new Date(w.createdAt).toISOString() : ""))
        .filter(Boolean)
        .join("; ");

      return {
        name: u.name || "",
        email: u.email || "",
        user_created_at: u.createdAt ? new Date(u.createdAt).toISOString() : "",
        wallet_count: wallets.length,
        wallet_ids: walletIds,
        wallet_addresses: walletAddresses,
        wallet_created_at: walletDates, // birden fazla cüzdan varsa ; ile ayrılır
      };
    });

    // CSV kolonları
    const headers = [
      "name",
      "email",
      "user_created_at",
      "wallet_count",
      "wallet_ids",
      "wallet_addresses",
      "wallet_created_at",
    ];
    const csv = toCSV(rows, headers);

    // Dosya adı
    const ts = new Date();
    const yyyy = ts.getFullYear();
    const mm = String(ts.getMonth() + 1).padStart(2, "0");
    const dd = String(ts.getDate()).padStart(2, "0");
    const fileName = `users_wallets_${yyyy}${mm}${dd}.csv`;

    // Telegram'a document olarak gönder
    await ctx.replyWithDocument(
      {
        source: Buffer.from(csv, "utf-8"),
        filename: fileName,
      },
      {
        contentType: "text/csv",
        caption: "📄 Kullanıcı–Cüzdan CSV (kayıt tarihleriyle)",
      }
    );
  } catch (err) {
    console.error("exportusers error:", err);
    await ctx.reply("Üzgünüm, CSV oluşturulurken bir hata oluştu.");
  }
});

/** Metin mesajı örneği (privacy off ise) */
bot.on("text", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;
  const text = (ctx.message.text || "").trim();
  if (/merhaba/i.test(text)) {
    await ctx.reply("Merhaba! Nasıl yardımcı olabilirim?");
  }
});

/** Hata yakalama */
bot.catch((err) => {
  console.error("Telegram error", err);
});

function webhookPath() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "tg-webhook";
  return `/telegram/webhook/${secret}`;
}

/**
 * @param {import('express').Express} [app]
 */
async function initTelegram(app) {
  const isProd = process.env.NODE_ENV === "production";
  const appUrl = process.env.APP_URL;

  if (isProd && app && appUrl) {
    const path = webhookPath();
    await bot.telegram.setWebhook(`${appUrl}${path}`);
    app.use(path, webhookCallback(bot, "express"));
    console.log(`✅ Telegram webhook set: ${appUrl}${path}`);
  } else {
    await bot.launch();
    console.log("✅ Telegram bot launched with long polling");
  }

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

module.exports = {
  TelegramService: { initTelegram },
  bot, // istersen başka yerlerde de kullan
};
