// utils/socialNormalize.js
function normalizeHandle(v) {
  return String(v || "").replace(/^@+/, "").trim().toLowerCase();
}

function extractXHandleFromUrl(url) {
  const s = String(url || "").trim();
  if (!s) return null;

  // https://x.com/handle  | https://twitter.com/handle
  // /handle/... veya ?query vb devamları tolere eder
  const m = s.match(
    /https?:\/\/(www\.)?(x\.com|twitter\.com)\/@?([A-Za-z0-9_]{1,15})(?:[/?#]|$)/i
  );
  return m ? normalizeHandle(m[3]) : null;
}

function extractXHandleFromAny(input) {
  const s = String(input || "").trim();
  if (!s) return null;

  // URL (protokollü)
  let h = extractXHandleFromUrl(s);
  if (h) return h;

  // URL (protokolsüz): x.com/abc gibi
  if (/^(www\.)?(x\.com|twitter\.com)\//i.test(s)) {
    h = extractXHandleFromUrl(`https://${s}`);
    if (h) return h;
  }

  // "@handle" veya "handle"
  const candidate = normalizeHandle(s);
  if (/^[a-z0-9_]{1,15}$/.test(candidate)) return candidate;

  return null;
}

module.exports = {
  normalizeHandle,
  extractXHandleFromUrl,
  extractXHandleFromAny,
};
