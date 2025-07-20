/**
 * File Upload Service
 * 
 * Bu servis dosya yükleme işlemlerini yönetir.
 * Cloudinary ve local storage desteği sağlar.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Cloudinary konfigürasyonu (opsiyonel)
let cloudinary = null;
try {
  const cloudinaryLib = require('cloudinary').v2;
  cloudinary = cloudinaryLib;
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} catch (error) {
  console.log('⚠️ Cloudinary yapılandırılmamış, local storage kullanılacak');
}

// Local storage için klasör oluştur
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // Desteklenen dosya türleri
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya türü'), false);
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maksimum 10 dosya
  }
});

// Cloudinary'ye yükleme
const uploadToCloudinary = async (filePath, folder = 'finscope') => {
  try {
    if (!cloudinary) {
      throw new Error('Cloudinary yapılandırılmamış');
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    // Local dosyayı sil
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary yükleme hatası:', error);
    throw error;
  }
};

// Local dosyayı URL'e çevir
const getLocalFileUrl = (filename) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5005';
  return `${baseUrl}/uploads/${filename}`;
};

// Dosya yükleme servisi
class UploadService {
  /**
   * Tek dosya yükleme
   */
  static async uploadSingle(file, options = {}) {
    try {
      if (!file) {
        throw new Error('Dosya bulunamadı');
      }

      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      };

      // Cloudinary kullanılıyorsa
      if (cloudinary && options.useCloudinary !== false) {
        const cloudinaryResult = await uploadToCloudinary(file.path, options.folder);
        return {
          ...fileInfo,
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format,
          storage: 'cloudinary'
        };
      }

      // Local storage
      const localUrl = getLocalFileUrl(file.filename);
      return {
        ...fileInfo,
        url: localUrl,
        storage: 'local'
      };
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * Çoklu dosya yükleme
   */
  static async uploadMultiple(files, options = {}) {
    try {
      if (!files || files.length === 0) {
        throw new Error('Dosya bulunamadı');
      }

      const uploadPromises = files.map(file => 
        this.uploadSingle(file, options)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Çoklu dosya yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * Dosya silme
   */
  static async deleteFile(fileInfo) {
    try {
      if (fileInfo.storage === 'cloudinary' && cloudinary) {
        // Cloudinary'den sil
        await cloudinary.uploader.destroy(fileInfo.publicId);
      } else if (fileInfo.storage === 'local') {
        // Local dosyayı sil
        const filePath = path.join(uploadDir, fileInfo.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return { success: true, message: 'Dosya başarıyla silindi' };
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      throw error;
    }
  }

  /**
   * Dosya bilgilerini doğrula
   */
  static validateFile(file) {
    const errors = [];

    // Dosya boyutu kontrolü (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`Dosya boyutu çok büyük. Maksimum: ${maxSize / (1024 * 1024)}MB`);
    }

    // Dosya türü kontrolü
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Desteklenmeyen dosya türü');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Dosya URL'lerini al
   */
  static getFileUrls(files) {
    if (!files || files.length === 0) {
      return [];
    }

    return files.map(file => {
      if (file.storage === 'cloudinary') {
        return file.url;
      } else {
        return getLocalFileUrl(file.filename);
      }
    });
  }
}

// Multer middleware'leri
const uploadMiddleware = {
  // Tek dosya yükleme
  single: (fieldName) => upload.single(fieldName),
  
  // Çoklu dosya yükleme
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  
  // Farklı alanlardan dosya yükleme
  fields: (fields) => upload.fields(fields)
};

// Hata yakalama middleware'i
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Dosya boyutu çok büyük. Maksimum 10MB.',
        code: 400
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Çok fazla dosya. Maksimum 10 dosya.',
        code: 400
      });
    }
  }

  if (error.message === 'Desteklenmeyen dosya türü') {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'Desteklenmeyen dosya türü. Sadece resim ve video dosyaları kabul edilir.',
      code: 400
    });
  }

  next(error);
};

module.exports = {
  UploadService,
  uploadMiddleware,
  handleUploadError,
  upload
}; 