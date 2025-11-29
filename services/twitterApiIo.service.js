// services/twitterApiIo.service.js
const axios = require("axios");

const BASE_URL = "https://api.twitterapi.io";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function checkFollowRelationship({ sourceUserName, targetUserName }) {
  const apiKey = requireEnv("TWITTERAPI_IO_KEY");

  const res = await axios.get(
    `${BASE_URL}/twitter/user/check_follow_relationship`,
    {
      headers: { "X-API-Key": apiKey },
      params: {
        // twitterapi.io dokümanına göre param isimleri:
        // bazı örneklerde sourceUserName/targetUserName geçiyor — sendikasyonu bu şekilde yapıyoruz
        sourceUserName,
        targetUserName,
      },
      timeout: 20000,
    }
  );

  return res.data;
}

module.exports = { checkFollowRelationship };
