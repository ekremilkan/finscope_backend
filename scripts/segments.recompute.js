"use strict";

require("dotenv").config();

const segmentationService = require("../services/segmentation.service");
const mongoose = require("mongoose");
const db = require("../db/index");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");

function getArg(name, def) {
  const idx = process.argv.findIndex((a) => a.startsWith(`--${name}=`));
  if (idx === -1) return def;
  const [_, v] = process.argv[idx].split("=");
  return v ?? def;
}

async function ensureDbConnection() {
  if (process.env.USE_INMEM_DB === "true") {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    return { type: "memory", server: mongoServer };
  }
  await db.mongooseConnection.connectMongoDB();
  return { type: "external" };
}

async function closeDb(connInfo) {
  if (connInfo?.type === "memory") {
    await mongoose.disconnect();
    await connInfo.server.stop();
  }
}

async function seedIfRequested() {
  const seed = String(getArg("seed", "false")) === "true";
  if (!seed) return;

  await User.deleteMany({ email: { $in: ["u1@example.com", "u2@example.com", "admin@example.com"] } });
  await Wallet.deleteMany({ address: { $in: ["0xuser1a", "0xuser1b", "0xuser2a", "0xadmin1"] } });

  const u1 = await User.create({ name: "Test User One", email: "u1@example.com", password: "Aa123456!", role: "user", isVerified: true });
  const u2 = await User.create({ name: "Test User Two", email: "u2@example.com", password: "Aa123456!", role: "user", isVerified: true });
  const admin = await User.create({ name: "Admin User", email: "admin@example.com", password: "Aa123456!", role: "admin", isVerified: true });

  await Wallet.create([
    { user: u1._id, network: "Ethereum", address: "0xuser1a" },
    { user: u1._id, network: "Ethereum", address: "0xuser1b" },
    { user: u2._id, network: "Ethereum", address: "0xuser2a" },
    { user: admin._id, network: "Ethereum", address: "0xadmin1" },
  ]);
}

(async () => {
  let connInfo = null;
  try {
    const chain = getArg("chain", "ethereum");
    if (chain !== "ethereum") {
      console.warn("Demo sürümde yalnızca ethereum destekleniyor. Varsayılan: ethereum");
    }
    const period = String(getArg("period", `${process.env.SEGMENT_WINDOW_DAYS || 90}d`));
    const windowDays = parseInt(period.replace("d", ""), 10) || 90;

    connInfo = await ensureDbConnection();
    await seedIfRequested();

    console.log(`Recompute başlıyor. chain=${chain}, windowDays=${windowDays}, db=${connInfo.type}`);
    const result = await segmentationService.recomputeAllUsers({ windowDays });
    console.log("Recompute tamamlandı:", JSON.stringify(result));
  } catch (err) {
    console.error("Recompute hata:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await closeDb(connInfo);
  }
})(); 