import CryptoJS from 'crypto-js';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// Generate a new RSA-like key pair using crypto-js
export const generateKeyPair = (): KeyPair => {
  // Generate a random seed
  const seed = CryptoJS.lib.WordArray.random(256/8).toString();
  
  // Generate private key (more complex)
  const privateKey = CryptoJS.SHA256(seed + 'private').toString();
  
  // Generate public key from private key
  const publicKey = CryptoJS.SHA256(seed + 'public').toString();
  
  return {
    publicKey,
    privateKey
  };
};

// Store key pair in secure cookie
export const storeKeyPair = (keyPair: KeyPair): void => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(keyPair),
      'device-key-storage'
    ).toString();
    
    // Store in a long-lived cookie (1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    
    document.cookie = `deviceKeys=${encodeURIComponent(encrypted)}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  } catch (error) {
    console.error('Failed to store key pair:', error);
  }
};

// Retrieve key pair from cookie
export const retrieveKeyPair = (): KeyPair | null => {
  try {
    const cookies = document.cookie.split(';');
    const keyCookie = cookies.find(cookie => cookie.trim().startsWith('deviceKeys='));
    
    if (!keyCookie) {
      return null;
    }
    
    const encrypted = decodeURIComponent(keyCookie.split('=')[1]);
    const decrypted = CryptoJS.AES.decrypt(encrypted, 'device-key-storage');
    const keyPair = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    
    return keyPair;
  } catch (error) {
    console.error('Failed to retrieve key pair:', error);
    return null;
  }
};

// Get existing key pair or generate new one
export const getOrCreateKeyPair = (): KeyPair => {
  let keyPair = retrieveKeyPair();
  
  if (!keyPair) {
    keyPair = generateKeyPair();
    storeKeyPair(keyPair);
  }
  
  return keyPair;
};

// Clear stored key pair
export const clearKeyPair = (): void => {
  document.cookie = 'deviceKeys=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
