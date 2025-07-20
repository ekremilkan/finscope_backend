const express = require("express");
const controller = require("../controllers/index");
const validation = require("../validations/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

// Soru oluşturma (sadece giriş yapmış müşteri)
router.post(
  "/create",
  middlewares.authMiddleware, // Token kontrolü
  validation.questionValidation.validateCreateQuestion,
  controller.questionController.create
);

// Tüm soruları getir (admin için kullanılabilir)
router.get(
  "/all",
  middlewares.authMiddleware,
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

// Soru silme (müşteri kendine ait soruyu silebilir)
router.delete(
  "/:id",
  middlewares.authMiddleware,
  controller.questionController.remove
);

module.exports = { question: router };