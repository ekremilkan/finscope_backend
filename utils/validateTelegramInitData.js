// utils/validateTelegramInitData.js
const crypto = require("crypto");

function validateTelegramInitData(initData, maxAgeSeconds = 300) {
  if (!initData || typeof initData !== "string") {
    return { ok: false, reason: "missing initData" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing hash" };
  params.delete("hash");

  // data_check_string
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  // 1) secret_key = HMAC_SHA256(key="WebAppData", data=botToken)
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // 2) calc hash = HMAC_SHA256(secret_key, data_check_string) hex
  const calcHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calcHash !== hash) return { ok: false, reason: "bad signature" };

  const authDateMs = Number(params.get("auth_date")) * 1000;
  if (!Number.isFinite(authDateMs))
    return { ok: false, reason: "bad auth_date" };
  if (maxAgeSeconds > 0 && Date.now() - authDateMs > maxAgeSeconds * 1000) {
    return { ok: false, reason: "expired" };
  }

  let tgUser = null;
  const userStr = params.get("user");
  if (userStr) {
    try {
      tgUser = JSON.parse(userStr);
    } catch (e) {
      /* ignore */
    }
  }

  return { ok: true, user: tgUser, params: Object.fromEntries(params) };
}

module.exports = { validateTelegramInitData };
