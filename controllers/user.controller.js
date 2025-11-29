const { StatusCodes } = require("http-status-codes");
const userService = require("../services/index");
const baseResponse = require("../dto/baseresponse.dto");

exports.register = async (req, res) => {
  try {

    const data = await userService.user.register(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "User created successfully",
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

exports.login = async (req, res) => {
  try {
    const data = await userService.user.login(req);

    // ✅ YENİ: isVerified durumuna göre mesaj ayarla
    const message = data.isVerified
      ? "Login successful"
      : "Verification code sent to your email address";

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message,
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

exports.resendVerificationCode = async (req, res) => {
  try {
    const data = await userService.user.resendVerificationCode(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Code has been sent",
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

exports.verifyLogin = async (req, res) => {
  try {
    const data = await userService.user.verifyLogin(req);

    // ✅ YENİ: isVerified durumuna göre mesaj ayarla
    const message = data.isVerified
      ? "Verification successful. Login completed."
      : "Verification successful";

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message,
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

exports.logout = async (req, res) => {
  try {
    const data = await userService.user.logout(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Logout successful",
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

exports.getProfile = async (req, res) => {
  // Middleware token'ı doğrulayıp kullanıcıyı req.user'a eklediği için,
  // burada veritabanına tekrar gitmemize gerek yok.
  // Direkt olarak req.user'dan bilgiyi alıp gönderebiliriz.
  res.status(StatusCodes.OK).json({
    message: "Profile information retrieved successfully.",
    data: req.user,
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const data = await userService.user.forgotPassword(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

exports.updateUserName = async (req, res) => {
  try {
    const data = await userService.user.updateUserName(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Name updated successfully.",
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

/**
 * Refresh token ile yeni access token üretme
 */
exports.refreshToken = async (req, res) => {
  try {
    const data = await userService.user.refreshAccessToken(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

exports.verifyResetCode = async (req, res) => {
  try {
    const data = await userService.user.verifyResetCode(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

exports.resetPassword = async (req, res) => {
  try {
    const data = await userService.user.resetPassword(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.message,
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

exports.getUserById = async (req, res) => {
  try {
    const data = await userService.user.getUserById(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data: data,
      timestamp: new Date(),
      message: "User retrieved successfully",
      code: StatusCodes.CREATED,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      timestamp: new Date(),
      message: "An error occurred",
      errorMessage: error.message,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.getUserByName = async (req, res) => {
  try {
    const data = await userService.user.getUserByName(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data: data,
      timestamp: new Date(),
      message: "User retrieved successfully",
      code: StatusCodes.CREATED,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      timestamp: new Date(),
      message: "An error occurred",
      errorMessage: error.message,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.getTotalUserCount = async (req, res) => {
  try {
    const data = await userService.user.getTotalUserCount();
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Total user count retrieved successfully",
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

exports.getUserJoinedCampaigns = async (req, res, next) => {
  try {
    const data = await userService.user.getUserJoinedCampaigns(req);
    res.status(StatusCodes.OK).json({
      success: true,
      data,
      message: "User's joined campaigns retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.claimReferralCode = async (req, res) => {
  try {
    const data = await userService.referral.claimReferralCode(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Referral code claimed successfully.",
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

exports.getReferralInfo = async (req, res) => {
  try {
    const data = await userService.referral.getReferralInfo(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Referral information retrieved successfully.",
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

exports.saveOrUpdateTwitterUsername = async (req, res) => {
  try {
    const data = await userService.user.saveOrUpdateTwitterUsername(req);

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Twitter username saved successfully",
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

exports.getTwitterUsername = async (req, res) => {
  try {
    // İstersen burada req.user varsa onu kullanacak şekilde de servisi güncelleyebilirsin.
    const data = await userService.user.getTwitterUsername(req);

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Twitter username fetched successfully",
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

exports.saveOrUpdateTelegramUsername = async (req, res) => {
  try {
    const data = await userService.user.saveOrUpdateTelegramUsername(req);

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Telegram username saved successfully",
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

exports.getTelegramUsername = async (req, res) => {
  try {
    const data = await userService.user.getTelegramUsername(req);

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Telegram username fetched successfully",
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