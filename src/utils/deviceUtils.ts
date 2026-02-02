import { envConfig } from "../config/env.config";
import { useFirebaseMessaging } from "../hooks/useFirebaseMessaging";
import { apiService } from "../services/api";
import {
  collectDeviceInfo,
  generateDeviceHash,
  DevicePayloadData,
} from "./deviceHash";
import EncryptionBrowser from "./encryption";
import { CookieUtils } from "./use-cookies";
import { useLocalStorage } from "./use-local-storage";
import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface ServerPublicKeyData {
  publicKey: string;
  algorithm: string;
  encoding: string;
  keyId: string;
}

export interface DeviceIdData {
  deviceId: string;
}

export interface DeviceInfoData {
  device: { vendor: string; model: string; type: string };
  userAgent: string;
}

export interface PusherDeviceIdData {
  pusherDeviceId: string;
}

export interface DeviceData {
  deviceKeys?: RSAKeyPair;
  serverPublicKey?: ServerPublicKeyData;
  deviceInfo?: DeviceInfoData;
  deviceId?: DeviceIdData;
  pusherDeviceId?: PusherDeviceIdData;
  deviceToken?: string;
  devicePayload?: DevicePayloadData;
  deviceHashData?: string;
}

// Encryption instance for device keys
export const deviceEncryption = new EncryptionBrowser({
  secret: "device-key-encryption-secret",
  salt: "device-key-salt",
  rsaKeySize: 2048,
});

// Helper function to convert PEM format to base64
export const pemToBase64 = (pem: string): string => {
  // Remove PEM header, footer, and newlines
  const base64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\n/g, "")
    .trim();
  return base64;
};

// Enhanced RSA encryption that handles PEM format
export const rsaEncryptWithPem = async (
  data: string,
  publicKeyPem: string,
): Promise<string> => {
  // Pass the full PEM key directly - rsaEncrypt can handle PEM format
  return await deviceEncryption.rsaEncrypt(data, publicKeyPem);
};

// Enhanced RSA encryption that handles PEM format
export const rsaDecryptWithPem = async (
  data: string,
  publicKeyPem: string,
): Promise<string> => {
  // Pass the full PEM key directly - rsaDecrypt can handle PEM format
  return await deviceEncryption.rsaDecrypt(data, publicKeyPem);
};

// Generate RSA key pair using the existing Encryption utility (PEM format)
export const generateDeviceRSAKeys = async (
  setCookies: boolean,
): Promise<RSAKeyPair> => {
  const deviceKeys: any = CookieUtils.getCookie("deviceKeys");
  if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
    return deviceKeys;
  }
  const newKeys = await deviceEncryption.generateRSAKeyPair();
  if (setCookies) {
    CookieUtils.setCookie("deviceKeys", newKeys);
    CookieUtils.setCookie("devicePublicKey", newKeys.publicKey);
    CookieUtils.setCookie("devicePrivateKey", newKeys.privateKey);
  }
  return newKeys;
};

// Generate RSA key pair using the existing Encryption utility (legacy base64 format)
export const generateDeviceRSAKeysLegacy = async (
  setCookies: boolean,
): Promise<RSAKeyPair> => {
  const deviceKeys: any = CookieUtils.getCookie("deviceKeys");
  if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
    return deviceKeys;
  }
  const newKeys = await deviceEncryption.generateRSAKeyPair();
  if (setCookies) {
    CookieUtils.setCookie("deviceKeys", newKeys);
    CookieUtils.setCookie("devicePublicKey", newKeys.publicKey);
    CookieUtils.setCookie("devicePrivateKey", newKeys.privateKey);
  }
  return newKeys;
};

interface RefreshDeviceResult {
  _serverPublicKey: ServerPublicKeyData;
  _deviceKeys: RSAKeyPair;
  _deviceId: DeviceIdData | null;
  _pusherDeviceId: string;
  _deviceToken: string;
  _deviceInfo: DeviceInfoData;
  _deviceHashData: string;
  _browserFingerPrint: string;
}

