// ==================== NOTIFICATION TYPES ====================

// Re-export types from the API service for consistency
export type {
  Notification,
  NotificationPayload,
  NotificationMetadata,
  NotificationPusher,
  NotificationDeviceStatus,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  MarkAsReadRequest,
  BulkMarkAsReadRequest,
  MarkDeviceDeliveredRequest,
  ListNotificationsQuery,
  GetUnreadCountQuery,
  GetNotificationStatsQuery,
  PublishPusherEventRequest,
  ApiResponse,
  PaginatedResponse,
  NotificationStats,
  UnreadCountResponse,
  BulkOperationResponse,
  PusherConfigStatus,
  PusherAuthResponse,
  DeviceIdsResponse
} from '../services/notificationAPIService';

// Additional types for UI components
export type NotificationType = 
  | 'achievement'
  | 'trade' 
  | 'system'
  | 'alert'
  | 'info'
  | 'profit'
  | 'loss';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 'trading' | 'system' | 'account' | 'security' | 'marketing';

// ==================== UI-SPECIFIC TYPES ====================

export interface NotificationListParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  read?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'time';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  lastUpdated: Date | null;
}

export interface NotificationContextType extends NotificationState {
  // Actions
  fetchNotifications: (params?: NotificationListParams) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
  
  // Computed values
  unreadNotifications: Notification[];
  readNotifications: Notification[];
  notificationsByType: Record<NotificationType, Notification[]>;
  
  // Loading states
  isLoading: boolean;
  isMarkingAsRead: boolean;
  isDeleting: boolean;
}

// ==================== PUSHER EVENT TYPES ====================

export interface PusherNotificationEvent {
  event: 'notification_created' | 'notification_updated' | 'notification_deleted';
  data: Notification;
}

export interface PusherNotificationData {
  channel: string;
  event: string;
  data: Notification;
  timestamp: string;
}
