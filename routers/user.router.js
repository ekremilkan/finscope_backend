const express = require("express");
const controller = require("../controllers/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

router.post("/register", controller.userController.register);
router.post(
  "/login",
  middlewares.authMiddleware.verifyToken,
  controller.userController.login
);
router.get(
  "/profile",
  middlewares.authMiddleware.verifyToken, // Önce token kontrol edilir
  controller.userController.getProfile // Token geçerliyse bu fonksiyon çalışır
);

module.exports = { user: router };