// Hook for managing server keys with secure encrypted storage
export function useDeviceUtils() {
  const { requestPermission, getFirebaseToken } = useFirebaseMessaging();

  const [serverPublicKey, setServerPublicKey] =
    useLocalStorage<ServerPublicKeyData>("koppoServerPublicKey");
  const [deviceKeys, setDeviceKeys] =
    useLocalStorage<RSAKeyPair>("koppoDeviceKeys");
  const [deviceId, setDeviceId] =
    useLocalStorage<DeviceIdData>("koppoDeviceId");
  const [pusherDeviceId, setPusherDeviceId] =
    useLocalStorage<PusherDeviceIdData>("koppoPusherDeviceId");
  const [deviceToken, setDeviceToken] =
    useLocalStorage<string>("koppoDeviceToken");
  const [deviceInfo, setDeviceInfo] =
    useLocalStorage<DeviceInfoData>("koppoDeviceInfo");
  const [devicePayload, setDevicePayload] =
    useLocalStorage<DevicePayloadData>("koppoDevicePayload");
  const [deviceHashData, setDeviceHashData] = useLocalStorage<string>(
    "koppoDeviceHashData",
  );
  const [browserFingerPrint, setBrowserFingerPrint] = useLocalStorage<string>(
    "koppoBrowserFingerPrint",
  );

  // Get existing keys or generate new ones
  const generateDeviceKeys = async (): Promise<RSAKeyPair> => {
    if (deviceKeys && deviceKeys.publicKey && deviceKeys.privateKey) {
      return deviceKeys;
    }
    const newKeys = await generateDeviceRSAKeys(false);
    setDeviceKeys(newKeys);
    return newKeys;
  };

  // Clear stored device keys
  const refreshDevice = async (): Promise<RefreshDeviceResult> => {
    try {
      // Get server key and return it directly
      const _serverPublicKey = await getServerPublicKey();
      setServerPublicKey(_serverPublicKey);

      // Generate device keys
      const _deviceKeys = await generateDeviceKeys();
      setDeviceKeys(_deviceKeys);

      // Get Pusher ID
      const _pusherDeviceId = await getPusherId(true);
      if (_pusherDeviceId) {
        setPusherDeviceId({ pusherDeviceId: _pusherDeviceId });
      }

      // Get device token
      const _deviceToken = await getDeviceToken();
      if (_deviceToken) {
        setDeviceToken(_deviceToken);
      }

      // Get device info
      const _deviceInfo = await getDeviceInfo();
      if(_deviceInfo){
        setDeviceInfo(_deviceInfo);
      }
      
      const _browserFingerPrint = await getCurrentBrowserFingerPrint();
      if (_browserFingerPrint) {
        setBrowserFingerPrint(_browserFingerPrint);
      }

      const _deviceHashData = generateDeviceHash();
      if(_deviceHashData){
        setDeviceHashData(_deviceHashData);
      }
      
      // Return all device data immediately
      return {
        _serverPublicKey,
        _deviceKeys,
        _deviceId: deviceId,
        _pusherDeviceId,
        _deviceToken,
        _deviceInfo,
        _deviceHashData,
        _browserFingerPrint,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Clear stored device keys
  const getServerPublicKey = async (): Promise<ServerPublicKeyData> => {
    const publicKey = await apiService.get("/encryption/get-pub-key");
    setServerPublicKey(publicKey as ServerPublicKeyData);
    return publicKey as ServerPublicKeyData;
  };

  // Clear stored device keys
  const getPusherId = async (granted: boolean): Promise<string | undefined> => {
    if (granted) {
      requestPermission();

      console.log("Pusher Beams: Starting initialization...");
      console.log(
        "Pusher Beams: PusherPushNotifications available:",
        !!PusherPushNotifications,
      );
      console.log(
        "Pusher Beams: PusherPushNotifications.Client:",
        !!PusherPushNotifications.Client,
      );

      const beamsClient = new PusherPushNotifications.Client({
        instanceId: envConfig.VITE_PUSHER_INSTANCE_ID || "",
      });

      console.log("Pusher Beams: Client created, starting...");

      await beamsClient.start();
      console.log("Pusher Beams: Started successfully");

      await beamsClient.addDeviceInterest("debug-hello");
      console.log('Pusher Beams: Added interest "debug-hello"');

      // Get device ID for debugging
      const id = await beamsClient.getDeviceId();
      setPusherDeviceId({ pusherDeviceId: id });
      return id;
    }
    return;
  };

  const getDeviceToken = async (): Promise<string | undefined> => {
    const token = await getFirebaseToken();
    if (token) {
      setDeviceToken(token);
    }
    return token;
  };

  // Clear stored device keys
  const getDeviceInfo = async (): Promise<DeviceInfoData> => {
    const payload: DevicePayloadData = collectDeviceInfo();
    const info: DeviceInfoData = {
      device: payload.device,
      userAgent: payload.userAgent,
    };
    setDeviceInfo(info);
    setDeviceHashData(generateDeviceHash(payload));
    setBrowserFingerPrint(await getCurrentBrowserFingerPrint());
    setDevicePayload(payload);
    return info;
  };

  // Clear stored device keys
  const getDevice = (): DeviceData => {
    const device = {
      serverPublicKey,
      deviceKeys,
      deviceId,
      pusherDeviceId,
      deviceToken,
      deviceInfo,
      devicePayload,
      deviceHashData,
    };
    return device as unknown as DeviceData;
  };

  // Clear stored device keys
  const clearDeviceKeys = (): void => {
    setDeviceKeys(null);
  };

  // Store server public key
  const storeServerPublicKey = (
    publicKey: string,
    algorithm: string = "RSA-OAEP",
    encoding: string = "BASE64",
    keyId: string = "default",
  ): void => {
    setServerPublicKey({ publicKey, algorithm, encoding, keyId });
  };

  // Clear stored server keys
  const clearServerPublicKey = (): void => {
    setServerPublicKey(null);
  };

  // Store server key data
  const storeDeviceId = (deviceId: string): void => {
    setDeviceId({ deviceId });
  };

  // Clear stored server keys
  const clearDeviceId = (): void => {
    setDeviceId(null);
  };

  return {
    serverPublicKey,
    deviceKeys,
    deviceId,
    pusherDeviceId,
    deviceToken,
    deviceInfo,
    devicePayload,
    deviceHashData,
    browserFingerPrint,
    getPusherId,
    getDevice,
    getDeviceToken,
    refreshDevice,
    clearDeviceKeys,
    storeServerPublicKey,
    clearServerPublicKey,
    storeDeviceId,
    setDeviceId,
    clearDeviceId,
  };
}
