const userRouter = require("./user.router").user;
const walletRouter = require("./wallet.router").wallet;
const campaignRouter = require("./campaign.router").campaign;
const questionRouter = require("./questions.router").question;
const uploadRouter = require("./upload.router").upload;
const segmentsRouter = require("./segments.router").segments;

module.exports = {
  userRouter,
  walletRouter,
  campaignRouter,
  questionRouter,
  uploadRouter,
  segmentsRouter,
};
