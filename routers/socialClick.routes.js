const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");

const User = require("../models/user.model");

// ✅ Kullanıcının X veya Telegram butonuna tıklamasını kaydeder
router.post("/", protect, async (req, res) => {
  try {
    const { campaignId, platform } = req.body;
    if (!campaignId || !platform)
      return res.status(400).json({ message: "Eksik bilgi" });

    if (!["x", "telegram"].includes(platform))
      return res.status(400).json({ message: "Geçersiz platform" });

    const update = {
      $push: {
        [`socialClicks.${platform}`]: { campaignId, clickedAt: new Date() },
      },
    };

    await User.updateOne({ _id: req.user._id }, update);
    res.json({ success: true, message: "Tıklama kaydedildi" });
  } catch (err) {
    console.error("❌ social click error:", err);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

module.exports = router;
