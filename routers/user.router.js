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

module.exports = { user: router };
