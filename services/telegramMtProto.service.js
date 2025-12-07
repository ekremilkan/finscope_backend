// services/telegramMtProto.service.js
// ✅ Telegram MTProto entegrasyonu (admin olmasa da grup üyeliği doğrulaması yapar)

const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

let client;
let isConnected = false;

/**
 * .env değişkenini kontrol eder
 */
function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required but not set`);
  return value;
}

/**
 * Telegram Client oluşturur
 */
function createClient() {
  if (client) return client;

  const apiId = Number(getEnvOrThrow("TELEGRAM_API_ID"));
  const apiHash = getEnvOrThrow("TELEGRAM_API_HASH");
  const sessionString = getEnvOrThrow("TELEGRAM_SESSION");

  const stringSession = new StringSession(sessionString);
  client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  return client;
}

/**
 * Bağlantıyı başlatır (tekrar tekrar bağlanmaz)
 */
async function ensureConnected() {
  const c = createClient();
  if (!isConnected) {
    await c.connect();
    isConnected = true;
    console.log("✅ [TelegramMTProto] Client connected to Telegram");
  }
  return c;
}

/**
 * Bir gruptaki tüm kullanıcıları çeker (admin değilse public gruplarda çalışır)
 */
async function getGroupMembers(chatIdentifier, limit = 5000) {
  const c = await ensureConnected();

  try {
    const entity = await c.getEntity(chatIdentifier);
    const participants = await c.getParticipants(entity, { limit });

    return participants.map((user, index) => ({
      index: index + 1,
      id: user.id?.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username ? user.username.toLowerCase() : null,
    }));
  } catch (err) {
    console.error("[TelegramMTProto] Failed to fetch group members:", err.message);
    return [];
  }
}

/**
 * ✅ Admin olmasan bile belirli bir kullanıcı, verilen grupta mı kontrol eder
 * channels.GetParticipant → fallback olarak getParticipants
 */
async function isUserInGroup(chatIdentifier, userIdentifier) {
  const c = await ensureConnected();
  const normalize = (v) => (v || "").toString().trim().replace(/^@/, "").toLowerCase();
  const target = normalize(userIdentifier);

  try {
    const channel = await c.getEntity(chatIdentifier);
    const user = await c.getEntity(target);

    // Telegram flood limit'e saygı
    await new Promise((r) => setTimeout(r, 1000));

    // 1️⃣ İlk deneme: doğrudan participant sorgusu
    try {
      const result = await c.invoke(
        new Api.channels.GetParticipant({
          channel,
          participant: user,
        })
      );

      const isMember = !!result?.participant;
      if (isMember) {
        return { isMember: true, member: { username: target } };
      }
      return { isMember: false };
    } catch (err1) {
      // 2️⃣ Eğer admin hatası geldiyse fallback'e geç
      if (err1.errorMessage?.includes("CHAT_ADMIN_REQUIRED")) {
        console.warn(`[TelegramMTProto] ⚠️ No admin access, switching to fallback mode...`);
        const members = await getGroupMembers(chatIdentifier, 5000);

        const found = members.find(
          (m) =>
            m.username === target ||
            m.id === target ||
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(target)
        );

        return { isMember: !!found, member: found || null, totalMembers: members.length };
      }

      // Diğer hatalar
      if (err1.errorMessage?.includes("USER_NOT_PARTICIPANT")) {
        return { isMember: false };
      }

      throw err1;
    }
  } catch (err) {
    console.error(`[TelegramMTProto] Error checking user ${userIdentifier}:`, err.message);
    return { isMember: false, error: err.message };
  }
}

module.exports = {
  getGroupMembers,
  isUserInGroup,
};
