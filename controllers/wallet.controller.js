const walletService = require("../services/wallet.service");
const { StatusCodes } = require("http-status-codes");
const baseResponse = require("../dto/baseresponse.dto");
const utils = require("../utils/index");


exports.generateNonce = async (req, res) => {
  try {
     console.log("✅ /nonce endpoint'ine istek geldi. Query:", req.query);
    const json = await walletService.generateNonce(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      code: StatusCodes.CREATED,
      data: json,
      message: "Nonce başarıyla oluşturuldu",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      timestamp: new Date(),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.verifySignatureAndConnect = async (req, res) => {
  try {
    const json = await walletService.verifySignatureAndConnect(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      code: StatusCodes.CREATED,
      data: json,
      message: "Cüzdan başarıyla bağlandı",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      timestamp: new Date(),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.getWalletStatus = async (req, res) => {
  try {
    console.log("📡 /wallet/status endpoint'ine istek geldi. Query:", req.query);
    const data = await walletService.getWalletStatus(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data,
      message: "Cüzdan durumu başarıyla getirildi.",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      timestamp: new Date(),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.getUserWallets = async (req, res) => {
  try {
    console.log("📡 /wallets endpoint'ine istek geldi.");
    const data = await walletService.getUserWallets(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data,
      message: "Cüzdanlar başarıyla listelendi.",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      timestamp: new Date(),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.deleteWallet = async (req, res) => {
  try {
    console.log("🗑️ /wallet/:address DELETE isteği alındı. Params:", req.params);
    const data = await walletService.deleteWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data,
      message: data.message,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      timestamp: new Date(),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};