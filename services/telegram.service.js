// services/telegram.service.js
const { Telegraf, webhookCallback } = require("telegraf");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const Campaign = require("../models/campaign.model");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const mongoose = require("mongoose");
const WEBAPP_URL = "https://finscope.app";

// Zaman dilimi: İstanbul
const TZ = "Europe/Istanbul";

const {
  Types: { ObjectId },
} = mongoose;
const ParticipationColl = () =>
  mongoose.connection.collection("campaignparticipations");

function shortId(id) {
  const s = String(id || "");
  return s.length > 8 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

// Son N günün (bugün dahil) etiketlerini üret
function buildDateLabels(days) {
  const labels = [];
  const now = new Date();
  // günleri geçmişten bugüne doğru sırala
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    // YYYY-MM-DD
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    labels.push(`${y}-${m}-${day}`);
  }
  return labels;
}

// MongoDB'den gün bazlı kullanıcı sayıları (createdAt'e göre)
async function getDailyUserCounts(days) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1)); // bugün dahil N gün

  // Günlük grup: YYYY-MM-DD string (İstanbul TZ ile)
  const results = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: {
            date: "$createdAt",
            format: "%Y-%m-%d",
            timezone: TZ,
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Map'e çevir
  const map = new Map(results.map((r) => [r._id, r.count]));
  const labels = buildDateLabels(days);
  const data = labels.map((lbl) => map.get(lbl) || 0);

  return { labels, data };
}

// PNG grafik üret
async function renderGrowthChart({ labels, data }) {
  // Genişlik/yükseklik px
  const width = 900;
  const height = 450;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white",
  });

  const cfg = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Günlük yeni kullanıcı",
          data,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2,
          // RENK BELİRTMİYORUZ: chartjs varsayılanlarını kullan (UI kurallarına uygunluk)
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: "Günlük Yeni Kullanıcılar" },
        legend: { display: true },
      },
      scales: {
        x: { ticks: { autoSkip: true, maxRotation: 0 } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(cfg, "image/png");
  return buffer;
}

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

function fmtTR(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(date);
  }
}

function escapeMd(s = "") {
  // Telegram Markdown için basit kaçış (başlıkları normal metin olarak güvenle göstermek amacıyla)
  return String(s).replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
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

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

// /usergrowth [gün] -> Son N günün günlük kayıt grafiğini PNG olarak yollar
bot.command("usergrowth", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    // Argüman çöz (örn: /usergrowth 14)
    const parts = (ctx.message?.text || "").trim().split(/\s+/);
    let days = Number(parts[1]) || 7; // varsayılan 7 gün
    if (!Number.isFinite(days) || days < 1) days = 7;
    if (days > 180) days = 180; // sınır (çok büyük istekleri frenle)

    const { labels, data } = await getDailyUserCounts(days);
    const png = await renderGrowthChart({ labels, data });

    await ctx.replyWithPhoto(
      { source: png, filename: `user_growth_${days}d.png` },
      { caption: `📈 Son ${days} gün – Günlük yeni kullanıcılar` }
    );
  } catch (err) {
    console.error("usergrowth error:", err);
    await ctx.reply("Üzgünüm, büyüme grafiğini oluştururken hata oluştu.");
  }
});

// /health -> DB bağlantısı, uptime, memory usage raporu
bot.command("health", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    // Mongoose bağlantı bilgileri
    const st = (mongoose.connection && mongoose.connection.readyState) || 0;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    const dbState = states[st] || String(st);
    const dbName = mongoose.connection?.name || "-";
    const dbHost = mongoose.connection?.host || "-";

    // Uptime
    const up = process.uptime(); // saniye
    const upH = Math.floor(up / 3600);
    const upM = Math.floor((up % 3600) / 60);
    const upS = Math.floor(up % 60);

    // Bellek
    const mem = process.memoryUsage(); // bytes
    const fmt = (b) => `${(b / (1024 * 1024)).toFixed(1)} MB`;

    const lines = [
      "🩺 *Health Check*",
      `• DB: *${dbState}* (${dbHost}/${dbName})`,
      `• Uptime: *${upH}h ${upM}m ${upS}s*`,
      `• RSS: *${fmt(mem.rss)}*`,
      `• Heap Used: *${fmt(mem.heapUsed)}* / Heap Total: *${fmt(
        mem.heapTotal
      )}*`,
      `• External: Node ${process.version} | Env: ${
        process.env.NODE_ENV || "dev"
      }`,
    ];

    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  } catch (err) {
    console.error("health error:", err);
    await ctx.reply("Üzgünüm, health raporu alınamadı.");
  }
});

