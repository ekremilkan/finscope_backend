const { ethers } = require('ethers');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const TronWeb = require('tronweb');

/**
 * Ethereum ağından bakiye çekme - GERÇEKLEŞTİRİLDİ
 */
const getEthereumBalance = async (address) => {
  try {
    console.log(`🔍 Ethereum bakiye sorgulanıyor: ${address}`);
    
    // Ücretsiz RPC endpoint'leri
    const rpcEndpoints = [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://cloudflare-eth.com'
    ];
    
    let provider;
    let lastError;
    
    // RPC endpoint'lerini sırayla dene
    for (const rpc of rpcEndpoints) {
      try {
        provider = new ethers.JsonRpcProvider(rpc);
        await provider.getNetwork(); // Bağlantı testi
        console.log(`✅ Bağlantı başarılı: ${rpc}`);
        break;
      } catch (err) {
        console.log(`❌ RPC başarısız: ${rpc} - ${err.message}`);
        lastError = err;
        provider = null;
      }
    }
    
    if (!provider) {
      throw new Error(`Tüm Ethereum RPC'ler başarısız: ${lastError?.message}`);
    }
    
    // Bakiye sorgulama
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.formatEther(balance);
    
    console.log(`💰 ETH Bakiye: ${ethBalance}`);
    
    // USD değerini basit fiyat ile hesapla (gerçek projede CoinGecko kullanın)
    const ethPrice = 1700; // Demo fiyat
    const usdValue = (parseFloat(ethBalance) * ethPrice).toFixed(2);
    
    return {
      success: true,
      balances: [
        {
          currency: 'ETH',
          amount: ethBalance,
          usdValue: usdValue
        }
      ],
      totalUsdValue: usdValue
    };
    
  } catch (error) {
    console.error(`❌ Ethereum bakiye hatası: ${error.message}`);
    return {
      success: false,
      error: error.message,
      balances: []
    };
  }
};

/**
 * Solana ağından bakiye çekme - GERÇEKLEŞTİRİLDİ
 */
const getSolanaBalance = async (address) => {
  try {
    console.log(`🔍 Solana bakiye sorgulanıyor: ${address}`);
    
    // Ücretsiz Solana RPC endpoint'leri
    const rpcEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ];
    
    let connection;
    let lastError;
    
    // RPC endpoint'lerini sırayla dene
    for (const rpc of rpcEndpoints) {
      try {
        connection = new Connection(rpc);
        await connection.getVersion(); // Bağlantı testi
        console.log(`✅ Solana bağlantı başarılı: ${rpc}`);
        break;
      } catch (err) {
        console.log(`❌ Solana RPC başarısız: ${rpc} - ${err.message}`);
        lastError = err;
        connection = null;
      }
    }
    
    if (!connection) {
      throw new Error(`Tüm Solana RPC'ler başarısız: ${lastError?.message}`);
    }
    
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    const solBalance = (balance / LAMPORTS_PER_SOL).toFixed(9);
    
    console.log(`💰 SOL Bakiye: ${solBalance}`);
    
    const solPrice = 20; // Demo fiyat
    const usdValue = (parseFloat(solBalance) * solPrice).toFixed(2);
    
    return {
      success: true,
      balances: [
        {
          currency: 'SOL',
          amount: solBalance,
          usdValue: usdValue
        }
      ],
      totalUsdValue: usdValue
    };
    
  } catch (error) {
    console.error(`❌ Solana bakiye hatası: ${error.message}`);
    return {
      success: false,
      error: error.message,
      balances: []
    };
  }
};

/**
 * BNB Chain (BSC) bakiye çekme - GERÇEKLEŞTİRİLDİ
 */
const getBNBChainBalance = async (address) => {
  try {
    console.log(`🔍 BNB Chain bakiye sorgulanıyor: ${address}`);
    
    // Ücretsiz BSC RPC endpoint'leri
    const rpcEndpoints = [
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc',
      'https://bsc.publicnode.com'
    ];
    
    let provider;
    let lastError;
    
    for (const rpc of rpcEndpoints) {
      try {
        provider = new ethers.JsonRpcProvider(rpc);
        await provider.getNetwork();
        console.log(`✅ BSC bağlantı başarılı: ${rpc}`);
        break;
      } catch (err) {
        console.log(`❌ BSC RPC başarısız: ${rpc} - ${err.message}`);
        lastError = err;
        provider = null;
      }
    }
    
    if (!provider) {
      throw new Error(`Tüm BSC RPC'ler başarısız: ${lastError?.message}`);
    }
    
    const balance = await provider.getBalance(address);
    const bnbBalance = ethers.formatEther(balance);
    
    console.log(`💰 BNB Bakiye: ${bnbBalance}`);
    
    const bnbPrice = 250; // Demo fiyat
    const usdValue = (parseFloat(bnbBalance) * bnbPrice).toFixed(2);
    
    return {
      success: true,
      balances: [
        {
          currency: 'BNB',
          amount: bnbBalance,
          usdValue: usdValue
        }
      ],
      totalUsdValue: usdValue
    };
    
  } catch (error) {
    console.error(`❌ BNB Chain bakiye hatası: ${error.message}`);
    return {
      success: false,
      error: error.message,
      balances: []
    };
  }
};

