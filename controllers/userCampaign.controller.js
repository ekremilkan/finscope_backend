const { StatusCodes } = require("http-status-codes");
const services = require("../services/index");
const baseResponse = require("../dto/baseresponse.dto");

exports.create = async (req, res) => {
  try {
    const data = await services.userCampaign.create(req.body);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "UserCampaign created successfully",
      code: StatusCodes.CREATED,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { userId, campaignId } = req.params;
    const data = await services.userCampaign.updateClass(
      { user_id: userId, campaign_id: campaignId },
      req.body
    );
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "UserCampaign class updated successfully",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { userId, campaignId } = req.params;
    console.log("userId", userId);
    console.log("campaignId", campaignId);
    const data = await services.userCampaign.getOne({ user_id: userId, campaign_id: campaignId });
    console.log("data", data);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "UserCampaign retrieved successfully",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};


