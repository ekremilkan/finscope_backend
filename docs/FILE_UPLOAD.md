# 📁 File Upload Sistemi

Bu dokümantasyon, FinScope Backend API'sinin dosya yükleme sistemini açıklar.

## 🚀 Özellikler

### ✅ Desteklenen Özellikler
- **Tek dosya yükleme** - Single file upload
- **Çoklu dosya yükleme** - Multiple file upload (max 10 dosya)
- **Dosya validasyonu** - File type ve size kontrolü
- **Local storage** - Yerel dosya sistemi
- **Cloudinary entegrasyonu** - Cloud storage (opsiyonel)
- **Dosya silme** - File deletion
- **Dosya listeleme** - File listing
- **Role-based access** - Yetki kontrolü

### 📋 Desteklenen Dosya Türleri
- **Resimler:** JPEG, JPG, PNG, GIF, WebP
- **Videolar:** MP4, AVI, MOV, WMV
- **Maksimum boyut:** 10MB per dosya
- **Maksimum dosya sayısı:** 10 dosya

## 🔧 Kurulum

### 1. Gerekli Paketler
```bash
npm install multer cloudinary multer-storage-cloudinary uuid
```

### 2. Environment Variables
```env
# Cloudinary (Opsiyonel)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Base URL
BASE_URL=http://localhost:5005
```

## 📡 API Endpoints

### 1. Tek Dosya Yükleme
```http
POST /api/v1/upload/single
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: [dosya]
- folder: campaigns (opsiyonel)
- useCloudinary: true/false (opsiyonel)
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Dosya başarıyla yüklendi",
  "data": {
    "originalName": "image.jpg",
    "filename": "1703123456789-uuid.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "url": "http://localhost:5005/uploads/1703123456789-uuid.jpg",
    "storage": "local"
  },
  "code": 200
}
```

### 2. Çoklu Dosya Yükleme
```http
POST /api/v1/upload/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- files: [dosya1, dosya2, ...] (max 10)
- folder: campaigns (opsiyonel)
- useCloudinary: true/false (opsiyonel)
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "3 dosya başarıyla yüklendi",
  "data": {
    "files": [
      {
        "originalName": "image1.jpg",
        "filename": "1703123456789-uuid1.jpg",
        "url": "http://localhost:5005/uploads/1703123456789-uuid1.jpg",
        "storage": "local"
      },
      {
        "originalName": "image2.png",
        "filename": "1703123456790-uuid2.png",
        "url": "http://localhost:5005/uploads/1703123456790-uuid2.png",
        "storage": "local"
      }
    ],
    "count": 2,
    "urls": [
      "http://localhost:5005/uploads/1703123456789-uuid1.jpg",
      "http://localhost:5005/uploads/1703123456790-uuid2.png"
    ]
  },
  "code": 200
}
```

### 3. Dosya Silme
```http
DELETE /api/v1/upload/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileInfo": {
    "filename": "1703123456789-uuid.jpg",
    "storage": "local",
    "publicId": "cloudinary_public_id" // Cloudinary için
  }
}
```

### 4. Dosya Bilgilerini Getir
```http
GET /api/v1/upload/info/:filename
Authorization: Bearer <token>
```

### 5. Dosyaları Listele (Admin)
```http
GET /api/v1/upload/list
Authorization: Bearer <token>
```

## 🧪 Kullanım Örnekleri

### 1. cURL ile Tek Dosya Yükleme
```bash
curl -X POST http://localhost:5005/api/v1/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=campaigns" \
  -F "useCloudinary=false"
```

### 2. cURL ile Çoklu Dosya Yükleme
```bash
curl -X POST http://localhost:5005/api/v1/upload/multiple \
  -H "Authorization: Bearer <token>" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.png" \
  -F "folder=campaigns"
```

### 3. JavaScript/Fetch ile Yükleme
```javascript
// Tek dosya yükleme
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'campaigns');

fetch('http://localhost:5005/api/v1/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Yüklenen dosya:', data.data.url);
});
```

