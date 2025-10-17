// services/nonce-store.js
const fs = require('fs');
const path = require('path');

const storePath = path.join(process.cwd(), 'nonce.json');

let store = {};
try {
  if (fs.existsSync(storePath)) {
    store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  }
} catch (error) {
  console.error('❌ Kalıcı nonce deposu okunamadı:', error);
}

const saveStore = () => {
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('❌ Kalıcı nonce deposu kaydedilemedi:', error);
  }
};

// DEĞİŞİKLİK: Fonksiyonları doğrudan module.exports'e atıyoruz.
module.exports = {
  set: (key, value) => {
    store[key] = { nonce: value, timestamp: Date.now() };
    saveStore();
  },

  get: (key) => {
    const entry = store[key];
    // Nonce'ları 5 dakika sonra geçersiz say
    if (entry && (Date.now() - entry.timestamp < 5 * 60 * 1000)) {
      return entry.nonce;
    }
    // Eğer süre dolmuşsa veya yoksa, sil ve null dön
    if (entry) {
      delete store[key];
      saveStore();
    }
    return null;
  },

  delete: (key) => {
    if (store[key]) {
      delete store[key];
      saveStore();
    }
  },
};