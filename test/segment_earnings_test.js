const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api/v1';
let authToken = '';

// Test kullanıcısı bilgileri
const testUser = {
  email: 'test@example.com',
  password: 'Test123!'
};

async function testSegmentEarningsAnalysis() {
  try {
    console.log('🧪 Segment Earnings Analysis Test Başlıyor...\n');

    // 1. Kullanıcı girişi
    console.log('1️⃣ Kullanıcı girişi yapılıyor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Giriş başarılı');
    } else {
      console.log('❌ Giriş başarısız:', loginResponse.data.message);
      return;
    }

    // 2. Segment earnings analysis endpoint'ini test et
    console.log('\n2️⃣ Segment earnings analysis endpoint test ediliyor...');
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    const analysisResponse = await axios.get(
      `${BASE_URL}/campaigns/user/segment-earnings-analysis`,
      { headers }
    );

    if (analysisResponse.data.success) {
      console.log('✅ Segment earnings analysis başarılı!');
      console.log('\n📊 Analiz Sonuçları:');
      
      const data = analysisResponse.data.data;
      
      console.log(`👤 UserCampaign Kayıtları: ${data.userCampaigns.totalUserCampaigns}`);
      console.log(`📊 Segmentler: ${data.userCampaigns.segments.join(', ')}`);
      
      console.log('\n💰 Kazanç Analizi:');
      console.log(`💵 Gerçek Kazanç: ${data.earnings.actualEarnings}`);
      console.log(`🎯 Potansiyel Kazanç: ${data.earnings.potentialEarnings}`);
      console.log(`❌ Kaçırılan Kazanç: ${data.earnings.missedEarnings}`);
      console.log(`📈 Tamamlama Oranı: %${data.earnings.completionRate}`);
      
      console.log('\n📋 Kampanya Özeti:');
      console.log(`✅ Tamamlanan: ${data.summary.totalCompletedCampaigns}`);
      console.log(`🎯 Potansiyel: ${data.summary.totalPotentialCampaigns}`);
      console.log(`❌ Kaçırılan: ${data.summary.totalMissedCampaigns}`);
      console.log(`🔄 Devam Eden: ${data.summary.totalInProgressCampaigns}`);
      
      if (data.campaigns.completed.length > 0) {
        console.log('\n✅ Tamamlanan Kampanyalar:');
        data.campaigns.completed.forEach((campaign, index) => {
          console.log(`  ${index + 1}. ${campaign.title} - ${campaign.reward} puan (Segment: ${campaign.userSegment})`);
        });
      }
      
      if (data.campaigns.potential.length > 0) {
        console.log('\n🎯 Potansiyel Kampanyalar:');
        data.campaigns.potential.slice(0, 3).forEach((campaign, index) => {
          console.log(`  ${index + 1}. ${campaign.title} - ${campaign.reward} puan (Segment: ${campaign.userSegment})`);
        });
        if (data.campaigns.potential.length > 3) {
          console.log(`  ... ve ${data.campaigns.potential.length - 3} kampanya daha`);
        }
      }
      
    } else {
      console.log('❌ Segment earnings analysis başarısız:', analysisResponse.data.message);
    }

  } catch (error) {
    console.error('💥 Test hatası:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Öneri: Kullanıcının wallet verification yapması gerekiyor olabilir.');
    }
  }
}

// Test'i çalıştır
testSegmentEarningsAnalysis();
