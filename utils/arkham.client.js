"use strict";

const axios = require("axios");

// Base URL
const ARKHAM_BASE_URL = (process.env.ARKHAM_BASE_URL || "https://api.arkm.com").replace(/\/$/, "");
const ARKHAM_API_KEY = process.env.ARKHAM_API_KEY || "";

if (!ARKHAM_API_KEY) {
  console.warn("⚠️ ARKHAM_API_KEY tanımlı değil. Arkham entegrasyonu devre dışı olabilir.");
}

const client = axios.create({
  baseURL: ARKHAM_BASE_URL,
  timeout: 20000,
  headers: {
    "API-Key": ARKHAM_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function withRetry(fn, { retries = 2, backoffMs = 1000 } = {}) {
  let attempt = 0;
  while (true) {
    try { return await fn(); }
    catch (err) {
      attempt += 1;
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 405) {
        console.error("Arkham API error", status, err?.response?.data || err?.message);
      }
      const shouldRetry = status === 429 || (status >= 500 && status < 600) || !status;
      if (!shouldRetry || attempt > retries) throw err;
      await sleep(backoffMs * Math.pow(2, attempt - 1));
    }
  }
}

function toUnixSeconds(ts) {
  if (!ts) return undefined;
  const n = typeof ts === "number" ? ts : Date.parse(ts);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n / 1000);
}

// --- Docs uyumlu yardımcılar ---
async function getChains() {
  const resp = await withRetry(() => client.get(`/chains`));
  return resp.data;
}

async function getBalancesAddress(address, { chain = "eth" } = {}) {
  const resp = await withRetry(() => client.get(`/balances/address/${address}`, { params: { chain } }));
  return resp.data;
}

async function getCounterpartiesAddress(address, { chain = "eth", since, until, limit = 500, cursor } = {}) {
  const params = { chain, limit, cursor };
  const start_time = toUnixSeconds(since);
  const end_time = toUnixSeconds(until);
  if (start_time) params.start_time = start_time;
  if (end_time) params.end_time = end_time;
  const resp = await withRetry(() => client.get(`/counterparties/address/${address}`, { params }));
  return resp.data;
}

async function getFlowAddress(address, { chain = "eth", since, until } = {}) {
  const params = { chain };
  const start_time = toUnixSeconds(since);
  const end_time = toUnixSeconds(until);
  if (start_time) params.start_time = start_time;
  if (end_time) params.end_time = end_time;
  const resp = await withRetry(() => client.get(`/flow/address/${address}`, { params }));
  return resp.data;
}

async function getPortfolioAddress(address, { chain = "eth", since, until } = {}) {
  const params = { chain };
  const start_time = toUnixSeconds(since);
  const end_time = toUnixSeconds(until);
  if (start_time) params.start_time = start_time;
  if (end_time) params.end_time = end_time;
  const resp = await withRetry(() => client.get(`/portfolio/address/${address}`, { params }));
  return resp.data;
}

async function getIntelligenceAddress(address, { chain = "eth" } = {}) {
  const resp = await withRetry(() => client.get(`/intelligence/address/${address}`, { params: { chain } }));
  return resp.data;
}

// Eski isimlere proxy (segmentation servisi uyumluluğu için)
async function getEthBalances(address) {
  return getBalancesAddress(address, { chain: "eth" });
}
async function getLabels(address) {
  return getIntelligenceAddress(address, { chain: "eth" });
}
async function getEthTransactions(address, { since, until } = {}) {
  // Doğrudan transactions endpointi yerine flow’u kullanıp volume/frequency üretiriz.
  const flow = await getFlowAddress(address, { chain: "eth", since, until });
  const items = (flow.points || []).map((p) => ({ usdValue: p.usd, timestamp: p.t }));
  return items;
}

module.exports = {
  getChains,
  getBalancesAddress,
  getCounterpartiesAddress,
  getFlowAddress,
  getPortfolioAddress,
  getIntelligenceAddress,
  // Eski isimler
  getEthBalances,
  getLabels,
  getEthTransactions,
}; 