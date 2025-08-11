"use strict";

const mongoose = require("mongoose");
const User = require("../../models/user.model");
const Wallet = require("../../models/wallet.model");
const UserSegment = require("../../models/userSegment.model");

jest.mock("../../utils/arkham.client", () => {
  return {
    getEthTransactions: jest.fn(async (address) => {
      // Adrese göre farklı hacim üretelim
      const now = new Date();
      const iso = now.toISOString();
      const tx = (usd) => ({ usdValue: usd, timestamp: iso, method: "swap" });
      switch (address) {
        case "0xuser1a":
          return [tx(500), tx(400), tx(300)]; // yüksek hacim
        case "0xuser1b":
          return [tx(200), tx(100)];
        case "0xuser2a":
          return [tx(20), tx(10)]; // düşük hacim
        default:
          return [];
      }
    }),
    getEthBalances: jest.fn(async (address) => {
      const val = address.startsWith("0xuser1") ? 1000 : 50;
      return [{ usdValue: val }];
    }),
    getLabels: jest.fn(async () => ({ labels: [] })),
  };
});

const { recomputeAllUsers } = require("../../services/segmentation.service");

describe("Segmentation service (ETH demo)", () => {
  beforeAll(async () => {
    // DB bağlantısı tests/setup.js tarafından yapılır
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await UserSegment.deleteMany({});
  });

  it("only role=user accounts are segmented, and segments are created", async () => {
    // Seed users
    const u1 = await User.create({
      name: "Test User One",
      email: "u1@example.com",
      password: "Aa123456!",
      role: "user",
      isVerified: true,
    });
    const u2 = await User.create({
      name: "Test User Two",
      email: "u2@example.com",
      password: "Aa123456!",
      role: "user",
      isVerified: true,
    });
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "Aa123456!",
      role: "admin",
      isVerified: true,
    });

    // Seed wallets (Ethereum)
    await Wallet.create([
      { user: u1._id, network: "Ethereum", address: "0xuser1a" },
      { user: u1._id, network: "Ethereum", address: "0xuser1b" },
      { user: u2._id, network: "Ethereum", address: "0xuser2a" },
      { user: admin._id, network: "Ethereum", address: "0xadmin1" },
    ]);

    const result = await recomputeAllUsers({ windowDays: 90 });
    expect(result.totalUsers).toBe(2); // sadece role=user

    const docs = await UserSegment.find({ chain: "ethereum", window: "90d" }).lean();
    expect(docs.length).toBe(2);
    const userIds = docs.map((d) => String(d.userId));
    expect(userIds).toContain(String(u1._id));
    expect(userIds).toContain(String(u2._id));

    // Admin için segment yok
    const adminSeg = await UserSegment.findOne({ userId: admin._id, chain: "ethereum", window: "90d" });
    expect(adminSeg).toBeNull();

    // Skorların sayısal olması ve sınıfların atanması
    docs.forEach((d) => {
      expect(typeof d.compositeScore).toBe("number");
      expect(["A", "B", "C", "D"]).toContain(d.class);
    });
  });
}); 