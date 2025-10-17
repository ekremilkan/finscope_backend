"use strict";

const { getEthTransactions, getEthBalances, getLabels } = require("../utils/arkham.client");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const UserSegment = require("../models/userSegment.model");

const DEFAULT_WINDOW_DAYS = parseInt(process.env.SEGMENT_WINDOW_DAYS || "90", 10);

function daysAgoUtc(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function daysBetween(a, b) {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function meanStd(values) {
  if (!values.length) return { mean: 0, std: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

function zScore(x, mean, std) {
  if (std === 0) return 0;
  return (x - mean) / std;
}

function log1p(x) {
  return Math.log(1 + Math.max(0, x));
}

function safeNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function isCexLike(label) {
  if (!label) return false;
  const s = String(label).toLowerCase();
  return s.includes("cex") || s.includes("exchange");
}

function isLpMethod(method) {
  if (!method) return false;
  const s = String(method).toLowerCase();
  return s.includes("addliquidity") || s.includes("removeliquidity") || s.includes("mint") || s.includes("burn");
}

async function fetchUserEthIntel(userId, windowDays = DEFAULT_WINDOW_DAYS) {
  const wallets = await Wallet.find({ user: userId, network: "Ethereum" }).lean();
  const since = daysAgoUtc(windowDays);
  const until = new Date().toISOString();

  const results = [];
  for (const w of wallets) {
    const address = w.address;
    const [txs, balances, labels] = await Promise.all([
      getEthTransactions(address, { since, until }),
      getEthBalances(address),
      getLabels(address).catch(() => ({})),
    ]);
    results.push({ address, txs, balances, labels });
  }
  return results;
}

function computeWalletMetricsForOne({ txs, balances }) {
  const nowIso = new Date().toISOString();
  const txCount = Array.isArray(txs) ? txs.length : 0;
  const lastTxTime = txs && txs.length ? txs.reduce((max, t) => {
    const tTime = t.timestamp || t.time || t.blockTime || t.date;
    if (!tTime) return max;
    return new Date(tTime) > new Date(max) ? tTime : max;
  }, "1970-01-01T00:00:00Z") : null;
  const daysSinceLast = lastTxTime ? daysBetween(lastTxTime, nowIso) : 9999;
  const lambda = 0.07;
  const recency = Math.exp(-lambda * daysSinceLast);

  let dexVolumeUsd = 0;
  let uniqueProtocolsSet = new Set();
  let nonCexGoodTx = 0;
  let lpEventsCount = 0;

  for (const t of txs || []) {
    const usd = safeNumber(t.usdValue || t.valueUsd || t.amountUsd || t.usd || 0);
    dexVolumeUsd += usd;

    const proto = t.protocol || t.app || t.toLabel || t.contractLabel || t.tag;
    if (proto) uniqueProtocolsSet.add(String(proto));

    const counterparty = t.counterpartyLabel || t.toLabel || t.fromLabel || t.label;
    if (!isCexLike(counterparty)) nonCexGoodTx += 1;

    const method = t.method || t.functionName || t.fnSig;
    if (isLpMethod(method)) lpEventsCount += 1;
  }

  const nonCexRatio = txCount > 0 ? nonCexGoodTx / txCount : 0;

  // Bakiye USD toplamı
  let balanceUsd = 0;
  try {
    if (balances) {
      // 1) Dizi şeklinde
      if (Array.isArray(balances)) {
        for (const b of balances) balanceUsd += safeNumber(b.usdValue || b.usd || b.valueUsd || 0);
      }
      // 2) balances.balances dizisi
      else if (Array.isArray(balances.balances)) {
        for (const b of balances.balances) balanceUsd += safeNumber(b.usdValue || b.usd || b.valueUsd || 0);
      }
      // 3) totalBalance objesi (zincir->değer)
      else if (balances.totalBalance && typeof balances.totalBalance === "object") {
        for (const k of Object.keys(balances.totalBalance)) {
          const v = balances.totalBalance[k];
          balanceUsd += safeNumber(v);
        }
      }
      // 4) tokens/assets dizileri
      else if (Array.isArray(balances.tokens)) {
        for (const t of balances.tokens) balanceUsd += safeNumber(t.usd || t.usdValue || 0);
      } else if (Array.isArray(balances.assets)) {
        for (const a of balances.assets) balanceUsd += safeNumber(a.usd || a.usdValue || 0);
      }
    }
  } catch (_) {
    balanceUsd = 0;
  }

  const penalty = nonCexRatio < 0.3 ? 0.2 : 0.0;

  return {
    volume: dexVolumeUsd,
    txCount,
    uniqueProtocols: uniqueProtocolsSet.size,
    balanceUsd,
    recency,
    nonCex: nonCexRatio,
    penalty,
    lpEventsCount,
  };
}

function buildZScoredWalletScores(allWalletMetrics) {
  const vols = allWalletMetrics.map((w) => log1p(w.metrics.volume));
  const txs = allWalletMetrics.map((w) => w.metrics.txCount);
  const uniqP = allWalletMetrics.map((w) => w.metrics.uniqueProtocols);
  const bals = allWalletMetrics.map((w) => log1p(w.metrics.balanceUsd));
  const recs = allWalletMetrics.map((w) => w.metrics.recency);
  const nonCex = allWalletMetrics.map((w) => w.metrics.nonCex);

  const stats = {
    volume: meanStd(vols),
    txCount: meanStd(txs),
    uniqueProtocols: meanStd(uniqP),
    balanceUsd: meanStd(bals),
    recency: meanStd(recs),
    nonCex: meanStd(nonCex),
  };

  const scored = allWalletMetrics.map((w) => {
    const zv = zScore(log1p(w.metrics.volume), stats.volume.mean, stats.volume.std);
    const zt = zScore(w.metrics.txCount, stats.txCount.mean, stats.txCount.std);
    const zu = zScore(w.metrics.uniqueProtocols, stats.uniqueProtocols.mean, stats.uniqueProtocols.std);
    const zb = zScore(log1p(w.metrics.balanceUsd), stats.balanceUsd.mean, stats.balanceUsd.std);
    const zr = zScore(w.metrics.recency, stats.recency.mean, stats.recency.std);
    const zn = zScore(w.metrics.nonCex, stats.nonCex.mean, stats.nonCex.std);

    const score = 0.30 * zv + 0.20 * zt + 0.15 * zu + 0.15 * zb + 0.10 * zr + 0.10 * zn - (w.metrics.penalty || 0);

    return { ...w, z: { zv, zt, zu, zb, zr, zn }, score };
  });

  return { scored, stats };
}

function aggregateUserEthScore(walletsForUser) {
  if (!walletsForUser.length) {
    return { userScore: 0, weightBreakdown: [] };
  }
  const volSum = walletsForUser.reduce((s, w) => s + w.metrics.volume, 0);
  const txSum = walletsForUser.reduce((s, w) => s + w.metrics.txCount, 0);

  const weightsRaw = walletsForUser.map((w) => {
    const volumeShare = volSum > 0 ? w.metrics.volume / volSum : 0;
    const activityShare = txSum > 0 ? w.metrics.txCount / txSum : 0;
    const recencyWeight = w.metrics.recency;
    return 0.5 * volumeShare + 0.3 * activityShare + 0.2 * recencyWeight;
  });
  const wSum = weightsRaw.reduce((s, v) => s + v, 0) || 1;
  const weights = weightsRaw.map((w) => w / wSum);

  const userScore = walletsForUser.reduce((s, w, i) => s + w.score * weights[i], 0);
  const weightBreakdown = walletsForUser.map((w, i) => ({ address: w.address, weight: weights[i], score: w.score }));
  return { userScore, weightBreakdown };
}

function assignSegmentsByZScore(userScores) {
  const vals = userScores.map((u) => u.userScore);
  const { mean, std } = meanStd(vals);
  return userScores.map((u) => {
    const z = zScore(u.userScore, mean, std);
    let klass = "D";
    if (z >= 1.0) klass = "A";
    else if (z >= 0.0) klass = "B";
    else if (z >= -1.0) klass = "C";
    return { ...u, zScore: z, class: klass };
  });
}

async function recomputeAllUsers({ windowDays = DEFAULT_WINDOW_DAYS } = {}) {
  const users = await User.find({ role: "user" }).select("_id").lean();
  const since = daysAgoUtc(windowDays);
  const until = new Date().toISOString();

  const allWalletMetrics = [];
  const userWalletIndex = {};

  for (const u of users) {
    const intelArr = await fetchUserEthIntel(u._id, windowDays);
    userWalletIndex[u._id] = [];
    for (const entry of intelArr) {
      const metrics = computeWalletMetricsForOne({ txs: entry.txs, balances: entry.balances });
      const rec = { userId: u._id, address: entry.address, metrics };
      userWalletIndex[u._id].push(rec);
      allWalletMetrics.push(rec);
    }
  }

  const { scored } = buildZScoredWalletScores(allWalletMetrics);

  const perUser = [];
  for (const u of users) {
    const ws = scored.filter((w) => String(w.userId) === String(u._id));
    const { userScore, weightBreakdown } = aggregateUserEthScore(ws);

    const agg = ws.reduce(
      (acc, w) => {
        acc.volume += w.metrics.volume;
        acc.txCount += w.metrics.txCount;
        acc.uniqueProtocols += w.metrics.uniqueProtocols;
        acc.balanceUsd += w.metrics.balanceUsd;
        acc.recency += w.metrics.recency;
        acc.nonCex += w.metrics.nonCex;
        acc.penalty += w.metrics.penalty;
        return acc;
      },
      { volume: 0, txCount: 0, uniqueProtocols: 0, balanceUsd: 0, recency: 0, nonCex: 0, penalty: 0 }
    );
    const n = ws.length || 1;
    agg.recency = agg.recency / n;
    agg.nonCex = agg.nonCex / n;
    agg.penalty = agg.penalty / n;

    perUser.push({ userId: u._id, userScore, wallets: ws, weightBreakdown, agg });
  }

  const withSegments = assignSegmentsByZScore(perUser);

  let counts = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of withSegments) {
    counts[r.class] += 1;
    const insufficientData = r.agg.txCount === 0 && r.agg.balanceUsd === 0;
    await UserSegment.findOneAndUpdate(
      { userId: r.userId, chain: "ethereum", window: `${windowDays}d` },
      {
        $set: {
          wallets: r.weightBreakdown.map((w) => {
            const wm = r.wallets.find((x) => x.address === w.address);
            return {
              address: w.address,
              score: w.score,
              weight: w.weight,
              metrics: {
                volume: wm?.metrics.volume || 0,
                txCount: wm?.metrics.txCount || 0,
                uniqueProtocols: wm?.metrics.uniqueProtocols || 0,
                balanceUsd: wm?.metrics.balanceUsd || 0,
                recency: wm?.metrics.recency || 0,
                nonCex: wm?.metrics.nonCex || 0,
                penalty: wm?.metrics.penalty || 0,
              },
            };
          }),
          metricsAggregate: r.agg,
          compositeScore: r.userScore,
          zScore: r.zScore,
          class: r.class,
          insufficientData,
          confidence: insufficientData ? 0.3 : 0.8,
          asOf: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  return { totalUsers: users.length, counts };
}

module.exports = {
  fetchUserEthIntel,
  recomputeAllUsers,
}; 