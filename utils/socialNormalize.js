// utils/socialNormalize.js
function normalizeHandle(v) {
  return String(v || "").replace(/^@+/, "").trim().toLowerCase();
}

function extractXHandleFromUrl(url) {
  const s = String(url || "").trim();

  // https://x.com/handle  | https://twitter.com/handle
  const m = s.match(
    /https?:\/\/(www\.)?(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})/i
  );
  return m ? normalizeHandle(m[3]) : null;
}

module.exports = { normalizeHandle, extractXHandleFromUrl };
