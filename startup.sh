#!/bin/bash

# FinScope Backend Startup Script
# Bu script sunucuya deploy ederken çalıştırılacak

echo "🚀 FinScope Backend Deployment Starting..."

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hata kontrolü
set -e

# 1. Sistem güncellemesi
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Gerekli paketleri yükle
echo -e "${YELLOW}📦 Installing required packages...${NC}"
sudo apt install -y curl wget git nginx mongodb

# 3. Node.js yükle (eğer yoksa)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 4. PM2 yükle (eğer yoksa)
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# 5. Proje klasörü oluştur
echo -e "${YELLOW}📁 Creating project directory...${NC}"
sudo mkdir -p /var/www/finscope_backend
sudo chown -R $USER:$USER /var/www/finscope_backend

# 6. Upload klasörü oluştur
echo -e "${YELLOW}📁 Creating uploads directory...${NC}"
mkdir -p /var/www/finscope_backend/uploads
chmod 755 /var/www/finscope_backend/uploads

# 7. Log klasörü oluştur
echo -e "${YELLOW}📁 Creating logs directory...${NC}"
mkdir -p /var/www/finscope_backend/logs

# 8. Nginx konfigürasyonunu kopyala
echo -e "${YELLOW}⚙️ Configuring Nginx...${NC}"
if [ -f "nginx.conf" ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/finscope
    sudo ln -sf /etc/nginx/sites-available/finscope /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ nginx.conf file not found${NC}"
    exit 1
fi

# 9. Firewall ayarları
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 27017

# 10. MongoDB başlat
echo -e "${YELLOW}🗄️ Starting MongoDB...${NC}"
sudo systemctl start mongodb
sudo systemctl enable mongodb

# 11. Nginx başlat
echo -e "${YELLOW}🌐 Starting Nginx...${NC}"
sudo systemctl start nginx
sudo systemctl enable nginx

# 12. PM2 startup ayarla
echo -e "${YELLOW}🔄 Configuring PM2 startup...${NC}"
pm2 startup systemd -u $USER --hp $HOME
pm2 save

# 13. Uygulamayı başlat
echo -e "${YELLOW}🚀 Starting application...${NC}"
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
    echo -e "${GREEN}✅ Application started with PM2${NC}"
else
    echo -e "${RED}❌ ecosystem.config.js file not found${NC}"
    exit 1
fi

# 14. Durum kontrolü
echo -e "${YELLOW}📊 Checking status...${NC}"
pm2 status
sudo systemctl status nginx --no-pager
sudo systemctl status mongodb --no-pager

# 15. Test endpoint
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"
sleep 5
if curl -f http://localhost:5005/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is running and healthy${NC}"
else
    echo -e "${RED}❌ Application health check failed${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Configure your domain in nginx.conf"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Configure environment variables in .env"
echo "4. Test your application endpoints"
echo ""
echo -e "${YELLOW}🔍 Useful commands:${NC}"
echo "pm2 status                    # Check application status"
echo "pm2 logs finscope-backend     # View application logs"
echo "sudo systemctl status nginx   # Check nginx status"
echo "sudo tail -f /var/log/nginx/error.log  # View nginx errors"
