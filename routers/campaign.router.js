const express = require("express");
const controller = require("../controllers/index");
const validation = require("../validations/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

// Kampanya oluştur (müşteri girişi gerekli)
router.post(
  "/create",
  middlewares.authMiddleware,
  validation.campaignValidation.validateCreateCampaign,
  controller.campaignController.create
);

// Tüm kampanyaları getir (herkese açık olabilir)
router.get(
  "/all",
  controller.campaignController.getAll
);

// Kampanyayı ID'ye göre getir
router.get(
  "/:id",
  controller.campaignController.getById
);

// Müşteriye ait kampanyaları getir
router.get(
  "/customer/list",
  middlewares.authMiddleware,
  controller.campaignController.getByCustomer
);

// Kampanyayı sil (müşteri girişi gerekli)
router.delete(
  "/:id",
  middlewares.authMiddleware,
  controller.campaignController.remove
);

module.exports = { campaign: router };