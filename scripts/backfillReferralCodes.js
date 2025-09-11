// scripts/backfillReferralCodes.js
require("dotenv").config();
const mongoose = require("mongoose");

// MODELİN DOĞRU YOLDAN İTHAL EDİLDİĞİNDEN EMİN OL
const User = require("../models/user.model"); // kendi projenin yoluna göre düzelt

const MONGODB_URI = process.env.DB_URI || process.env.DATABASE_URL;

function baseCodeFromId(id, len = 8) {
  return id.toString().slice(-len).toUpperCase();
}

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI (veya DATABASE_URL) bulunamadı.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, {});

  // Index yoksa oluştur (prod'da autoIndex kapalı olabilir)
  await User.collection.createIndex(
    { referralCode: 1 },
    { unique: true, sparse: true }
  );

  const filter = {
    $or: [
      { referralCode: { $exists: false } },
      { referralCode: null },
      { referralCode: "" },
    ],
  };

  const cursor = User.find(filter).lean().cursor();

  let processed = 0;
  let updated = 0;

  for await (const u of cursor) {
    processed++;

    let code = baseCodeFromId(u._id, 8);
    let attempts = 0;

    // Çok düşük ihtimal çakışma kontrolü (önleyici)
    // Mevcutsa birkaç alternatif dene
    // Not: exists çağrısı indeks üzerinden hızlıdır
    while (await User.exists({ referralCode: code })) {
      attempts++;
      // farklı dilimler dene
      const idStr = u._id.toString().toUpperCase();
      if (attempts === 1) code = idStr.slice(8, 16);
      else if (attempts === 2) code = idStr.slice(4, 12);
      else {
        // son çare: 6 + random 2 hex
        code =
          idStr.slice(-6) +
          Math.random().toString(16).slice(2, 4).toUpperCase();
      }
    }

    try {
      await User.updateOne({ _id: u._id }, { $set: { referralCode: code } });
      updated++;
    } catch (e) {
      // eşzamanlı yarış/unique hatası olursa bir kez daha alternatif dene
      if (e?.code === 11000) {
        const fallback =
          baseCodeFromId(u._id, 6) +
          Math.random().toString(16).slice(2, 4).toUpperCase();
        await User.updateOne(
          { _id: u._id },
          { $set: { referralCode: fallback } }
        );
        updated++;
      } else {
        console.error(`Kullanıcı ${u._id} güncellenemedi:`, e.message);
      }
    }

    if (processed % 500 === 0) {
      console.log(`İşlenen: ${processed}, güncellenen: ${updated}`);
    }
  }

  console.log(`BİTTİ. Toplam işlenen: ${processed}, güncellenen: ${updated}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
