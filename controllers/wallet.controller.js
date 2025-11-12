const walletService = require("../services/wallet.service");
const { StatusCodes } = require("http-status-codes");
const baseResponse = require("../dto/baseresponse.dto");
const utils = require("../utils/index");


exports.generateNonce = async (req, res) => {
  try {
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

exports.setAirdropWallet = async (req, res) => {
  try {
    const json = await walletService.setAirdropWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data: json,
      message: "Airdrop cüzdan başarıyla bağlandı",
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

exports.updateWalletNetwork = async (req, res) => {
  try {

    const json = await walletService.updateWalletNetwork(req);

    res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data: json,
      message: "Cüzdan ağı başarıyla güncellendi.",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Cüzdan ağı güncellenirken hata:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message || "Bir hata oluştu.",
      timestamp: new Date(),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