### 4. React ile Dosya Yükleme
```jsx
import React, { useState } from 'react';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const selectedFiles = event.target.files;
    setUploading(true);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    formData.append('folder', 'campaigns');

    try {
      const response = await fetch('http://localhost:5005/api/v1/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        console.log('Yüklenen dosyalar:', data.data.urls);
        setFiles(data.data.urls);
      }
    } catch (error) {
      console.error('Yükleme hatası:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Yükleniyor...</p>}
      {files.map((url, index) => (
        <img key={index} src={url} alt={`Uploaded ${index}`} style={{width: 100}} />
      ))}
    </div>
  );
};

export default FileUpload;
```

## 🔐 Yetki Kontrolü

### Roller ve Yetkiler
- **Admin:** Tüm upload işlemleri + dosya listeleme
- **Customer:** Dosya yükleme ve silme
- **User:** Sadece dosya bilgisi görüntüleme

### Middleware Kontrolü
```javascript
// Upload router'ında
middlewares.authMiddleware, // Giriş kontrolü
middlewares.roleMiddleware.requireAdminOrCustomer, // Yetki kontrolü
```

## 📁 Dosya Yapısı

### Local Storage
```
uploads/
├── 1703123456789-uuid1.jpg
├── 1703123456790-uuid2.png
└── 1703123456791-uuid3.mp4
```

### Cloudinary Storage
```
finscope/
├── campaigns/
│   ├── image1.jpg
│   └── image2.png
└── users/
    └── profile.jpg
```

## ⚙️ Konfigürasyon

### Multer Konfigürasyonu
```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maksimum 10 dosya
  }
});
```

### Cloudinary Konfigürasyonu
```javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

## 🛡️ Güvenlik

### Dosya Validasyonu
- **Dosya türü kontrolü** - Sadece izin verilen türler
- **Dosya boyutu kontrolü** - Maksimum 10MB
- **Dosya sayısı kontrolü** - Maksimum 10 dosya
- **Güvenli dosya adı** - UUID ile benzersiz isimler

### Hata Yönetimi
```javascript
// Dosya boyutu hatası
{
  "success": false,
  "error": true,
  "message": "Dosya boyutu çok büyük. Maksimum 10MB.",
  "code": 400
}

// Desteklenmeyen dosya türü
{
  "success": false,
  "error": true,
  "message": "Desteklenmeyen dosya türü. Sadece resim ve video dosyaları kabul edilir.",
  "code": 400
}
```

## 🔄 Kampanya Entegrasyonu

### Kampanya Oluştururken Dosya Yükleme
```javascript
// 1. Önce dosyaları yükle
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('folder', 'campaigns');

const uploadResponse = await fetch('/api/v1/upload/multiple', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});

const uploadData = await uploadResponse.json();
const imageUrls = uploadData.data.urls;

// 2. Kampanya oluştur
const campaignData = {
  title: 'Kampanya Başlığı',
  description: 'Açıklama',
  images: imageUrls, // Yüklenen dosya URL'leri
  videoLink: 'https://youtube.com/watch?v=...',
  // ... diğer alanlar
};

const campaignResponse = await fetch('/api/v1/campaigns/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(campaignData)
});
```

## 📊 Test Senaryoları

### 1. Geçerli Dosya Yükleme
```bash
# Resim yükleme
curl -X POST http://localhost:5005/api/v1/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-image.jpg"
```

### 2. Geçersiz Dosya Türü
```bash
# PDF dosyası (desteklenmeyen)
curl -X POST http://localhost:5005/api/v1/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf"
# Response: 400 - Desteklenmeyen dosya türü
```

### 3. Büyük Dosya
```bash
# 15MB dosya (limit 10MB)
curl -X POST http://localhost:5005/api/v1/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@large-file.jpg"
# Response: 400 - Dosya boyutu çok büyük
```

## 🚨 Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Dosya bulunamadı, geçersiz dosya türü, dosya boyutu aşımı |
| 401 | Yetkilendirme hatası |
| 403 | Yetki yetersiz |
| 500 | Sunucu hatası |

## 📝 Notlar

1. **Dosya Adlandırma:** `timestamp-uuid.extension` formatında
2. **URL Formatı:** `http://localhost:5005/uploads/filename`
3. **Cloudinary:** Opsiyonel, yapılandırılmamışsa local storage kullanılır
4. **Güvenlik:** Sadece admin ve customer dosya yükleyebilir
5. **Performans:** Dosyalar otomatik olarak optimize edilir (Cloudinary) 