/**
 * 10 Adet Örnek Kampanya Verisi Ekleme Scripti - Local Database
 * 
 * Bu dosya local MongoDB veritabanına 10 adet örnek kampanya verisi eklemek için kullanılır.
 * 
 * Kullanım: node scripts/add_campaign_data_local.js
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Campaign = require('../models/campaign.model');

// Local MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/finscope_db_local");
    console.log('✅ Local MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ Local MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

// 10 adet örnek kampanya oluştur
const createCampaigns = async () => {
  try {
    // Önce bir admin kullanıcı bul veya oluştur
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

    const campaigns = [];

    // 1. DeFi ve Yield Farming Kampanyası
    const defiCampaign = new Campaign({
      title: 'DeFi ve Yield Farming Rehberi',
      description: 'Decentralized Finance dünyasına giriş yapın. Uniswap, Compound, Aave gibi protokolleri öğrenin ve yield farming stratejilerini keşfedin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
          itemVideo: '',
          itemTitle: 'DeFi Nedir?',
          itemDescription: 'Decentralized Finance kavramının temelleri ve geleneksel finansla farkları',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800',
          itemVideo: '',
          itemTitle: 'Yield Farming',
          itemDescription: 'Liquidity sağlayarak nasıl pasif gelir elde edebilirsiniz',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 200,
          maxParticipants: 50,
          currentParticipants: 0,


          description: 'Yüksek deneyimli DeFi kullanıcıları',
          filters: [
            {
              field: 'defi_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'swap', min_value: 10000, min_count: 5 },
                  { name: 'lending', min_value: 5000, min_count: 3 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 1000, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 150,
          maxParticipants: 100,
          currentParticipants: 0,


          description: 'Orta seviye DeFi kullanıcıları',
          filters: [
            {
              field: 'defi_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'swap', min_value: 5000, min_count: 3 },
                  { name: 'lending', min_value: 2000, min_count: 2 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 500, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 100,
          maxParticipants: 200,
          currentParticipants: 0,


          description: 'DeFi\'ye yeni başlayanlar',
          filters: [
            {
              field: 'defi_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'swap', min_value: 1000, min_count: 1 },
                  { name: 'other', min_value: 500, min_count: 1 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 100, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-20T00:00:00.000Z'),
      endDate: new Date('2024-12-30T23:59:59.000Z'),
      questions: 12,
      questionIds: [],
      tags: ['defi', 'yield-farming', 'uniswap', 'compound', 'aave'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200',
      twitter_url: 'https://twitter.com/defi_protocol',
      telegram_url: 'https://t.me/defi_community',
      website_url: 'https://defi-protocol.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await defiCampaign.save();
    campaigns.push(defiCampaign);
    console.log('✅ DeFi kampanyası oluşturuldu');

    // 2. NFT ve Metaverse Kampanyası
    const nftCampaign = new Campaign({
      title: 'NFT ve Metaverse Dünyası',
      description: 'Non-Fungible Token\'lar ve metaverse ekosistemini keşfedin. OpenSea, Decentraland ve diğer NFT platformlarını öğrenin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=800',
          itemVideo: '',
          itemTitle: 'NFT Nedir?',
          itemDescription: 'Non-Fungible Token kavramı ve kullanım alanları',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=800',
          itemVideo: '',
          itemTitle: 'Metaverse',
          itemDescription: 'Sanal dünyalar ve dijital varlık sahipliği',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 180,
          maxParticipants: 40,
          currentParticipants: 0,


          description: 'NFT koleksiyoncuları',
          filters: [
            {
              field: 'nft_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'other', min_value: 5000, min_count: 3 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 1000, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 120,
          maxParticipants: 80,
          currentParticipants: 0,


          description: 'NFT deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'nft_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 2000, min_count: 2 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 500, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 80,
          maxParticipants: 150,
          currentParticipants: 0,


          description: 'NFT\'ye yeni başlayanlar',
          filters: [
            {
              field: 'nft_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 500, min_count: 1 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 100, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-25T00:00:00.000Z'),
      endDate: new Date('2025-01-05T23:59:59.000Z'),
      questions: 10,
      questionIds: [],
      tags: ['nft', 'metaverse', 'opensea', 'decentraland', 'digital-art'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=200',
      twitter_url: 'https://twitter.com/nft_platform',
      telegram_url: 'https://t.me/nft_community',
      website_url: 'https://nft-platform.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await nftCampaign.save();
    campaigns.push(nftCampaign);
    console.log('✅ NFT kampanyası oluşturuldu');

    // 3. Layer 2 Solutions Kampanyası
    const layer2Campaign = new Campaign({
      title: 'Layer 2 Scaling Solutions',
      description: 'Ethereum\'un ölçeklenebilirlik sorunlarına çözümler. Polygon, Arbitrum, Optimism gibi Layer 2 protokollerini öğrenin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800',
          itemVideo: '',
          itemTitle: 'Layer 2 Nedir?',
          itemDescription: 'Ethereum\'un ölçeklenebilirlik çözümleri',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800',
          itemVideo: '',
          itemTitle: 'Polygon ve Arbitrum',
          itemDescription: 'Popüler Layer 2 protokolleri ve kullanım alanları',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 160,
          maxParticipants: 60,
          currentParticipants: 0,


          description: 'Layer 2 deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'layer2_volume',
              chain: ['ARB', 'ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'bridge', min_value: 8000, min_count: 4 },
                  { name: 'swap', min_value: 5000, min_count: 3 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 2000, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 110,
          maxParticipants: 120,
          currentParticipants: 0,


          description: 'Layer 2 kullanımı olan kullanıcılar',
          filters: [
            {
              field: 'layer2_volume',
              chain: ['ARB', 'ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'bridge', min_value: 3000, min_count: 2 },
                  { name: 'swap', min_value: 2000, min_count: 2 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 1000, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 70,
          maxParticipants: 200,
          currentParticipants: 0,


          description: 'Layer 2\'ye yeni başlayanlar',
          filters: [
            {
              field: 'layer2_volume',
              chain: ['ARB', 'ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'bridge', min_value: 1000, min_count: 1 },
                  { name: 'swap', min_value: 500, min_count: 1 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 200, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-22T00:00:00.000Z'),
      endDate: new Date('2025-01-02T23:59:59.000Z'),
      questions: 14,
      questionIds: [],
      tags: ['layer2', 'polygon', 'arbitrum', 'optimism', 'scaling'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=200',
      twitter_url: 'https://twitter.com/layer2_solutions',
      telegram_url: 'https://t.me/layer2_community',
      website_url: 'https://layer2-solutions.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await layer2Campaign.save();
    campaigns.push(layer2Campaign);
    console.log('✅ Layer 2 kampanyası oluşturuldu');

    // 4. GameFi ve Play-to-Earn Kampanyası
    const gamefiCampaign = new Campaign({
      title: 'GameFi ve Play-to-Earn Oyunları',
      description: 'Oyun oynayarak para kazanma dünyasına giriş yapın. Axie Infinity, The Sandbox ve diğer GameFi projelerini keşfedin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
          itemVideo: '',
          itemTitle: 'GameFi Nedir?',
          itemDescription: 'Oyun ve finansın birleşimi',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
          itemVideo: '',
          itemTitle: 'Play-to-Earn',
          itemDescription: 'Oyun oynayarak nasıl gelir elde edilir',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 140,
          maxParticipants: 45,
          currentParticipants: 0,


          description: 'GameFi deneyimi olan oyuncular',
          filters: [
            {
              field: 'gamefi_volume',
              chain: ['ETH', 'BNB'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'other', min_value: 3000, min_count: 5 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 500, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 90,
          maxParticipants: 90,
          currentParticipants: 0,


          description: 'GameFi\'ye ilgi duyan kullanıcılar',
          filters: [
            {
              field: 'gamefi_volume',
              chain: ['ETH', 'BNB'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 1500, min_count: 3 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 200, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 60,
          maxParticipants: 180,
          currentParticipants: 0,


          description: 'GameFi\'ye yeni başlayanlar',
          filters: [
            {
              field: 'gamefi_volume',
              chain: ['ETH', 'BNB'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 500, min_count: 1 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 100, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-28T00:00:00.000Z'),
      endDate: new Date('2025-01-08T23:59:59.000Z'),
      questions: 8,
      questionIds: [],
      tags: ['gamefi', 'play-to-earn', 'axie-infinity', 'sandbox', 'gaming'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200',
      twitter_url: 'https://twitter.com/gamefi_platform',
      telegram_url: 'https://t.me/gamefi_community',
      website_url: 'https://gamefi-platform.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await gamefiCampaign.save();
    campaigns.push(gamefiCampaign);
    console.log('✅ GameFi kampanyası oluşturuldu');

    // 5. Cross-Chain Bridge Kampanyası
    const bridgeCampaign = new Campaign({
      title: 'Cross-Chain Bridge Teknolojileri',
      description: 'Farklı blockchain ağları arasında varlık transferi. Multichain, Stargate ve diğer bridge protokollerini öğrenin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800',
          itemVideo: '',
          itemTitle: 'Cross-Chain Bridge',
          itemDescription: 'Blockchain\'ler arası köprü teknolojileri',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800',
          itemVideo: '',
          itemTitle: 'Bridge Güvenliği',
          itemDescription: 'Bridge protokollerinde güvenlik önlemleri',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 170,
          maxParticipants: 35,
          currentParticipants: 0,


          description: 'Bridge deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'bridge_volume',
              chain: ['ETH', 'BNB', 'ARB'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'bridge', min_value: 15000, min_count: 8 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 5000, min_count: 3 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 130,
          maxParticipants: 70,
          currentParticipants: 0,


          description: 'Bridge kullanımı olan kullanıcılar',
          filters: [
            {
              field: 'bridge_volume',
              chain: ['ETH', 'BNB', 'ARB'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'bridge', min_value: 8000, min_count: 4 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 2000, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 90,
          maxParticipants: 140,
          currentParticipants: 0,


          description: 'Bridge\'e yeni başlayanlar',
          filters: [
            {
              field: 'bridge_volume',
              chain: ['ETH', 'BNB', 'ARB'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'bridge', min_value: 2000, min_count: 2 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 500, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-18T00:00:00.000Z'),
      endDate: new Date('2024-12-28T23:59:59.000Z'),
      questions: 16,
      questionIds: [],
      tags: ['bridge', 'cross-chain', 'multichain', 'stargate', 'interoperability'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=200',
      twitter_url: 'https://twitter.com/bridge_protocol',
      telegram_url: 'https://t.me/bridge_community',
      website_url: 'https://bridge-protocol.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await bridgeCampaign.save();
    campaigns.push(bridgeCampaign);
    console.log('✅ Bridge kampanyası oluşturuldu');

    // 6. Staking ve Validator Kampanyası
    const stakingCampaign = new Campaign({
      title: 'Staking ve Validator Rehberi',
      description: 'Proof-of-Stake konsensüs mekanizması ve validator olma süreci. Ethereum 2.0, Solana ve diğer PoS ağlarını öğrenin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
          itemVideo: '',
          itemTitle: 'Staking Nedir?',
          itemDescription: 'Proof-of-Stake konsensüs mekanizması',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
          itemVideo: '',
          itemTitle: 'Validator Olmak',
          itemDescription: 'Blockchain ağlarında validator olma süreci',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 190,
          maxParticipants: 30,
          currentParticipants: 0,


          description: 'Validator deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'staking_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'other', min_value: 20000, min_count: 10 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 10000, min_count: 5 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 140,
          maxParticipants: 60,
          currentParticipants: 0,


          description: 'Staking deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'staking_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 10000, min_count: 5 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 5000, min_count: 3 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 100,
          maxParticipants: 120,
          currentParticipants: 0,


          description: 'Staking\'e yeni başlayanlar',
          filters: [
            {
              field: 'staking_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 3000, min_count: 2 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 1000, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-15T00:00:00.000Z'),
      endDate: new Date('2024-12-25T23:59:59.000Z'),
      questions: 18,
      questionIds: [],
      tags: ['staking', 'validator', 'pos', 'ethereum2', 'consensus'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200',
      twitter_url: 'https://twitter.com/staking_platform',
      telegram_url: 'https://t.me/staking_community',
      website_url: 'https://staking-platform.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await stakingCampaign.save();
    campaigns.push(stakingCampaign);
    console.log('✅ Staking kampanyası oluşturuldu');

    // 7. DAO ve Governance Kampanyası
    const daoCampaign = new Campaign({
      title: 'DAO ve Governance Modelleri',
      description: 'Decentralized Autonomous Organization\'lar ve blockchain tabanlı yönetişim sistemleri. MakerDAO, Uniswap DAO örnekleri.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
          itemVideo: '',
          itemTitle: 'DAO Nedir?',
          itemDescription: 'Merkezi olmayan özerk organizasyonlar',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
          itemVideo: '',
          itemTitle: 'Governance Token',
          itemDescription: 'Yönetişim tokenları ve oy verme sistemleri',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 160,
          maxParticipants: 40,
          currentParticipants: 0,


          description: 'DAO deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'dao_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'other', min_value: 8000, min_count: 6 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 2000, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 110,
          maxParticipants: 80,
          currentParticipants: 0,


          description: 'DAO\'ya katılım deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'dao_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 4000, min_count: 3 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 1000, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 80,
          maxParticipants: 160,
          currentParticipants: 0,


          description: 'DAO\'ya yeni başlayanlar',
          filters: [
            {
              field: 'dao_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 1000, min_count: 1 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'meme', min_value: 200, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-30T00:00:00.000Z'),
      endDate: new Date('2025-01-10T23:59:59.000Z'),
      questions: 13,
      questionIds: [],
      tags: ['dao', 'governance', 'makerdao', 'uniswap', 'voting'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200',
      twitter_url: 'https://twitter.com/dao_platform',
      telegram_url: 'https://t.me/dao_community',
      website_url: 'https://dao-platform.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await daoCampaign.save();
    campaigns.push(daoCampaign);
    console.log('✅ DAO kampanyası oluşturuldu');

    // 8. DeFi Lending ve Borrowing Kampanyası
    const lendingCampaign = new Campaign({
      title: 'DeFi Lending ve Borrowing',
      description: 'Merkezi olmayan kredi ve borç verme protokolleri. Compound, Aave ve diğer lending platformlarını öğrenin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          itemVideo: '',
          itemTitle: 'DeFi Lending',
          itemDescription: 'Merkezi olmayan kredi verme sistemleri',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          itemVideo: '',
          itemTitle: 'Collateral ve Liquidation',
          itemDescription: 'Teminat ve tasfiye mekanizmaları',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 200,
          maxParticipants: 50,
          currentParticipants: 0,


          description: 'Lending deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'lending_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'lending', min_value: 12000, min_count: 8 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 6000, min_count: 4 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 150,
          maxParticipants: 100,
          currentParticipants: 0,


          description: 'Lending kullanımı olan kullanıcılar',
          filters: [
            {
              field: 'lending_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'lending', min_value: 6000, min_count: 4 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 3000, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 100,
          maxParticipants: 200,
          currentParticipants: 0,


          description: 'Lending\'e yeni başlayanlar',
          filters: [
            {
              field: 'lending_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'lending', min_value: 2000, min_count: 2 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 1000, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-12T00:00:00.000Z'),
      endDate: new Date('2024-12-22T23:59:59.000Z'),
      questions: 15,
      questionIds: [],
      tags: ['lending', 'borrowing', 'compound', 'aave', 'defi'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200',
      twitter_url: 'https://twitter.com/lending_protocol',
      telegram_url: 'https://t.me/lending_community',
      website_url: 'https://lending-protocol.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await lendingCampaign.save();
    campaigns.push(lendingCampaign);
    console.log('✅ Lending kampanyası oluşturuldu');

    // 9. DEX ve AMM Kampanyası
    const dexCampaign = new Campaign({
      title: 'DEX ve Automated Market Maker',
      description: 'Decentralized Exchange\'ler ve otomatik piyasa yapıcı protokoller. Uniswap V3, SushiSwap ve diğer DEX\'leri öğrenin.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          itemVideo: '',
          itemTitle: 'DEX Nedir?',
          itemDescription: 'Merkezi olmayan borsalar',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          itemVideo: '',
          itemTitle: 'AMM Protokolleri',
          itemDescription: 'Otomatik piyasa yapıcı algoritmalar',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 180,
          maxParticipants: 45,
          currentParticipants: 0,


          description: 'DEX deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'dex_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'swap', min_value: 15000, min_count: 10 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 5000, min_count: 3 },
                  { name: 'meme', min_value: 2000, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 130,
          maxParticipants: 90,
          currentParticipants: 0,


          description: 'DEX kullanımı olan kullanıcılar',
          filters: [
            {
              field: 'dex_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'swap', min_value: 8000, min_count: 6 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 2000, min_count: 2 },
                  { name: 'meme', min_value: 1000, min_count: 1 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 90,
          maxParticipants: 180,
          currentParticipants: 0,


          description: 'DEX\'e yeni başlayanlar',
          filters: [
            {
              field: 'dex_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'swap', min_value: 3000, min_count: 3 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 1000, min_count: 1 },
                  { name: 'meme', min_value: 500, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-08T00:00:00.000Z'),
      endDate: new Date('2024-12-18T23:59:59.000Z'),
      questions: 17,
      questionIds: [],
      tags: ['dex', 'amm', 'uniswap', 'sushiswap', 'trading'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200',
      twitter_url: 'https://twitter.com/dex_protocol',
      telegram_url: 'https://t.me/dex_community',
      website_url: 'https://dex-protocol.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await dexCampaign.save();
    campaigns.push(dexCampaign);
    console.log('✅ DEX kampanyası oluşturuldu');

    // 10. Web3 ve dApp Development Kampanyası
    const web3Campaign = new Campaign({
      title: 'Web3 ve dApp Development',
      description: 'Web3 teknolojileri ve merkezi olmayan uygulama geliştirme. Solidity, Web3.js ve dApp geliştirme süreçleri.',
      content: [
        {
          itemImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          itemVideo: '',
          itemTitle: 'Web3 Nedir?',
          itemDescription: 'Web3 teknolojileri ve merkezi olmayan internet',
          itemIndex: 1
        },
        {
          itemImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          itemVideo: '',
          itemTitle: 'dApp Development',
          itemDescription: 'Merkezi olmayan uygulama geliştirme süreçleri',
          itemIndex: 2
        }
      ],
      segments: [
        {
          name: 'A',
          reward: 220,
          maxParticipants: 25,
          currentParticipants: 0,


          description: 'dApp geliştirme deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'dapp_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'and',
                types: [
                  { name: 'other', min_value: 20000, min_count: 15 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 8000, min_count: 5 },
                  { name: 'meme', min_value: 3000, min_count: 3 }
                ]
              }
            }
          ]
        },
        {
          name: 'B',
          reward: 160,
          maxParticipants: 50,
          currentParticipants: 0,


          description: 'Web3 deneyimi olan kullanıcılar',
          filters: [
            {
              field: 'dapp_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 10000, min_count: 8 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 4000, min_count: 3 },
                  { name: 'meme', min_value: 1500, min_count: 2 }
                ]
              }
            }
          ]
        },
        {
          name: 'C',
          reward: 110,
          maxParticipants: 100,
          currentParticipants: 0,


          description: 'Web3\'e yeni başlayanlar',
          filters: [
            {
              field: 'dapp_volume',
              chain: ['ETH'],
              tx_types: {
                state: 'or',
                types: [
                  { name: 'other', min_value: 5000, min_count: 4 }
                ]
              },
              token_types: {
                state: 'and',
                types: [
                  { name: 'stable', min_value: 2000, min_count: 2 },
                  { name: 'meme', min_value: 500, min_count: 1 }
                ]
              }
            }
          ]
        }
      ],
      startDate: new Date('2024-12-05T00:00:00.000Z'),
      endDate: new Date('2024-12-15T23:59:59.000Z'),
      questions: 20,
      questionIds: [],
      tags: ['web3', 'dapp', 'solidity', 'web3js', 'development'],
      createdUserId: adminUser._id,
      company_logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200',
      twitter_url: 'https://twitter.com/web3_platform',
      telegram_url: 'https://t.me/web3_community',
      website_url: 'https://web3-platform.com',
      status: 'upcoming',
      isActive: true,
      isAdminAccept: true
    });
    await web3Campaign.save();
    campaigns.push(web3Campaign);
    console.log('✅ Web3 kampanyası oluşturuldu');

    return campaigns;

  } catch (error) {
    console.error('❌ Kampanya oluşturma hatası:', error.message);
    throw error;
  }
};

// Ana fonksiyon
const addCampaignDataLocal = async () => {
  try {
    console.log('🚀 Local veritabanına 10 adet kampanya verisi ekleniyor...\n');

    // Kampanyaları oluştur
    const campaigns = await createCampaigns();

    console.log('\n📊 Oluşturulan Kampanyalar:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.title}`);
      console.log(`   - Segmentler: ${campaign.segments.map(s => s.name).join(', ')}`);
      console.log(`   - Başlangıç: ${campaign.startDate.toLocaleDateString('tr-TR')}`);
      console.log(`   - Bitiş: ${campaign.endDate.toLocaleDateString('tr-TR')}`);
      console.log(`   - Soru Sayısı: ${campaign.questions}`);
      console.log('');
    });

    console.log(`✅ Toplam ${campaigns.length} kampanya local veritabanına başarıyla eklendi!`);
    console.log('\n🔗 Kampanyalar şu durumda:');
    console.log('- Tümü "upcoming" durumunda');
    console.log('- Admin onayı alınmış');
    console.log('- Aktif durumda');
    console.log('- Segment bazlı ödül sistemi ile');

  } catch (error) {
    console.error('❌ Veri ekleme hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Local MongoDB bağlantısı kapatıldı');
  }
};

// Script çalıştır
if (require.main === module) {
  connectDB().then(() => {
    addCampaignDataLocal();
  });
}

module.exports = {
  addCampaignDataLocal,
  createCampaigns
};

