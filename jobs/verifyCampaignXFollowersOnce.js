// jobs/verifyCampaignXFollowersOnce.js

const Campaign = require("../models/campaign.model");
const User = require("../models/user.model");
const UserProgress = require("../models/userProgress.model");
const VerificationRun = require("../models/verificationRun.model");
const twitterApi = require("../services/twitterApiIo.service");
const { extractXHandleFromAny } = require("../utils/socialNormalize");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyCampaignXFollowersOnce(
  campaignId,
  { dryRun = false, debug = true, persistTargetToProgress = true } = {}
) {
  if (!campaignId) throw new Error("Campaign ID is required for Twitter verification.");

  const campaign = await Campaign.findById(campaignId)
    .select("_id title endDate twitter_url")
    .lean();
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const now = new Date();
  if (campaign.endDate && new Date(campaign.endDate) > now) {
    throw new Error("Campaign has not ended yet");
  }

  const targetHandle = extractXHandleFromAny(campaign.twitter_url);
  if (!targetHandle) {
    throw new Error("Invalid or missing twitter_url for this campaign.");
  }

  console.log(`[XVERIFY] Campaign: ${campaign.title?.tr || campaign.title?.en || campaignId}`);
  console.log(`[XVERIFY] Target Account: @${targetHandle}`);

  // ✅ Ödül kazanma potansiyeli olan kullanıcıları çek
  const candidates = await UserProgress.find({
    campaignId,
    eligibleForReward: true,
  })
    .select("_id userId eligibleForReward socialVerification.twitter")
    .lean();

  if (!candidates.length) {
    console.log(`[XVERIFY] No eligible users found for this campaign.`);
    return { checked: 0, followingTrue: 0 };
  }

  console.log(`[XVERIFY] Found ${candidates.length} eligible users`);

  let checked = 0;
  let followingTrue = 0;
  const bulk = [];
  const reportDetails = [];

  // ✅ Username eşleştirme
  const progressUserHandle = new Map();
  const missingUserIds = [];

  for (const p of candidates) {
    const handle = extractXHandleFromAny(p?.socialVerification?.twitter?.userName);
    if (handle) progressUserHandle.set(String(p._id), handle);
    else missingUserIds.push(p.userId);
  }

  if (missingUserIds.length) {
    const users = await User.find({ _id: { $in: missingUserIds } })
      .select("social.twitter.username")
      .lean();

    for (const u of users) {
      const h = extractXHandleFromAny(u?.social?.twitter?.username);
      if (!h) continue;
      const related = candidates.filter((c) => String(c.userId) === String(u._id));
      for (const rel of related) progressUserHandle.set(String(rel._id), h);
    }
  }

  // ✅ Kullanıcıları sırayla kontrol et
  for (const p of candidates) {
    const pid = String(p._id);
    const handle = progressUserHandle.get(pid);

    if (!handle) {
      if (debug)
        console.warn(`[XVERIFY] ⚠️ Skipped ${p.userId} (no twitter username)`);

      if (!dryRun) {
        bulk.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                eligibleForReward: false,
                ineligibleReason: "missing_x_username",
                "socialVerification.twitter.checkedAt": now,
                "socialVerification.twitter.details": { reason: "missing_x_username" },
              },
            },
          },
        });
      }
      continue;
    }

    checked++;
    await sleep(5500); // rate limit

    try {
      const res = await twitterApi.checkFollowRelationship({
        sourceUserName: handle,
        targetUserName: targetHandle,
      });

      const isFollowing = !!res?.isFollowing;
      if (isFollowing) followingTrue++;

      if (debug) {
        console.log(`[XVERIFY] ${handle} → ${isFollowing ? "✅ FOLLOWS" : "❌ DOES NOT FOLLOW"}`);
      }

      if (!dryRun) {
        bulk.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                eligibleForReward: isFollowing,
                ineligibleReason: isFollowing ? null : "not_following_target_x_account",
                "socialVerification.twitter.userName": handle,
                "socialVerification.twitter.isFollowing": isFollowing,
                "socialVerification.twitter.checkedAt": now,
                "socialVerification.twitter.details": { mode: "relationship_api" },
              },
            },
          },
        });
      }

      reportDetails.push({
        userId: p.userId,
        username: handle,
        isFollowing,
      });
    } catch (err) {
      console.error(`[XVERIFY] Error checking ${handle}:`, err.message);
      if (!dryRun) {
        bulk.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                eligibleForReward: false,
                ineligibleReason: "twitter_api_error",
                "socialVerification.twitter.userName": handle,
                "socialVerification.twitter.isFollowing": null,
                "socialVerification.twitter.checkedAt": now,
                "socialVerification.twitter.details": { error: err.message },
              },
            },
          },
        });
      }
      reportDetails.push({
        userId: p.userId,
        username: handle,
        isFollowing: null,
        error: err.message,
      });
    }
  }

  // ✅ MongoDB'ye toplu güncelleme
  if (!dryRun && bulk.length) {
    await UserProgress.bulkWrite(bulk);
    console.log(`[XVERIFY] Updated ${bulk.length} progress records`);
  }

  // ✅ Rapor oluştur
  const report = {
    campaignId,
    campaignTitle: campaign.title,
    targetHandle,
    checked,
    followingTrue,
    totalUsers: candidates.length,
    dryRun,
    details: reportDetails,
    createdAt: new Date(),
  };

  // ✅ VerificationRun kaydı oluştur veya güncelle
  if (!dryRun) {
    await VerificationRun.findOneAndUpdate(
      { campaignId, job: "twitter_follow_verify" },
      {
        $set: {
          ranAt: new Date(),
          report,
          triggeredBy: "admin_manual",
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[ADMIN] 🗂️ VerificationRun saved (Twitter) for campaign: ${campaignId}`);
  }

  console.log(`[XVERIFY] ✅ Verification completed: ${followingTrue}/${checked} follow target`);
  return { checked, followingTrue, data: report };
}

module.exports = { verifyCampaignXFollowersOnce };
