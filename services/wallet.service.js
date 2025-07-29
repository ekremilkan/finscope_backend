const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const { StatusCodes } = require("http-status-codes");
const utils = require("../utils/index");
const crypto = require("crypto");
const { ethers } = require("ethers");

const nonceStore = require('./nonce-store.service') // productionda Redis’e taşınması önerilir

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
  // Mongoose session'ı sadece bu fonksiyonun başında başlatıyoruz
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("➡️ [verifySignature] İstek geldi. Body:", req.body);
    const { email, message, signature, network, address: frontendAddress } = req.body;

    if (!email || !message || !signature || !network) {
      throw new Error("Eksik alanlar var (email, message, signature, network)");
    }

    console.log("⏳ [verifySignature] İmza doğrulanıyor...");
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    console.log(`✅ [verifySignature] İmzadan çıkarılan adres: ${recoveredAddress}`);
    console.log(`ℹ️ [verifySignature] Frontend'den gönderilen adres: ${frontendAddress}`);

    // Güvenlik için her zaman imzadan çıkarılan adresi kullanırız.
    const addressToSave = recoveredAddress;

    const savedNonce = nonceStore.get(email);
    if (!savedNonce || !message.includes(savedNonce)) {
      console.error(`❌ [verifySignature] Nonce hatası! Beklenen nonce'u içeren mesaj bekleniyordu.`);
      throw new Error("Geçersiz veya süresi dolmuş nonce");
    }
    console.log("✅ [verifySignature] Nonce doğrulandı.");

    const user = await User.findOne({ email }).session(session);
    if (!user) {
      console.error(`❌ [verifySignature] Kullanıcı bulunamadı: ${email}`);
      throw new Error("Kullanıcı bulunamadı");
    }
    console.log(`✅ [verifySignature] Kullanıcı bulundu: ${user._id}`);

    const existingWallet = await Wallet.findOne({ address: addressToSave }).session(session);
    if (existingWallet) {
      console.error(`❌ [verifySignature] Bu cüzdan zaten kullanımda: ${addressToSave}`);
      throw new Error("Bu cüzdan adresi zaten başka bir hesaba bağlı.");
    }
    console.log("✅ [verifySignature] Cüzdan daha önce bağlanmamış.");

    console.log("⏳ [verifySignature] Yeni cüzdan veritabanına kaydediliyor...");
    const wallet = new Wallet({ user: user._id, address: addressToSave, network });
    await wallet.save({ session });

    user.wallets.push(wallet._id);
    await user.save({ session });

    // Tüm işlemler başarılı, transaction'ı onayla.
    await session.commitTransaction();
    console.log("✅ [verifySignature] Veritabanı işlemleri başarıyla tamamlandı (commit).");

    // Her şey bittikten sonra nonce'u sil.
    nonceStore.delete(email);
    console.log(`✅ [verifySignature] Nonce silindi: ${email}`);
    
    return { message: "Wallet connected", address: addressToSave };

  } catch (error) {
    // Herhangi bir hata olursa tüm işlemleri geri al.
    await session.abortTransaction();
    console.error("💥 [verifySignature] Hata nedeniyle işlemler geri alındı (abort):", error.message);
    
    // Hatayı üst katmana fırlat
    throw new Error(error.message);

  } finally {
    // Her durumda (başarılı veya başarısız) session'ı sonlandır.
    session.endSession();
  }
};

