const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api/v1';
let authToken = '';

// Admin kullanıcısı bilgileri
const adminUser = {
  email: 'cnosman14043@gmail.com',
  password: 'Osman.14043!'
};

async function createSegmentCampaign() {
  try {
    console.log('🧪 Segment Bazlı Kampanya Oluşturma Testi Başlıyor...\n');

    // 1. Admin girişi
    console.log('1️⃣ Admin girişi yapılıyor...');
    const loginResponse = await axios.post(`${BASE_URL}/user/login`, adminUser);
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Admin girişi başarılı');
    } else {
      console.log('❌ Admin girişi başarısız:', loginResponse.data.message);
      return;
    }

    // 2. Segment bazlı ödüllü kampanya oluştur
    console.log('\n2️⃣ Segment bazlı ödüllü kampanya oluşturuluyor...');
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    const campaignData = {
      title: "Segment Bazlı Test Kampanyası",
      description: "Her segment için farklı ödül değerleri olan test kampanyası",
      startDate: "2025-01-20T00:00:00.000Z",
      endDate: "2025-01-25T23:59:59.000Z",
      questions: 5,
      // ✅ YENİ: Her segment için farklı ödül değerleri
      rewards: {
        A: 1000,  // A segmenti: 1000 puan
        B: 750,   // B segmenti: 750 puan
        C: 500,   // C segmenti: 500 puan
        D: 250    // D segmenti: 250 puan
      },
      // ✅ Eski reward alanı (geriye uyumluluk için)
      reward: 500,
      maxParticipants: {
        A: 50,
        B: 100,
        C: 150,
        D: 200
      },
      tags: ["test", "segment", "education"]
    };

    const createResponse = await axios.post(
      `${BASE_URL}/campaigns/create`,
      campaignData,
      { headers }
    );

    if (createResponse.data.success) {
      console.log('✅ Segment bazlı kampanya oluşturuldu!');
      console.log('\n📊 Kampanya Detayları:');
      
      const campaign = createResponse.data.data;
      console.log(`ID: ${campaign._id}`);
      console.log(`Title: ${campaign.title}`);
      console.log(`Status: ${campaign.status}`);
      console.log(`IsActive: ${campaign.isActive}`);
      console.log(`IsAdminAccept: ${campaign.isAdminAccept}`);
      
      console.log('\n💰 Segment Ödülleri:');
      console.log(`A Segmenti: ${campaign.rewards.A} puan`);
      console.log(`B Segmenti: ${campaign.rewards.B} puan`);
      console.log(`C Segmenti: ${campaign.rewards.C} puan`);
      console.log(`D Segmenti: ${campaign.rewards.D} puan`);
      console.log(`Fallback Reward: ${campaign.reward} puan`);
      
      console.log('\n👥 Katılımcı Limitleri:');
      console.log(`A Segmenti: ${campaign.maxParticipants.A} kişi`);
      console.log(`B Segmenti: ${campaign.maxParticipants.B} kişi`);
      console.log(`C Segmenti: ${campaign.maxParticipants.C} kişi`);
      console.log(`D Segmenti: ${campaign.maxParticipants.D} kişi`);
      
      // 3. Kampanyayı getir ve kontrol et
      console.log('\n3️⃣ Oluşturulan kampanya getiriliyor...');
      
      const getResponse = await axios.get(
        `${BASE_URL}/campaigns/${campaign._id}`,
        { headers }
      );
      
      if (getResponse.data.success) {
        console.log('✅ Kampanya başarıyla getirildi');
        const retrievedCampaign = getResponse.data.data;
        console.log(`Retrieved Rewards A: ${retrievedCampaign.rewards.A}`);
        console.log(`Retrieved Rewards D: ${retrievedCampaign.rewards.D}`);
      }
      
    } else {
      console.log('❌ Kampanya oluşturma başarısız:', createResponse.data.message);
    }

  } catch (error) {
    console.error('💥 Test hatası:', error.response?.data || error.message);
  }
}

// Test'i çalıştır
createSegmentCampaign();
