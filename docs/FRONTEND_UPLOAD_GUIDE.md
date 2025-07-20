# 🖼️ Frontend - Kampanya Resim Yükleme Rehberi

Bu rehber, frontend geliştiricisinin kampanya oluştururken resim yükleme özelliğini nasıl implement edeceğini açıklar.

## 🚀 Hızlı Başlangıç

### 1. Kampanya Oluşturma Akışı
```javascript
// 1. Resimleri yükle
// 2. Kampanya verilerini hazırla
// 3. Kampanya oluştur
```

### 2. Gerekli API Endpoint'leri
- `POST /api/v1/upload/multiple` - Resim yükleme
- `POST /api/v1/campaigns/create` - Kampanya oluşturma

## 📋 Adım Adım Implementasyon

### Adım 1: Resim Yükleme Komponenti

```jsx
import React, { useState } from 'react';

const ImageUpload = ({ onImagesUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Dosya validasyonu
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        setError('Sadece resim dosyaları kabul edilir (JPEG, PNG, GIF, WebP)');
        return false;
      }
      
      if (!isValidSize) {
        setError('Dosya boyutu 10MB\'dan küçük olmalıdır');
        return false;
      }
      
      return true;
    });

    if (validFiles.length + uploadedImages.length > 10) {
      setError('Maksimum 10 resim yükleyebilirsiniz');
      return;
    }

    setSelectedFiles(validFiles);
    setError('');
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('folder', 'campaigns');

      const token = localStorage.getItem('token'); // veya context'ten al
      
      const response = await fetch('http://localhost:5005/api/v1/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const newImages = data.data.urls;
        const allImages = [...uploadedImages, ...newImages];
        setUploadedImages(allImages);
        setSelectedFiles([]);
        
        // Parent component'e bildir
        onImagesUploaded(allImages);
        
        console.log('Resimler yüklendi:', newImages);
      } else {
        setError(data.message || 'Resim yükleme hatası');
      }
    } catch (error) {
      setError('Resim yükleme sırasında hata oluştu');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    onImagesUploaded(newImages);
  };

  return (
    <div className="image-upload-container">
      <h3>Kampanya Resimleri</h3>
      
      {/* Dosya Seçimi */}
      <div className="file-input-section">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="file-input"
        />
        <button 
          onClick={uploadImages}
          disabled={selectedFiles.length === 0 || uploading}
          className="upload-btn"
        >
          {uploading ? 'Yükleniyor...' : `${selectedFiles.length} Resim Yükle`}
        </button>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Seçilen Dosyalar */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Seçilen Dosyalar ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span>{file.name}</span>
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ))}
        </div>
      )}

      {/* Yüklenen Resimler */}
      {uploadedImages.length > 0 && (
        <div className="uploaded-images">
          <h4>Yüklenen Resimler ({uploadedImages.length}/10)</h4>
          <div className="image-grid">
            {uploadedImages.map((url, index) => (
              <div key={index} className="image-item">
                <img src={url} alt={`Resim ${index + 1}`} />
                <button 
                  onClick={() => removeImage(index)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
```

### Adım 2: Kampanya Oluşturma Formu

```jsx
import React, { useState } from 'react';
import ImageUpload from './ImageUpload';

const CampaignForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    maxParticipants: '',
    category: 'education',
    difficulty: 'Beginner',
    startDate: '',
    endDate: '',
    questions: '',
    videoLink: '',
    tags: []
  });
  
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImagesUploaded = (uploadedImages) => {
    setImages(uploadedImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const campaignData = {
        ...formData,
        images: images, // Yüklenen resim URL'leri
        reward: parseInt(formData.reward),
        maxParticipants: parseInt(formData.maxParticipants),
        questions: parseInt(formData.questions),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      const response = await fetch('http://localhost:5005/api/v1/campaigns/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      const data = await response.json();

      if (data.success) {
        console.log('Kampanya oluşturuldu:', data.data);
        // Başarı mesajı göster veya yönlendir
        alert('Kampanya başarıyla oluşturuldu!');
      } else {
        setError(data.message || 'Kampanya oluşturma hatası');
      }
    } catch (error) {
      setError('Kampanya oluşturma sırasında hata oluştu');
      console.error('Campaign creation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="campaign-form">
      <h2>Yeni Kampanya Oluştur</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Temel Bilgiler */}
        <div className="form-section">
          <h3>Temel Bilgiler</h3>
          
          <div className="form-group">
            <label>Kampanya Başlığı *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Açıklama *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              maxLength={500}
              rows={4}
            />
          </div>
        </div>

        {/* Resim Yükleme */}
        <div className="form-section">
          <ImageUpload onImagesUploaded={handleImagesUploaded} />
        </div>

        {/* Kampanya Detayları */}
        <div className="form-section">
          <h3>Kampanya Detayları</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Ödül Miktarı *</label>
              <input
                type="number"
                name="reward"
                value={formData.reward}
                onChange={handleInputChange}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Maksimum Katılımcı</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
                defaultValue="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kategori</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="education">Eğitim</option>
                <option value="technology">Teknoloji</option>
                <option value="health">Sağlık</option>
                <option value="finance">Finans</option>
                <option value="sports">Spor</option>
                <option value="entertainment">Eğlence</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Zorluk Seviyesi</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                <option value="Beginner">Başlangıç</option>
                <option value="Intermediate">Orta</option>
                <option value="Advanced">İleri</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Başlangıç Tarihi *</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Bitiş Tarihi *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Soru Sayısı</label>
            <input
              type="number"
              name="questions"
              value={formData.questions}
              onChange={handleInputChange}
              min="1"
              defaultValue="5"
            />
          </div>

          <div className="form-group">
            <label>Video Linki (Opsiyonel)</label>
            <input
              type="url"
              name="videoLink"
              value={formData.videoLink}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="submit-btn"
          >
            {submitting ? 'Oluşturuluyor...' : 'Kampanya Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignForm;
```

