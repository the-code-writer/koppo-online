import { apiService } from './api';

export interface DeviceMeta {
  pusherDeviceId: string;
  notificationsEnabled: boolean;
  browserFingerPrint: number;
}

export interface DeviceInfo {
  type: string;
  vendor: string;
  model: string;
}

export interface Device {
  meta: DeviceMeta;
  device: DeviceInfo;
  notificationStatus: string;
  handshakeCompleted: boolean;
  isActive: boolean;
  bannedUntil: number;
  _id: string;
  deviceId: string;
  deviceHash: string;
  userAgent: string;
  language?: string;
  lastSeen: string;
  registeredAt: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
}

export interface DevicesPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetDevicesResponse {
  success: boolean;
  message: string;
  data: {
    devices: Device[];
    pagination: DevicesPagination;
  };
}

export interface RevokeDeviceResponse {
  success: boolean;
  message: string;
}

class DevicesService {
  private static instance: DevicesService;

  private constructor() {}

  public static getInstance(): DevicesService {
    if (!DevicesService.instance) {
      DevicesService.instance = new DevicesService();
    }
    return DevicesService.instance;
  }

  /**
   * Get all devices for the current user
   * @param page - Page number for pagination
   * @param limit - Number of devices per page
   * @returns Promise<GetDevicesResponse>
   */
  async getDevices(page: number = 1, limit: number = 20): Promise<GetDevicesResponse> {
    try {
      const response = await apiService.get<GetDevicesResponse>(
        '/v1/devices',
        { page, limit }
      );
      return response;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }

  /**
   * Revoke/logout a specific device
   * @param deviceId - The device ID to revoke
   * @returns Promise<RevokeDeviceResponse>
   */
  async revokeDevice(deviceId: string): Promise<RevokeDeviceResponse> {
    try {
      const response = await apiService.delete<RevokeDeviceResponse>(
        `/v1/devices/${deviceId}`
      );
      return response;
    } catch (error) {
      console.error('Error revoking device:', error);
      throw error;
    }
  }

  /**
   * Revoke all devices except current
   * @returns Promise<RevokeDeviceResponse>
   */
  async revokeAllDevices(): Promise<RevokeDeviceResponse> {
    try {
      const response = await apiService.delete<RevokeDeviceResponse>(
        '/v1/devices/all'
      );
      return response;
    } catch (error) {
      console.error('Error revoking all devices:', error);
      throw error;
    }
  }
}

export const apiDevicesService = DevicesService.getInstance();
