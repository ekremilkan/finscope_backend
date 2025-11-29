require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/questions.model');
const config = require('../configs');

async function migrateQuestions() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(config.dbURI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const questions = await Question.find({});
    console.log(`📊 Toplam ${questions.length} soru bulundu`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const question of questions) {
      // Eğer zaten çoklu dil yapısındaysa atla
      if (typeof question.questionText === 'object' && question.questionText.tr) {
        console.log(`⏭️  Soru ${question._id} zaten çoklu dil formatında, atlanıyor`);
        skippedCount++;
        continue;
      }
      
      // Eski format (tek dil) - yeni formata dönüştür
      if (typeof question.questionText === 'string') {
        const oldQuestionText = question.questionText || '';
        
        // Yeni çoklu dil yapısına dönüştür
        question.questionText = {
          tr: oldQuestionText,
          en: oldQuestionText // Varsayılan olarak aynı metni kullan (çeviri yapılacak)
        };
        
        // Options array'ini dönüştür
        if (Array.isArray(question.options)) {
          question.options = question.options.map(option => ({
            text: {
              tr: option.text || '',
              en: option.text || ''
            },
            isTrue: option.isTrue || false
          }));
        }
        
        await question.save();
        console.log(`✅ Soru ${question._id} migrate edildi`);
        migratedCount++;
      }
    }
    
    console.log('\n📊 Migration Özeti:');
    console.log(`✅ Migrate edilen: ${migratedCount}`);
    console.log(`⏭️  Atlanan: ${skippedCount}`);
    console.log(`📝 Toplam: ${questions.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Migration tamamlandı!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  }
}

migrateQuestions();

