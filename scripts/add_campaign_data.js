/**
 * Kampanya ve Questions Verileri Ekleme Scripti
 * 
 * Bu script verdiğiniz admin token ile kampanya ve questions verileri ekler.
 * 
 * Kullanım: node scripts/add_campaign_data.js
 */

const mongoose = require('mongoose');
const axios = require('axios');

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

// Admin token
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODZhODBhZDRkZjhiNjk0YjFlOTAxNDAiLCJlbWFpbCI6ImNub3NtYW4xNDA0M0BnbWFpbC5jb20iLCJuYW1lIjoiY25vc21uIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUzNjM0OTA2LCJleHAiOjE3NTM2Mzg1MDZ9.O8tpDbKL193W-1QDSyFjrH9vx_92UkPWuWW_vwGk6V0';

// API base URL
const API_BASE_URL = 'http://localhost:5005/api/v1';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Kampanya verileri
const campaignData = [
  {
    title: 'Blockchain ve Kripto Para Eğitimi',
    description: 'Blockchain teknolojisi, kripto para birimleri ve DeFi uygulamaları hakkında kapsamlı eğitim. Bitcoin, Ethereum ve diğer kripto para birimlerinin temellerini öğrenin.',
    reward: 150,
    maxParticipants: 200,
    category: 'education',
    difficulty: 'Beginner',
    startDate: '2024-12-20T00:00:00.000Z',
    endDate: '2024-12-25T23:59:59.000Z',
    questions: 5,
    images: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      'https://images.unsplash.com/photo-1621416894560-3a23f3a1d8c5?w=800',
      'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800'
    ],
    videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'defi']
  },
  {
    title: 'Modern Web Geliştirme Teknikleri',
    description: 'React, Node.js, ve modern web teknolojileri ile full-stack uygulama geliştirme. REST API, state management ve deployment konularını kapsar.',
    reward: 200,
    maxParticipants: 150,
    category: 'technology',
    difficulty: 'Intermediate',
    startDate: '2024-12-22T00:00:00.000Z',
    endDate: '2024-12-28T23:59:59.000Z',
    questions: 6,
    images: [
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'
    ],
    videoLink: 'https://vimeo.com/123456789',
    tags: ['web-development', 'react', 'nodejs', 'javascript', 'api']
  },
  {
    title: 'Dijital Sağlık ve Fitness Rehberi',
    description: 'Modern yaşamda sağlıklı kalmanın yolları. Dijital fitness uygulamaları, beslenme ve wellness konularında pratik bilgiler.',
    reward: 100,
    maxParticipants: 300,
    category: 'health',
    difficulty: 'Beginner',
    startDate: '2024-12-25T00:00:00.000Z',
    endDate: '2024-12-30T23:59:59.000Z',
    questions: 4,
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
    ],
    tags: ['health', 'fitness', 'wellness', 'digital-health']
  },
  {
    title: 'Kişisel Finans ve Yatırım Stratejileri',
    description: 'Kişisel finans yönetimi, bütçe planlama ve yatırım stratejileri. Emeklilik planlaması ve finansal bağımsızlık konuları.',
    reward: 250,
    maxParticipants: 100,
    category: 'finance',
    difficulty: 'Advanced',
    startDate: '2024-12-28T00:00:00.000Z',
    endDate: '2025-01-05T23:59:59.000Z',
    questions: 7,
    images: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
    ],
    videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['finance', 'investment', 'budgeting', 'retirement', 'financial-literacy']
  }
];

