"use strict";

const cron = require("node-cron");
const segmentationService = require("../services/segmentation.service");

const CRON_EXPR = process.env.SEGMENT_CRON_EXPR || "0 3 * * *"; // Her gün 03:00
const WINDOW_DAYS = parseInt(process.env.SEGMENT_WINDOW_DAYS || "90", 10);

async function runOnce() {
  try {
    console.log(`[segments.cron] Başladı: windowDays=${WINDOW_DAYS}`);
    const result = await segmentationService.recomputeAllUsers({ windowDays: WINDOW_DAYS });
    console.log(`[segments.cron] Tamamlandı: ${JSON.stringify(result)}`);
  } catch (err) {
    console.error("[segments.cron] Hata:", err?.message || err);
  }
}

if (process.env.RUN_ONCE === "true") {
  runOnce().then(() => process.exit(0));
} else {
  console.log(`[segments.cron] Planlandı: ${CRON_EXPR}`);
  cron.schedule(CRON_EXPR, runOnce, { timezone: process.env.CRON_TZ || "UTC" });
} 