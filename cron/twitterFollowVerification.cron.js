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
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log("[CRON] X follow verification started at", now.toISOString());

    try {
      const campaigns = await Campaign.find({ endDate: { $lte: now } })
        .select("_id title endDate twitter_url")
        .lean();

      if (!campaigns.length) {
        console.log("[CRON] No ended campaigns to verify.");
        return;
      }

      for (const c of campaigns) {
        const already = await VerificationRun.findOne({
          campaignId: c._id,
          job: "x_follow_verify",
        })
          .select("_id")
          .lean();

        if (already) {
          console.log(`[CRON] Campaign ${c._id} already verified, skipping.`);
          continue;
        }

        try {
          console.log(`[CRON] Verifying X followers for Campaign ${c._id} (${c.title})`);
          const report = await verifyCampaignXFollowersOnce(c._id, { dryRun: false });
          console.log("[CRON] Verification report:", report);

          await VerificationRun.create({
            campaignId: c._id,
            job: "x_follow_verify",
            report,
            ranAt: new Date(),
          });
        } catch (e) {
          console.error(`[CRON] Error verifying campaign ${c._id} (${c.title}):`, e.message);
        }
      }
    } catch (e) {
      console.error("[CRON] Top-level error in X follow verification cron:", e);
    }
  });
}

module.exports = { startTwitterFollowVerificationCron };