// Soru verileri (her kampanya için)
const questionData = {
  'Blockchain ve Kripto Para Eğitimi': [
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
        { text: 'Hızlı işlem', isTrue: false },
        { text: 'Düşük maliyet', isTrue: false }
      ],
      order: 3
    },
    {
      questionText: 'DeFi nedir?',
      options: [
        { text: 'Merkezi finans', isTrue: false },
        { text: 'Merkezi olmayan finans', isTrue: true },
        { text: 'Dijital para', isTrue: false },
        { text: 'Kripto borsa', isTrue: false }
      ],
      order: 4
    },
    {
      questionText: 'NFT\'nin açılımı nedir?',
      options: [
        { text: 'Non-Fungible Token', isTrue: true },
        { text: 'New Financial Technology', isTrue: false },
        { text: 'Network File Transfer', isTrue: false },
        { text: 'Next Future Technology', isTrue: false }
      ],
      order: 5
    }
  ],
  'Modern Web Geliştirme Teknikleri': [
    {
      questionText: 'React\'te state yönetimi için hangi hook kullanılır?',
      options: [
        { text: 'useState', isTrue: true },
        { text: 'useEffect', isTrue: false },
        { text: 'useContext', isTrue: false },
        { text: 'useReducer', isTrue: false }
      ],
      order: 1
    },
    {
      questionText: 'Node.js hangi dilde yazılmıştır?',
      options: [
        { text: 'JavaScript', isTrue: false },
        { text: 'C++', isTrue: true },
        { text: 'Python', isTrue: false },
        { text: 'Java', isTrue: false }
      ],
      order: 2
    },
    {
      questionText: 'REST API\'de GET isteği ne için kullanılır?',
      options: [
        { text: 'Veri silmek', isTrue: false },
        { text: 'Veri okumak', isTrue: true },
        { text: 'Veri güncellemek', isTrue: false },
        { text: 'Veri eklemek', isTrue: false }
      ],
      order: 3
    },
    {
      questionText: 'JavaScript\'te async/await ne için kullanılır?',
      options: [
        { text: 'Asenkron işlemler', isTrue: true },
        { text: 'Senkron işlemler', isTrue: false },
        { text: 'Döngü işlemleri', isTrue: false },
        { text: 'Fonksiyon tanımlama', isTrue: false }
      ],
      order: 4
    },
    {
      questionText: 'npm nedir?',
      options: [
        { text: 'Node Package Manager', isTrue: true },
        { text: 'Network Protocol Manager', isTrue: false },
        { text: 'New Project Manager', isTrue: false },
        { text: 'Node Process Manager', isTrue: false }
      ],
      order: 5
    },
    {
      questionText: 'React\'te props nedir?',
      options: [
        { text: 'Component state\'i', isTrue: false },
        { text: 'Component parametreleri', isTrue: true },
        { text: 'Component lifecycle', isTrue: false },
        { text: 'Component event\'leri', isTrue: false }
      ],
      order: 6
    }
  ],
  'Dijital Sağlık ve Fitness Rehberi': [
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
      questionText: 'Hangi vitamin güneş ışığı ile üretilir?',
      options: [
        { text: 'Vitamin A', isTrue: false },
        { text: 'Vitamin B', isTrue: false },
        { text: 'Vitamin C', isTrue: false },
        { text: 'Vitamin D', isTrue: true }
      ],
      order: 2
    },
    {
      questionText: 'Haftada kaç gün egzersiz yapılmalıdır?',
      options: [
        { text: '1-2 gün', isTrue: false },
        { text: '3-4 gün', isTrue: true },
        { text: '5-6 gün', isTrue: false },
        { text: 'Her gün', isTrue: false }
      ],
      order: 3
    },
    {
      questionText: 'Uyku kalitesi için ne yapılmalıdır?',
      options: [
        { text: 'Geç yatmak', isTrue: false },
        { text: 'Düzenli uyku saatleri', isTrue: true },
        { text: 'Çok yemek', isTrue: false },
        { text: 'Egzersiz yapmamak', isTrue: false }
      ],
      order: 4
    }
  ],
  'Kişisel Finans ve Yatırım Stratejileri': [
    {
      questionText: 'Acil durum fonu ne kadar olmalıdır?',
      options: [
        { text: '1 aylık gider', isTrue: false },
        { text: '3-6 aylık gider', isTrue: true },
        { text: '1 yıllık gider', isTrue: false },
        { text: '2 yıllık gider', isTrue: false }
      ],
      order: 1
    },
    {
      questionText: 'Diversifikasyon nedir?',
      options: [
        { text: 'Risk dağıtımı', isTrue: true },
        { text: 'Para biriktirme', isTrue: false },
        { text: 'Borç alma', isTrue: false },
        { text: 'Yatırım yapma', isTrue: false }
      ],
      order: 2
    },
    {
      questionText: 'Compound interest nedir?',
      options: [
        { text: 'Basit faiz', isTrue: false },
        { text: 'Bileşik faiz', isTrue: true },
        { text: 'Kredi faizi', isTrue: false },
        { text: 'Mevduat faizi', isTrue: false }
      ],
      order: 3
    },
    {
      questionText: '50/30/20 kuralı nedir?',
      options: [
        { text: 'Bütçe planlama kuralı', isTrue: true },
        { text: 'Yatırım kuralı', isTrue: false },
        { text: 'Tasarruf kuralı', isTrue: false },
        { text: 'Borç kuralı', isTrue: false }
      ],
      order: 4
    },
    {
      questionText: 'ETF nedir?',
      options: [
        { text: 'Exchange Traded Fund', isTrue: true },
        { text: 'Electronic Transfer Fund', isTrue: false },
        { text: 'Exchange Trading Fee', isTrue: false },
        { text: 'Electronic Trading Fund', isTrue: false }
      ],
      order: 5
    },
    {
      questionText: 'Risk toleransı nedir?',
      options: [
        { text: 'Risk alma kapasitesi', isTrue: true },
        { text: 'Risk alma isteği', isTrue: false },
        { text: 'Risk alma zorunluluğu', isTrue: false },
        { text: 'Risk alma yasağı', isTrue: false }
      ],
      order: 6
    },
    {
      questionText: 'Emeklilik planlaması ne zaman başlamalıdır?',
      options: [
        { text: 'Emeklilik yaklaşınca', isTrue: false },
        { text: 'Erken yaşlarda', isTrue: true },
        { text: 'Orta yaşlarda', isTrue: false },
        { text: 'Geç yaşlarda', isTrue: false }
      ],
      order: 7
    }
  ]
};