/**
 * Base ağından bakiye çekme - GERÇEKLEŞTİRİLDİ
 */
const getBaseBalance = async (address) => {
  try {
    console.log(`🔍 Base bakiye sorgulanıyor: ${address}`);
    
    // Base network RPC endpoint'leri
    const rpcEndpoints = [
      'https://mainnet.base.org',
      'https://base.publicnode.com',
      'https://base-rpc.publicnode.com'
    ];
    
    let provider;
    let lastError;
    
    for (const rpc of rpcEndpoints) {
      try {
        provider = new ethers.JsonRpcProvider(rpc);
        await provider.getNetwork();
        console.log(`✅ Base bağlantı başarılı: ${rpc}`);
        break;
      } catch (err) {
        console.log(`❌ Base RPC başarısız: ${rpc} - ${err.message}`);
        lastError = err;
        provider = null;
      }
    }
    
    if (!provider) {
      throw new Error(`Tüm Base RPC'ler başarısız: ${lastError?.message}`);
    }
    
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.formatEther(balance);
    
    console.log(`💰 Base ETH Bakiye: ${ethBalance}`);
    
    const ethPrice = 1700; // Demo fiyat
    const usdValue = (parseFloat(ethBalance) * ethPrice).toFixed(2);
    
    return {
      success: true,
      balances: [
        {
          currency: 'ETH',
          amount: ethBalance,
          usdValue: usdValue
        }
      ],
      totalUsdValue: usdValue
    };
    
  } catch (error) {
    console.error(`❌ Base bakiye hatası: ${error.message}`);
    return {
      success: false,
      error: error.message,
      balances: []
    };
  }
};

/**
 * Tron ağından bakiye çekme - MOCK (Gerçek API karmaşık)
 */
const getTronBalance = async (address) => {
  try {
    console.log(`🔍 Tron bakiye sorgulanıyor (MOCK): ${address}`);
    
    // Tron için mock data (gerçek TronWeb API karmaşık)
    return {
      success: true,
      balances: [
        {
          currency: 'TRX',
          amount: '0',
          usdValue: '0.00'
        }
      ],
      totalUsdValue: '0.00'
    };
    
  } catch (error) {
    console.error(`❌ Tron bakiye hatası: ${error.message}`);
    return {
      success: false,
      error: error.message,
      balances: []
    };
  }
};

/**
 * SUI ağından bakiye çekme - MOCK (Gerçek API karmaşık)
 */
const getSUIBalance = async (address) => {
  try {
    console.log(`🔍 SUI bakiye sorgulanıyor (MOCK): ${address}`);
    
    // SUI için mock data (gerçek API karmaşık)
    return {
      success: true,
      balances: [
        {
          currency: 'SUI',
          amount: '0',
          usdValue: '0.00'
        }
      ],
      totalUsdValue: '0.00'
    };
    
  } catch (error) {
    console.error(`❌ SUI bakiye hatası: ${error.message}`);
    return {
      success: false,
      error: error.message,
      balances: []
    };
  }
};

/**
 * Ana bakiye çekme fonksiyonu
 */
const fetchWalletBalance = async (network, address) => {
  switch (network) {
    case 'Ethereum':
      return await getEthereumBalance(address);
    case 'Solana':
      return await getSolanaBalance(address);
    case 'Tron':
      return await getTronBalance(address);
    case 'BNBChain':
      return await getBNBChainBalance(address);
    case 'SUI':
      return await getSUIBalance(address);
    case 'Base':
      return await getBaseBalance(address);
    default:
      return {
        success: false,
        error: 'Desteklenmeyen blockchain ağı',
        balances: []
      };
  }
};

/**
 * Fiyat bilgisi çekme (CoinGecko API - demo)
 */
const getTokenPrice = async (tokenId) => {
  try {
    // Demo fiyatlar
    const mockPrices = {
      'ethereum': 1700.00,
      'solana': 20.00,
      'tron': 0.09,
      'binancecoin': 250.00,
      'sui': 4.00
    };
    
    return mockPrices[tokenId] || 0;
    
    /* Gerçek API çağrısı:
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
    const data = await response.json();
    return data[tokenId]?.usd || 0;
    */
  } catch (error) {
    console.error('Fiyat çekme hatası:', error);
    return 0;
  }
};

/**
 * Birden fazla cüzdan bakiyesini çekme
 */
const fetchMultipleWalletBalances = async (wallets) => {
  const promises = wallets.map(wallet => 
    fetchWalletBalance(wallet.network, wallet.address)
  );
  
  const results = await Promise.allSettled(promises);
  
  return wallets.map((wallet, index) => ({
    walletId: wallet._id,
    network: wallet.network,
    address: wallet.address,
    result: results[index].status === 'fulfilled' 
      ? results[index].value 
      : { success: false, error: results[index].reason?.message || 'Bilinmeyen hata' }
  }));
};

module.exports = {
  fetchWalletBalance,
  fetchMultipleWalletBalances,
  getEthereumBalance,
  getSolanaBalance,
  getTronBalance,
  getBNBChainBalance,
  getSUIBalance,
  getBaseBalance,
  getTokenPrice
}; 