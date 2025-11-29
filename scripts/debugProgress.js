require("dotenv").config();
const mongoose = require("mongoose");
const UserProgress = require("../models/userProgress.model"); // path sende farklıysa düzelt

(async () => {
  try {
    await mongoose.connect(process.env.DB_URI); // sende uri farklı env ismi olabilir
    const cid = new mongoose.Types.ObjectId("68f3bed4e623464eb9200391");

    console.log("all:", await UserProgress.countDocuments({ campaignId: cid }));
    console.log(
      "completed:",
      await UserProgress.countDocuments({ campaignId: cid, completed: true })
    );
    console.log(
      "eligibleForReward:",
      await UserProgress.countDocuments({ campaignId: cid, eligibleForReward: true })
    );
    console.log(
      "isPaymentEarned:",
      await UserProgress.countDocuments({ campaignId: cid, isPaymentEarned: true })
    );
    console.log(
      "earnedAmount>0:",
      await UserProgress.countDocuments({ campaignId: cid, earnedAmount: { $gt: 0 } })
    );
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
