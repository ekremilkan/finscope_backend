const mongoose = require("mongoose");
const config = require("../configs"); // config dosyamızdan DB_URI'yi alacağız

exports.connectMongoDB = async () => {
  try {
    await mongoose.connect(config.dbURI);
    console.log("✅ MongoDB bağlantısı başarılı!");
  } catch (error) {
    console.error("❌ DB connect hatası:", error.message);
    process.exit(1);
  }
};
