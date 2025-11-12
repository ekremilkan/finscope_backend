const mongoose = require("mongoose");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const userWallets = require("../models/userWallets.model");
const Transaction = require("../models/transaction.model");
const { StatusCodes } = require("http-status-codes");
const utils = require("../utils/index");
const crypto = require("crypto");
const { ethers } = require("ethers");


const nonceStore = require("./nonce-store.service"); 

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

  if (!message || !signature || !network)
    throw new Error("Missing required fields.");
  if (!authenticatedUser || !authenticatedUser.userId || !authenticatedUser.email)
    throw new Error("A valid user session is required.");

  const recoveredAddress = ethers.utils.verifyMessage(message, signature).toLowerCase();
  const savedNonce = nonceStore.get(authenticatedUser.email);
  if (!savedNonce || !message.includes(savedNonce))
    throw new Error("Invalid or expired nonce.");
  nonceStore.delete(authenticatedUser.email);

  // 🔍 1. Global wallet kontrolü
  const globalWalletCheck = await Wallet.findOne({ address: recoveredAddress });
  if (globalWalletCheck && globalWalletCheck.user.toString() !== authenticatedUser.userId)
    throw new Error("This wallet address is already registered with another user.");

  // 🔍 2. Kullanıcıya ait mevcut cüzdan kontrolü
  const existingWallet = await Wallet.findOne({
    user: authenticatedUser.userId,
    address: recoveredAddress,
  });

  if (existingWallet) {
    if (!existingWallet.isVerified) {
      existingWallet.isVerified = true;
      await existingWallet.save();
    }
    return { message: "This wallet is already linked to your account." };
  }

  // 📦 3. Kullanıcının mevcut cüzdan sayısını kontrol et
  const userWalletCount = await Wallet.countDocuments({ user: authenticatedUser.userId });
  const isFirstWallet = userWalletCount === 0;

  // 🎯 4. Yeni cüzdan oluşturma
  let newWallet;
  try {
    newWallet = new Wallet({
      user: authenticatedUser.userId,
      address: recoveredAddress,
      network,
      isVerified: true,
      isAirdropAddress: isFirstWallet, // İlk cüzdan airdrop olarak atanır
    });

    await newWallet.save();

    await User.findByIdAndUpdate(authenticatedUser.userId, {
      $push: { wallets: newWallet._id },
    });

    return {
      message: isFirstWallet
        ? "First wallet linked and set as your airdrop wallet."
        : "Wallet successfully verified and linked to your account.",
      address: recoveredAddress,
      isAirdropAddress: isFirstWallet,
    };
  } catch (dbError) {
    console.error("💥 Critical error during database save:", dbError);
    if (newWallet && newWallet._id) {
      await Wallet.findByIdAndDelete(newWallet._id);
    }
    throw new Error("A database error occurred while saving the wallet.");
  }
};

exports.setAirdropWallet = async (req) => {
  const { adress: walletAddress } = req.params;
  const { user: authenticatedUser } = req;

  if (!walletAddress)
    throw new Error("Eksik cüzdan adresi.");
  if (!authenticatedUser || !authenticatedUser.userId)
    throw new Error("Geçerli bir kullanıcı oturumu gerekli.");

  const userId = authenticatedUser.userId;

  // Önce tüm cüzdanlardan airdrop flag’ini kaldır
  await Wallet.updateMany(
    { user: userId },
    { $set: { isAirdropAddress: false } }
  );

  // Seçilen cüzdanı işaretle
  const updatedWallet = await Wallet.findOneAndUpdate(
    { address: walletAddress, user: userId },
    { $set: { isAirdropAddress: true } },
    { new: true }
  );

  if (!updatedWallet)
    throw new Error("Cüzdan bulunamadı veya yetkiniz yok.");

  return {
    walletId: updatedWallet._id,
    address: updatedWallet.address,
    isAirdropAddress: updatedWallet.isAirdropAddress,
  };
};


exports.getUserWallets = async (req) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      throw new Error("User ID not found.");
    }
    
    const wallets = await Wallet.find({ user: userId }).sort({ createdAt: -1 });

    return wallets;
  } catch (error) {
    console.error("getUserWallets service error:", error);
    throw new Error("An error occurred while fetching wallets.");
  }
};

exports.getWalletStatus = async (req) => {
  try {
    const { userId } = req.user;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      throw new Error("Wallet address is required.");
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
      throw new Error("Wallet to delete not found or does not belong to you.");
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { wallets: wallet._id } },
      { session }
    );

    await Wallet.deleteOne({ _id: wallet._id }, { session });

    await session.commitTransaction();
    return { message: "Wallet successfully deleted." };
  } catch (error) {
    await session.abortTransaction();
    throw new Error("An error occurred while deleting the wallet.");
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
      throw new Error("New network information ('network') is required.");
    }

    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: userId, address: address.toLowerCase() },
      { $set: { network: network } }, 
      { new: true } 
    );

    if (!updatedWallet) {
      throw new Error("Wallet not found or this wallet does not belong to you.");
    }

    return {
      message: "Wallet network successfully updated.",
      wallet: updatedWallet,
    };
    
  } catch (error) {
    console.error("updateWalletNetwork service error:", error);
    throw new Error("An error occurred while updating the wallet network.");
  }
};
