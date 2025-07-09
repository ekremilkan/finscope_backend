const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validation = require("../validations/index");

// YENİ: Kimlik doğrulama gerektirmeyen endpoint'ler
router.post("/validate-address", 
  validation.walletValidation.validateAddressCheck,
  walletController.validateAddress
);

router.get("/supported-networks", walletController.getSupportedNetworks);

// Kimlik doğrulama gerektiren endpoint'ler
router.use(authMiddleware);

router.post("/connect", 
  validation.walletValidation.validateConnectWallet,
  walletController.connectWallet
);

router.post("/set-airdrop", 
  validation.walletValidation.validateSetAirdropWallet,
  walletController.setAirdropWallet
);

// YENİ: Airdrop özelliğini kaldırma
router.delete("/remove-airdrop", walletController.removeAirdropWallet);

// YENİ: Mevcut airdrop cüzdanını gösterme
router.get("/airdrop", walletController.getAirdropWallet);

// YENİ: Cüzdan listeleme
router.get("/", walletController.getUserWallets);

// YENİ: Bakiye yönetimi endpoint'leri (SADECE OTOMATİK)
router.put("/:walletId/balance/refresh", walletController.updateWalletBalance);
router.put("/balance/refresh-all", walletController.updateAllWalletBalances);
router.get("/portfolio", walletController.getUserPortfolioValue);

// KALDIRILDI: Manuel bakiye güncelleme (GÜVENLİK RİSKİ)
// router.put("/:walletId/balance/manual", walletController.updateManualBalance);

// YENİ: Cüzdan silme
router.delete("/:walletId", walletController.deleteWallet);

// YENİ: Cüzdan işlem geçmişi
router.get("/:walletId/transactions", walletController.getWalletTransactions);

// YENİ: İşlem ekleme (demo/test için)
router.post("/:walletId/transactions", 
  validation.walletValidation.validateAddTransaction,
  walletController.addTransaction
);

module.exports = { wallet: router };
