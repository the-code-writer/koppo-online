/**
 * Notification API Service
 * A comprehensive TypeScript service for consuming the Notifications module API endpoints
 * Provides full type safety and error handling for frontend applications
 */

import { apiService } from './api';

// ==================== INTERFACES ====================

/**
 * Base notification payload structure
 */
export interface NotificationPayload {
  type: 'profit' | 'loss' | 'achievement' | 'trade' | 'system' | 'alert' | 'info';
  amount?: number;
  profit?: number;
  loss?: number;
  title?: string;
  description?: string;
  tags?: string[];
}

/**
 * Notification metadata for display configuration
 */
export interface NotificationMetadata {
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  icon?: string | null;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  delay?: number;
  playSound?: boolean;
  alertType: 'success-emoji' | 'error-emoji' | 'warning-emoji' | 'info-emoji' | 'default';
}

/**
 * Pusher integration configuration
 */
export interface NotificationPusher {
  channel: string;
  event: string;
  timestamp?: string;
  payload?: Record<string, any>;
}

/**
 * Device-specific notification status
 */
export interface NotificationDeviceStatus {
  delivered: boolean;
  deliveredAt?: string;
  read: boolean;
  readAt?: string;
}

/**
 * Complete notification data structure
 */
export interface Notification {
  _id: string;
  type: 'achievement' | 'trade' | 'system' | 'alert' | 'info' | 'profit' | 'loss';
  title: string;
  message: string;
  userUUID: string;
  read: boolean;
  time: string;
  payload: NotificationPayload;
  metadata: NotificationMetadata;
  pusher: NotificationPusher;
  devices: Record<string, NotificationDeviceStatus>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'trading' | 'system' | 'account' | 'security' | 'marketing';
  expiresAt?: string;
  deliveryAttempts?: number;
  lastDeliveryAttempt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create notification request payload
 */
export interface CreateNotificationRequest {
  type: 'achievement' | 'trade' | 'system' | 'alert' | 'info' | 'profit' | 'loss';
  title: string;
  message: string;
  userUUID: string;
  payload?: Partial<NotificationPayload>;
  metadata?: Partial<NotificationMetadata>;
  pusher?: Partial<NotificationPusher>;
  devices?: Record<string, Partial<NotificationDeviceStatus>>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'trading' | 'system' | 'account' | 'security' | 'marketing';
  expiresAt?: string;
}

/**
 * Update notification request payload
 */
export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  read?: boolean;
  payload?: Partial<NotificationPayload>;
  metadata?: Partial<NotificationMetadata>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'trading' | 'system' | 'account' | 'security' | 'marketing';
  expiresAt?: string;
}

/**
 * Mark notification as read request
 */
export interface MarkAsReadRequest {
  deviceId?: string;
  markAll?: boolean;
}

/**
 * Bulk mark as read request
 */
export interface BulkMarkAsReadRequest {
  notificationIds: string[];
  deviceId?: string;
}

/**
 * Mark device delivered request
 */
export interface MarkDeviceDeliveredRequest {
  deviceId: string;
}

/**
 * List notifications query parameters
 */
export interface ListNotificationsQuery {
  userUUID: string;
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  priority?: string;
  read?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get unread count query parameters
 */
export interface GetUnreadCountQuery {
  userUUID: string;
  category?: string;
}

/**
 * Get notification statistics query parameters
 */
export interface GetNotificationStatsQuery {
  userUUID: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Pusher publish event request
 */
export interface PublishPusherEventRequest {
  channel: string | string[];
  eventName: string;
  data: Record<string, any>;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    notifications: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * Notification statistics response
 */
export interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  readRate: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  updated: number;
}

/**
 * Pusher configuration status
 */
export interface PusherConfigStatus {
  configured: boolean;
  appId: boolean;
  key: boolean;
  secret: boolean;
  cluster: boolean;
  baseUrl: string;
}

/**
 * Pusher authentication response
 */
export interface PusherAuthResponse {
  auth: string;
  channel_data: string;
}

/**
 * Device IDs response
 */
export interface DeviceIdsResponse {
  deviceIds: string[];
  pusherDeviceIds: string[];
  totalDevices: number;
}

// ==================== SERVICE CLASS ====================

/**
 * Notification API Service class
 * Provides methods to interact with all notification endpoints using the existing apiService
 */
export class NotificationAPIService {
  private baseURL: string;

