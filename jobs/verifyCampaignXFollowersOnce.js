// jobs/verifyCampaignXFollowersOnce.js
const Campaign = require("../models/campaign.model");
const User = require("../models/user.model");
const UserProgress = require("../models/userProgress.model");
const twitterApi = require("../services/twitterApiIo.service");
const { extractXHandleFromAny } = require("../utils/socialNormalize");

function pickFollowersArray(res) {
  return Array.isArray(res?.followers) ? res.followers : [];
}
function pickNextCursor(res) {
  return res?.next_cursor ?? res?.nextCursor ?? res?.next ?? res?.cursor ?? null;
}
function pickHasNextPage(res) {
  return res?.has_next_page ?? res?.hasNextPage ?? res?.has_next ?? null;
}

/**
 * Kampanya bitince:
 * 1) Ödül kazanan adayları UserProgress'ten alır
 * 2) Progress'te twitter.userName boşsa User modelinden çeker ve Progress'e SNAPSHOT yazar
 * 3) Campaign.twitter_url (target) follower listesinde aday userName var mı kontrol eder (paged)
 * 4) eligibleForReward + socialVerification.twitter.* alanlarını günceller
 */
async function verifyCampaignXFollowersOnce(
  campaignId,
  {
    dryRun = false,
    pageSize = 200,
    maxPages = 25,
    debug = true,
    persistTargetToProgress = true,
  } = {}
) {
  const campaign = await Campaign.findById(campaignId)
    .select("_id title endDate twitter_url")
    .lean();
  if (!campaign) throw new Error("Campaign not found");

  const now = new Date();
  if (campaign.endDate && new Date(campaign.endDate) > now) {
    throw new Error("Campaign has not ended yet");
  }

  const targetHandle = extractXHandleFromAny(campaign.twitter_url);
  if (!targetHandle) {
    return { campaignId, campaignTitle: campaign.title, skipped: true, reason: "campaign_twitter_url_invalid", dryRun };
  }

  // ✅ ÖDÜL KAZANAN ADAYLAR (senin mevcut kriterlerin)
  const candidates = await UserProgress.find({
    campaignId,
    completed: true,
    isPaymentEarned: true,
    earnedAmount: { $gt: 0 },
    eligibleForReward: true,
  })
    .select("_id userId eligibleForReward socialVerification.twitter")
    .lean();

  if (!candidates.length) {
    return {
      campaignId,
      campaignTitle: campaign.title,
      targetHandle,
      candidates: 0,
      checked: 0,
      followingTrue: 0,
      noUsername: 0,
      filledFromUser: 0,
      pagesFetched: 0,
      truncatedByMaxPages: false,
      mode: "followers_paged",
      dryRun,
    };
  }

  // 1) Progress'teki username boş olanları tespit et
  const missingUserIds = [];
  const progressUserHandle = new Map(); // progressId -> handle

  for (const p of candidates) {
    const existing = extractXHandleFromAny(p?.socialVerification?.twitter?.userName);
    if (existing) {
      progressUserHandle.set(String(p._id), existing);
    } else {
      missingUserIds.push(p.userId);
    }
  }

  // 2) Eksikleri User modelinden doldur -> UserProgress'e snapshot yaz
  let filledFromUser = 0;
  if (missingUserIds.length) {
    const users = await User.find({ _id: { $in: missingUserIds } })
      .select("social.twitter.username")
      .lean();

    const userIdToHandle = new Map();
    for (const u of users) {
      const h = extractXHandleFromAny(u?.social?.twitter?.username);
      if (h) userIdToHandle.set(String(u._id), h);
    }

    const fillBulk = [];
    for (const p of candidates) {
      const pid = String(p._id);
      if (progressUserHandle.has(pid)) continue;

      const h = userIdToHandle.get(String(p.userId)) || null;
      if (!h) continue;

      filledFromUser++;
      progressUserHandle.set(pid, h);

      if (!dryRun) {
        const $set = {
          "socialVerification.twitter.userName": h,
        };
        if (persistTargetToProgress) $set["socialVerification.twitter.targetUserName"] = targetHandle;

        fillBulk.push({
          updateOne: {
            filter: { _id: p._id },
            update: { $set },
          },
        });
      }
    }

    if (!dryRun && fillBulk.length) {
      await UserProgress.bulkWrite(fillBulk);
    }
  }

  // 3) handle -> progressIds map
  const handleToProgressIds = new Map();
  let noUsername = 0;

  for (const p of candidates) {
    const pid = String(p._id);
    const h = progressUserHandle.get(pid) || null;
    if (!h) {
      noUsername++;
      continue;
    }
    const list = handleToProgressIds.get(h) || [];
    list.push(pid);
    handleToProgressIds.set(h, list);
  }

  const remainingHandles = new Set(handleToProgressIds.keys());
  const foundProgressIdSet = new Set();

  // 4) Followers sayfa sayfa tara
  let pagesFetched = 0;
  let cursor = null;
  let truncatedByMaxPages = false;

  for (let page = 1; page <= maxPages; page++) {
    if (remainingHandles.size === 0) break;

    if (debug) {
      console.log("[XVERIFY] fetching followers", {
        page,
        pageSize,
        cursor,
        remainingHandles: remainingHandles.size,
        targetHandle,
      });
    }

    const followersRes = await twitterApi.getUserFollowers({
      userName: targetHandle,
      pageSize,
      cursor,
    });

    pagesFetched++;

    const followersArr = pickFollowersArray(followersRes);
    for (const f of followersArr) {
      const followerHandle = extractXHandleFromAny(f?.userName || f?.url || "");
      if (!followerHandle) continue;

      if (remainingHandles.has(followerHandle)) {
        const pids = handleToProgressIds.get(followerHandle) || [];
        for (const pid of pids) foundProgressIdSet.add(pid);
        remainingHandles.delete(followerHandle);
        if (remainingHandles.size === 0) break;
      }
    }

    const hasNext = pickHasNextPage(followersRes);
    const nextCursor = pickNextCursor(followersRes);

    if (debug) {
      console.log("[XVERIFY] page done", {
        page,
        gotFollowers: followersArr.length,
        foundSoFar: foundProgressIdSet.size,
        remainingHandles: remainingHandles.size,
        hasNext,
        nextCursor,
      });
    }

    if (hasNext === false) break;
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  if (remainingHandles.size > 0 && pagesFetched >= maxPages) truncatedByMaxPages = true;

  // 5) Progress güncelle
  let checked = 0;
  let followingTrue = 0;
  const bulk = [];

  for (const p of candidates) {
    const pid = String(p._id);
    const userHandle = progressUserHandle.get(pid) || null;

    if (!userHandle) {
      if (!dryRun) {
        const $set = {
          eligibleForReward: false,
          ineligibleReason: "missing_x_username",
          "socialVerification.twitter.userName": null,
          "socialVerification.twitter.isFollowing": null,
          "socialVerification.twitter.checkedAt": now,
          "socialVerification.twitter.details": { error: "missing_x_username" },
        };
        if (persistTargetToProgress) $set["socialVerification.twitter.targetUserName"] = targetHandle;

        bulk.push({ updateOne: { filter: { _id: p._id }, update: { $set } } });
      }
      continue;
    }

    checked++;
    const isFollowing = foundProgressIdSet.has(pid);
    if (isFollowing) followingTrue++;

    if (!dryRun) {
      const $set = {
        eligibleForReward: isFollowing,
        ineligibleReason: isFollowing ? null : "not_following_x",
        "socialVerification.twitter.userName": userHandle,
        "socialVerification.twitter.isFollowing": isFollowing,
        "socialVerification.twitter.checkedAt": now,
        "socialVerification.twitter.details": {
          method: "followers_paged",
          pageSize,
          maxPages,
          pagesFetched,
          truncatedByMaxPages,
        },
      };
      if (persistTargetToProgress) $set["socialVerification.twitter.targetUserName"] = targetHandle;

      bulk.push({ updateOne: { filter: { _id: p._id }, update: { $set } } });
    }
  }

  if (!dryRun && bulk.length) {
    await UserProgress.bulkWrite(bulk);
  }

  return {
    campaignId,
    campaignTitle: campaign.title,
    targetHandle,
    candidates: candidates.length,
    checked,
    followingTrue,
    noUsername,
    filledFromUser,
    pagesFetched,
    truncatedByMaxPages,
    remainingHandles: remainingHandles.size,
    mode: "followers_paged",
    dryRun,
  };
}

module.exports = { verifyCampaignXFollowersOnce };
