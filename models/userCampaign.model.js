const mongoose = require("mongoose");

const userCampaignSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Aynı kullanıcının aynı kampanya için tek kaydı olsun
userCampaignSchema.index({ user_id: 1, campaign_id: 1 }, { unique: true });

const UserCampaign = mongoose.model("UserCampaign", userCampaignSchema);
module.exports = UserCampaign;


