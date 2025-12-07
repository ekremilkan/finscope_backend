// routes/adminSocialVerify.routes.js

const router = require("express").Router();
const middlewares = require("../middlewares");
const { verifyCampaignXFollowersOnce } = require("../jobs/verifyCampaignXFollowersOnce");
const { verifyCampaignTelegramMembersOnce } = require("../jobs/verifyCampaignTelegramMembersOnce");

// ==========================
// 🐦 TWITTER FOLLOW VERIFY
// ==========================
router.post(
  "/twitter/verify-follow",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const { campaignId, dryRun } = req.body || {};

      if (!campaignId) {
        return res.status(400).json({
          success: false,
          message: "campaignId parametresi gereklidir.",
        });
      }

      console.log(`[ADMIN] 🔄 Twitter verification started for campaign: ${campaignId}`);

      const report = await verifyCampaignXFollowersOnce(campaignId, {
        dryRun: !!dryRun,
        debug: true,
      });

      return res.json({
        success: true,
        message: "Twitter takip doğrulaması tamamlandı.",
        checked: report.checked || 0,
        followingTrue: report.followingTrue || 0,
        data: report,
      });
    } catch (e) {
      console.error("[ADMIN] ❌ Twitter verification failed:", e);
      return res.status(e.status || 500).json({
        success: false,
        message: e.message || "Twitter doğrulama sırasında hata oluştu.",
      });
    }
  }
);

// ==========================
// 💬 TELEGRAM MEMBER VERIFY
// ==========================
router.post(
  "/telegram/verify-members",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const { campaignId, dryRun } = req.body || {};

      if (!campaignId) {
        return res.status(400).json({
          success: false,
          message: "campaignId parametresi gereklidir.",
        });
      }

      console.log(`[ADMIN] 🔄 Telegram verification started for campaign: ${campaignId}`);

      const report = await verifyCampaignTelegramMembersOnce(campaignId, {
        dryRun: !!dryRun,
        debug: true,
      });

      return res.json({
        success: true,
        message: "Telegram grup doğrulaması tamamlandı.",
        checked: report.checked || 0,
        joinedCount: report.joinedCount || 0,
        data: report.data,
      });
    } catch (e) {
      console.error("[ADMIN] ❌ Telegram verification failed:", e);
      return res.status(e.status || 500).json({
        success: false,
        message: e.message || "Telegram doğrulama sırasında hata oluştu.",
      });
    }
  }
);

module.exports = router;