  /**
   * Initialize the notification service
   * @param baseURL Base URL for the API
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      return queryString ? `${url}?${queryString}` : url;
    }
    return url;
  }

  // ==================== NOTIFICATION CRUD OPERATIONS ====================

  /**
   * Create a new notification
   */
  async createNotification(notification: CreateNotificationRequest): Promise<ApiResponse<Notification>> {
    return apiService.post<ApiResponse<Notification>>('/notifications', notification);
  }

  /**
   * Create multiple notifications in bulk
   */
  async createBulkNotifications(notifications: CreateNotificationRequest[]): Promise<ApiResponse<{ created: number; notifications: Notification[] }>> {
    return apiService.post<ApiResponse<{ created: number; notifications: Notification[] }>>('/notifications/bulk', { notifications });
  }

  /**
   * List notifications with filtering and pagination
   */
  async listNotifications(query: ListNotificationsQuery): Promise<PaginatedResponse<Notification>> {
    const url = this.buildURL('/notifications', query);
    const response = await apiService.get<PaginatedResponse<Notification>>(url);
    
    // Ensure the response matches the expected structure
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to retrieve notifications');
    }
    
    return response;
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(notificationId: string, userUUID: string): Promise<ApiResponse<Notification>> {
    const url = this.buildURL(`/notifications/${notificationId}`, { userUUID });
    return apiService.get<ApiResponse<Notification>>(url);
  }

  /**
   * Update a notification
   */
  async updateNotification(notificationId: string, userUUID: string, updates: UpdateNotificationRequest): Promise<ApiResponse<Notification>> {
    const url = this.buildURL(`/notifications/${notificationId}`, { userUUID });
    return apiService.put<ApiResponse<Notification>>(url, updates);
  }

  /**
   * Delete a notification (soft delete by default)
   */
  async deleteNotification(notificationId: string, hardDelete = false): Promise<ApiResponse<{ deleted: boolean }>> {
    const url = this.buildURL(`/notifications/${notificationId}`, { hardDelete });
    return apiService.delete<ApiResponse<{ deleted: boolean }>>(url, { hardDelete });
  }

  // ==================== NOTIFICATION STATUS OPERATIONS ====================

  /**
   * Mark notification as read (single or all)
   */
  async markAsRead(notificationId: string, request: MarkAsReadRequest): Promise<ApiResponse<Notification>> {
    const url = this.buildURL(`/notifications/${notificationId}/read`);
    return apiService.patch<ApiResponse<Notification>>(url, request);
  }

  /**
   * Mark multiple notifications as read
   */
  async bulkMarkAsRead( request: BulkMarkAsReadRequest): Promise<ApiResponse<BulkOperationResponse>> {
    const url = this.buildURL('/notifications/bulk/read');
    return apiService.patch<ApiResponse<BulkOperationResponse>>(url, request);
  }

  /**
   * Mark notification as delivered to specific device
   */
  async markAsDelivered(notificationId: string, userUUID: string, request: MarkDeviceDeliveredRequest): Promise<ApiResponse<Notification>> {
    const url = this.buildURL(`/notifications/${notificationId}/delivered`, { userUUID });
    return apiService.patch<ApiResponse<Notification>>(url, request);
  }

  // ==================== NOTIFICATION ANALYTICS ====================

