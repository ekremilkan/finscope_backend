const express = require("express");
const controller = require("../controllers/index");
const validation = require("../validations/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

// Kampanya oluştur (sadece admin ve customer)
router.post(
  "/create",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  validation.campaignValidation.validateCreateCampaign,
  controller.campaignController.create
);

// Tüm kampanyaları getir (auth gerekli)
router.get(
  "/all",
  middlewares.authMiddleware,
  controller.campaignController.getAll
);

// Kampanyayı ID'ye göre getir
router.get(
  "/:id",
  controller.campaignController.getById
);

// Kampanyayı güncelle (admin ve customer - service'de detay kontrol)
router.put(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  validation.campaignValidation.validateUpdateCampaign,
  controller.campaignController.update
);

// Müşteriye ait kampanyaları getir
router.get(
  "/customer/list",
  middlewares.authMiddleware,
  controller.campaignController.getByCustomer
);

// Kampanyayı sil (admin ve customer - service'de detay kontrol)
router.delete(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  controller.campaignController.remove
);

module.exports = { campaign: router };