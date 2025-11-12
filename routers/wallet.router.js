const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validation = require("../validations/index");

router.get("/nonce", walletController.generateNonce);
router.post("/verify", authMiddleware,walletController.verifySignatureAndConnect);
router.get('/getWalletStatus', authMiddleware, walletController.getWalletStatus);
router.get('/', authMiddleware, walletController.getUserWallets);
router.delete('/:address', authMiddleware, walletController.deleteWallet);
router.patch('/:address/network', authMiddleware, walletController.updateWalletNetwork);
router.patch('/:adress/set-airdrop', authMiddleware, walletController.setAirdropWallet);

module.exports = { wallet: router };
