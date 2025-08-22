const express = require("express");
const controller = require("../controllers/index");
const middlewares = require("../middlewares/index");
const { uploadMiddleware, handleUploadError } = require("../services/upload.service");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Proxy endpoint - CORS sorunu için
router.get('/proxy/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Dosyanın var olup olmadığını kontrol et
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'Dosya bulunamadı' 
    });
  }
  
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Dosyayı gönder
  res.sendFile(filePath);
});

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