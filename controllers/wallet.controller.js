const walletService = require("../services/wallet.service");
const { StatusCodes } = require("http-status-codes");
const baseResponse = require("../dto/baseresponse.dto");

exports.connectWallet = async (req, res) => {
  try {
    req.body.userId = req.user._id;

    const data = await walletService.connectWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Cüzdan başarıyla bağlandı.",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};

exports.setAirdropWallet = async (req, res) => {
  try {
    req.body.userId = req.user._id;

    const data = await walletService.setAirdropWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Airdrop cüzdanı başarıyla ayarlandı.",
      code: StatusCodes.OK,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message,
      code: error.statusCode || 500,
    });
  }
};
