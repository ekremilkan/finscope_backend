const userRouter = require("./user.router").user;
const walletRouter = require("./wallet.router").wallet;
const campaignRouter = require("./campaign.router").campaign;
const questionRouter = require("./questions.router").question;

module.exports = {
  userRouter,
  walletRouter,
  campaignRouter,
  questionRouter,
};