exports.connectWallet = async (req) => {
  const { userId, network, address } = req.body;

  const walletExists = await Wallet.findOne({ address });
  if (walletExists) {
    const err = new Error(
      "Bu cüzdan adresi zaten başka bir kullanıcı tarafından bağlanmış."
    );
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const walletCountForNetwork = await Wallet.countDocuments({
    user: userId,
    network,
  });
  if (walletCountForNetwork >= 3) {
    const err = new Error(`Bu ağ için en fazla 3 cüzdan bağlayabilirsiniz.`);
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // 3. Kullanıcıyı bul.
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("Kullanıcı bulunamadı.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  const newWallet = new Wallet({
    user: userId,
    network,
    address,
  });
  await newWallet.save();

  user.wallets.push(newWallet._id);
  await user.save();

  const updatedUser = await User.findById(userId).select("-password");
  const wallets = await Wallet.find({ _id: { $in: updatedUser.wallets } });
  const userResponse = updatedUser.toObject();
  userResponse.wallets = wallets;

  return userResponse;
};

exports.setAirdropWallet = async (req) => {
  const { userId, address } = req.body;

  const targetWallet = await Wallet.findOne({ user: userId, address });
  if (!targetWallet) {
    const err = new Error(
      "Kullanıcının cüzdanları arasında belirtilen adres bulunamadı."
    );
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  await Wallet.updateMany({ user: userId }, { isAirdropAddress: false });

  targetWallet.isAirdropAddress = true;
  await targetWallet.save();

  const updatedUser = await User.findById(userId).select("-password");
  const wallets = await Wallet.find({ _id: { $in: updatedUser.wallets } });
  const userResponse = updatedUser.toObject();
  userResponse.wallets = wallets;

  return userResponse;
};

// YENİ: Airdrop özelliğini kaldırma
exports.removeAirdropWallet = async (req) => {
  const { userId } = req.body;

  // Kullanıcının airdrop cüzdanı var mı kontrol et
  const airdropWallet = await Wallet.findOne({
    user: userId,
    isAirdropAddress: true,
  });
  if (!airdropWallet) {
    const err = new Error("Airdrop olarak ayarlanmış cüzdan bulunamadı.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Tüm cüzdanların airdrop özelliğini kaldır
  await Wallet.updateMany({ user: userId }, { isAirdropAddress: false });

  const updatedUser = await User.findById(userId).select("-password");
  const wallets = await Wallet.find({ _id: { $in: updatedUser.wallets } });
  const userResponse = updatedUser.toObject();
  userResponse.wallets = wallets;

  return {
    user: userResponse,
    removedAirdropAddress: airdropWallet.address,
    message: "Airdrop cüzdanı kaldırıldı",
  };
};

// YENİ: Mevcut airdrop cüzdanını gösterme
exports.getAirdropWallet = async (req) => {
  const { userId } = req.query;

  const airdropWallet = await Wallet.findOne({
    user: userId,
    isAirdropAddress: true,
  });

  if (!airdropWallet) {
    return {
      hasAirdrop: false,
      airdropWallet: null,
      message: "Airdrop cüzdanı ayarlanmamış",
    };
  }

  return {
    hasAirdrop: true,
    airdropWallet: airdropWallet,
    message: "Airdrop cüzdanı bulundu",
  };
};

// YENİ: Kullanıcının cüzdanlarını listeleme
exports.getUserWallets = async (req) => {
  const { userId } = req.body;

  const wallets = await Wallet.find({ user: userId }).sort({ createdAt: -1 });

  // Her cüzdan için toplam USD değerini hesapla
  const walletsWithCalculatedValues = wallets.map((wallet) => {
    const walletObj = wallet.toObject();

    // Eğer bakiye yoksa boş array ver
    if (!walletObj.balances || walletObj.balances.length === 0) {
      walletObj.balances = [];
      walletObj.totalUsdValue = "0";
    }

    // Manuel bakiye artık desteklenmiyor - tüm bakiyeler blockchain'den
    // walletObj.isManualBalance her zaman false olacak

    return walletObj;
  });

  return {
    wallets: walletsWithCalculatedValues,
    totalCount: wallets.length,
  };
};

// YENİ: Cüzdan silme
exports.deleteWallet = async (req) => {
  const { userId, walletId } = req.body;

  const wallet = await Wallet.findOne({ _id: walletId, user: userId });
  if (!wallet) {
    const err = new Error("Cüzdan bulunamadı veya size ait değil.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Eğer airdrop cüzdanı siliniyor ise uyarı ver
  if (wallet.isAirdropAddress) {
    const err = new Error(
      "Airdrop cüzdanını silmeden önce başka bir cüzdan seçin."
    );
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // User'dan wallet referansını kaldır
  await User.findByIdAndUpdate(userId, {
    $pull: { wallets: walletId },
  });

  // Wallet'ı sil
  await Wallet.findByIdAndDelete(walletId);

  // İlgili transaction'ları da sil
  await Transaction.deleteMany({ wallet: walletId });

  return { message: "Cüzdan başarıyla silindi." };
};

// YENİ: Cüzdan işlem geçmişi
exports.getWalletTransactions = async (req) => {
  const { userId, walletId } = req.query;
  const { page = 1, limit = 20 } = req.query;

  // Wallet sahiplik kontrolü
  const wallet = await Wallet.findOne({ _id: walletId, user: userId });
  if (!wallet) {
    const err = new Error("Cüzdan bulunamadı veya size ait değil.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({ wallet: walletId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Transaction.countDocuments({ wallet: walletId });

  return {
    transactions,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: skip + transactions.length < totalCount,
    },
  };
};

// YENİ: İşlem ekleme (demo/test için)
exports.addTransaction = async (req) => {
  const {
    userId,
    walletId,
    type,
    amount,
    currency,
    txHash,
    fromAddress,
    toAddress,
    description,
  } = req.body;

  // Wallet sahiplik kontrolü
  const wallet = await Wallet.findOne({ _id: walletId, user: userId });
  if (!wallet) {
    const err = new Error("Cüzdan bulunamadı veya size ait değil.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Transaction hash benzersizlik kontrolü
  const existingTx = await Transaction.findOne({ txHash });
  if (existingTx) {
    const err = new Error("Bu işlem hash'i zaten kayıtlı.");
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  const newTransaction = new Transaction({
    wallet: walletId,
    user: userId,
    type,
    amount,
    currency,
    txHash,
    fromAddress,
    toAddress,
    description,
    status: "success", // Demo için direkt success
  });

  await newTransaction.save();
  return newTransaction;
};

// YENİ: Cüzdan bakiyesini güncelleme (SADECE BLOCKCHAIN'DEN)
exports.updateWalletBalance = async (req) => {
  const { userId, walletId } = req.body;

  const wallet = await Wallet.findOne({ _id: walletId, user: userId });
  if (!wallet) {
    const err = new Error("Cüzdan bulunamadı veya size ait değil.");
    err.statusCode = StatusCodes.NOT_FOUND;
    throw err;
  }

  // Blockchain'den bakiye çek
  const balanceResult = await utils.balanceFetcher.fetchWalletBalance(
    wallet.network,
    wallet.address
  );

  if (!balanceResult.success) {
    const err = new Error(`Bakiye çekme hatası: ${balanceResult.error}`);
    err.statusCode = StatusCodes.BAD_REQUEST;
    throw err;
  }

  // Wallet'ı güncelle - HER ZAMAN OTOMATİK
  wallet.balances = balanceResult.balances.map((balance) => ({
    currency: balance.currency,
    amount: balance.amount,
    usdValue: balance.usdValue,
    lastUpdated: new Date(),
  }));

  wallet.totalUsdValue = balanceResult.totalUsdValue;
  wallet.lastBalanceCheck = new Date();
  wallet.isManualBalance = false; // HER ZAMAN OTOMATİK

  await wallet.save();

  return {
    wallet: wallet,
    message: "Bakiye blockchain'den başarıyla güncellendi",
  };
};

// KALDIRILDI: Manuel bakiye güncelleme (GÜVENLİK RİSKİ)
// Manuel bakiye artık desteklenmiyor, sadece blockchain verisi kabul ediliyor

// YENİ: Kullanıcının tüm cüzdanlarının bakiyesini güncelleme (SADECE OTOMATİK)
exports.updateAllWalletBalances = async (req) => {
  const { userId } = req.body;

  // Tüm cüzdanları otomatik moda çevir
  await Wallet.updateMany({ user: userId }, { isManualBalance: false });

  const wallets = await Wallet.find({ user: userId });

  if (wallets.length === 0) {
    return {
      message: "Güncellenecek cüzdan bulunamadı",
      updatedCount: 0,
    };
  }

  const results = await utils.balanceFetcher.fetchMultipleWalletBalances(
    wallets
  );

  let updatedCount = 0;
  const updatePromises = results.map(async (result) => {
    if (result.result.success) {
      const wallet = wallets.find(
        (w) => w._id.toString() === result.walletId.toString()
      );
      if (wallet) {
        wallet.balances = result.result.balances.map((balance) => ({
          currency: balance.currency,
          amount: balance.amount,
          usdValue: balance.usdValue,
          lastUpdated: new Date(),
        }));

        wallet.totalUsdValue = result.result.totalUsdValue;
        wallet.lastBalanceCheck = new Date();
        wallet.isManualBalance = false; // HER ZAMAN OTOMATİK

        await wallet.save();
        updatedCount++;
      }
    }
  });

  await Promise.all(updatePromises);

  return {
    message: `${updatedCount} cüzdan bakiyesi blockchain'den güncellendi`,
    updatedCount,
    totalWallets: wallets.length,
  };
};

// YENİ: Kullanıcının toplam portföy değeri
exports.getUserPortfolioValue = async (req) => {
  const { userId } = req.query;

  const wallets = await Wallet.find({ user: userId });

  let totalUsdValue = 0;
  const portfolioBreakdown = [];
  const currencyTotals = {};

  wallets.forEach((wallet) => {
    totalUsdValue += parseFloat(wallet.totalUsdValue || "0");

    wallet.balances.forEach((balance) => {
      if (!currencyTotals[balance.currency]) {
        currencyTotals[balance.currency] = {
          currency: balance.currency,
          totalAmount: "0",
          totalUsdValue: "0",
        };
      }

      currencyTotals[balance.currency].totalAmount = (
        parseFloat(currencyTotals[balance.currency].totalAmount) +
        parseFloat(balance.amount)
      ).toString();

      currencyTotals[balance.currency].totalUsdValue = (
        parseFloat(currencyTotals[balance.currency].totalUsdValue) +
        parseFloat(balance.usdValue)
      ).toFixed(2);
    });

    portfolioBreakdown.push({
      walletId: wallet._id,
      network: wallet.network,
      address: wallet.address,
      balances: wallet.balances,
      usdValue: wallet.totalUsdValue,
      lastUpdated: wallet.lastBalanceCheck,
      isAutomatic: true, // Artık tüm bakiyeler otomatik (blockchain'den)
    });
  });

  return {
    totalUsdValue: totalUsdValue.toFixed(2),
    totalWallets: wallets.length,
    currencyTotals: Object.values(currencyTotals),
    portfolioBreakdown,
    lastUpdated: new Date(),
    securityNote:
      "Tüm bakiyeler blockchain'den otomatik olarak güncellenmektedir",
  };
};
