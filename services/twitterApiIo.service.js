// services/twitterApiIo.service.js
const axios = require("axios");

const BASE_URL = "https://api.twitterapi.io";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/**
 * twitter/user/check_follow_relationship
 * Standardize: isFollowing: boolean, raw: apiBody
 */
async function checkFollowRelationship({ sourceUserName, targetUserName }) {
  const apiKey = requireEnv("TWITTERAPI_IO_KEY");

  try {
    const res = await axios.get(
      `${BASE_URL}/twitter/user/check_follow_relationship`,
      {
        params: {
          source_user_name: sourceUserName,
          target_user_name: targetUserName,
        },
        headers: { "X-API-Key": apiKey },
        timeout: 10000,
      }
    );

    const body = res.data;

    // twitterapi.io cevabı genelde:
    // { data: { following: true, followed_by: false } }
    const followingRaw =
      body?.data?.following ??
      body?.data?.is_following ??
      body?.following ??
      body?.isFollowing ??
      false;

    return {
      isFollowing: !!followingRaw,
      raw: body,
    };
  } catch (e) {
    console.error("[twitterapi.io] checkFollowRelationship error:", {
      status: e?.response?.status,
      data: e?.response?.data,
      message: e?.message,
    });
    throw e;
  }
}

module.exports = {
  checkFollowRelationship,
};
