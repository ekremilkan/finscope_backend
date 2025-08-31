const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api/v1';

async function testSimpleCampaign() {
  try {
    console.log('🧪 Basit Kampanya Oluşturma Testi Başlıyor...\n');

    // 1. Admin girişi
    console.log('1️⃣ Admin girişi yapılıyor...');
    const loginResponse = await axios.post(`${BASE_URL}/user/login`, {
      email: 'cnosman14043@gmail.com',
      password: 'Osman.14043!'
    });
    
    if (loginResponse.data.success) {
      const authToken = loginResponse.data.data.token;
      console.log('✅ Admin girişi başarılı');
      
      // 2. Basit kampanya oluştur
      console.log('\n2️⃣ Basit kampanya oluşturuluyor...');
      
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const campaignData = {
        title: "Basit Test Kampanyası",
        description: "Kaldırılan alanlar olmadan basit kampanya",
        startDate: "2025-01-20T00:00:00.000Z",
        endDate: "2025-01-25T23:59:59.000Z",
        questions: 5,
        rewards: {
          A: 100,
          B: 75,
          C: 50,
          D: 25
        },
        maxParticipants: {
          A: 10,
          B: 20,
          C: 30,
          D: 40
        },
        tags: ["test", "simple"]
      };

      const createResponse = await axios.post(
        `${BASE_URL}/campaigns/create`,
        campaignData,
        { headers }
      );

      if (createResponse.data.success) {
        console.log('✅ Basit kampanya oluşturuldu!');
        console.log('\n📊 Kampanya Detayları:');
        
        const campaign = createResponse.data.data;
        console.log(`ID: ${campaign._id}`);
        console.log(`Title: ${campaign.title}`);
        console.log(`Description: ${campaign.description}`);
        console.log(`Status: ${campaign.status}`);
        console.log(`IsActive: ${campaign.isActive}`);
        console.log(`IsAdminAccept: ${campaign.isAdminAccept}`);
        
        console.log('\n💰 Segment Ödülleri:');
        console.log(`A Segmenti: ${campaign.rewards.A} puan`);
        console.log(`B Segmenti: ${campaign.rewards.B} puan`);
        console.log(`C Segmenti: ${campaign.rewards.C} puan`);
        console.log(`D Segmenti: ${campaign.rewards.D} puan`);
        
        console.log('\n👥 Katılımcı Limitleri:');
        console.log(`A Segmenti: ${campaign.maxParticipants.A} kişi`);
        console.log(`B Segmenti: ${campaign.maxParticipants.B} kişi`);
        console.log(`C Segmenti: ${campaign.maxParticipants.C} kişi`);
        console.log(`D Segmenti: ${campaign.maxParticipants.D} kişi`);
        
        // Kaldırılan alanların olmadığını kontrol et
        console.log('\n❌ Kaldırılan Alanlar:');
        console.log(`Category: ${campaign.category || 'YOK'}`);
        console.log(`EstimatedDuration: ${campaign.estimatedDuration || 'YOK'}`);
        console.log(`Images: ${campaign.images || 'YOK'}`);
        console.log(`VideoUrl: ${campaign.videoUrl || 'YOK'}`);
        console.log(`Reward: ${campaign.reward || 'YOK'}`);
        
      } else {
        console.log('❌ Kampanya oluşturma başarısız:', createResponse.data.message);
      }
    } else {
      console.log('❌ Admin girişi başarısız:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('💥 Test hatası:', error.response?.data || error.message);
  }
}

// Test'i çalıştır
testSimpleCampaign();
