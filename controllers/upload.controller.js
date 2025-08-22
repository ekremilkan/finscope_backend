/**
 * Upload Controller
 * 
 * Bu controller dosya yükleme işlemlerini yönetir.
 */

const { UploadService } = require('../services/upload.service');
const { StatusCodes } = require('http-status-codes');

// Tek dosya yükleme
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Dosya bulunamadı',
        code: StatusCodes.BAD_REQUEST
      });
    }

    // Dosya validasyonu
    const validation = UploadService.validateFile(req.file);
    if (!validation.isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Dosya validasyon hatası',
        errors: validation.errors,
        code: StatusCodes.BAD_REQUEST
      });
    }

    // Dosyayı yükle - varsayılan olarak local storage kullan
    const uploadOptions = {
      folder: req.body.folder || 'campaigns',
      useCloudinary: false // Varsayılan olarak local storage
    };

    const result = await UploadService.uploadSingle(req.file, uploadOptions);

    res.status(StatusCodes.OK).json({
      success: true,
      error: false,
      message: 'Dosya başarıyla yüklendi',
      data: result,
      code: StatusCodes.OK
    });

  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: true,
      message: 'Dosya yükleme hatası',
      code: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
};

// Çoklu dosya yükleme
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Dosya bulunamadı',
        code: StatusCodes.BAD_REQUEST
      });
    }

    // Dosya sayısı kontrolü
    if (req.files.length > 10) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Çok fazla dosya. Maksimum 10 dosya.',
        code: StatusCodes.BAD_REQUEST
      });
    }

    // Her dosyayı validate et
    const validationErrors = [];
    req.files.forEach((file, index) => {
      const validation = UploadService.validateFile(file);
      if (!validation.isValid) {
        validationErrors.push({
          file: file.originalname,
          errors: validation.errors
        });
      }
    });

    if (validationErrors.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Bazı dosyalar geçersiz',
        errors: validationErrors,
        code: StatusCodes.BAD_REQUEST
      });
    }

    // Dosyaları yükle - varsayılan olarak local storage kullan
    const uploadOptions = {
      folder: req.body.folder || 'campaigns',
      useCloudinary: false // Varsayılan olarak local storage
    };

    const results = await UploadService.uploadMultiple(req.files, uploadOptions);

    res.status(StatusCodes.OK).json({
      success: true,
      error: false,
      message: `${results.length} dosya başarıyla yüklendi`,
      data: {
        files: results,
        count: results.length,
        urls: results.map(file => file.url)
      },
      code: StatusCodes.OK
    });

  } catch (error) {
    console.error('Çoklu dosya yükleme hatası:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: true,
      message: 'Dosya yükleme hatası',
      code: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
};

// Dosya silme
exports.deleteFile = async (req, res) => {
  try {
    const { fileInfo } = req.body;

    if (!fileInfo) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Dosya bilgisi gerekli',
        code: StatusCodes.BAD_REQUEST
      });
    }

    const result = await UploadService.deleteFile(fileInfo);

    res.status(StatusCodes.OK).json({
      success: true,
      error: false,
      message: result.message,
      data: result,
      code: StatusCodes.OK
    });

  } catch (error) {
    console.error('Dosya silme hatası:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: true,
      message: 'Dosya silme hatası',
      code: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
};

// Dosya bilgilerini getir
exports.getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: true,
        message: 'Dosya adı gerekli',
        code: StatusCodes.BAD_REQUEST
      });
    }

    // Local dosya kontrolü
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: true,
        message: 'Dosya bulunamadı',
        code: StatusCodes.NOT_FOUND
      });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `${process.env.BASE_URL || 'http://localhost:5005'}/uploads/${filename}`
    };

    res.status(StatusCodes.OK).json({
      success: true,
      error: false,
      message: 'Dosya bilgileri getirildi',
      data: fileInfo,
      code: StatusCodes.OK
    });

  } catch (error) {
    console.error('Dosya bilgisi getirme hatası:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: true,
      message: 'Dosya bilgisi getirme hatası',
      code: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
};

// Yüklenen dosyaları listele
exports.listFiles = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadDir)) {
      return res.status(StatusCodes.OK).json({
        success: true,
        error: false,
        message: 'Yüklenen dosya bulunamadı',
        data: {
          files: [],
          count: 0
        },
        code: StatusCodes.OK
      });
    }

    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `${process.env.BASE_URL || 'http://localhost:5005'}/uploads/${filename}`
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      error: false,
      message: 'Dosyalar listelendi',
      data: {
        files: fileList,
        count: fileList.length
      },
      code: StatusCodes.OK
    });

  } catch (error) {
    console.error('Dosya listeleme hatası:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: true,
      message: 'Dosya listeleme hatası',
      code: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
}; 