// Kampanya oluştur
const createCampaign = async (campaignData) => {
  try {
    const response = await api.post('/campaigns/create', campaignData);
    console.log(`✅ Kampanya oluşturuldu: ${campaignData.title}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Kampanya oluşturma hatası: ${campaignData.title}`, error.response?.data || error.message);
    return null;
  }
};

// Soru oluştur
const createQuestion = async (questionData, campaignId) => {
  try {
    const response = await api.post('/questions/create', {
      ...questionData,
      campaignId: campaignId
    });
    console.log(`✅ Soru oluşturuldu: ${questionData.questionText.substring(0, 30)}...`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Soru oluşturma hatası: ${questionData.questionText.substring(0, 30)}...`, error.response?.data || error.message);
    return null;
  }
};

// Ana fonksiyon
const addSampleData = async () => {
  try {
    console.log('🚀 Kampanya ve Questions verileri ekleniyor...');
    
    // Kampanyaları oluştur
    const createdCampaigns = [];
    for (const campaign of campaignData) {
      const createdCampaign = await createCampaign(campaign);
      if (createdCampaign) {
        createdCampaigns.push({
          ...createdCampaign,
          title: campaign.title
        });
      }
    }
    
    console.log(`\n📊 ${createdCampaigns.length} kampanya oluşturuldu`);
    
    // Her kampanya için soruları oluştur
    for (const campaign of createdCampaigns) {
      const questions = questionData[campaign.title];
      if (questions) {
        console.log(`\n📝 "${campaign.title}" kampanyası için sorular ekleniyor...`);
        
        for (const question of questions) {
          await createQuestion(question, campaign._id);
        }
        
        console.log(`✅ "${campaign.title}" kampanyası için ${questions.length} soru eklendi`);
      }
    }
    
    console.log('\n🎉 Tüm veriler başarıyla eklendi!');
    
  } catch (error) {
    console.error('❌ Veri ekleme hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
connectDB().then(() => {
  addSampleData();
}); 