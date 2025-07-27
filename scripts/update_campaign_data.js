/**
 * Mevcut Kampanya Verilerini Güncelleme Scripti
 * 
 * Bu script mevcut kampanya verilerini yeni alanlarla günceller.
 * 
 * Kullanım: node scripts/update_campaign_data.js
 */

const mongoose = require('mongoose');
const Campaign = require('../models/campaign.model');

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

// Kampanya verilerini güncelle
const updateCampaignData = async () => {
  try {
    console.log('🚀 Kampanya verileri güncelleniyor...');
    
    // Tüm kampanyaları getir
    const campaigns = await Campaign.find();
    console.log(`📊 ${campaigns.length} kampanya bulundu`);
    
    for (const campaign of campaigns) {
      console.log(`\n🔄 "${campaign.title}" kampanyası güncelleniyor...`);
      
      // Yeni alanları ekle
      const updateData = {
        participants: Math.floor(Math.random() * 100) + 10, // 10-110 arası rastgele
        currentParticipants: Math.floor(Math.random() * 80) + 5, // 5-85 arası rastgele
        content: `${campaign.description}\n\nBu kampanya hakkında detaylı bilgi ve eğitim materyalleri. Katılımcılar bu kampanya ile önemli bilgiler edinecek ve pratik deneyim kazanacaklar.`,
        videoUrl: campaign.videoLink, // Eski videoLink'i videoUrl'e kopyala
        imageUrls: campaign.images, // Eski images'i imageUrls'e kopyala
        estimatedDuration: Math.floor(Math.random() * 20) + 10 // 10-30 dakika arası
      };
      
      // Kampanyayı güncelle
      await Campaign.findByIdAndUpdate(campaign._id, updateData);
      
      console.log(`✅ "${campaign.title}" kampanyası güncellendi`);
      console.log(`   - Katılımcılar: ${updateData.participants}`);
      console.log(`   - Aktif katılımcılar: ${updateData.currentParticipants}`);
      console.log(`   - Tahmini süre: ${updateData.estimatedDuration} dakika`);
    }
    
    console.log('\n🎉 Tüm kampanya verileri başarıyla güncellendi!');
    
  } catch (error) {
    console.error('❌ Veri güncelleme hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
connectDB().then(() => {
  updateCampaignData();
}); 