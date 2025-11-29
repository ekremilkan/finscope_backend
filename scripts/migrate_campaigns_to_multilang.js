require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('../models/campaign.model');
const config = require('../configs');

async function migrateCampaigns() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(config.dbURI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const campaigns = await Campaign.find({});
    console.log(`📊 Toplam ${campaigns.length} kampanya bulundu`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const campaign of campaigns) {
      // Eğer zaten çoklu dil yapısındaysa atla
      if (typeof campaign.title === 'object' && campaign.title.tr) {
        console.log(`⏭️  Kampanya ${campaign._id} zaten çoklu dil formatında, atlanıyor`);
        skippedCount++;
        continue;
      }
      
      // Eski format (tek dil) - yeni formata dönüştür
      if (typeof campaign.title === 'string') {
        const oldTitle = campaign.title || '';
        const oldDescription = campaign.description || '';
        
        // Yeni çoklu dil yapısına dönüştür
        campaign.title = {
          tr: oldTitle,
          en: oldTitle // Varsayılan olarak aynı metni kullan (çeviri yapılacak)
        };
        
        // Description varsa dönüştür, yoksa boş obje oluştur
        if (oldDescription) {
          campaign.description = {
            tr: oldDescription,
            en: oldDescription
          };
        } else {
          campaign.description = {
            tr: '',
            en: ''
          };
        }
        
        // Content array'ini dönüştür
        if (Array.isArray(campaign.content)) {
          campaign.content = campaign.content.map(item => ({
            itemTitle: {
              tr: item.itemTitle || '',
              en: item.itemTitle || ''
            },
            itemDescription: {
              tr: item.itemDescription || '',
              en: item.itemDescription || ''
            },
            itemImage: item.itemImage || '',
            itemVideo: item.itemVideo || '',
            itemIndex: item.itemIndex || 1
          }));
        }
        
        // Segment description'larını dönüştür (eğer varsa)
        if (Array.isArray(campaign.segments)) {
          campaign.segments = campaign.segments.map(segment => {
            if (segment.description && typeof segment.description === 'string') {
              return {
                ...segment,
                description: {
                  tr: segment.description,
                  en: segment.description
                }
              };
            }
            return segment;
          });
        }
        
        await campaign.save();
        console.log(`✅ Kampanya ${campaign._id} migrate edildi`);
        migratedCount++;
      }
    }
    
    console.log('\n📊 Migration Özeti:');
    console.log(`✅ Migrate edilen: ${migratedCount}`);
    console.log(`⏭️  Atlanan: ${skippedCount}`);
    console.log(`📝 Toplam: ${campaigns.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Migration tamamlandı!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  }
}

migrateCampaigns();

