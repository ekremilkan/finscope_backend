// services/twitterApiIo.service.js
const axios = require("axios");

const BASE_URL = "https://api.twitterapi.io";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/**
 * twitter/user/followers
 * params: userName, pageSize, cursor(optional)
 */
async function getUserFollowers({ userName, cursor = null, pageSize = 200 }) {
  const apiKey = requireEnv("TWITTERAPI_IO_KEY");

  try {
    const res = await axios.get(`${BASE_URL}/twitter/user/followers`, {
      params: {
        userName,
        pageSize,
        ...(cursor ? { cursor } : {}),
      },
      headers: { "X-API-Key": apiKey },
      timeout: 15000,
    });

    return res.data;
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error("[twitterapi.io] getUserFollowers error:", {
      status,
      data,
      message: e?.message,
    });
    throw e;
  }
}

module.exports = { getUserFollowers };
