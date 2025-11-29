// jobs/verifyCampaignXFollowersOnce.js
const Campaign = require("../models/campaign.model");
const User = require("../models/user.model");
const UserProgress = require("../models/userProgress.model");
const twitterApi = require("../services/twitterApiIo.service");
const { normalizeHandle, extractXHandleFromUrl } = require("../utils/socialNormalize");

/**
 * Kampanya bitince 1 kere çalışır:
 * - ödül kazanmış (kota) kullanıcılar için X follow doğrular
 * - UserProgress.eligibleForReward alanını follow sonucuna göre günceller
 */
async function verifyCampaignXFollowersOnce(campaignId, { dryRun = false } = {}) {
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) throw new Error("Campaign not found");

  const now = new Date();
  if (campaign.endDate && new Date(campaign.endDate) > now) {
    throw new Error("Campaign has not ended yet");
  }

  const targetHandle = extractXHandleFromUrl(campaign.twitter_url);
  if (!targetHandle) {
    throw new Error("Campaign twitter_url invalid, cannot extract X handle");
  }

  // ✅ ÖDÜL KAZANAN ADAYLAR (completeQuiz ile UYUMLU):
  // - completed true
  // - kota kazandı => isPaymentEarned true
  // - earnedAmount > 0
  const progresses = await UserProgress.find({
    campaignId,
    completed: true,
    isPaymentEarned: true,
    earnedAmount: { $gt: 0 },
  })
    .select("_id userId earnedAmount eligibleForReward socialVerification")
    .lean();

  const userIds = progresses.map((p) => p.userId);
  if (!userIds.length) {
    return {
      campaignId,
      campaignTitle: campaign.title,
      targetHandle,
      candidates: 0,
      checked: 0,
      followingTrue: 0,
      noUsername: 0,
      dryRun,
    };
  }

  const users = await User.find({ _id: { $in: userIds } })
    .select("_id social.twitter.username")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const progressMap = new Map(progresses.map((p) => [String(p.userId), p]));

  let checked = 0;
  let followingTrue = 0;
  let noUsername = 0;

  const bulkProgress = [];
  const bulkUsers = [];

  for (const uid of userIds) {
    const u = userMap.get(String(uid));
    const p = progressMap.get(String(uid));
    if (!u || !p) continue;

    const sourceHandle = normalizeHandle(u?.social?.twitter?.username);

    // Username yoksa => final eligibility false
    if (!sourceHandle) {
      noUsername++;

      if (!dryRun) {
        bulkProgress.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                eligibleForReward: false,
                ineligibleReason: "missing_x_username",
                "socialVerification.twitter": {
                  targetUserName: targetHandle,
                  userName: null,
                  isFollowing: null,
                  checkedAt: new Date(),
                  details: { error: "missing_x_username" },
                },
              },
            },
          },
        });

        bulkUsers.push({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { "social.twitter.isFollowing": false } },
          },
        });
      }
      continue;
    }

    checked++;

    try {
      const apiRes = await twitterApi.checkFollowRelationship({
        source_user_name: sourceHandle,
        target_user_name: targetHandle,
      });

      const following = !!apiRes?.data?.following;
      const followedBy = !!apiRes?.data?.followed_by;

      if (following) followingTrue++;

      if (!dryRun) {
        bulkProgress.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                // ✅ final eligibility: takip ediyorsa true
                eligibleForReward: following,
                ineligibleReason: following ? null : "not_following_x",
                "socialVerification.twitter": {
                  targetUserName: targetHandle,
                  userName: sourceHandle,
                  isFollowing: following,
                  checkedAt: new Date(),
                  details: apiRes,
                },
              },
            },
          },
        });

        bulkUsers.push({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { "social.twitter.isFollowing": following } },
          },
        });
      }
    } catch (e) {
      if (!dryRun) {
        bulkProgress.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                eligibleForReward: false,
                ineligibleReason: "x_api_error",
                "socialVerification.twitter": {
                  targetUserName: targetHandle,
                  userName: sourceHandle,
                  isFollowing: false,
                  checkedAt: new Date(),
                  details: { error: e?.message || "x_api_error" },
                },
              },
            },
          },
        });

        bulkUsers.push({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { "social.twitter.isFollowing": false } },
          },
        });
      }
    }
  }

  if (!dryRun) {
    if (bulkProgress.length) await UserProgress.bulkWrite(bulkProgress);
    if (bulkUsers.length) await User.bulkWrite(bulkUsers);
  }

  return {
    campaignId,
    campaignTitle: campaign.title,
    targetHandle,
    candidates: userIds.length,
    checked,
    followingTrue,
    noUsername,
    dryRun,
  };
}

module.exports = { verifyCampaignXFollowersOnce };
