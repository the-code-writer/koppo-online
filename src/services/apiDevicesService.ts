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
  riskScore?: number;
  location?: any;
  lastLoginTime?: string;
  ipAddress?: string;
  flags?: {
    suspiciousLogin: boolean;
    newDevice: boolean;
    newLocation: boolean;
    bruteForceAttempt: boolean;
    concurrentSession: boolean;
  };
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

export interface RevokeSessionResponse {
  success: boolean;
  message: string;
  data?: {
    endedSessions?: string[];
    count?: number;
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
        '/devices',
        { page, limit }
      );
      return response;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }

  /**
   * End a specific login session
   * @param sessionId - The session ID to end
   * @returns Promise<RevokeSessionResponse>
   */
  async endSession(sessionId: string): Promise<RevokeSessionResponse> {
    try {
      const response = await apiService.post<RevokeSessionResponse>(
        `/login-sessions/${sessionId}/end`,
        { reason: 'logout' }
      );
      return response;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * End all login sessions for a user
   * @param userId - The user ID
   * @returns Promise<RevokeSessionResponse>
   */
  async endAllSessions(userId: string): Promise<RevokeSessionResponse> {
    try {
      const response = await apiService.post<RevokeSessionResponse>(
        `/login-sessions/user/${userId}/end-all`
      );
      return response;
    } catch (error) {
      console.error('Error ending all sessions:', error);
      throw error;
    }
  }

  /**
   * Revoke/logout a specific device (legacy method)
   * @param deviceId - The device ID to revoke
   * @returns Promise<RevokeDeviceResponse>
   */
  async revokeDevice(deviceId: string): Promise<RevokeDeviceResponse> {
    try {
      const response = await apiService.delete<RevokeDeviceResponse>(
        `/devices/${deviceId}`
      );
      return response;
    } catch (error) {
      console.error('Error revoking device:', error);
      throw error;
    }
  }

  /**
   * Revoke all devices except current (legacy method)
   * @returns Promise<RevokeDeviceResponse>
   */
  async revokeAllDevices(): Promise<RevokeDeviceResponse> {
    try {
      const response = await apiService.delete<RevokeDeviceResponse>(
        '/devices/all'
      );
      return response;
    } catch (error) {
      console.error('Error revoking all devices:', error);
      throw error;
    }
  }
}

export const apiDevicesService = DevicesService.getInstance();
