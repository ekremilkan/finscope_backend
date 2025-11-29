const express = require("express");
const controller = require("../controllers/index");
const validation = require("../validations/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

router.post(
  "/register",
  middlewares.rateLimiter.registerLimiter,
  validation.userValidation.validateRegister,
  controller.userController.register
);

router.post(
  "/login",
  middlewares.rateLimiter.authLimiter,
  validation.userValidation.validateLogin,
  controller.userController.login
);

router.post(
  "/verify-login",
  middlewares.rateLimiter.authLimiter, // Aynı rate limiter'ı kullanabiliriz
  validation.userValidation.validateVerifyLogin, // Yeni validation middleware'i
  controller.userController.verifyLogin // Yeni controller fonksiyonu
);

router.get(
  "/profile",
  middlewares.authMiddleware,
  controller.userController.getProfile // Token geçerliyse bu fonksiyon çalışır
);

router.post("/logout/:userId", controller.userController.logout);

router.get("/getUserById/:userId", controller.userController.getUserById);
router.get("/getUserByName/:name", controller.userController.getUserByName);

router.put(
  "/updateUserName/:userId",
  controller.userController.updateUserName,
  validation.userValidation.validateUpdateUser
);

// Şifre sıfırlama
router.post(
  "/forgot-password",
  middlewares.rateLimiter.forgotPasswordLimiter,
  validation.userValidation.validateForgotPassword,
  controller.userController.forgotPassword
);

router.post(
  "/verify-reset-code",
  validation.userValidation.validateVerifyResetCode,
  controller.userController.verifyResetCode
);

router.post(
  "/reset-password",
  validation.userValidation.validateResetPassword,
  controller.userController.resetPassword
);

router.post(
  "/resend-verification-code",
  controller.userController.resendVerificationCode
);

// Refresh token endpoint'i
router.post(
  "/refresh-token",
  middlewares.rateLimiter.authLimiter,
  validation.userValidation.validateRefreshToken,
  controller.userController.refreshToken
);

router.get(
  "/admin/total-count",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.userController.getTotalUserCount
);

router.get(
  "/joined-campaigns",
  middlewares.authMiddleware,
  controller.userController.getUserJoinedCampaigns
);

router.post(
  "/claim-referral",
  middlewares.authMiddleware,
  controller.referralController.claimReferral
);

router.get(
  "/referral-info",
  middlewares.authMiddleware,
  controller.referralController.getReferralInfo
);

router.post(
  "/save-twitter-username",
  middlewares.authMiddleware,
  controller.userController.saveOrUpdateTwitterUsername
);

router.get(
  "/get-twitter-username",
  middlewares.authMiddleware,
  controller.userController.getTwitterUsername
);

router.post(
  "/save-telegram-username",
  middlewares.authMiddleware,
  controller.userController.saveOrUpdateTelegramUsername
);

router.get(
  "/get-telegram-username",
  middlewares.authMiddleware,
  controller.userController.getTelegramUsername
);

module.exports = { user: router };
