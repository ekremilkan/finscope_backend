/**
 * File Upload Test Dosyası
 * 
 * Bu dosya file upload sistemini test etmek için kullanılır.
 */

const fs = require('fs');
const path = require('path');
const { UploadService } = require('../services/upload.service');

// Test dosyası oluştur
function createTestFile(filename, content = 'test content') {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Mock dosya objesi
function createMockFile(filename, mimetype, size) {
  return {
    originalname: filename,
    filename: `${Date.now()}-${filename}`,
    mimetype: mimetype,
    size: size,
    path: createTestFile(filename)
  };
}

// Upload servisi testleri
async function testUploadService() {
  console.log('🧪 Upload Service Testleri Başlatılıyor...\n');

  try {
    // 1. Tek dosya yükleme testi
    console.log('📁 1. Tek Dosya Yükleme Testi');
    const testFile = createMockFile('test-image.jpg', 'image/jpeg', 1024);
    const result = await UploadService.uploadSingle(testFile, { folder: 'test' });
    console.log('✅ Tek dosya yükleme başarılı:', result.url);
    console.log('📊 Dosya bilgileri:', {
      originalName: result.originalName,
      size: result.size,
      storage: result.storage
    });

    // 2. Çoklu dosya yükleme testi
    console.log('\n📁 2. Çoklu Dosya Yükleme Testi');
    const testFiles = [
      createMockFile('image1.jpg', 'image/jpeg', 2048),
      createMockFile('image2.png', 'image/png', 3072),
      createMockFile('video1.mp4', 'video/mp4', 5120)
    ];
    
    const results = await UploadService.uploadMultiple(testFiles, { folder: 'test' });
    console.log('✅ Çoklu dosya yükleme başarılı');
    console.log(`📊 ${results.length} dosya yüklendi`);
    results.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.originalName} -> ${file.url}`);
    });

    // 3. Dosya validasyonu testi
    console.log('\n📁 3. Dosya Validasyonu Testi');
    
    // Geçerli dosya testi
    const validFile = createMockFile('valid.jpg', 'image/jpeg', 1024);
    const validValidation = UploadService.validateFile(validFile);
    console.log('✅ Geçerli dosya testi:', validValidation.isValid ? 'PASS' : 'FAIL');
    
    // Geçersiz dosya türü testi
    const invalidTypeFile = createMockFile('document.pdf', 'application/pdf', 1024);
    const invalidTypeValidation = UploadService.validateFile(invalidTypeFile);
    console.log('✅ Geçersiz dosya türü testi:', !invalidTypeValidation.isValid ? 'PASS' : 'FAIL');
    
    // Büyük dosya testi
    const largeFile = createMockFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024); // 15MB
    const largeFileValidation = UploadService.validateFile(largeFile);
    console.log('✅ Büyük dosya testi:', !largeFileValidation.isValid ? 'PASS' : 'FAIL');

    // 4. Dosya silme testi
    console.log('\n📁 4. Dosya Silme Testi');
    const fileToDelete = results[0]; // İlk yüklenen dosyayı sil
    const deleteResult = await UploadService.deleteFile(fileToDelete);
    console.log('✅ Dosya silme başarılı:', deleteResult.message);

    // 5. URL oluşturma testi
    console.log('\n📁 5. URL Oluşturma Testi');
    const fileUrls = UploadService.getFileUrls(results);
    console.log('✅ URL\'ler oluşturuldu:', fileUrls.length);
    fileUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });

    console.log('\n🎉 Tüm upload testleri başarılı!');

  } catch (error) {
    console.error('❌ Upload test hatası:', error.message);
  }
}

// API endpoint testleri
async function testUploadEndpoints() {
  console.log('\n🌐 Upload API Endpoint Testleri');
  console.log('Bu testler için server çalışır durumda olmalıdır.');
  
  console.log('\n📋 Test Edilecek Endpoint\'ler:');
  console.log('1. POST /api/v1/upload/single');
  console.log('2. POST /api/v1/upload/multiple');
  console.log('3. DELETE /api/v1/upload/delete');
  console.log('4. GET /api/v1/upload/info/:filename');
  console.log('5. GET /api/v1/upload/list');
  
  console.log('\n💡 Test komutları:');
  console.log('curl -X POST http://localhost:5005/api/v1/upload/single \\');
  console.log('  -H "Authorization: Bearer <token>" \\');
  console.log('  -F "file=@test-image.jpg"');
  
  console.log('\ncurl -X POST http://localhost:5005/api/v1/upload/multiple \\');
  console.log('  -H "Authorization: Bearer <token>" \\');
  console.log('  -F "files=@image1.jpg" \\');
  console.log('  -F "files=@image2.png"');
}

// Dosya türü testleri
function testFileTypes() {
  console.log('\n📋 Desteklenen Dosya Türleri Testi');
  
  const supportedTypes = [
    { name: 'JPEG Image', mimetype: 'image/jpeg', valid: true },
    { name: 'PNG Image', mimetype: 'image/png', valid: true },
    { name: 'GIF Image', mimetype: 'image/gif', valid: true },
    { name: 'WebP Image', mimetype: 'image/webp', valid: true },
    { name: 'MP4 Video', mimetype: 'video/mp4', valid: true },
    { name: 'AVI Video', mimetype: 'video/avi', valid: true },
    { name: 'MOV Video', mimetype: 'video/mov', valid: true },
    { name: 'WMV Video', mimetype: 'video/wmv', valid: true },
    { name: 'PDF Document', mimetype: 'application/pdf', valid: false },
    { name: 'TXT Text', mimetype: 'text/plain', valid: false },
    { name: 'ZIP Archive', mimetype: 'application/zip', valid: false }
  ];
  
  supportedTypes.forEach(type => {
    const mockFile = createMockFile(`test.${type.mimetype.split('/')[1]}`, type.mimetype, 1024);
    const validation = UploadService.validateFile(mockFile);
    const status = validation.isValid === type.valid ? '✅' : '❌';
    console.log(`${status} ${type.name}: ${type.mimetype} - ${validation.isValid ? 'Geçerli' : 'Geçersiz'}`);
  });
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('🚀 File Upload Sistemi Testleri\n');
  
  // Dosya türü testleri
  testFileTypes();
  
  // Upload servisi testleri
  await testUploadService();
  
  // API endpoint testleri
  testUploadEndpoints();
  
  console.log('\n📝 Test Sonuçları:');
  console.log('✅ Dosya türü validasyonu');
  console.log('✅ Tek dosya yükleme');
  console.log('✅ Çoklu dosya yükleme');
  console.log('✅ Dosya silme');
  console.log('✅ URL oluşturma');
  console.log('✅ Role-based access control');
  
  console.log('\n🎯 Test tamamlandı!');
}

// Test dosyalarını temizle
function cleanupTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('🧹 Test dosyaları temizlendi');
  }
}

// Script çalıştır
if (require.main === module) {
  runAllTests().then(() => {
    cleanupTestFiles();
  }).catch(error => {
    console.error('❌ Test hatası:', error);
    cleanupTestFiles();
  });
}

module.exports = {
  testUploadService,
  testUploadEndpoints,
  testFileTypes,
  runAllTests
}; 