const mongoose = require("mongoose");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const { StatusCodes } = require("http-status-codes");
const utils = require("../utils/index");
const crypto = require("crypto");
const { ethers } = require("ethers");

const nonceStore = require("./nonce-store.service"); // productionda Redis’e taşınması önerilir

exports.generateNonce = async (req) => {
  try {
    const { email } = req.query;
    if (!email) throw new Error("Email is required");

    const nonce = crypto.randomBytes(16).toString("hex");
    nonceStore.set(email, nonce);

    return { nonce };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.verifySignatureAndConnect = async (req) => {
  const { message, signature, network } = req.body;
  const { user: authenticatedUser } = req;

  // 1. Girdi ve kullanıcı kontrolü
  if (!message || !signature || !network) throw new Error("Eksik alanlar var.");
  console.log("🔍 İstek verileri:", { authenticatedUser })  ;
  if (!authenticatedUser || !authenticatedUser.userId) throw new Error("Geçerli bir kullanıcı oturumu gerekli.");
  
  // 2. İmza ve Nonce doğrulaması
  const recoveredAddress = ethers.utils.verifyMessage(message, signature).toLowerCase();
  const savedNonce = nonceStore.get(authenticatedUser.email);
  if (!savedNonce || !message.includes(savedNonce)) {
    throw new Error("Geçersiz veya süresi dolmuş nonce.");
  }
  nonceStore.delete(authenticatedUser.email);

  // 3. Cüzdanın başka birine ait olup olmadığını kontrol et
  const existingWallet = await Wallet.findOne({ address: recoveredAddress });
  if (existingWallet && existingWallet.user.toString() !== authenticatedUser.userId.toString()) {
    throw new Error("Bu cüzdan adresi zaten başka bir hesaba bağlı.");
  }
  if (existingWallet) {
    // Cüzdan zaten bu kullanıcıya ait ve doğrulanmışsa, işlemi bitir.
    if (!existingWallet.isVerified) {
        existingWallet.isVerified = true;
        await existingWallet.save(); // Transaction olmadan kaydet
    }
    return { message: "Bu cüzdan zaten hesabınıza bağlı." };
  }

  // --- YENİ VE SAĞLAM KAYIT MANTIĞI (TRANSACTION OLMADAN) ---
  let newWallet;
  try {
    // 4. Önce yeni cüzdanı oluştur ve veritabanına kaydet.
    console.log(`[DB] Yeni cüzdan kaydediliyor: ${recoveredAddress}`);
    newWallet = new Wallet({
      user: authenticatedUser.userId,
      address: recoveredAddress,
      network,
      isVerified: true,
    });
    await newWallet.save(); // Cüzdanı kaydet
    console.log(`[DB] Yeni cüzdan başarıyla kaydedildi. ID: ${newWallet._id}`);

    // 5. Cüzdan başarıyla kaydedildikten sonra, User modelini güncelle.
    console.log(`[DB] Kullanıcı güncelleniyor: ${authenticatedUser.userId}`);
    await User.findByIdAndUpdate(
      authenticatedUser.userId,
      { $push: { wallets: newWallet._id } } // $push operatörü ile atomik güncelleme
    );
    console.log(`[DB] Kullanıcı başarıyla güncellendi.`);
    
    // 6. Her şey başarılı, frontend'e başarı yanıtı dön.
    return {
      message: "Cüzdan başarıyla doğrulandı ve hesabınıza bağlandı.",
      address: recoveredAddress,
    };
  } catch (dbError) {
    // Eğer User güncellemesi veya Wallet kaydı başarısız olursa,
    // oluşturduğumuz cüzdanı silerek veritabanını temiz tutalım (manuel rollback).
    console.error("💥 Veritabanı kaydı sırasında kritik hata:", dbError);
    if (newWallet && newWallet._id) {
      console.log(`[DB Rollback] Başarısız işlem nedeniyle cüzdan siliniyor: ${newWallet._id}`);
      await Wallet.findByIdAndDelete(newWallet._id);
    }
    // Hatanın ne olduğunu frontend'e bildirelim.
    throw new Error("Cüzdan kaydedilirken bir veritabanı hatası oluştu.");
  }
};

exports.getUserWallets = async (req) => {
  try {
    // Middleware'den gelen req.user objesinden userId'yi alıyoruz
    const { userId } = req.user;
    if (!userId) {
      throw new Error("Kullanıcı kimliği bulunamadı.");
    }
    
    // --- DOĞRU SORGULAMA ---
    // Wallet modelinde 'user' alanı, giriş yapmış kullanıcının 'userId'sine eşit olanları bul.
    const wallets = await Wallet.find({ user: userId }).sort({ createdAt: -1 });
    // -----------------------

    return wallets;
  } catch (error) {
    // Orijinal hatayı loglamak daha faydalı olabilir
    console.error("getUserWallets service error:", error);
    throw new Error("Cüzdanlar listelenirken bir hata oluştu.");
  }
};


exports.getWalletStatus = async (req) => {
  try {
    const { userId } = req.user;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      throw new Error("Cüzdan adresi gerekli.");
    }

    const wallet = await Wallet.findOne({
      user: userId,
      address: walletAddress,
      isVerified: true,
    });

    if (wallet) {
      return { needsSignature: false };
    } else {
      return { needsSignature: true };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};


exports.deleteWallet = async (req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId } = req.user;
    const { address } = req.params;

    const wallet = await Wallet.findOne({ user: userId, address: address.toLowerCase() });
    if (!wallet) {
      throw new Error("Silinecek cüzdan bulunamadı veya bu cüzdan size ait değil.");
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { wallets: wallet._id } },
      { session }
    );

    await Wallet.deleteOne({ _id: wallet._id }, { session });

    await session.commitTransaction();
    return { message: "Cüzdan başarıyla silindi." };
  } catch (error) {
    await session.abortTransaction();
    throw new Error("Cüzdan silinirken bir hata oluştu.");
  } finally {
    session.endSession();
  }
};

exports.updateWalletNetwork = async (req) => {
  try {
    const { userId } = req.user;
    const { address } = req.params;
    const { network } = req.body;

    
    if (!network) {
      throw new Error("Yeni ağ bilgisi ('network') zorunludur.");
    }

    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: userId, address: address.toLowerCase() },
      { $set: { network: network } }, 
      { new: true } 
    );


    if (!updatedWallet) {
      throw new Error("Cüzdan bulunamadı veya bu cüzdan size ait değil.");
    }

  
    return {
      message: "Cüzdanın ağı başarıyla güncellendi.",
      wallet: updatedWallet,
    };
    
  } catch (error) {
    
    console.error("updateWalletNetwork service error:", error);
    throw new Error("Cüzdan ağı güncellenirken bir hata oluştu.");
  }
};
