const Campaign = require("../models/campaign.model");

/**
 * Süresi dolmuş kampanyaları günceller
 * Bu fonksiyon cron job ile düzenli olarak çalıştırılabilir
 */
exports.updateExpiredCampaigns = async () => {
  try {
    const now = new Date();
    
    const result = await Campaign.updateMany(
      { 
        endDate: { $lt: now },
        status: { $ne: 'expired' }
      },
      { 
        status: 'expired',
        isActive: false
      }
    );
    
    return result;
  } catch (error) {
    console.error('❌ Kampanya güncelleme hatası:', error.message);
    throw error;
  }
};

/**
 * Aktif kampanyaları getirir
 */
exports.getActiveCampaigns = async () => {
  try {
    const now = new Date();
    
    return await Campaign.find({
      status: 'active',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gt: now }
    }).populate('createdUserId', 'name email');
  } catch (error) {
    console.error('❌ Aktif kampanya getirme hatası:', error.message);
    throw error;
  }
};

/**
 * Yaklaşan kampanyaları getirir
 */
exports.getUpcomingCampaigns = async () => {
  try {
    const now = new Date();
    
    return await Campaign.find({
      status: 'upcoming',
      isActive: true,
      startDate: { $gt: now }
    }).populate('createdUserId', 'name email');
  } catch (error) {
    console.error('❌ Yaklaşan kampanya getirme hatası:', error.message);
    throw error;
  }
};

/**
 * Kampanya durumunu kontrol eder ve günceller
 */
exports.checkAndUpdateCampaignStatus = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Kampanya bulunamadı');
    }
    
    const now = new Date();
    let statusChanged = false;
    
    if (campaign.endDate < now && campaign.status !== 'expired') {
      campaign.status = 'expired';
      campaign.isActive = false;
      statusChanged = true;
    } else if (campaign.startDate <= now && campaign.endDate > now && campaign.status !== 'active') {
      campaign.status = 'active';
      statusChanged = true;
    } else if (campaign.startDate > now && campaign.status !== 'upcoming') {
      campaign.status = 'upcoming';
      statusChanged = true;
    }
    
    if (statusChanged) {
      await campaign.save();
    }
    
    return campaign;
  } catch (error) {
    console.error('❌ Kampanya durum kontrolü hatası:', error.message);
    throw error;
  }
}; 