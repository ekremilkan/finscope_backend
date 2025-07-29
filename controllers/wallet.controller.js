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


// YENİ: Adres doğrulama endpoint'i
exports.validateAddress = async (req, res) => {
  try {
    const { network, address } = req.body;
    
    const validation = utils.addressValidator.validateWalletAddress(network, address);
    
    if (validation.valid) {
      res.status(StatusCodes.OK).json({
        ...baseResponse,
        data: {
          valid: true,
          normalizedAddress: validation.normalizedAddress,
          network: network,
          message: "Adres geçerli"
        },
        message: "Adres doğrulama başarılı",
        code: StatusCodes.OK,
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({
        ...baseResponse,
        success: false,
        error: true,
        data: {
          valid: false,
          error: validation.error,
          suggestion: validation.suggestion || null,
          network: network
        },
        message: "Adres doğrulama başarısız",
        code: StatusCodes.BAD_REQUEST,
      });
    }
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

// YENİ: Desteklenen ağlar ve format bilgileri
exports.getSupportedNetworks = async (req, res) => {
  try {
    const networks = ["Ethereum", "Solana", "Tron", "BNBChain", "SUI", "Base"];
    const networkInfo = {};
    
    networks.forEach(network => {
      networkInfo[network] = utils.addressValidator.getAddressInfo(network);
    });
    
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data: {
        supportedNetworks: networks,
        networkFormats: networkInfo,
        totalNetworks: networks.length
      },
      message: "Desteklenen ağlar başarıyla getirildi",
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

// YENİ: Airdrop özelliğini kaldırma
exports.removeAirdropWallet = async (req, res) => {
  try {
    req.body.userId = req.user._id;

    const data = await walletService.removeAirdropWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Airdrop cüzdanı kaldırıldı.",
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

// YENİ: Mevcut airdrop cüzdanını gösterme
exports.getAirdropWallet = async (req, res) => {
  try {
    req.query.userId = req.user._id;

    const data = await walletService.getAirdropWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: data.hasAirdrop ? "Airdrop cüzdanı getirildi." : "Airdrop cüzdanı ayarlanmamış.",
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

// YENİ: Kullanıcının cüzdanlarını listeleme
exports.getUserWallets = async (req, res) => {
  try {
    req.body.userId = req.user._id;

    const data = await walletService.getUserWallets(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Cüzdanlar başarıyla getirildi.",
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

// YENİ: Cüzdan silme
exports.deleteWallet = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.walletId = req.params.walletId;

    const data = await walletService.deleteWallet(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Cüzdan başarıyla silindi.",
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

// YENİ: Cüzdan işlem geçmişi
exports.getWalletTransactions = async (req, res) => {
  try {
    req.query.userId = req.user._id;
    req.query.walletId = req.params.walletId;

    const data = await walletService.getWalletTransactions(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "İşlem geçmişi başarıyla getirildi.",
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

// YENİ: İşlem ekleme (demo/test için)
exports.addTransaction = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.walletId = req.params.walletId;

    const data = await walletService.addTransaction(req);
    res.status(StatusCodes.CREATED).json({
      ...baseResponse,
      data,
      message: "İşlem başarıyla eklendi.",
      code: StatusCodes.CREATED,
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

// YENİ: Cüzdan bakiyesini güncelleme (SADECE BLOCKCHAIN)
exports.updateWalletBalance = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.walletId = req.params.walletId;

    const data = await walletService.updateWalletBalance(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Bakiye blockchain'den başarıyla güncellendi.",
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

// KALDIRILDI: Manuel bakiye güncelleme (GÜVENLİK RİSKİ)
// Kullanıcılar artık manuel bakiye giremez, sadece blockchain verisi

// YENİ: Tüm cüzdan bakiyelerini güncelleme (SADECE OTOMATİK)
exports.updateAllWalletBalances = async (req, res) => {
  try {
    req.body.userId = req.user._id;

    const data = await walletService.updateAllWalletBalances(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Tüm cüzdan bakiyeleri blockchain'den güncellendi.",
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

// YENİ: Kullanıcı portföy değeri
exports.getUserPortfolioValue = async (req, res) => {
  try {
    req.query.userId = req.user._id;

    const data = await walletService.getUserPortfolioValue(req);
    res.status(StatusCodes.OK).json({
      ...baseResponse,
      data,
      message: "Portföy değeri başarıyla getirildi.",
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