  /**
   * Get unread notification count
   */
  async getUnreadCount(query: GetUnreadCountQuery): Promise<ApiResponse<UnreadCountResponse>> {
    const url = this.buildURL('/notifications/unread/count', query);
    return apiService.get<ApiResponse<UnreadCountResponse>>(url);
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(query: GetNotificationStatsQuery): Promise<ApiResponse<NotificationStats>> {
    const url = this.buildURL('/notifications/stats', query);
    return apiService.get<ApiResponse<NotificationStats>>(url);
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(olderThan: string): Promise<ApiResponse<BulkOperationResponse>> {
    return apiService.post<ApiResponse<BulkOperationResponse>>('/notifications/expire', { olderThan });
  }

  // ==================== PUSHER INTEGRATION ====================

  /**
   * Publish event to Pusher channels
   */
  async publishPusherEvent(request: PublishPusherEventRequest): Promise<ApiResponse<{ channel: string; eventName: string; published: boolean }>> {
    return apiService.post<ApiResponse<{ channel: string; eventName: string; published: boolean }>>('/pusher/publish-event', request);
  }

  /**
   * Get Pusher configuration status
   */
  async getPusherConfig(): Promise<ApiResponse<PusherConfigStatus>> {
    return apiService.get<ApiResponse<PusherConfigStatus>>('/pusher/config');
  }

  /**
   * Authenticate user for private Pusher channel
   */
  async authenticatePusherChannel(request: {
    socketId: string;
    channel: string;
    userUUID: string;
  }): Promise<ApiResponse<PusherAuthResponse>> {
    return apiService.post<ApiResponse<PusherAuthResponse>>('/pusher/authenticate', request);
  }

  // ==================== DEVICE INTEGRATION ====================

  /**
   * Get device IDs for a user (for Pusher integration)
   */
  async getDeviceIds(userUUID: string): Promise<ApiResponse<DeviceIdsResponse>> {
    return apiService.get<ApiResponse<DeviceIdsResponse>>(`/devices/${userUUID}/get-ids`);
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Create achievement notification with sensible defaults
   */
  async createAchievementNotification(userUUID: string, title: string, message: string, options: Partial<CreateNotificationRequest> = {}): Promise<ApiResponse<Notification>> {
    const notification: CreateNotificationRequest = {
      type: 'achievement',
      title,
      message,
      userUUID,
      category: 'trading',
      priority: 'medium',
      metadata: {
        type: 'success',
        icon: '🏆',
        placement: 'top',
        playSound: true,
        alertType: 'success-emoji',
      },
      ...options,
    };

    return this.createNotification(notification);
  }

  /**
   * Create profit notification with sensible defaults
   */
  async createProfitNotification(userUUID: string, amount: number, options: Partial<CreateNotificationRequest> = {}): Promise<ApiResponse<Notification>> {
    const notification: CreateNotificationRequest = {
      type: 'profit',
      title: 'Profit Earned',
      message: `You earned $${amount.toFixed(2)} profit!`,
      userUUID,
      category: 'trading',
      priority: 'high',
      payload: {
        type: 'profit',
        amount,
        profit: amount,
        tags: ['profit', 'trading'],
      },
      metadata: {
        type: 'success',
        icon: '💰',
        placement: 'top',
        playSound: true,
        alertType: 'success-emoji',
      },
      ...options,
    };

    return this.createNotification(notification);
  }

  /**
   * Create system notification with sensible defaults
   */
  async createSystemNotification(userUUID: string, title: string, message: string, options: Partial<CreateNotificationRequest> = {}): Promise<ApiResponse<Notification>> {
    const notification: CreateNotificationRequest = {
      type: 'system',
      title,
      message,
      userUUID,
      category: 'system',
      priority: 'medium',
      metadata: {
        type: 'info',
        icon: 'ℹ️',
        placement: 'top',
        playSound: false,
        alertType: 'info-emoji',
      },
      ...options,
    };

    return this.createNotification(notification);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(deviceId?: string): Promise<ApiResponse<BulkOperationResponse>> {
    return this.bulkMarkAsRead({
      notificationIds: [], // This will be handled by the backend to mark all
      deviceId,
    });
  }

  /**
   * Get unread count for all categories
   */
  async getAllUnreadCounts(userUUID: string): Promise<ApiResponse<Record<string, number>>> {
    const categories: Array<'trading' | 'system' | 'account' | 'security' | 'marketing'> = ['trading', 'system', 'account', 'security', 'marketing'];
    const counts: Record<string, number> = {};

    for (const category of categories) {
      try {
        const response = await this.getUnreadCount({ userUUID, category });
        if (response.success && response.data) {
          counts[category] = response.data.count;
        }
      } catch (error) {
        console.error(`Failed to get unread count for ${category}:`, error);
        counts[category] = 0;
      }
    }

    return {
      success: true,
      message: 'Unread counts retrieved successfully',
      data: counts,
    };
  }

  /**
   * Create notification with automatic Pusher publishing
   */
  async createNotificationWithPusher(
    notification: CreateNotificationRequest,
    pusherChannel?: string,
    pusherEvent = 'notification'
  ): Promise<ApiResponse<Notification>> {
    // Add Pusher configuration if channel is provided
    if (pusherChannel) {
      notification.pusher = {
        channel: pusherChannel,
        event: pusherEvent,
        timestamp: new Date().toISOString(),
        payload: notification.payload || {},
      };
    }

    return this.createNotification(notification);
  }

  /**
   * Get notifications for a specific device
   */
  async getNotificationsForDevice(userUUID: string, deviceId: string, options: Partial<ListNotificationsQuery> = {}): Promise<Notification[]> {
    // Get all notifications for the user
    const response = await this.listNotifications({
      userUUID,
      limit: 1000, // Get a large batch to filter
      ...options,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to retrieve notifications');
    }

    // Filter notifications that are not read on this specific device
    return response.data.notifications.filter(notification => {
      const deviceStatus = notification.devices[deviceId];
      return !deviceStatus || !deviceStatus.read;
    });
  }
}

// ==================== EXPORTS ====================

export default NotificationAPIService;
