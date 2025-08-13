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

// Tüm kampanyaları getir (auth - admin tümünü, diğer roller filtreli görür)
router.get(
  "/all",
  middlewares.authMiddleware,
  controller.campaignController.getAll
);

// Kampanyayı ID'ye göre getir (giriş yapmış herkes görebilir)
router.get(
  "/:id",
  middlewares.authMiddleware,
  controller.campaignController.getById
);

// ✅ YENİ: Kullanıcının kampanya progress'ini getir
router.get(
  "/:id/user-progress",
  middlewares.authMiddleware,
  controller.campaignController.getUserProgress
);

// ✅ YENİ: Kampanyaya katıl
router.post(
  "/:id/join",
  middlewares.authMiddleware,
  controller.campaignController.joinCampaign
);

// ✅ YENİ: Progress güncelle
router.put(
  "/:id/progress",
  middlewares.authMiddleware,
  validation.campaignValidation.validateUpdateProgress,
  controller.campaignController.updateProgress
);

// ✅ YENİ: Quiz tamamla
router.post(
  "/:id/complete",
  middlewares.authMiddleware,
  validation.campaignValidation.validateCompleteQuiz,
  controller.campaignController.completeQuiz
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

// Kampanyayı silme isteği (customer için - isActive false yapar)
router.delete(
  "/:id/request-delete",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  controller.campaignController.requestDelete
);

// Kampanyayı sil (sadece admin - gerçek silme)
router.delete(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.campaignController.remove
);

// Silme isteklerini getir (sadece admin)
router.get(
  "/admin/delete-requests",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.campaignController.getDeleteRequests
);

module.exports = { campaign: router };