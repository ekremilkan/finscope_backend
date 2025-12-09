const express = require("express");
const controller = require("../controllers/index");
const validation = require("../validations/index");
const middlewares = require("../middlewares/index");

const router = express.Router();

/* ------------------- 🔹 CREATE & ADMIN OPERATIONS ------------------- */

// Kampanya oluştur (sadece admin ve customer)
router.post(
  "/create",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  controller.campaignController.create
);

// Tüm kampanyaları getir (auth - admin tümünü, diğer roller filtreli görür)
router.get(
  "/all",
  middlewares.authMiddleware,
  controller.campaignController.getAll
);

// Silme isteklerini getir (sadece admin)
router.get(
  "/admin/delete-requests",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.campaignController.getDeleteRequests
);

// Tamamlanan kullanıcıları listele (admin)
router.get(
  "/admin/completed-users",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.campaignController.listCompletedUsers
);

// Ödeme (isPurchase) durumunu güncelle (admin)
router.patch(
  "/admin/completed-users/:userId/:campaignId/purchase",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  validation.campaignValidation.validateUpdatePurchase,
  controller.campaignController.updatePurchaseStatus
);

/* ------------------- 🔹 USER OPERATIONS ------------------- */

// Kullanıcının segmentine göre potansiyel kazanç analizi
router.get(
  "/user/segment-earnings-analysis",
  middlewares.authMiddleware,
  controller.campaignController.getUserSegmentEarningsAnalysis
);

// Müşteriye ait kampanyaları getir
router.get(
  "/customer/list",
  middlewares.authMiddleware,
  controller.campaignController.getByCustomer
);

/* ------------------- 🔹 CAMPAIGN DETAILS ------------------- */

// Kampanyayı ID'ye göre getir
router.get(
  "/:id",
  middlewares.authMiddleware,
  controller.campaignController.getById
);

// Kampanya durumuna göre getir
router.get(
  "/getByStatus",
  middlewares.authMiddleware,
  controller.campaignController.getByStatus
);

// Zorunlu kampanyayı getir
router.get(
  "/getRequiredCampaign",
  middlewares.authMiddleware,
  controller.campaignController.getRequiredCampaign
);

// Reward durumu
router.get(
  "/:id/reward-status",
  middlewares.authMiddleware,
  controller.campaignController.getRewardStatus
);

// Kullanıcının progress bilgisini getir
router.get(
  "/:id/user-progress",
  middlewares.authMiddleware,
  controller.campaignController.getUserProgress
);

/* ------------------- 🔹 MAIN LOGIC ROUTES ------------------- */

// ⚠️ ÖNCE /complete - spesifik route, en üste alınmalı
router.post(
  "/:id/complete",
  middlewares.authMiddleware,
  validation.campaignValidation.validateCompleteQuiz,
  controller.campaignController.completeQuiz
);

// Kampanyaya katıl
router.post(
  "/:id/join/:segment?",
  middlewares.authMiddleware,
  controller.campaignController.joinCampaign
);

// Progress güncelle
router.put(
  "/:id/progress",
  middlewares.authMiddleware,
  validation.campaignValidation.validateUpdateProgress,
  controller.campaignController.updateProgress
);

/* ------------------- 🔹 UPDATE & DELETE ------------------- */

// Kampanyayı güncelle (admin & customer)
router.put(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  validation.campaignValidation.validateUpdateCampaign,
  controller.campaignController.update
);

// Silme isteği (customer)
router.delete(
  "/:id/request-delete",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  controller.campaignController.requestDelete
);

// Kampanyayı sil (sadece admin)
router.delete(
  "/:id",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.campaignController.remove
);

/* ------------------- ✅ EXPORT ------------------- */
module.exports = { campaign: router };
