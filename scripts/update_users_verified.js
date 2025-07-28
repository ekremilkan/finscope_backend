/**
 * Mevcut Kullanıcıları Doğrulanmış Olarak İşaretleme Scripti
 * 
 * Bu script mevcut kullanıcıların isVerified alanını true yapar.
 * 
 * Kullanım: node scripts/update_users_verified.js
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');

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

// Kullanıcıları güncelle
const updateUsersVerified = async () => {
  try {
    console.log('🚀 Kullanıcılar doğrulanmış olarak işaretleniyor...');
    
    // Tüm kullanıcıları getir
    const users = await User.find();
    console.log(`📊 ${users.length} kullanıcı bulundu`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      if (!user.isVerified) {
        console.log(`\n🔄 "${user.email}" kullanıcısı güncelleniyor...`);
        
        // isVerified'i true yap
        await User.findByIdAndUpdate(user._id, { isVerified: true });
        
        console.log(`✅ "${user.email}" kullanıcısı doğrulanmış olarak işaretlendi`);
        updatedCount++;
      } else {
        console.log(`✅ "${user.email}" kullanıcısı zaten doğrulanmış`);
      }
    }
    
    console.log(`\n🎉 İşlem tamamlandı!`);
    console.log(`📈 Toplam kullanıcı: ${users.length}`);
    console.log(`✅ Güncellenen kullanıcı: ${updatedCount}`);
    console.log(`🔄 Zaten doğrulanmış: ${users.length - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Veri güncelleme hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
connectDB().then(() => {
  updateUsersVerified();
}); 