/**
 * Basit Kampanya Ekleme Scripti
 */

const mongoose = require('mongoose');
const Campaign = require('../models/campaign.model');
const User = require('../models/user.model');

async function addSimpleCampaigns() {
  try {
    console.log('🔌 Local MongoDB\'ye bağlanıyor...');
    await mongoose.connect('mongodb://localhost:27017/finscope_db_local');
    console.log('✅ Local MongoDB bağlantısı başarılı');
    
    // Mevcut kampanyaları sil
    console.log('🗑️ Mevcut kampanyalar siliniyor...');
    await Campaign.deleteMany({});
    console.log('✅ Mevcut kampanyalar silindi');
    
    // Admin kullanıcı oluştur
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@finscope.com',
        password: 'Admin123!',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin kullanıcısı oluşturuldu');
    }
    
    // Basit filtre şablonu
    const basicFilter = {
      field: 'defi_volume',
      chain: ['ETH'],
      tx_types: {
        state: 'and',
        types: [
          { name: 'swap', min_value: 1000, min_count: 1 }
        ]
      },
      token_types: {
        state: 'and',
        types: [
          { name: 'stable', min_value: 100, min_count: 1 }
        ]
      }
    };
    
    // 10 kampanya oluştur
    const campaigns = [
      {
        title: 'DeFi ve Yield Farming Rehberi',
        description: 'Decentralized Finance dünyasına giriş yapın. Uniswap, Compound, Aave gibi protokolleri öğrenin.',
        segments: [
          { name: 'A', reward: 200, maxParticipants: 50, currentParticipants: 0, description: 'Yüksek deneyimli DeFi kullanıcıları', filters: [basicFilter] },
          { name: 'B', reward: 150, maxParticipants: 100, currentParticipants: 0, description: 'Orta seviye DeFi kullanıcıları', filters: [basicFilter] },
          { name: 'C', reward: 100, maxParticipants: 200, currentParticipants: 0, description: 'DeFi\'ye yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-20T00:00:00.000Z'),
        endDate: new Date('2024-12-30T23:59:59.000Z'),
        questions: 12,
        tags: ['defi', 'yield-farming', 'uniswap', 'compound', 'aave']
      },
      {
        title: 'NFT ve Metaverse Dünyası',
        description: 'Non-Fungible Token\'lar ve metaverse ekosistemini keşfedin. OpenSea, Decentraland ve diğer NFT platformlarını öğrenin.',
        segments: [
          { name: 'A', reward: 180, maxParticipants: 40, currentParticipants: 0, description: 'NFT koleksiyoncuları', filters: [basicFilter] },
          { name: 'B', reward: 120, maxParticipants: 80, currentParticipants: 0, description: 'NFT deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 80, maxParticipants: 150, currentParticipants: 0, description: 'NFT\'ye yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-25T00:00:00.000Z'),
        endDate: new Date('2025-01-05T23:59:59.000Z'),
        questions: 10,
        tags: ['nft', 'metaverse', 'opensea', 'decentraland', 'digital-art']
      },
      {
        title: 'Layer 2 Scaling Solutions',
        description: 'Ethereum\'un ölçeklenebilirlik sorunlarına çözümler. Polygon, Arbitrum, Optimism gibi Layer 2 protokollerini öğrenin.',
        segments: [
          { name: 'A', reward: 160, maxParticipants: 60, currentParticipants: 0, description: 'Layer 2 deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 110, maxParticipants: 120, currentParticipants: 0, description: 'Layer 2 kullanımı olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 70, maxParticipants: 200, currentParticipants: 0, description: 'Layer 2\'ye yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-22T00:00:00.000Z'),
        endDate: new Date('2025-01-02T23:59:59.000Z'),
        questions: 14,
        tags: ['layer2', 'polygon', 'arbitrum', 'optimism', 'scaling']
      },
      {
        title: 'GameFi ve Play-to-Earn Oyunları',
        description: 'Oyun oynayarak para kazanma dünyasına giriş yapın. Axie Infinity, The Sandbox ve diğer GameFi projelerini keşfedin.',
        segments: [
          { name: 'A', reward: 140, maxParticipants: 45, currentParticipants: 0, description: 'GameFi deneyimi olan oyuncular', filters: [basicFilter] },
          { name: 'B', reward: 90, maxParticipants: 90, currentParticipants: 0, description: 'GameFi\'ye ilgi duyan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 60, maxParticipants: 180, currentParticipants: 0, description: 'GameFi\'ye yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-28T00:00:00.000Z'),
        endDate: new Date('2025-01-08T23:59:59.000Z'),
        questions: 8,
        tags: ['gamefi', 'play-to-earn', 'axie-infinity', 'sandbox', 'gaming']
      },
      {
        title: 'Cross-Chain Bridge Teknolojileri',
        description: 'Farklı blockchain ağları arasında varlık transferi. Multichain, Stargate ve diğer bridge protokollerini öğrenin.',
        segments: [
          { name: 'A', reward: 170, maxParticipants: 35, currentParticipants: 0, description: 'Bridge deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 130, maxParticipants: 70, currentParticipants: 0, description: 'Bridge kullanımı olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 90, maxParticipants: 140, currentParticipants: 0, description: 'Bridge\'e yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-18T00:00:00.000Z'),
        endDate: new Date('2024-12-28T23:59:59.000Z'),
        questions: 16,
        tags: ['bridge', 'cross-chain', 'multichain', 'stargate', 'interoperability']
      },
      {
        title: 'Staking ve Validator Rehberi',
        description: 'Proof-of-Stake konsensüs mekanizması ve validator olma süreci. Ethereum 2.0, Solana ve diğer PoS ağlarını öğrenin.',
        segments: [
          { name: 'A', reward: 190, maxParticipants: 30, currentParticipants: 0, description: 'Validator deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 140, maxParticipants: 60, currentParticipants: 0, description: 'Staking deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 100, maxParticipants: 120, currentParticipants: 0, description: 'Staking\'e yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-15T00:00:00.000Z'),
        endDate: new Date('2024-12-25T23:59:59.000Z'),
        questions: 18,
        tags: ['staking', 'validator', 'pos', 'ethereum2', 'consensus']
      },
      {
        title: 'DAO ve Governance Modelleri',
        description: 'Decentralized Autonomous Organization\'lar ve blockchain tabanlı yönetişim sistemleri. MakerDAO, Uniswap DAO örnekleri.',
        segments: [
          { name: 'A', reward: 160, maxParticipants: 40, currentParticipants: 0, description: 'DAO deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 110, maxParticipants: 80, currentParticipants: 0, description: 'DAO\'ya katılım deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 80, maxParticipants: 160, currentParticipants: 0, description: 'DAO\'ya yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-30T00:00:00.000Z'),
        endDate: new Date('2025-01-10T23:59:59.000Z'),
        questions: 13,
        tags: ['dao', 'governance', 'makerdao', 'uniswap', 'voting']
      },
      {
        title: 'DeFi Lending ve Borrowing',
        description: 'Merkezi olmayan kredi ve borç verme protokolleri. Compound, Aave ve diğer lending platformlarını öğrenin.',
        segments: [
          { name: 'A', reward: 200, maxParticipants: 50, currentParticipants: 0, description: 'Lending deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 150, maxParticipants: 100, currentParticipants: 0, description: 'Lending kullanımı olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 100, maxParticipants: 200, currentParticipants: 0, description: 'Lending\'e yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-12T00:00:00.000Z'),
        endDate: new Date('2024-12-22T23:59:59.000Z'),
        questions: 15,
        tags: ['lending', 'borrowing', 'compound', 'aave', 'defi']
      },
      {
        title: 'DEX ve Automated Market Maker',
        description: 'Decentralized Exchange\'ler ve otomatik piyasa yapıcı protokoller. Uniswap V3, SushiSwap ve diğer DEX\'leri öğrenin.',
        segments: [
          { name: 'A', reward: 180, maxParticipants: 45, currentParticipants: 0, description: 'DEX deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 130, maxParticipants: 90, currentParticipants: 0, description: 'DEX kullanımı olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 90, maxParticipants: 180, currentParticipants: 0, description: 'DEX\'e yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-08T00:00:00.000Z'),
        endDate: new Date('2024-12-18T23:59:59.000Z'),
        questions: 17,
        tags: ['dex', 'amm', 'uniswap', 'sushiswap', 'trading']
      },
      {
        title: 'Web3 ve dApp Development',
        description: 'Web3 teknolojileri ve merkezi olmayan uygulama geliştirme. Solidity, Web3.js ve dApp geliştirme süreçleri.',
        segments: [
          { name: 'A', reward: 220, maxParticipants: 25, currentParticipants: 0, description: 'dApp geliştirme deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'B', reward: 160, maxParticipants: 50, currentParticipants: 0, description: 'Web3 deneyimi olan kullanıcılar', filters: [basicFilter] },
          { name: 'C', reward: 110, maxParticipants: 100, currentParticipants: 0, description: 'Web3\'e yeni başlayanlar', filters: [basicFilter] }
        ],
        startDate: new Date('2024-12-05T00:00:00.000Z'),
        endDate: new Date('2024-12-15T23:59:59.000Z'),
        questions: 20,
        tags: ['web3', 'dapp', 'solidity', 'web3js', 'development']
      }
    ];
    
    console.log('🚀 10 kampanya oluşturuluyor...');
    
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = new Campaign({
        ...campaigns[i],
        content: [
          {
            itemImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
            itemVideo: '',
            itemTitle: campaigns[i].title + ' - Bölüm 1',
            itemDescription: 'Bu kampanyanın ilk bölümü',
            itemIndex: 1
          }
        ],
        createdUserId: adminUser._id,
        company_logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200',
        twitter_url: 'https://twitter.com/example',
        telegram_url: 'https://t.me/example',
        website_url: 'https://example.com',
        status: 'upcoming',
        isActive: true,
        isAdminAccept: true
      });
      
      await campaign.save();
      console.log(`✅ ${i + 1}. ${campaign.title} oluşturuldu`);
    }
    
    console.log(`\n🎉 Toplam ${campaigns.length} kampanya başarıyla eklendi!`);
    
    // Kontrol et
    const finalCount = await Campaign.countDocuments({});
    console.log(`📊 Veritabanındaki toplam kampanya sayısı: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Bağlantı kapatıldı');
  }
}

addSimpleCampaigns();

