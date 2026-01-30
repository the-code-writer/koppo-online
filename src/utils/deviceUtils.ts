import EncryptionBrowser from './encryption';
import { CookieUtils } from './use-cookies';
import { useSecureCookies } from './use-cookies/useCookies';

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface ServerPublicKeyData {
  publicKey: string;
}

export interface DeviceIdData {
  deviceId: string;
}

export interface DeviceInfoData {
  device: {userAgent: string; vendor: string, model: string, type: string};
}

export interface PusherDeviceIdData {
  pusherDeviceId: string;
}

export interface DeviceData {
  deviceKeys: RSAKeyPair;
  serverKeys: ServerPublicKeyData;
  deviceInfo?: DeviceInfoData;
  deviceId?: DeviceIdData;
  pusherDeviceId?: PusherDeviceIdData;
}

// Encryption instance for device keys
export const deviceEncryption = new EncryptionBrowser({
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
  // Pass the full PEM key directly - rsaEncrypt can handle PEM format
  return await deviceEncryption.rsaEncrypt(data, publicKeyPem);
};

// Enhanced RSA encryption that handles PEM format
export const rsaDecryptWithPem = async (data: string, publicKeyPem: string): Promise<string> => {
  // Pass the full PEM key directly - rsaDecrypt can handle PEM format
  return await deviceEncryption.rsaDecrypt(data, publicKeyPem);
};

// Generate RSA key pair using the existing Encryption utility (PEM format)
export const generateDeviceRSAKeys = async (setCookies:boolean): Promise<RSAKeyPair> => {
  const deviceKeys:any = CookieUtils.getCookie('deviceKeys');
  if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
      return deviceKeys;
    }
  const newKeys = await deviceEncryption.generateRSAKeyPair();
  if(setCookies){
    CookieUtils.setCookie('deviceKeys', newKeys);
    CookieUtils.setCookie('devicePublicKey', newKeys.publicKey);
    CookieUtils.setCookie('devicePrivateKey', newKeys.privateKey);
  }
  return newKeys;
};

// Generate RSA key pair using the existing Encryption utility (legacy base64 format)
export const generateDeviceRSAKeysLegacy = async (setCookies:boolean): Promise<RSAKeyPair> => {
  const deviceKeys:any = CookieUtils.getCookie('deviceKeys');
  if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
      return deviceKeys;
    }
  const newKeys = await deviceEncryption.generateRSAKeyPair();
  if(setCookies){
    CookieUtils.setCookie('deviceKeys', newKeys);
    CookieUtils.setCookie('devicePublicKey', newKeys.publicKey);
    CookieUtils.setCookie('devicePrivateKey', newKeys.privateKey);
  }
  return newKeys;
};

// Hook for managing server keys with secure encrypted storage
export function useDeviceUtils() {
  const [serverKeys, setServerKeys] = useSecureCookies<ServerPublicKeyData>('serverKeys', 'server-key-encryption-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000, // 1 year
    validator: (keys): boolean => {
      return keys &&
        typeof keys.publicKey === 'string' &&
        keys.publicKey.length > 0;
    }
  });
  const [parsedDeviceId, setDeviceId] = useSecureCookies<DeviceIdData>('deviceId', 'server-key-encryption-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000, // 1 year
    validator: (keys): boolean => {
      return keys &&
        typeof keys.deviceId === 'string' &&
        keys.deviceId.length > 0;
    }
  });

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
  const generateDeviceKeys = async (): Promise<RSAKeyPair> => {
    if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
      return deviceKeys;
    }
    const newKeys = await generateDeviceRSAKeys(false);
    setDeviceKeys(newKeys);
    CookieUtils.setCookie('deviceKeys', newKeys);
    CookieUtils.setCookie('devicePublicKey', newKeys.publicKey);
    CookieUtils.setCookie('devicePrivateKey', newKeys.privateKey);
    return newKeys;
  };

  // Clear stored device keys
  const clearDeviceKeys = (): void => {
    setDeviceKeys(null);
    CookieUtils.deleteCookie('deviceKeys');
    CookieUtils.deleteCookie('devicePublicKey');
    CookieUtils.deleteCookie('devicePrivateKey');
  };

  // Store server key data
  const storeServerPublicKey = (publicKey: string): void => {
    setServerKeys({ publicKey });
    CookieUtils.setCookie('serverKeys', {publicKey});
    CookieUtils.setCookie('serverPublicKey', publicKey);
  };

  // Clear stored server keys
  const clearServerPublicKey = (): void => {
    setServerKeys(null);
    CookieUtils.deleteCookie('serverKeys');
    CookieUtils.deleteCookie('serverPublicKey');
  };

  // Store server key data
  const storeDeviceId = (deviceId: string): void => {
    setDeviceId({ deviceId });
    CookieUtils.setCookie('deviceId', deviceId);
  };

  // Clear stored server keys
  const clearDeviceId = (): void => {
    setDeviceId(null);
    CookieUtils.deleteCookie('deviceId');
  };

  return {
    deviceKeys,
    setDeviceKeys,
    generateDeviceKeys,
    clearDeviceKeys,
    serverKeys,
    storeServerPublicKey,
    clearServerPublicKey,
    parsedDeviceId,
    storeDeviceId,
    setDeviceId,
    clearDeviceId
  };
}
