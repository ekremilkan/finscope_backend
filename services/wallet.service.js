const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const { StatusCodes } = require("http-status-codes");

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
