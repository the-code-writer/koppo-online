import Encryption from './crypto/Encryption';
import { CookieUtils } from './use-cookies';
import { useSecureCookies } from './use-cookies/useCookies';

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface ServerKeyData {
  serverPublicKey: string;
}

export interface DeviceKeyData {
  deviceKeys: RSAKeyPair;
  serverKeyData?: ServerKeyData;
}

// Encryption instance for device keys
export const deviceEncryption = new Encryption({
  secret: 'device-key-encryption-secret',
  salt: 'device-key-salt',
  rsaKeySize: 2048
});

// Helper function to convert PEM format to base64
export const pemToBase64 = (pem: string): string => {
  // Remove PEM header, footer, and newlines
  const base64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\n/g, '')
    .trim();
  return base64;
};

// Enhanced RSA encryption that handles PEM format
export const rsaEncryptWithPem = async (data: string, publicKeyPem: string): Promise<string> => {
  const base64Key = pemToBase64(publicKeyPem);
  return await deviceEncryption.rsaEncrypt(data, base64Key);
};

// Generate RSA key pair using the existing Encryption utility (PEM format)
export const generateDeviceRSAKeys = async (): Promise<RSAKeyPair> => {
  return await deviceEncryption.generateRSAKeyPairPEM();
};

// Generate RSA key pair using the existing Encryption utility (legacy base64 format)
export const generateDeviceRSAKeysLegacy = async (): Promise<RSAKeyPair> => {
  return await deviceEncryption.generateRSAKeyPair();
};

// Hook for managing device keys with secure encrypted storage
export function useDeviceKeys() {
  const [deviceKeys, setDeviceKeys] = useSecureCookies<RSAKeyPair>('deviceKeys', 'device-key-encryption-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000, // 1 year
    validator: (keys): boolean => {
      return keys && 
             typeof keys.publicKey === 'string' && 
             typeof keys.privateKey === 'string' &&
             keys.publicKey.length > 0 && 
             keys.privateKey.length > 0;
    }
  });

  // Get existing keys or generate new ones
  const getOrCreateDeviceKeys = async (): Promise<RSAKeyPair> => {
    if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
      return deviceKeys;
    }

    const newKeys = await generateDeviceRSAKeys();
    setDeviceKeys(newKeys);
    return newKeys;
  };

  // Clear stored device keys
  const clearDeviceKeys = (): void => {
    setDeviceKeys(null);
  };

  return {
    deviceKeys,
    setDeviceKeys,
    getOrCreateDeviceKeys,
    clearDeviceKeys
  };
}

// Hook for managing server keys with secure encrypted storage
export function useServerKeys() {
  const [serverKeys, setServerKeys] = useSecureCookies<ServerKeyData>('serverKeys', 'server-key-encryption-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000, // 1 year
    validator: (keys): boolean => {
      return keys && 
             typeof keys.serverPublicKey === 'string' && 
             keys.serverPublicKey.length > 0;
    }
  });

  // Store server key data
  const storeServerKeys = (serverPublicKey: string): void => {
    setServerKeys({
      serverPublicKey
    });
    CookieUtils.setCookie('serverPublicKeyX', btoa(serverPublicKey));
  };

  // Clear stored server keys
  const clearServerKeys = (): void => {
    setServerKeys(null);
  };

  return {
    serverKeys,
    setServerKeys,
    storeServerKeys,
    clearServerKeys
  };
}

// Utility function to get or create keys outside of React context
export const getOrCreateDeviceKeys = async (): Promise<RSAKeyPair> => {
  try {
    // Try to get existing keys from cookie
    const cookieValue = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('deviceKeys='));
    
    if (cookieValue) {
      // The cookie is encrypted, so we need to decrypt it
      const encryptedValue = decodeURIComponent(cookieValue.split('=')[1]);
      
      // Use the encryption utility to decrypt
      const decrypted = await deviceEncryption.aesDecryptCombined(encryptedValue, 'device-key-encryption-secret');
      const keys = JSON.parse(decrypted) as RSAKeyPair;
      
      if (keys && keys.publicKey && keys.privateKey) {
        return keys;
      }
    }
  } catch (error) {
    console.error('Error retrieving device keys:', error);
  }

  // Generate new keys if none exist or invalid
  const newKeys = await generateDeviceRSAKeys();
  
  // Encrypt and store the new keys
  try {
    const encrypted = await deviceEncryption.aesEncryptCombined(newKeys, 'device-key-encryption-secret');
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    
    document.cookie = `deviceKeys=${encodeURIComponent(encrypted)}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  } catch (error) {
    console.error('Error storing device keys:', error);
  }
  
  return newKeys;
};

// Clear device keys outside of React context
export const clearDeviceKeys = (): void => {
  document.cookie = 'deviceKeys=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
