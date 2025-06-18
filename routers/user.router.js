const express = require("express");
const controller = require("../controllers/index");

const router = express.Router();

router.post("/register", controller.userController.register);
router.post("/login", controller.userController.login);

module.exports = { user: router };