// /open -> FinScope mini app'i Telegram içinde aç
bot.command("open", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  await ctx.reply("FinScope Mini App’i açmak için butona tıkla:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔗 FinScope.app’i Aç", web_app: { url: WEBAPP_URL } }],
      ],
    },
  });
});

// /userWallet <email> -> email'e bağlı cüzdanları listeler
bot.command("userwallet", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    const parts = (ctx.message?.text || "").trim().split(/\s+/);
    const email = (parts[1] || "").toLowerCase();
    if (!email || !/@/.test(email)) {
      await ctx.reply(
        "Lütfen geçerli bir email adresi gir. Örnek: /userWallet <email>"
      );
      return;
    }

    const user = await User.findOne({ email });
    const wallets = Array.isArray(user?.wallets) ? user.wallets : [];
    if (!user) {
      await ctx.reply(`Bu email ile kayıtlı kullanıcı bulunamadı: ${email}`);
      return;
    }
    if (wallets.length === 0) {
      await ctx.reply(`Bu kullanıcının kayıtlı cüzdanı yok: ${email}`);
      return;
    }

    const lines = [
      `Kullanıcı: ${user.name || "-"} (${user.email})`,
      `Kayıt tarihi: ${
        user.createdAt ? new Date(user.createdAt).toLocaleString("tr-TR") : "-"
      }`,
      `Toplam cüzdan: ${wallets.length}`,
      ``,
      `Cüzdanlar:`,
    ];
    wallets.forEach((w, idx) => {
      lines.push(
        `${idx + 1}. [${w._id}] ${
          w.address || w.addr || w.walletAddress || "-"
        } (${w.type || "?"} - ${
          w.createdAt ? new Date(w.createdAt).toLocaleDateString("tr-TR") : "-"
        })`
      );
    });

    await ctx.reply(lines.join("\n"));
  } catch (err) {
    console.error("userwallet error:", err);
    await ctx.reply("Üzgünüm, cüzdan bilgileri alınamadı.");
  }
});

// /kampanyalar -> aktif kampanyaları inline buton olarak listeler
bot.command("campaigns", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    const now = new Date();

    // Aktif + tarih penceresi içinde olanları getir
    const campaigns = await Campaign.find(
      {
        isActive: true,
      },
      { title: 1 }
    )
      .sort({ createdAt: -1 })
      .lean();

    if (!campaigns || campaigns.length === 0) {
      await ctx.reply("Şu anda görüntülenebilir bir kampanya bulunamadı.");
      return;
    }
    const inline_keyboard = campaigns.map((c) => [
      { text: c.title || "Adsız Kampanya", callback_data: `cmp:${c._id}` },
    ]);
    await ctx.reply("Mevcut kampanyalar:", {
      reply_markup: { inline_keyboard },
    });
  } catch (err) {
    console.error("kampanyalar error:", err);
    await ctx.reply("Üzgünüm, kampanyalar listesi şu anda getirilemedi.");
  }
});

// /campaignwinners -> kampanyaları inline butonlarla listeler, tıklanınca kazananları döker
bot.command("campaignwinners", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    const campaigns = await Campaign.find({ isActive: true }, { title: 1 })
      .sort({ createdAt: -1 })
      .lean();

    if (!campaigns || campaigns.length === 0) {
      await ctx.reply("Şu anda listelenecek aktif kampanya bulunamadı.");
      return;
    }

    const inline_keyboard = campaigns.map((c) => [
      { text: c.title || "Adsız Kampanya", callback_data: `win:${c._id}` },
    ]);

    await ctx.reply("Kazananlarını görmek istediğin kampanyayı seç:", {
      reply_markup: { inline_keyboard },
    });
  } catch (err) {
    console.error("campaignwinners error:", err);
    await ctx.reply("Üzgünüm, kampanyalar getirilemedi.");
  }
});