### Adım 3: CSS Stilleri

```css
/* ImageUpload.css */
.image-upload-container {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #fafafa;
}

.file-input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.file-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.upload-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.selected-files {
  margin: 15px 0;
}

.file-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.uploaded-images {
  margin-top: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255,0,0,0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  font-size: 12px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  animation: progress 2s infinite;
}

@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* CampaignForm.css */
.campaign-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
}

.submit-btn {
  padding: 12px 30px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## 🔄 Kullanım Akışı

### 1. Kullanıcı Deneyimi
```
1. Kullanıcı kampanya formunu açar
2. Temel bilgileri doldurur
3. "Dosya Seç" butonuna tıklar
4. Resimleri seçer (max 10 adet)
5. "Resim Yükle" butonuna tıklar
6. Resimler yüklenir ve önizleme gösterilir
7. Kampanya bilgilerini tamamlar
8. "Kampanya Oluştur" butonuna tıklar
9. Kampanya resimlerle birlikte oluşturulur
```

### 2. API Çağrı Sırası
```javascript
// 1. Resim yükleme
POST /api/v1/upload/multiple
{
  files: [File1, File2, ...],
  folder: 'campaigns'
}

// 2. Kampanya oluşturma
POST /api/v1/campaigns/create
{
  title: 'Kampanya Başlığı',
  description: 'Açıklama',
  images: ['http://localhost:5005/uploads/image1.jpg', ...],
  videoLink: 'https://youtube.com/...',
  // ... diğer alanlar
}
```

## 🛡️ Güvenlik ve Validasyon

### Frontend Validasyonu
```javascript
// Dosya türü kontrolü
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Dosya boyutu kontrolü (10MB)
const maxSize = 10 * 1024 * 1024;

// Dosya sayısı kontrolü
const maxFiles = 10;
```

### Hata Yönetimi
```javascript
// Yükleme hatası
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message);
}

// Network hatası
catch (error) {
  console.error('Upload failed:', error);
  setError('Resim yükleme başarısız');
}
```

## 📱 Responsive Tasarım

```css
/* Mobile için */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .file-input-section {
    flex-direction: column;
  }
}
```

## 🎯 Test Senaryoları

### 1. Başarılı Yükleme
- ✅ Geçerli resim dosyaları seç
- ✅ Yükleme butonuna tıkla
- ✅ Resimlerin yüklendiğini kontrol et
- ✅ Kampanya oluştur

### 2. Hata Senaryoları
- ❌ Geçersiz dosya türü (PDF, TXT)
- ❌ Büyük dosya (15MB)
- ❌ Çok fazla dosya (11+ resim)
- ❌ Network hatası
- ❌ Token geçersiz

### 3. Kullanıcı Deneyimi
- ✅ Drag & drop desteği
- ✅ Progress bar
- ✅ Resim önizleme
- ✅ Resim silme
- ✅ Responsive tasarım

## 📝 Notlar

1. **Token Yönetimi:** localStorage veya context'ten token alın
2. **Error Handling:** Tüm hataları yakala ve kullanıcıya göster
3. **Loading States:** Yükleme sırasında UI'ı disable et
4. **File Validation:** Hem frontend hem backend validasyonu yap
5. **Image Preview:** Yüklenen resimleri göster
6. **Remove Functionality:** Resim silme özelliği ekle
7. **Progress Indicator:** Yükleme durumunu göster 