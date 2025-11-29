// services/twitterApiIo.service.js
const axios = require("axios");

const BASE_URL = "https://api.twitterapi.io";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function checkFollowRelationship({ source_user_name, target_user_name }) {
  const apiKey = requireEnv("TWITTERAPI_IO_KEY");

  const res = await axios.get(
    `${BASE_URL}/twitter/user/check_follow_relationship?source_user_name=${source_user_name}&target_user_name=${target_user_name}`,
    {
      headers: { "X-API-Key": apiKey },
      timeout: 10000,
    }
  );

  return res.data;
}

module.exports = { checkFollowRelationship };