// /exportcampaignwinners -> kampanyaları inline butonlarla listeler, tıklanınca kazananları CSV olarak gönderir
bot.command("exportcampaignwinners", async (ctx) => {
  if (!isAllowedChat(ctx.chat?.id)) return;

  try {
    const campaigns = await Campaign.find({ isActive: true }, { title: 1 })
      .sort({ createdAt: -1 })
      .lean();

    if (!campaigns || campaigns.length === 0) {
      await ctx.reply("Şu anda listelenecek aktif kampanya bulunamadı.");
      return;
    }

    const inline_keyboard = campaigns.map((c) => [
      { text: c.title || "Adsız Kampanya", callback_data: `wincsv:${c._id}` },
    ]);

    await ctx.reply(
      "Kazananlarını CSV olarak indirmek istediğin kampanyayı seç:",
      { reply_markup: { inline_keyboard } }
    );
  } catch (err) {
    console.error("exportcampaignwinners error:", err);
    await ctx.reply("Üzgünüm, kampanyalar getirilemedi.");
  }
});

// Kampanya detaylarını döndür (inline buton callback)
bot.on("callback_query", async (ctx) => {
  try {
    const data = ctx.callbackQuery?.data || "";
    // --- winners akışı ---
    if (data.startsWith("win:")) {
      if (!isAllowedChat(ctx.chat?.id)) {
        await ctx.answerCbQuery("Bu sohbet için yetkin yok.");
        return;
      }

      const id = data.split(":")[1];
      if (!id || !ObjectId.isValid(id)) {
        await ctx.answerCbQuery("Geçersiz kampanya.");
        return;
      }

      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        await ctx.answerCbQuery("Kampanya bulunamadı.");
        return;
      }

      await ctx.answerCbQuery();

      const title = escapeHtml(campaign.title || "Kampanya");
      if (campaign.company_logo) {
        try {
          await ctx.replyWithPhoto(campaign.company_logo, {
            caption: `<b>${title}</b>\nKazananlar`,
            parse_mode: "HTML",
          });
        } catch {
          await ctx.reply(`<b>${title}</b>\nKazananlar`, {
            parse_mode: "HTML",
          });
        }
      } else {
        await ctx.reply(`<b>${title}</b>\nKazananlar`, { parse_mode: "HTML" });
      }

      const segments = Array.isArray(campaign.segments)
        ? campaign.segments
        : [];
      if (segments.length === 0) {
        await ctx.reply("Bu kampanya için segment tanımı yok.");
        return;
      }

      for (const seg of segments) {
        const segName = seg?.name ?? "-";
        const reward = seg?.reward ?? "-";
        const limit = Number(seg?.maxParticipants ?? 0) || 0;

        if (limit <= 0) {
          await ctx.reply(
            `<b>Segment ${escapeHtml(
              segName
            )}</b>\nSeçim limiti tanımlı değil.`,
            { parse_mode: "HTML" }
          );
          continue;
        }

        const pipeline = [
          {
            $match: {
              campaignId: new ObjectId(id),
              segment: segName,
              eligibleForReward: true,
              status: "completed",
            },
          },
          { $sort: { completedAt: 1, timeSpent: 1 } },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: 1,
              joinedAt: 1,
              completedAt: 1,
              timeSpent: 1,
              name: "$user.name",
              email: "$user.email",
            },
          },
        ];

        let winners = [];
        try {
          winners = await ParticipationColl().aggregate(pipeline).toArray();
        } catch (e) {
          console.error("winners aggregate error:", e);
          await ctx.reply(
            `<b>Segment ${escapeHtml(segName)}</b>\nKazananlar getirilemedi.`,
            { parse_mode: "HTML" }
          );
          continue;
        }

        if (!winners.length) {
          await ctx.reply(
            `<b>Segment ${escapeHtml(segName)}</b>\nUygun kazanan bulunamadı.`,
            { parse_mode: "HTML" }
          );
          continue;
        }

        const lines = [
          `<b>Segment ${escapeHtml(segName)}</b> — Ödül: ${escapeHtml(
            String(reward)
          )} — Limit: ${limit}`,
          ``,
        ];

        winners.forEach((w, idx) => {
          const nm = escapeHtml(w?.name || "-");
          const em = escapeHtml(w?.email || "-");
          const uid = escapeHtml(String(w?.userId || "-"));
          const comp = fmtTR(w?.completedAt);
          const tSpent =
            typeof w?.timeSpent === "number" ? `${w.timeSpent}s` : "-";
          lines.push(
            `${
              idx + 1
            }. ${nm} (${em}) — ID: <code>${uid}</code> — Tamam: ${escapeHtml(
              comp
            )} — Süre: ${escapeHtml(tSpent)}`
          );
        });

        await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
      }

      return;
    }
    if (data.startsWith("wincsv:")) {
      if (!isAllowedChat(ctx.chat?.id)) {
        await ctx.answerCbQuery("Bu sohbet için yetkin yok.");
        return;
      }

      const id = data.split(":")[1];
      if (!id || !ObjectId.isValid(id)) {
        await ctx.answerCbQuery("Geçersiz kampanya.");
        return;
      }

      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        await ctx.answerCbQuery("Kampanya bulunamadı.");
        return;
      }

      await ctx.answerCbQuery();

      const segments = Array.isArray(campaign.segments)
        ? campaign.segments
        : [];
      if (segments.length === 0) {
        await ctx.reply("Bu kampanya için segment tanımı yok.");
        return;
      }

      const allRows = []; // CSV satırları

      for (const seg of segments) {
        const segName = seg?.name ?? "-";
        const reward = seg?.reward ?? "-";
        const limit = Number(seg?.maxParticipants ?? 0) || 0;

        if (limit <= 0) {
          // limit tanımlı değilse atla
          continue;
        }

        // winners + user + wallet lookup
        const pipeline = [
          {
            $match: {
              campaignId: new ObjectId(id),
              segment: segName,
              eligibleForReward: true,
              status: "completed",
            },
          },
          { $sort: { completedAt: 1, timeSpent: 1 } },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "wallets",
              let: { wids: "$user.wallets" },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ["$_id", { $ifNull: ["$$wids", []] }] },
                  },
                },
                { $project: { address: 1, type: 1, createdAt: 1 } },
              ],
              as: "walletDocs",
            },
          },
          {
            $project: {
              _id: 0,
              segment: 1,
              joinedAt: 1,
              completedAt: 1,
              timeSpent: 1,
              userId: 1,
              userName: "$user.name",
              userEmail: "$user.email",
              walletDocs: 1,
            },
          },
        ];

        let winners = [];
        try {
          winners = await ParticipationColl().aggregate(pipeline).toArray();
        } catch (e) {
          console.error("wincsv aggregate error:", e);
          continue;
        }

        for (const w of winners) {
          const walletCount = Array.isArray(w.walletDocs)
            ? w.walletDocs.length
            : 0;
          const walletAddresses = (w.walletDocs || [])
            .map((wd) => wd?.address)
            .filter(Boolean)
            .join("; ");
          const walletTypes = (w.walletDocs || [])
            .map((wd) => wd?.type || "")
            .filter(Boolean)
            .join("; ");
          // DÜZELTME: wd.createdAt kullanılmalı
          const walletCreatedAt = (w.walletDocs || [])
            .map((wd) =>
              wd?.createdAt ? new Date(wd.createdAt).toISOString() : ""
            )
            .filter(Boolean)
            .join("; ");

          allRows.push({
            segment: segName,
            reward: String(reward ?? ""),
            user_name: w.userName || "",
            user_email: w.userEmail || "",
            user_id: String(w.userId || ""),
            joined_at_tr: fmtTR(w.joinedAt),
            joined_at_iso: w.joinedAt ? new Date(w.joinedAt).toISOString() : "",
            completed_at_tr: fmtTR(w.completedAt),
            completed_at_iso: w.completedAt
              ? new Date(w.completedAt).toISOString()
              : "",
            time_spent_seconds:
              typeof w.timeSpent === "number" ? w.timeSpent : "",
            wallet_count: walletCount,
            wallet_addresses: walletAddresses,
            wallet_types: walletTypes,
            wallet_created_at_iso: walletCreatedAt,
          });
        }
      }

      if (allRows.length === 0) {
        await ctx.reply("Bu kampanya için uygun kazanan bulunamadı.");
        return;
      }

      // CSV kolon başlıkları
      const headers = [
        "segment",
        "reward",
        "user_name",
        "user_email",
        "user_id",
        "joined_at_tr",
        "joined_at_iso",
        "completed_at_tr",
        "completed_at_iso",
        "time_spent_seconds",
        "wallet_count",
        "wallet_addresses",
        "wallet_types",
        "wallet_created_at_iso",
      ];

      const csv = toCSV(allRows, headers);

      const ts = new Date();
      const yyyy = ts.getFullYear();
      const mm = String(ts.getMonth() + 1).padStart(2, "0");
      const dd = String(ts.getDate()).padStart(2, "0");
      const safeTitle = (campaign.title || "campaign").replace(
        /[^\p{L}\p{N}_-]+/gu,
        "_"
      );
      const filename = `winners_${safeTitle}_${yyyy}${mm}${dd}.csv`;

      await ctx.replyWithDocument(
        {
          source: Buffer.from(csv, "utf-8"),
          filename,
        },
        {
          contentType: "text/csv",
          caption: `📄 ${
            campaign.title || "Kampanya"
          } – Kazananlar (cüzdan bilgileriyle, CSV)`,
        }
      );

      return;
    }
    if (!data.startsWith("cmp:")) return;

    if (!isAllowedChat(ctx.chat?.id)) {
      await ctx.answerCbQuery("Bu sohbet için yetkin yok.");
      return;
    }

    const id = data.split(":")[1];
    if (!id) {
      await ctx.answerCbQuery("Geçersiz kampanya.");
      return;
    }

    const c = await Campaign.findById(id).lean();
    if (!c) {
      await ctx.answerCbQuery("Kampanya bulunamadı.");
      return;
    }

    // Segment metinleri (yalın, kısa)
    const segLines = (Array.isArray(c.segments) ? c.segments : []).map((s) => {
      const name = escapeHtml(s?.name ?? "-");
      const reward = escapeHtml(String(s?.reward ?? "-"));
      const curP = escapeHtml(String(s?.currentParticipants ?? 0));
      const maxP = escapeHtml(String(s?.maxParticipants ?? "-"));
      return `• <b>${name}</b> — Katılımcı: ${curP}/${maxP} — Ödül: ${reward}`;
    });

    // Önce callback spinner'ı kapat
    await ctx.answerCbQuery();

    // 1) LOGO (varsa) + kısa caption (sadece başlık)
    const title = escapeHtml(c.title || "Kampanya");
    if (c.company_logo) {
      try {
        await ctx.replyWithPhoto(c.company_logo, {
          caption: `<b>${title}</b>`,
          parse_mode: "HTML",
        });
      } catch (e) {
        // Logo URL’i erişilemezse düz metin başlık gönder
        console.warn(
          "Logo fetch failed, sending text title instead:",
          e?.message
        );
        await ctx.reply(`<b>${title}</b>`, { parse_mode: "HTML" });
      }
    } else {
      await ctx.reply(`<b>${title}</b>`, { parse_mode: "HTML" });
    }

    // 2) Segment detayları (ayrı mesaj)
    if (segLines.length) {
      const body = ["<b>Segmentler</b>", ...segLines].join("\n");
      await ctx.reply(body, { parse_mode: "HTML" });
    } else {
      await ctx.reply("Bu kampanya için segment bilgisi bulunamadı.");
    }
  } catch (err) {
    console.error("kampanya detay error:", err);
    try {
      await ctx.answerCbQuery("Kampanya detayları getirilemedi.");
    } catch {}
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
  } else {
    await bot.launch();
  }

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

module.exports = {
  TelegramService: { initTelegram },
  bot, // istersen başka yerlerde de kullan
};
