const { StatusCodes } = require("http-status-codes");
const UserCampaign = require("../models/userCampaign.model");

async function create(payload) {
  const { user_id, campaign_id, class: className } = payload;
  const doc = await UserCampaign.create({ user_id, campaign_id, class: className });
  return doc;
}

async function updateClass(query, payload) {
  const { user_id, campaign_id } = query;
  const { class: className } = payload;

  const updated = await UserCampaign.findOneAndUpdate(
    { user_id, campaign_id },
    { $set: { class: className } },
    { new: true }
  );

  if (!updated) {
    const err = new Error("UserCampaign not found");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  return updated;
}

async function getOne(query) {
  const { user_id, campaign_id } = query;
  const doc = await UserCampaign.findOne({ user_id, campaign_id });
  return doc;
}

module.exports = {
  create,
  updateClass,
  getOne,
};


