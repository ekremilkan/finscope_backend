// cron/twitterFollowVerification.cron.js
const cron = require("node-cron");
const Campaign = require("../models/campaign.model");
const VerificationRun = require("../models/verificationRun.model");
const { verifyCampaignXFollowersOnce } = require("../jobs/verifyCampaignXFollowersOnce");

/**
 * - 15 dakikada bir
 * - endDate geçmiş kampanyaları bulur
 * - aynı campaign için daha önce koşmadıysa 1 kere doğrular
 */
function startTwitterFollowVerificationCron() {
  cron.schedule("*/60 * * * *", async () => {
    try {
      const now = new Date();
      console.log("[CRON] X follow verification started at", now.toISOString());

      const endedCampaigns = await Campaign.find({
        endDate: { $lte: now },
        twitter_url: { $exists: true, $ne: null },
      })
        .select("_id title endDate twitter_url")
        .lean();

      for (const c of endedCampaigns) {
        try {
          const already = await VerificationRun.findOne({
            campaignId: c._id,
            job: "x_follow_verify",
          }).lean();

          if (already) continue;

          const report = await verifyCampaignXFollowersOnce(c._id, {
  dryRun: false,
  pageSize: 200,
  maxPages: 25, // örnek: 25 sayfa = 5000 follower tarar
});


          await VerificationRun.create({
            campaignId: c._id,
            job: "x_follow_verify",
            report,
            ranAt: new Date(),
          });

          console.log(`[CRON] Verified campaign ${c._id} (${c.title})`, report);
        } catch (e) {
          console.error(
            `[CRON] Error verifying campaign ${c._id} (${c.title}):`,
            e?.message
          );
        }
      }
    } catch (e) {
      console.error("[CRON] Top-level error in X follow verification cron:", e);
    }
  });
}

module.exports = { startTwitterFollowVerificationCron };
