/**
 * Aktif Kampanya Oluşturma Scripti
 * 
 * Bu script aktif bir kampanya oluşturur.
 * 
 * Kullanım: node scripts/create_active_campaign.js
 */

const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://tahatufek05:DjHdBAPfg6snM32F@finscope.4p52ak4.mongodb.net/");
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

// Admin token
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODZhODBhZDRkZjhiNjk0YjFlOTAxNDAiLCJlbWFpbCI6ImNub3NtYW4xNDA0M0BnbWFpbC5jb20iLCJuYW1lIjoiY25vc21uIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUzNjM0OTA2LCJleHAiOjE3NTM2Mzg1MDZ9.O8tpDbKL193W-1QDSyFjrH9vx_92UkPWuWW_vwGk6V0';

// API base URL
const API_BASE_URL = 'http://localhost:5005/api/v1';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Aktif kampanya verisi
const activeCampaignData = {
  title: 'Aktif Test Kampanyası',
  description: 'Bu kampanya test amaçlı oluşturulmuştur ve aktif durumdadır.',
  content: 'Bu kampanya hakkında detaylı bilgi ve eğitim materyalleri. Katılımcılar bu kampanya ile önemli bilgiler edinecek ve pratik deneyim kazanacaklar.',
  reward: 100,
  maxParticipants: 50,
  category: 'education',
  difficulty: 'Beginner',
  startDate: new Date().toISOString(), // Bugün başlar
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün sonra biter
  questions: 3,
  images: [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800'
  ],
  imageUrls: [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800'
  ],
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  tags: ['test', 'active', 'education'],
  estimatedDuration: 15
};

// Kampanya oluştur
const createActiveCampaign = async () => {
  try {
    const response = await api.post('/campaigns/create', activeCampaignData);
    console.log(`✅ Aktif kampanya oluşturuldu: ${activeCampaignData.title}`);
    console.log(`📊 Kampanya ID: ${response.data.data._id}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Kampanya oluşturma hatası:`, error.response?.data || error.message);
    return null;
  }
};

// Ana fonksiyon
const createActiveCampaignData = async () => {
  try {
    console.log('🚀 Aktif kampanya oluşturuluyor...');
    
    const campaign = await createActiveCampaign();
    
    if (campaign) {
      console.log('\n🎉 Aktif kampanya başarıyla oluşturuldu!');
      console.log(`📋 Kampanya ID: ${campaign._id}`);
      console.log(`📅 Başlangıç: ${campaign.startDate}`);
      console.log(`📅 Bitiş: ${campaign.endDate}`);
      console.log(`👥 Maksimum katılımcı: ${campaign.maxParticipants}`);
    }
    
  } catch (error) {
    console.error('❌ Veri oluşturma hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
connectDB().then(() => {
  createActiveCampaignData();
}); 