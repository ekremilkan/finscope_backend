require("dotenv").config();
const { getDialogsSafe } = require("../services/telegramMtProto.service");

(async () => {
  try {
    const dialogs = await getDialogsSafe();
    console.log("📂 Telegram sohbet listesi:");
    dialogs.forEach((d, i) => {
      console.log(
        `${i + 1}. ${d.title} | id=${d.id} | username=${d.username} | group=${d.isGroup} | channel=${d.isChannel}`
      );
    });
    process.exit(0);
  } catch (err) {
    console.error("❌ Hata:", err);
    process.exit(1);
  }
})();
