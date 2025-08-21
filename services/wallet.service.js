const mongoose = require("mongoose");
const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
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

  // 1. Input and user check
  if (!message || !signature || !network) throw new Error("Missing required fields.");
  if (!authenticatedUser || !authenticatedUser.userId || !authenticatedUser.email) throw new Error("A valid user session is required.");
  
  // 2. Signature and nonce validation
  const recoveredAddress = ethers.utils.verifyMessage(message, signature).toLowerCase();
  const savedNonce = nonceStore.get(authenticatedUser.email);
  if (!savedNonce || !message.includes(savedNonce)) {
    throw new Error("Invalid or expired nonce.");
  }
  nonceStore.delete(authenticatedUser.email);

  // ------------------- NEW PART START -------------------
  // 3. Global Wallet Check: Is this wallet already registered to another email?
  const globalWalletCheck = await UserWallets.findOne({ address: recoveredAddress });

  if (globalWalletCheck && globalWalletCheck.email !== authenticatedUser.email) {
    throw new Error("This wallet address is already registered with another email address.");
  }
  // ------------------- NEW PART END -----------------------

  // 4. User-specific wallet check
  const existingWallet = await Wallet.findOne({ user: authenticatedUser.userId, address: recoveredAddress });

  if (existingWallet) {
    if (!existingWallet.isVerified) {
        existingWallet.isVerified = true;
        await existingWallet.save();
    }
    return { message: "This wallet is already linked to your account." };
  }

  // --- NEW AND SAFE SAVE LOGIC ---
  let newWallet;
  try {
    console.log(`[DB] Saving new wallet: ${recoveredAddress}`);
    newWallet = new Wallet({
      user: authenticatedUser.userId,
      address: recoveredAddress,
      network,
      isVerified: true,
    });
    await newWallet.save();
    console.log(`[DB] New wallet successfully saved. ID: ${newWallet._id}`);

    console.log(`[DB] Updating user: ${authenticatedUser.userId}`);
    await User.findByIdAndUpdate(
      authenticatedUser.userId,
      { $push: { wallets: newWallet._id } }
    );
    console.log(`[DB] User successfully updated.`);

    console.log(`[DB] Updating global wallet list: ${authenticatedUser.email}`);
    await UserWallets.findOneAndUpdate(
        { email: authenticatedUser.email },
        { $addToSet: { address: recoveredAddress } },
        { upsert: true, new: true }
    );
    console.log(`[DB] Global wallet list successfully updated.`);
    
    return {
      message: "Wallet successfully verified and linked to your account.",
      address: recoveredAddress,
    };
  } catch (dbError) {
    console.error("💥 Critical error during database save:", dbError);
    if (newWallet && newWallet._id) {
      console.log(`[DB Rollback] Deleting wallet due to failed operation: ${newWallet._id}`);
      await Wallet.findByIdAndDelete(newWallet._id);
    }
    throw new Error("A database error occurred while saving the wallet.");
  }
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
