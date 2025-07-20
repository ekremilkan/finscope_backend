const express = require("express");
const controller = require("../controllers/index");
const validation = require("../validations/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

// Soru oluşturma (sadece admin ve customer)
router.post(
  "/create",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  validation.questionValidation.validateCreateQuestion,
  controller.questionController.create
);

// Tüm soruları getir (admin için kullanılabilir)
router.get(
  "/all",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.questionController.getAll
);

// Belirli kampanyaya ait sorular
router.get(
  "/campaign/:campaignId",
  middlewares.authMiddleware,
  controller.questionController.getByCampaign
);

// Giriş yapan müşteriye ait sorular
router.get(
  "/customer",
  middlewares.authMiddleware,
  controller.questionController.getByCustomer
);

// Soru güncelleme (admin ve customer - service'de detay kontrol)
router.put(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  validation.questionValidation.validateUpdateQuestion,
  controller.questionController.update
);

// Soru silme (admin ve customer - service'de detay kontrol)
router.delete(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  controller.questionController.remove
);

module.exports = { question: router };