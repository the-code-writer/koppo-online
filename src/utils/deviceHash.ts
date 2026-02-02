import CryptoJS from 'crypto-js';

export interface DevicePayloadData {
  userAgent: string;
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: string;
    vendor: string;
    model: string;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  language: string;
  languages: string[];
  platform: string;
  hardware: {
    cores: number | string;
    memory: number | string;
    connection: {
      effectiveType: string;
      downlink: number | string;
      rtt: number | string;
    };
  };
  timezone: {
    offset: number;
    name: string;
  };
}

// Browser detection
const getBrowserInfo = (ua: string) => {
  const browsers = {
    chrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
    firefox: /Firefox/.test(ua),
    safari: /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor),
    edge: /Edg/.test(ua),
    ie: /MSIE|Trident/.test(ua),
    opera: /Opera|OPR/.test(ua)
  };
  
  const browserName = Object.keys(browsers).find(key => browsers[key as keyof typeof browsers]) || 'Unknown';
  const version = ua.match(new RegExp(`${browserName}/([0-9.]+)`))?.[1] || 'Unknown';
  
  return { name: browserName, version };
};

// OS detection
const getOSInfo = (ua: string) => {
  const os = {
    Windows: /Windows/.test(ua),
    macOS: /Mac OS/.test(ua),
    Linux: /Linux/.test(ua),
    iOS: /iPhone|iPad|iPod/.test(ua),
    Android: /Android/.test(ua)
  };
  
  const osName = Object.keys(os).find(key => os[key as keyof typeof os]) || 'Unknown';
  const version = ua.match(new RegExp(`${osName} ([0-9_.]+)`))?.[1]?.replace(/_/g, '.') || 'Unknown';
  
  return { name: osName, version };
};

// Device type detection
const getDeviceInfo = (ua: string) => {
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  let vendor = 'Unknown';
  let model = 'Unknown';
  
  if (/iPhone/.test(ua)) {
    vendor = 'Apple';
    model = 'iPhone';
  } else if (/iPad/.test(ua)) {
    vendor = 'Apple';
    model = 'iPad';
  } else if (/Android/.test(ua)) {
    vendor = 'Various';
    const match = ua.match(/Android.*?;\s*([^)]*)\)/);
    model = match?.[1] || 'Android Device';
  } else if (/Windows/.test(ua)) {
    vendor = 'Microsoft';
    model = 'Windows PC';
  }
  
  return {
    type: isTablet ? 'Tablet' : isMobile ? 'Mobile' : isDesktop ? 'Desktop' : 'Unknown',
    vendor,
    model
  };
};

// Network connection info
const getConnectionInfo = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    return {
      effectiveType: connection.effectiveType || 'Unknown',
      downlink: connection.downlink || 'Unknown',
      rtt: connection.rtt || 'Unknown'
    };
  }
  return { effectiveType: 'Unknown', downlink: 'Unknown', rtt: 'Unknown' };
};

// Collect comprehensive device information
export const collectDeviceInfo = (): DevicePayloadData => {
  const userAgent = navigator.userAgent;
  
  return {
    userAgent,
    browser: getBrowserInfo(userAgent),
    os: getOSInfo(userAgent),
    device: getDeviceInfo(userAgent),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    hardware: {
      cores: navigator.hardwareConcurrency || 'Unknown',
      memory: navigator.deviceMemory || 'Unknown',
      connection: getConnectionInfo()
    },
    timezone: {
      offset: new Date().getTimezoneOffset(),
      name: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };
};

// Generate a stable device hash
export const generateDeviceHash = (deviceInfo?: DevicePayloadData): string => {
  const info = deviceInfo || collectDeviceInfo();
  
  // Create a stable string from device characteristics
  const hashString = [
    info.device.vendor,
    info.device.model,
    info.browser.name,
    info.browser.version,
    info.os.name,
    info.os.version,
    info.screen.width,
    info.screen.height,
    info.screen.colorDepth,
    info.hardware.cores,
    info.hardware.memory,
    info.language,
    info.platform
  ].join('|');
  
  // Generate SHA-256 hash
  return CryptoJS.SHA256(hashString).toString();
};

// Get device fingerprint (hash + basic info)
export const getDeviceFingerprint = () => {
  const deviceInfo = collectDeviceInfo();
  const hash = generateDeviceHash(deviceInfo);
  
  return {
    hash,
    deviceInfo: {
      type: deviceInfo.device.type,
      vendor: deviceInfo.device.vendor,
      model: deviceInfo.device.model,
      browser: `${deviceInfo.browser.name} ${deviceInfo.browser.version}`,
      os: `${deviceInfo.os.name} ${deviceInfo.os.version}`,
      platform: deviceInfo.platform
    }
  };
};
