const express = require("express");
const controller = require("../controllers/index");
const middlewares = require("../middlewares/index");
const { uploadMiddleware, handleUploadError } = require("../services/upload.service");

const router = express.Router();

// Tek dosya yükleme
router.post(
  "/single",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  uploadMiddleware.single('file'),
  handleUploadError,
  controller.uploadController.uploadSingle
);

// Çoklu dosya yükleme (maksimum 10 dosya)
router.post(
  "/multiple",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  uploadMiddleware.array('files', 10),
  handleUploadError,
  controller.uploadController.uploadMultiple
);

// Dosya silme
router.delete(
  "/delete",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdminOrCustomer,
  controller.uploadController.deleteFile
);

// Dosya bilgilerini getir
router.get(
  "/info/:filename",
  middlewares.authMiddleware,
  controller.uploadController.getFileInfo
);

// Yüklenen dosyaları listele
router.get(
  "/list",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.uploadController.listFiles
);

module.exports = { upload: router }; 