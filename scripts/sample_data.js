/**
 * Örnek Veri Oluşturma Scripti
 * 
 * Bu dosya veritabanına örnek kampanya ve soru verileri eklemek için kullanılır.
 * 
 * Kullanım: node scripts/sample_data.js
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Campaign = require('../models/campaign.model');
const Question = require('../models/questions.model');

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

// Örnek kullanıcılar oluştur
const createSampleUsers = async () => {
  const users = [];
  
  // Admin kullanıcısı
  const adminUser = new User({
    name: 'Admin User',
    email: 'admin1@finscope.com',
    password: 'Admin123!',
    role: 'admin'
  });
  await adminUser.save();
  users.push(adminUser);
  console.log('✅ Admin kullanıcısı oluşturuldu');

  // Customer kullanıcıları
  const customer1 = new User({
    name: 'John Doe',
    email: 'john1@finscope.com',
    password: 'Customer123!',
    role: 'customer'
  });
  await customer1.save();
  users.push(customer1);

  const customer2 = new User({
    name: 'Jane Smith',
    email: 'jane@finscope.com',
    password: 'Customer123!',
    role: 'customer'
  });
  await customer2.save();
  users.push(customer2);
  console.log('✅ Customer kullanıcıları oluşturuldu');

  // Normal kullanıcı
  const normalUser = new User({
    name: 'Bob Wilson',
    email: 'bob@finscope.com',
    password: 'User123!',
    role: 'user'
  });
  await normalUser.save();
  users.push(normalUser);
  console.log('✅ Normal kullanıcı oluşturuldu');

  return users;
};

// Örnek kampanyalar oluştur
const createSampleCampaigns = async (users) => {
  const campaigns = [];
  
  // Blockchain Eğitimi Kampanyası
  const blockchainCampaign = new Campaign({
    title: 'Blockchain ve Kripto Para Eğitimi',
    description: 'Blockchain teknolojisi, kripto para birimleri ve DeFi uygulamaları hakkında kapsamlı eğitim. Bitcoin, Ethereum ve diğer kripto para birimlerinin temellerini öğrenin.',
    reward: 150,
    maxParticipants: 200,
    category: 'education',
    difficulty: 'Beginner',
    startDate: new Date('2024-12-20T00:00:00.000Z'),
    endDate: new Date('2024-12-25T23:59:59.000Z'),
    questions: 10,
    images: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      'https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800',
      'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800'
    ],
    videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'defi'],
    createdUserId: users[1]._id, // John Doe
    status: 'upcoming'
  });
  await blockchainCampaign.save();
  campaigns.push(blockchainCampaign);
  console.log('✅ Blockchain kampanyası oluşturuldu');

  // Web Geliştirme Kampanyası
  const webDevCampaign = new Campaign({
    title: 'Modern Web Geliştirme Teknikleri',
    description: 'React, Node.js ve modern web teknolojileri ile full-stack uygulama geliştirme. REST API, state management ve deployment konularını kapsar.',
    reward: 200,
    maxParticipants: 150,
    category: 'technology',
    difficulty: 'Intermediate',
    startDate: new Date('2024-12-15T00:00:00.000Z'),
    endDate: new Date('2024-12-30T23:59:59.000Z'),
    questions: 15,
    images: [
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'
    ],
    videoLink: 'https://vimeo.com/123456789',
    tags: ['web-development', 'react', 'nodejs', 'javascript', 'api'],
    createdUserId: users[2]._id, // Jane Smith
    status: 'active'
  });
  await webDevCampaign.save();
  campaigns.push(webDevCampaign);
  console.log('✅ Web geliştirme kampanyası oluşturuldu');

  // Sağlık ve Fitness Kampanyası
  const healthCampaign = new Campaign({
    title: 'Dijital Sağlık ve Fitness Rehberi',
    description: 'Modern yaşamda sağlıklı kalmanın yolları, dijital fitness uygulamaları ve wellness teknolojileri hakkında bilgi edinin.',
    reward: 100,
    maxParticipants: 300,
    category: 'health',
    difficulty: 'Beginner',
    startDate: new Date('2024-12-10T00:00:00.000Z'),
    endDate: new Date('2024-12-20T23:59:59.000Z'),
    questions: 8,
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
    ],
    videoLink: null,
    tags: ['health', 'fitness', 'wellness', 'digital-health'],
    createdUserId: users[1]._id, // John Doe
    status: 'active'
  });
  await healthCampaign.save();
  campaigns.push(healthCampaign);
  console.log('✅ Sağlık kampanyası oluşturuldu');

  // Finans Eğitimi Kampanyası
  const financeCampaign = new Campaign({
    title: 'Kişisel Finans ve Yatırım Stratejileri',
    description: 'Bütçe yönetimi, yatırım araçları, emeklilik planlaması ve finansal okuryazarlık konularında kapsamlı eğitim.',
    reward: 250,
    maxParticipants: 100,
    category: 'finance',
    difficulty: 'Advanced',
    startDate: new Date('2024-12-01T00:00:00.000Z'),
    endDate: new Date('2024-12-31T23:59:59.000Z'),
    questions: 20,
    images: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
    ],
    videoLink: 'https://www.youtube.com/watch?v=example',
    tags: ['finance', 'investment', 'budgeting', 'retirement', 'financial-literacy'],
    createdUserId: users[2]._id, // Jane Smith
    status: 'active'
  });
  await financeCampaign.save();
  campaigns.push(financeCampaign);
  console.log('✅ Finans kampanyası oluşturuldu');

  return campaigns;
};

// Örnek sorular oluştur
const createSampleQuestions = async (campaigns, users) => {
  const questions = [];

  // Blockchain kampanyası için sorular
  const blockchainQuestions = [
    {
      questionText: 'Blockchain teknolojisinin temel özelliği nedir?',
      options: [
        { text: 'Merkezi kontrol', isTrue: false },
        { text: 'Değiştirilemezlik (Immutability)', isTrue: true },
        { text: 'Hızlı işlem', isTrue: false },
        { text: 'Düşük maliyet', isTrue: false }
      ],
      order: 1
    },
    {
      questionText: 'Bitcoin\'in yaratıcısı kimdir?',
      options: [
        { text: 'Vitalik Buterin', isTrue: false },
        { text: 'Satoshi Nakamoto', isTrue: true },
        { text: 'Mark Zuckerberg', isTrue: false },
        { text: 'Elon Musk', isTrue: false }
      ],
      order: 2
    },
    {
      questionText: 'Ethereum\'un ana özelliği nedir?',
      options: [
        { text: 'Sadece kripto para', isTrue: false },
        { text: 'Akıllı kontratlar', isTrue: true },
        { text: 'Hızlı transfer', isTrue: false },
        { text: 'Düşük maliyet', isTrue: false }
      ],
      order: 3
    }
  ];

  for (let i = 0; i < blockchainQuestions.length; i++) {
    const question = new Question({
      ...blockchainQuestions[i],
      campaignId: campaigns[0]._id,
      createdUserId: users[1]._id
    });
    await question.save();
    questions.push(question);
  }
  console.log('✅ Blockchain soruları oluşturuldu');

  // Web geliştirme kampanyası için sorular
  const webDevQuestions = [
    {
      questionText: 'React\'te state yönetimi için hangi hook kullanılır?',
      options: [
        { text: 'useEffect', isTrue: false },
        { text: 'useState', isTrue: true },
        { text: 'useContext', isTrue: false },
        { text: 'useReducer', isTrue: false }
      ],
      order: 1
    },
    {
      questionText: 'Node.js hangi JavaScript motorunu kullanır?',
      options: [
        { text: 'SpiderMonkey', isTrue: false },
        { text: 'V8', isTrue: true },
        { text: 'Chakra', isTrue: false },
        { text: 'JavaScriptCore', isTrue: false }
      ],
      order: 2
    },
    {
      questionText: 'REST API\'de GET isteği ne için kullanılır?',
      options: [
        { text: 'Veri silmek', isTrue: false },
        { text: 'Veri güncellemek', isTrue: false },
        { text: 'Veri okumak', isTrue: true },
        { text: 'Veri oluşturmak', isTrue: false }
      ],
      order: 3
    }
  ];

  for (let i = 0; i < webDevQuestions.length; i++) {
    const question = new Question({
      ...webDevQuestions[i],
      campaignId: campaigns[1]._id,
      createdUserId: users[2]._id
    });
    await question.save();
    questions.push(question);
  }
  console.log('✅ Web geliştirme soruları oluşturuldu');

  // Sağlık kampanyası için sorular
  const healthQuestions = [
    {
      questionText: 'Günlük su tüketimi ne kadar olmalıdır?',
      options: [
        { text: '1-2 litre', isTrue: false },
        { text: '2-3 litre', isTrue: true },
        { text: '4-5 litre', isTrue: false },
        { text: '6-7 litre', isTrue: false }
      ],
      order: 1
    },
    {
      questionText: 'Hangi vitamin D vitamini için önemlidir?',
      options: [
        { text: 'Güneş ışığı', isTrue: true },
        { text: 'Su', isTrue: false },
        { text: 'Protein', isTrue: false },
        { text: 'Karbonhidrat', isTrue: false }
      ],
      order: 2
    }
  ];

  for (let i = 0; i < healthQuestions.length; i++) {
    const question = new Question({
      ...healthQuestions[i],
      campaignId: campaigns[2]._id,
      createdUserId: users[1]._id
    });
    await question.save();
    questions.push(question);
  }
  console.log('✅ Sağlık soruları oluşturuldu');

  // Finans kampanyası için sorular
  const financeQuestions = [
    {
      questionText: 'Bileşik faiz nedir?',
      options: [
        { text: 'Sadece ana para üzerinden faiz', isTrue: false },
        { text: 'Ana para + faiz üzerinden faiz', isTrue: true },
        { text: 'Sabit faiz oranı', isTrue: false },
        { text: 'Değişken faiz oranı', isTrue: false }
      ],
      order: 1
    },
    {
      questionText: 'ETF\'nin açılımı nedir?',
      options: [
        { text: 'Exchange Traded Fund', isTrue: true },
        { text: 'Electronic Transfer Fund', isTrue: false },
        { text: 'Exchange Transfer Fund', isTrue: false },
        { text: 'Electronic Traded Fund', isTrue: false }
      ],
      order: 2
    }
  ];

  for (let i = 0; i < financeQuestions.length; i++) {
    const question = new Question({
      ...financeQuestions[i],
      campaignId: campaigns[3]._id,
      createdUserId: users[2]._id
    });
    await question.save();
    questions.push(question);
  }
  console.log('✅ Finans soruları oluşturuldu');

  return questions;
};

// Ana fonksiyon
const createSampleData = async () => {
  try {
    console.log('🚀 Örnek veri oluşturma başlatılıyor...\n');

    // Mevcut verileri temizle
    await Campaign.deleteMany({});
    await Question.deleteMany({});
    console.log('✅ Mevcut veriler temizlendi');

    // Kullanıcıları oluştur
    const users = await createSampleUsers();

    // Kampanyaları oluştur
    const campaigns = await createSampleCampaigns(users);

    // Soruları oluştur
    const questions = await createSampleQuestions(campaigns, users);

    console.log('\n📊 Oluşturulan Veriler:');
    console.log(`👥 Kullanıcılar: ${users.length}`);
    console.log(`📝 Kampanyalar: ${campaigns.length}`);
    console.log(`❓ Sorular: ${questions.length}`);

    console.log('\n✅ Örnek veriler başarıyla oluşturuldu!');
    console.log('\n🔗 Test için kullanabileceğiniz kullanıcılar:');
    console.log('Admin: admin1@finscope.com / Admin123!');
    console.log('Customer 1: john1@finscope.com / Customer123!');
    console.log('Customer 2: jane@finscope.com / Customer123!');
    console.log('User: bob@finscope.com / User123!');

  } catch (error) {
    console.error('❌ Veri oluşturma hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script çalıştır
if (require.main === module) {
  connectDB().then(() => {
    createSampleData();
  });
}

module.exports = {
  createSampleData,
  createSampleUsers,
  createSampleCampaigns,
  createSampleQuestions
}; 