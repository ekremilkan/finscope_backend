const router = require("express").Router();
const middlewares = require("../middlewares");
const { verifyCampaignXFollowersOnce } = require("../jobs/verifyCampaignXFollowersOnce");

// Örn: POST /api/v1/admin/campaigns/:campaignId/verify-x?dryRun=1
router.post(
  "/admin/campaigns/:campaignId/verify-x",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin, // sende ismi farklıysa değiştir
  async (req, res) => {
    try {
      const { campaignId } = req.params;
      const dryRun = String(req.query.dryRun || "0") === "1";

      const report = await verifyCampaignXFollowersOnce(campaignId, { dryRun });
      return res.json({ success: true, data: report });
    } catch (e) {
      return res.status(e.status || 500).json({
        success: false,
        message: e.message,
        detail: e.detail,
      });
    }
  }
);

module.exports = router;
