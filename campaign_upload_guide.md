# 📤 Kampanya İçerik Resimleri File Upload Rehberi

**Frontend Geliştirici - File Upload Entegrasyonu**

![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Upload](https://img.shields.io/badge/Upload-Multiple%20Files-green.svg)
![Storage](https://img.shields.io/badge/Storage-Local%20Storage-orange.svg)

---

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [📤 Upload API Endpoints](#-upload-api-endpoints)
- [🎨 Frontend Entegrasyonu](#-frontend-entegrasyonu)
- [🔧 React Örnekleri](#-react-örnekleri)
- [❌ Hata Yönetimi](#-hata-yönetimi)
- [💡 Best Practices](#-best-practices)
- [🔧 Sorun Giderme](#-sorun-giderme)

---

## 🚀 Hızlı Başlangıç

### Base URL
```
Development: http://localhost:5005/api/v1
Production: https://your-domain.com/api/v1
```

### Desteklenen Dosya Türleri
- **Resimler**: JPEG, JPG, PNG, GIF, WebP
- **Videolar**: MP4, AVI, MOV, WMV
- **Maksimum Boyut**: 10MB per dosya
- **Maksimum Dosya**: 10 dosya

### ⚠️ Önemli Not
**Sistem şu anda Local Storage kullanıyor.** Cloudinary API key'leri eksik olduğu için dosyalar sunucunun `uploads/` klasörüne yükleniyor.

---

## 📤 Upload API Endpoints

### 1. Tek Dosya Yükleme

**Endpoint:** `POST /upload/single`

**Yetki:** Admin veya Customer

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [dosya seçimi]
folder: campaigns (opsiyonel)
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Dosya başarıyla yüklendi",
  "data": {
    "originalName": "kampanya-banner.jpg",
    "filename": "1703123456789-uuid.jpg",
    "mimetype": "image/jpeg",
    "size": 245760,
    "url": "http://localhost:5005/api/v1/upload/proxy/1703123456789-uuid.jpg",
    "storage": "local"
  },
  "code": 200
}
```

### 2. Çoklu Dosya Yükleme

**Endpoint:** `POST /upload/multiple`

**Yetki:** Admin veya Customer

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
files: [dosya1, dosya2, dosya3...] (maksimum 10)
folder: campaigns (opsiyonel)
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
        "originalName": "banner1.jpg",
        "filename": "1703123456789-uuid1.jpg",
        "url": "http://localhost:5005/api/v1/upload/proxy/1703123456789-uuid1.jpg",
        "storage": "local"
      },
      {
        "originalName": "banner2.jpg",
        "filename": "1703123456789-uuid2.jpg",
        "url": "http://localhost:5005/api/v1/upload/proxy/1703123456789-uuid2.jpg",
        "storage": "local"
      }
    ],
    "count": 2,
    "urls": [
      "http://localhost:5005/api/v1/upload/proxy/1703123456789-uuid1.jpg",
      "http://localhost:5005/api/v1/upload/proxy/1703123456789-uuid2.jpg"
    ]
  },
  "code": 200
}
```

### 3. Dosya Silme

**Endpoint:** `DELETE /upload/delete`

**Yetki:** Admin veya Customer

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileInfo": {
    "filename": "1703123456789-uuid.jpg",
    "storage": "local"
  }
}
```

**Response:**
```json
{
  "success": true,
  "error": false,
  "message": "Dosya başarıyla silindi",
  "data": {
    "success": true,
    "message": "Dosya başarıyla silindi"
  },
  "code": 200
}
```

---

## 🎨 Frontend Entegrasyonu

### HTML Form Örneği
```html
<form id="uploadForm" enctype="multipart/form-data">
  <input type="file" name="file" accept="image/*" required>
  <input type="hidden" name="folder" value="campaigns">
  <button type="submit">Yükle</button>
</form>
```

### JavaScript Fetch Örneği
```javascript
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'campaigns');

  const token = localStorage.getItem('jwt_token');
  
  try {
    const response = await fetch('/api/v1/upload/single', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data.url; // Yüklenen dosyanın URL'i
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Upload hatası:', error);
    throw error;
  }
};
```

---

## 🔧 React Örnekleri

### 1. Tek Dosya Upload Hook'u
```typescript
import { useState } from 'react';
import axios from 'axios';

interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  storage: 'local';
}

const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadSingle = async (file: File, folder: string = 'campaigns'): Promise<UploadResult> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const token = localStorage.getItem('jwt_token');
      const response = await axios.post('/api/v1/upload/single', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Dosya yükleme hatası';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return { uploadSingle, uploading, error };
};
```

### 2. Çoklu Dosya Upload Hook'u
```typescript
import { useState } from 'react';
import axios from 'axios';

const useMultipleFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMultiple = async (files: File[], folder: string = 'campaigns'): Promise<string[]> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('folder', folder);

      const token = localStorage.getItem('jwt_token');
      const response = await axios.post('/api/v1/upload/multiple', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        return response.data.data.urls;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Dosya yükleme hatası';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadMultiple, uploading, progress, error };
};
```

### 3. Kampanya İçerik Upload Komponenti
```typescript
import React, { useState, useRef } from 'react';
import { useMultipleFileUpload } from './hooks/useMultipleFileUpload';

interface CampaignContentUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  maxFiles?: number;
}

const CampaignContentUpload: React.FC<CampaignContentUploadProps> = ({
  onImagesUploaded,
  maxFiles = 10
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultiple, uploading, progress, error } = useMultipleFileUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length > maxFiles) {
      alert(`Maksimum ${maxFiles} dosya seçebilirsiniz.`);
      return;
    }

    setSelectedFiles(files);

    // Preview oluştur
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const urls = await uploadMultiple(selectedFiles, 'campaigns');
      onImagesUploaded(urls);
      
      // Form'u temizle
      setSelectedFiles([]);
      setPreviewUrls([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload hatası:', err);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <div className="campaign-upload">
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progress}%</span>
          </div>
        )}

        {error && (
          <div className="upload-error">
            {error}
          </div>
        )}
      </div>

      {previewUrls.length > 0 && (
        <div className="preview-grid">
          {previewUrls.map((url, index) => (
            <div key={index} className="preview-item">
              <img src={url} alt={`Preview ${index + 1}`} />
              <button 
                type="button" 
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <button 
          type="button" 
          onClick={handleUpload}
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? 'Yükleniyor...' : `${selectedFiles.length} Dosyayı Yükle`}
        </button>
      )}
    </div>
  );
};

export default CampaignContentUpload;
```

### 4. Kampanya Oluşturma Formu ile Entegrasyon
```typescript
import React, { useState } from 'react';
import CampaignContentUpload from './CampaignContentUpload';

const CampaignCreateForm: React.FC = () => {
  const [campaignData, setCampaignData] = useState({
    title: '',
    description: '',
    content: [],
    images: [],
    // ... diğer alanlar
  });

  const handleImagesUploaded = (urls: string[]) => {
    setCampaignData(prev => ({
      ...prev,
      images: [...prev.images, ...urls]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(campaignData)
      });

      const result = await response.json();
      if (result.success) {
        console.log('Kampanya oluşturuldu:', result.data);
      }
    } catch (error) {
      console.error('Kampanya oluşturma hatası:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Kampanya Başlığı:</label>
        <input
          type="text"
          value={campaignData.title}
          onChange={(e) => setCampaignData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label>Kampanya Açıklaması:</label>
        <textarea
          value={campaignData.description}
          onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <label>Kampanya Resimleri:</label>
        <CampaignContentUpload onImagesUploaded={handleImagesUploaded} />
        
        {campaignData.images.length > 0 && (
          <div className="uploaded-images">
            <h4>Yüklenen Resimler:</h4>
            {campaignData.images.map((url, index) => (
              <img key={index} src={url} alt={`Kampanya resmi ${index + 1}`} />
            ))}
          </div>
        )}
      </div>

      <button type="submit">Kampanya Oluştur</button>
    </form>
  );
};
```

---

## ❌ Hata Yönetimi

### Yaygın Upload Hataları

| Hata | Açıklama | Çözüm |
|------|----------|-------|
| `Dosya bulunamadı` | FormData'da file alanı yok | File input'u kontrol edin |
| `Desteklenmeyen dosya türü` | Geçersiz dosya formatı | Sadece desteklenen formatları kullanın |
| `Çok fazla dosya` | 10'dan fazla dosya | Dosya sayısını sınırlayın |
| `Dosya boyutu çok büyük` | 10MB'dan büyük dosya | Dosya boyutunu küçültün |

### Hata Response Örneği
```json
{
  "success": false,
  "error": true,
  "message": "Desteklenmeyen dosya türü",
  "code": 400
}
```

---

## 💡 Best Practices

### 1. Dosya Validasyonu
```typescript
const validateFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    alert('Sadece resim dosyaları yükleyebilirsiniz.');
    return false;
  }

  if (file.size > maxSize) {
    alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
    return false;
  }

  return true;
};
```

### 2. Progress Tracking
```typescript
const uploadWithProgress = async (file: File, onProgress: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/v1/upload/single', formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    }
  });

  return response.data;
};
```

### 3. Dosya Silme
```typescript
const deleteFile = async (fileInfo: any) => {
  try {
    const response = await axios.delete('/api/v1/upload/delete', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        'Content-Type': 'application/json'
      },
      data: { fileInfo }
    });

    if (response.data.success) {
      console.log('Dosya silindi');
    }
  } catch (error) {
    console.error('Dosya silme hatası:', error);
  }
};
```

### 4. Retry Mekanizması
```typescript
const uploadWithRetry = async (file: File, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadSingle(file);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## 🔧 Sorun Giderme

### Cloudinary Hatası Çözüldü
**Sorun:** `Must supply api_key` hatası
**Çözüm:** Sistem artık varsayılan olarak local storage kullanıyor. Cloudinary API key'leri eksik olsa bile dosyalar başarıyla yükleniyor.

### CORS Hatası Çözüldü
**Sorun:** Frontend'de yüklenen resimleri görüntülerken CORS hatası
**Çözüm:** Proxy endpoint eklendi. Artık dosyalar `/api/v1/upload/proxy/filename` üzerinden erişilebiliyor.

### Local Storage URL Formatı
```javascript
// Eski format (CORS sorunu)
const fileUrl = `http://localhost:5005/uploads/${filename}`;

// Yeni format (CORS sorunu çözüldü)
const fileUrl = `http://localhost:5005/api/v1/upload/proxy/${filename}`;

// Production için
const fileUrl = `https://your-domain.com/api/v1/upload/proxy/${filename}`;
```

### Dosya Erişimi
Yüklenen dosyalar `uploads/` klasöründe saklanıyor ve `/api/v1/upload/proxy/` endpoint'i üzerinden CORS sorunu olmadan erişilebiliyor.

### Proxy Endpoint Özellikleri
- **URL:** `GET /api/v1/upload/proxy/:filename`
- **CORS Headers:** Otomatik olarak ekleniyor
- **Güvenlik:** Dosya varlığı kontrolü
- **Performans:** Direkt dosya servisi

---

## 📱 CSS Stilleri

### Upload Area Stilleri
```css
.campaign-upload {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin: 20px 0;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-progress {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.preview-item button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.upload-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.upload-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.upload-error {
  color: #dc3545;
  margin-top: 10px;
  padding: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
}
```

---

**Son güncelleme**: 2024-12-19  
**Versiyon**: 2.0.0  
**Status**: �� Production Ready 