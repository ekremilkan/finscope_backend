# 🚀 Sunucuya Deploy Rehberi

Bu rehber, FinScope Backend projesini sunucuya deploy etmek için gerekli adımları açıklar.

## 📋 Ön Gereksinimler

### 1. Sunucu Gereksinimleri
- **OS**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **RAM**: Minimum 2GB (4GB önerilen)
- **Disk**: Minimum 20GB (video yükleme için daha fazla)
- **CPU**: 2 core (4 core önerilen)

### 2. Gerekli Yazılımlar
- Node.js 16+ (LTS)
- Nginx
- PM2 (Process Manager)
- MongoDB
- Git

## 🔧 Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketleri yükle
sudo apt install -y curl wget git nginx mongodb

# Node.js yükle (NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 global yükle
sudo npm install -g pm2
```

### 2. Proje Kurulumu

```bash
# Proje klasörü oluştur
sudo mkdir -p /var/www/finscope_backend
sudo chown -R $USER:$USER /var/www/finscope_backend

# Projeyi klonla
cd /var/www/finscope_backend
git clone <your-repo-url> .

# Bağımlılıkları yükle
npm install

# Upload klasörü oluştur
mkdir -p uploads
chmod 755 uploads
```

### 3. Environment Variables

```bash
# .env dosyası oluştur
nano .env
```

```env
# Server Configuration
NODE_ENV=production
PORT=5005
BASE_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb://localhost:27017/finscope

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Cloudinary (Opsiyonel)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Opsiyonel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Segment Window
SEGMENT_WINDOW_DAYS=90
```

### 4. Nginx Konfigürasyonu

```bash
# Nginx konfigürasyonunu kopyala
sudo cp nginx.conf /etc/nginx/sites-available/finscope

# Site'ı aktifleştir
sudo ln -s /etc/nginx/sites-available/finscope /etc/nginx/sites-enabled/

# Default site'ı kaldır (opsiyonel)
sudo rm /etc/nginx/sites-enabled/default

# Nginx'i test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### 5. PM2 Konfigürasyonu

```bash
# PM2 ecosystem dosyası oluştur
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'finscope-backend',
    script: 'server.js',
    instances: 'max', // CPU core sayısı kadar instance
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5005
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5005
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

```bash
# Log klasörü oluştur
mkdir -p logs

# PM2 ile uygulamayı başlat
pm2 start ecosystem.config.js --env production

# PM2'yi sistem başlangıcında çalıştır
pm2 startup
pm2 save
```

### 6. Firewall Ayarları

```bash
# UFW firewall aktifleştir
sudo ufw enable

# Gerekli portları aç
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS
sudo ufw allow 27017 # MongoDB (sadece local)

# Firewall durumunu kontrol et
sudo ufw status
```

## 🔧 Nginx Özel Ayarları

### Upload Klasörü İzinleri

```bash
# Upload klasörü izinlerini ayarla
sudo chown -R www-data:www-data /var/www/finscope_backend/uploads
sudo chmod -R 755 /var/www/finscope_backend/uploads

# Nginx'in dosyalara erişebilmesi için
sudo usermod -a -G www-data $USER
```

### Nginx Konfigürasyon Optimizasyonu

```bash
# Nginx ana konfigürasyonunu düzenle
sudo nano /etc/nginx/nginx.conf
```

```nginx
# http bloğu içine ekle
http {
    # Client max body size
    client_max_body_size 100M;
    
    # Timeout ayarları
    client_body_timeout 300s;
    client_header_timeout 300s;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;
}
```

## 📁 Dosya Yapısı

```
/var/www/finscope_backend/
├── server.js
├── package.json
├── ecosystem.config.js
├── nginx.conf
├── .env
├── uploads/                 # Yüklenen dosyalar
│   ├── campaigns/
│   └── users/
├── logs/                    # PM2 logları
│   ├── err.log
│   ├── out.log
│   └── combined.log
└── node_modules/
```

## 🔍 Monitoring ve Loglar

### PM2 Monitoring

```bash
# Uygulama durumunu kontrol et
pm2 status

# Logları izle
pm2 logs finscope-backend

# Uygulamayı yeniden başlat
pm2 restart finscope-backend

# Uygulamayı durdur
pm2 stop finscope-backend
```

### Nginx Logları

```bash
# Access logları
sudo tail -f /var/log/nginx/finscope_access.log

# Error logları
sudo tail -f /var/log/nginx/finscope_error.log

# Nginx durumu
sudo systemctl status nginx
```

## 🚨 Sorun Giderme

### 1. Upload Sorunları

```bash
# Upload klasörü izinlerini kontrol et
ls -la /var/www/finscope_backend/uploads/

# Nginx error loglarını kontrol et
sudo tail -f /var/log/nginx/error.log

# PM2 loglarını kontrol et
pm2 logs finscope-backend --err
```

### 2. CORS Sorunları

```bash
# Nginx konfigürasyonunda CORS headers kontrol et
sudo nano /etc/nginx/sites-available/finscope

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### 3. Dosya Boyutu Sorunları

```bash
# Nginx client_max_body_size kontrol et
grep -r "client_max_body_size" /etc/nginx/

# Node.js body parser limit kontrol et
grep -r "limit" server.js
```

## 🔒 SSL/HTTPS Kurulumu (Opsiyonel)

### Let's Encrypt ile SSL

```bash
# Certbot yükle
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

## 📊 Performans Optimizasyonu

### 1. Nginx Optimizasyonu

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;
```

### 2. PM2 Optimizasyonu

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'finscope-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5005
    }
  }]
};
```

## 🧪 Test Senaryoları

### 1. API Test

```bash
# Health check
curl http://your-domain.com/api/health

# Upload test
curl -X POST http://your-domain.com/api/v1/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-image.jpg"
```

### 2. Video Upload Test

```bash
# Video yükleme testi
curl -X POST http://your-domain.com/api/v1/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-video.mp4"
```

## 📝 Notlar

1. **Domain**: `your-domain.com` yerine gerçek domain adınızı yazın
2. **Port**: 5005 yerine istediğiniz portu kullanabilirsiniz
3. **SSL**: HTTPS için Let's Encrypt kullanın
4. **Monitoring**: PM2 monitoring ve nginx loglarını düzenli kontrol edin
5. **Backup**: Upload klasörünü düzenli yedekleyin
6. **Security**: Firewall ve güvenlik ayarlarını kontrol edin

## 🔄 Güncelleme Süreci

```bash
# Yeni kodu çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# Uygulamayı yeniden başlat
pm2 restart finscope-backend

# Nginx'i yeniden başlat (gerekirse)
sudo systemctl restart nginx
```
