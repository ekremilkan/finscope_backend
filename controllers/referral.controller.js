// controllers/referral.controller.js
const { StatusCodes } = require("http-status-codes");
const referralService = require("../services/referral.service");

const baseResponse = { success: true, error: false }; // projenin pattern'ine uyum

exports.claimReferral = async (req, res) => {
  try {
    const data = await referralService.claimReferralCode(req);
    return res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Referral linked",
      code: StatusCodes.OK,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: true,
      message: err.message || "Internal error",
      code: err.statusCode || 500,
    });
  }
};

exports.getReferralInfo = async (req, res) => {
  try {
    const data = await referralService.getReferralInfo(req);
    return res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Referral info retrieved",
      code: StatusCodes.OK,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: true,
      message: err.message || "Internal error",
      code: err.statusCode || 500,
    });
  }
};
