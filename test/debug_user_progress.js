require('dotenv').config();
const mongoose = require('mongoose');
const UserProgress = require('../models/userProgress.model');
const Campaign = require('../models/campaign.model');
const UserSegment = require('../models/userSegment.model');

const userId = '688dd674db9c42941be50587';

async function debugUserProgress() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // 1. Kullanıcının tüm UserProgress kayıtlarını getir
    console.log('1️⃣ Kullanıcının tüm UserProgress kayıtları:');
    const allProgress = await UserProgress.find({ userId }).populate('campaignId', 'title reward status isActive isAdminAccept endDate maxParticipants');
    
    console.log(`📊 Toplam UserProgress kayıt sayısı: ${allProgress.length}\n`);
    
    allProgress.forEach((progress, index) => {
      console.log(`${index + 1}. Campaign ID: ${progress.campaignId?._id || 'N/A'}`);
      console.log(`   Title: ${progress.campaignId?.title || 'N/A'}`);
      console.log(`   Reward: ${progress.campaignId?.reward || 'N/A'}`);
      console.log(`   Status: ${progress.campaignId?.status || 'N/A'}`);
      console.log(`   IsActive: ${progress.campaignId?.isActive || 'N/A'}`);
      console.log(`   IsAdminAccept: ${progress.campaignId?.isAdminAccept || 'N/A'}`);
      console.log(`   EndDate: ${progress.campaignId?.endDate || 'N/A'}`);
      console.log(`   Joined: ${progress.joined}`);
      console.log(`   Completed: ${progress.completed}`);
      console.log(`   Score: ${progress.score}`);
      console.log('   ---');
    });

    // 2. Kullanıcının segmentini kontrol et
    console.log('\n2️⃣ Kullanıcının segment bilgisi:');
    const userSegment = await UserSegment.findOne({ 
      userId, 
      chain: 'ethereum' 
    }).sort({ asOf: -1 });
    
    if (userSegment) {
      console.log(`Segment Class: ${userSegment.class}`);
      console.log(`Composite Score: ${userSegment.compositeScore}`);
      console.log(`Confidence: ${userSegment.confidence}`);
      console.log(`AsOf: ${userSegment.asOf}`);
    } else {
      console.log('❌ Kullanıcı segmenti bulunamadı');
    }

    // 3. Kullanıcının segmentine uygun tüm kampanyaları kontrol et
    console.log('\n3️⃣ Kullanıcının segmentine uygun tüm kampanyalar:');
    const segmentClass = userSegment?.class || 'D';
    
    const segmentCampaigns = await Campaign.find({
      status: { $in: ['active', 'expired'] },
      isActive: true,
      isAdminAccept: true,
      endDate: { $lte: new Date() },
      [`maxParticipants.${segmentClass}`]: { $gt: 0 }
    }).select('title reward status isActive isAdminAccept endDate maxParticipants');

    console.log(`📊 Segment ${segmentClass} için uygun kampanya sayısı: ${segmentCampaigns.length}\n`);
    
    segmentCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. Campaign ID: ${campaign._id}`);
      console.log(`   Title: ${campaign.title}`);
      console.log(`   Reward: ${campaign.reward}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   EndDate: ${campaign.endDate}`);
      console.log(`   MaxParticipants ${segmentClass}: ${campaign.maxParticipants[segmentClass]}`);
      console.log('   ---');
    });

    // 4. Tamamlanan kampanyaları kontrol et
    console.log('\n4️⃣ Tamamlanan kampanyalar:');
    const completedProgress = allProgress.filter(p => p.completed === true);
    console.log(`✅ Tamamlanan kampanya sayısı: ${completedProgress.length}`);
    
    completedProgress.forEach((progress, index) => {
      console.log(`${index + 1}. ${progress.campaignId?.title || 'N/A'} - ${progress.campaignId?.reward || 'N/A'} puan`);
    });

    // 5. Katıldığı ama tamamlamadığı kampanyaları kontrol et
    console.log('\n5️⃣ Katıldığı ama tamamlamadığı kampanyalar:');
    const inProgress = allProgress.filter(p => p.joined === true && p.completed === false);
    console.log(`🔄 Devam eden kampanya sayısı: ${inProgress.length}`);
    
    inProgress.forEach((progress, index) => {
      console.log(`${index + 1}. ${progress.campaignId?.title || 'N/A'} - ${progress.campaignId?.reward || 'N/A'} puan`);
    });

    // 6. Hiç katılmadığı kampanyaları kontrol et
    console.log('\n6️⃣ Hiç katılmadığı kampanyalar:');
    const userCampaignIds = allProgress.map(p => p.campaignId?._id?.toString());
    const notJoined = segmentCampaigns.filter(campaign => 
      !userCampaignIds.includes(campaign._id.toString())
    );
    console.log(`❌ Katılmadığı kampanya sayısı: ${notJoined.length}`);
    
    notJoined.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.title} - ${campaign.reward} puan`);
    });

  } catch (error) {
    console.error('💥 Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

debugUserProgress();
