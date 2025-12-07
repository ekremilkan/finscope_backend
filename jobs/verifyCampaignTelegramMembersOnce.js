const { isUserInGroup } = require("../services/telegramMtProto.service");
const Campaign = require("../models/campaign.model");
const UserProgress = require("../models/userProgress.model");
const User = require("../models/user.model");
const VerificationRun = require("../models/verificationRun.model");

async function verifyCampaignTelegramMembersOnce(campaignId, options = {}) {
  const { dryRun = false, debug = false } = options;

  if (!campaignId) throw new Error("Campaign ID is required for Telegram verification.");

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  if (!campaign.telegram_url) {
    throw new Error("This campaign does not have a Telegram group assigned.");
  }

  const match = campaign.telegram_url.match(/(?:t\.me|telegram\.me)\/([^/]+)/);
  if (!match || !match[1]) throw new Error("Invalid Telegram group URL in campaign.");
  const groupHandle = `@${match[1]}`;

  console.log(`[TELEGRAM VERIFY] Campaign: ${campaign.title?.tr || campaign.title?.en || campaignId}`);
  console.log(`[TELEGRAM VERIFY] Group: ${groupHandle}`);

  // ✅ Ödül hak eden kullanıcılar
  const candidates = await UserProgress.find({
    campaignId,
    eligibleForReward: true,
  });

  if (!candidates.length) {
    console.log(`[TELEGRAM VERIFY] No eligible users found for this campaign.`);
    return { checked: 0, joinedCount: 0 };
  }

  console.log(`[TELEGRAM VERIFY] Found ${candidates.length} eligible users`);

  let checked = 0;
  let joinedCount = 0;
  const reportDetails = [];

  for (const progress of candidates) {
    let username = progress.socialVerification?.telegram?.userName || null;

    // Eğer boşsa user modelinden çek
    if (!username) {
  const user = await User.findById(progress.userId).select("telegram social");
  const foundUsername =
    user?.telegram?.username ||
    user?.social?.telegram?.username ||
    null;

  if (foundUsername) {
    username = foundUsername;
    if (!dryRun) {
      await UserProgress.updateOne(
        { _id: progress._id },
        { $set: { "socialVerification.telegram.userName": username } }
      );
    }
  }
}

    if (!username) {
      if (debug) console.log(`[TELEGRAM VERIFY] ⚠️ User ${progress.userId} has no Telegram username`);
      continue;
    }

    try {
      const result = await isUserInGroup(groupHandle, username);
      checked++;
      if (result.isMember) joinedCount++;

      if (debug) {
        console.log(
          `[TELEGRAM VERIFY] ${username} → ${result.isMember ? "✅ ÜYE" : "❌ DEĞİL"}`
        );
      }

      if (!dryRun) {
        await UserProgress.updateOne(
          { _id: progress._id },
          {
            $set: {
              "socialVerification.telegram.isMember": result.isMember,
              "socialVerification.telegram.checkedAt": new Date(),
              "socialVerification.telegram.details": result.member || {},
            },
          }
        );
      }

      reportDetails.push({
        userId: progress.userId,
        username,
        isMember: result.isMember,
      });

      await new Promise((r) => setTimeout(r, 1200)); // rate limit
    } catch (err) {
      console.error(`[TELEGRAM VERIFY] Error checking ${username}:`, err.message);
    }
  }

  const report = {
    campaignId,
    campaignTitle: campaign.title,
    group: groupHandle,
    checked,
    joinedCount,
    totalUsers: candidates.length,
    dryRun,
    details: reportDetails,
    createdAt: new Date(),
  };

  // ✅ artık upsert kullanıyoruz
  if (!dryRun) {
    await VerificationRun.findOneAndUpdate(
      { campaignId, job: "telegram_member_verify" },
      {
        $set: {
          ranAt: new Date(),
          report,
          triggeredBy: "admin_manual",
        },
      },
      { upsert: true, new: true }
    );
    console.log(`[ADMIN] 🗂️ VerificationRun saved (Telegram) for campaign: ${campaignId}`);
  }

  console.log(`[TELEGRAM VERIFY] ✅ Verification completed: ${joinedCount}/${checked} members joined`);
  return { checked, joinedCount, data: report };
}

module.exports = { verifyCampaignTelegramMembersOnce };
