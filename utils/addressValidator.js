const { ethers } = require('ethers');
const { PublicKey } = require('@solana/web3.js');
const TronWeb = require('tronweb');
const bs58 = require('bs58');

/**
 * Ethereum adresi doğrulama (EIP-55 checksum dahil)
 */
const validateEthereumAddress = (address) => {
  try {
    // Ethereum address format kontrolü
    if (!ethers.isAddress(address)) {
      return { valid: false, error: "Geçersiz Ethereum adresi formatı" };
    }
    
    // Checksum kontrolü (EIP-55)
    const checksumAddress = ethers.getAddress(address);
    if (address !== checksumAddress && address !== address.toLowerCase()) {
      return { 
        valid: false, 
        error: "Ethereum adresi checksum hatası",
        suggestion: `Doğru format: ${checksumAddress}`
      };
    }
    
    return { valid: true, normalizedAddress: checksumAddress };
  } catch (error) {
    return { valid: false, error: "Ethereum adresi doğrulama hatası: " + error.message };
  }
};

/**
 * Solana adresi doğrulama
 */
const validateSolanaAddress = (address) => {
  try {
    // Solana public key formatı kontrolü
    const publicKey = new PublicKey(address);
    
    // Base58 format kontrolü
    if (publicKey.toBase58() !== address) {
      return { valid: false, error: "Geçersiz Solana adresi formatı" };
    }
    
    // Uzunluk kontrolü (32 byte = 44 karakter base58)
    if (address.length < 32 || address.length > 44) {
      return { valid: false, error: "Solana adresi uzunluk hatası" };
    }
    
    return { valid: true, normalizedAddress: address };
  } catch (error) {
    return { valid: false, error: "Solana adresi doğrulama hatası: " + error.message };
  }
};

/**
 * Tron adresi doğrulama
 */
const validateTronAddress = (address) => {
  try {
    // Tron address format kontrolü
    const isValid = TronWeb.isAddress(address);
    if (!isValid) {
      return { valid: false, error: "Geçersiz Tron adresi formatı" };
    }
    
    // Base58 format ve checksum kontrolü
    if (!address.startsWith('T') || address.length !== 34) {
      return { valid: false, error: "Tron adresi format hatası (T ile başlamalı ve 34 karakter olmalı)" };
    }
    
    return { valid: true, normalizedAddress: address };
  } catch (error) {
    return { valid: false, error: "Tron adresi doğrulama hatası: " + error.message };
  }
};

/**
 * BNB Chain (BSC) adresi doğrulama - Ethereum ile aynı format
 */
const validateBNBChainAddress = (address) => {
  return validateEthereumAddress(address);
};

/**
 * Base Network adresi doğrulama - Ethereum ile aynı format
 */
const validateBaseAddress = (address) => {
  return validateEthereumAddress(address);
};

/**
 * SUI adresi doğrulama
 */
const validateSUIAddress = (address) => {
  try {
    // SUI adresi 0x ile başlar ve 64 hex karakter (32 byte) olmalı
    if (!address.startsWith('0x')) {
      return { valid: false, error: "SUI adresi 0x ile başlamalıdır" };
    }
    
    // Hex karakterleri kontrolü (0x + 64 hex karakter = 66 toplam)
    const hexPart = address.slice(2);
    if (hexPart.length !== 64) {
      return { valid: false, error: "SUI adresi 64 hex karakter olmalıdır" };
    }
    
    // Hex format kontrolü
    if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
      return { valid: false, error: "SUI adresi geçersiz hex karakterler içeriyor" };
    }
    
    return { valid: true, normalizedAddress: address.toLowerCase() };
  } catch (error) {
    return { valid: false, error: "SUI adresi doğrulama hatası: " + error.message };
  }
};

/**
 * Ana adres doğrulama fonksiyonu
 */
const validateWalletAddress = (network, address) => {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: "Adres boş olamaz" };
  }
  
  address = address.trim();
  
  switch (network) {
    case 'Ethereum':
      return validateEthereumAddress(address);
    case 'Solana':
      return validateSolanaAddress(address);
    case 'Tron':
      return validateTronAddress(address);
    case 'BNBChain':
      return validateBNBChainAddress(address);
    case 'SUI':
      return validateSUIAddress(address);
    case 'Base':
      return validateBaseAddress(address);
    default:
      return { valid: false, error: "Desteklenmeyen blockchain ağı" };
  }
};

/**
 * Adres format bilgileri
 */
const getAddressInfo = (network) => {
  const formats = {
    Ethereum: {
      format: "0x + 40 hex karakter",
      example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      length: 42,
      features: ["EIP-55 Checksum"]
    },
    Solana: {
      format: "Base58 encoded, 32-44 karakter",
      example: "DhJ4mFqBfbfHkuDrBpBxjy1w2pQW2pQW2pQW2pQW2pQW",
      length: "32-44",
      features: ["Base58 Encoding"]
    },
    Tron: {
      format: "T + 33 Base58 karakter", 
      example: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
      length: 34,
      features: ["Base58 Encoding", "T Prefix"]
    },
    BNBChain: {
      format: "0x + 40 hex karakter (Ethereum uyumlu)",
      example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
      length: 42,
      features: ["EIP-55 Checksum", "Ethereum Compatible"]
    },
    SUI: {
      format: "0x + 64 hex karakter",
      example: "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234",
      length: 66,
      features: ["32-byte address"]
    },
    Base: {
      format: "0x + 40 hex karakter (Ethereum uyumlu)",
      example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      length: 42, 
      features: ["EIP-55 Checksum", "Ethereum Compatible"]
    }
  };
  
  return formats[network] || null;
};

module.exports = {
  validateWalletAddress,
  validateEthereumAddress,
  validateSolanaAddress, 
  validateTronAddress,
  validateBNBChainAddress,
  validateSUIAddress,
  validateBaseAddress,
  getAddressInfo
}; 