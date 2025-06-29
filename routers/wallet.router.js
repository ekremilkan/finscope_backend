const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.use(authMiddleware);

router.post("/connect", walletController.connectWallet);
router.post("/set-airdrop", walletController.setAirdropWallet);

module.exports = { wallet: router };
