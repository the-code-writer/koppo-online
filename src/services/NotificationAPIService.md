# NotificationAPIService

A comprehensive TypeScript service for consuming the Notifications module API endpoints. Provides full type safety, error handling, and convenient methods for frontend applications.

## 🚀 Quick Start

```typescript
import NotificationAPIService from './notificationAPIService';

// Initialize the service
const notificationService = new NotificationAPIService('http://localhost:3052');

// Create a simple notification
const notification = await notificationService.createAchievementNotification(
  'user-uuid-123',
  'Welcome!',
  'Thanks for joining our platform'
);

// List notifications
const notifications = await notificationService.listNotifications({
  userUUID: 'user-uuid-123',
  page: 1,
  limit: 20
});
```

## 📋 Table of Contents

- [Installation](#installation)
- [Initialization](#initialization)
- [API Methods](#api-methods)
- [Type Definitions](#type-definitions)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## 🔧 Installation

```bash
# The service is ready to use - just import it
import NotificationAPIService from './notificationAPIService';
```

## 🎯 Initialization

```typescript
// Basic initialization
const notificationService = new NotificationAPIService('http://localhost:3052');

// With custom base URL
const notificationService = new NotificationAPIService('https://api.yourapp.com');
```

## 📡 API Methods

### 📱 Notification CRUD Operations

#### Create Notification
```typescript
const notification = await notificationService.createNotification({
  type: 'achievement',
  title: 'New Achievement',
  message: 'You reached a new milestone!',
  userUUID: 'user-uuid-123',
  category: 'trading',
  priority: 'medium'
});
```

#### Create Bulk Notifications
```typescript
const notifications = await notificationService.createBulkNotifications([
  {
    type: 'achievement',
    title: 'First Trade',
    message: 'Completed your first trade!',
    userUUID: 'user-uuid-123'
  },
  {
    type: 'profit',
    title: 'Daily Profit',
    message: 'Today was profitable!',
    userUUID: 'user-uuid-123'
  }
]);
```

#### List Notifications
```typescript
const notifications = await notificationService.listNotifications({
  userUUID: 'user-uuid-123',
  page: 1,
  limit: 20,
  type: 'achievement',
  read: false,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

#### Get Specific Notification
```typescript
const notification = await notificationService.getNotification(
  'notification-id-123',
  'user-uuid-123'
);
```

#### Update Notification
```typescript
const updated = await notificationService.updateNotification(
  'notification-id-123',
  'user-uuid-123',
  {
    title: 'Updated Title',
    message: 'Updated message',
    read: true
  }
);
```

#### Delete Notification
```typescript
// Soft delete (default)
const deleted = await notificationService.deleteNotification(
  'notification-id-123',
  'user-uuid-123'
);

// Hard delete
const hardDeleted = await notificationService.deleteNotification(
  'notification-id-123',
  'user-uuid-123',
  true
);
```

### 🔄 Status Management

#### Mark as Read
```typescript
// Mark specific notification as read for device
await notificationService.markAsRead(
  'notification-id-123',
  'user-uuid-123',
  {
    deviceId: 'device-123',
    markAll: false
  }
);

// Mark all notifications as read
await notificationService.markAsRead(
  'notification-id-123',
  'user-uuid-123',
  {
    markAll: true
  }
);
```

#### Bulk Mark as Read
```typescript
const result = await notificationService.bulkMarkAsRead(
  'user-uuid-123',
  {
    notificationIds: ['id1', 'id2', 'id3'],
    deviceId: 'device-123'
  }
);
```

#### Mark as Delivered
```typescript
await notificationService.markAsDelivered(
  'notification-id-123',
  'user-uuid-123',
  {
    deviceId: 'device-123'
  }
);
```

### 📊 Analytics

#### Get Unread Count
```typescript
const unreadCount = await notificationService.getUnreadCount({
  userUUID: 'user-uuid-123',
  category: 'trading'
});
```

#### Get Statistics
```typescript
const stats = await notificationService.getNotificationStats({
  userUUID: 'user-uuid-123',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

#### Clean Up Expired
```typescript
const result = await notificationService.cleanupExpiredNotifications(
  '2026-01-01T00:00:00.000Z'
);
```

### 🌐 Pusher Integration

#### Publish Event
```typescript
await notificationService.publishPusherEvent({
  channel: 'private-user-user-uuid-123',
  eventName: 'notification',
  data: { message: 'Hello World!' }
});
```

#### Get Pusher Config
```typescript
const config = await notificationService.getPusherConfig();
```

#### Authenticate Channel
```typescript
const auth = await notificationService.authenticatePusherChannel({
  socketId: 'socket-id-123',
  channel: 'private-user-user-uuid-123',
  userUUID: 'user-uuid-123'
});
```

### 📱 Device Integration

#### Get Device IDs
```typescript
const deviceIds = await notificationService.getDeviceIds('user-uuid-123');
```

## 🎨 Convenience Methods

### Quick Notification Creation

#### Achievement Notification
```typescript
const achievement = await notificationService.createAchievementNotification(
  'user-uuid-123',
  'Welcome!',
  'Thanks for joining our platform'
);
```

#### Profit Notification
```typescript
const profit = await notificationService.createProfitNotification(
  'user-uuid-123',
  150.75,
  {
    title: 'Trade Profit',
    message: 'Your EUR/USD trade was profitable!'
  }
);
```

#### System Notification
```typescript
const system = await notificationService.createSystemNotification(
  'user-uuid-123',
  'Maintenance',
  'System will be under maintenance'
);
```

### Bulk Operations

#### Mark All as Read
```typescript
const result = await notificationService.markAllAsRead(
  'user-uuid-123',
  'device-123'
);
```

#### Get All Unread Counts
```typescript
const counts = await notificationService.getAllUnreadCounts('user-uuid-123');
// Returns: { trading: 5, system: 2, account: 1, security: 0, marketing: 3 }
```

### Pusher Integration

#### Create with Pusher
```typescript
const notification = await notificationService.createNotificationWithPusher(
  {
    type: 'profit',
    title: 'Trade Profit',
    message: 'Your trade was profitable!',
    userUUID: 'user-uuid-123'
  },
  'private-user-user-uuid-123'
);
```

#### Device-Specific Notifications
```typescript
const deviceNotifications = await notificationService.getNotificationsForDevice(
  'user-uuid-123',
  'device-123',
  { read: false }
);
```

## 📋 Type Definitions

### Core Types

```typescript
interface Notification {
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
  // ... more fields
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
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
```

### Request Types

```typescript
interface CreateNotificationRequest {
  type: 'achievement' | 'trade' | 'system' | 'alert' | 'info' | 'profit' | 'loss';
  title: string;
  message: string;
  userUUID: string;
  payload?: Partial<NotificationPayload>;
  metadata?: Partial<NotificationMetadata>;
  pusher?: Partial<NotificationPusher>;
  // ... more optional fields
}

interface ListNotificationsQuery {
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
```

## 🚨 Error Handling

```typescript
try {
  const notification = await notificationService.createNotification({
    type: 'achievement',
    title: 'Test',
    message: 'Test message',
    userUUID: 'user-uuid-123'
  });
  
  if (notification.success) {
    console.log('Notification created:', notification.data);
  } else {
    console.error('API Error:', notification.message);
  }
} catch (error) {
  console.error('Network/Service Error:', error);
}
```

### Common Error Types

1. **Network Errors**: Connection issues, timeouts
2. **Validation Errors**: Invalid request data
3. **Authorization Errors**: Missing or invalid userUUID
4. **Not Found Errors**: Notification doesn't exist
5. **Server Errors**: Internal server issues

## 🎯 Best Practices

### 1. Always Check Success Status

```typescript
const response = await notificationService.createNotification(data);
if (!response.success) {
  throw new Error(response.message || 'Failed to create notification');
}
```

### 2. Use Type-Safe Interfaces

```typescript
// ✅ Good - Use proper types
const notification: CreateNotificationRequest = {
  type: 'achievement',
  title: 'Test',
  message: 'Test message',
  userUUID: 'user-uuid-123'
};

// ❌ Bad - Using any
const notification: any = {
  // ... no type safety
};
```

### 3. Handle Pagination

```typescript
const fetchNotifications = async (page = 1) => {
  const response = await notificationService.listNotifications({
    userUUID: 'user-uuid-123',
    page,
    limit: 20
  });
  
  if (response.success && response.data) {
    const { notifications, pagination } = response.data;
    return { notifications, pagination };
  }
  
  throw new Error('Failed to fetch notifications');
};
```

### 4. Use Convenience Methods

```typescript
// ✅ Good - Use convenience methods
const achievement = await notificationService.createAchievementNotification(
  'user-uuid-123',
  'Welcome!',
  'Thanks for joining'
);

// ❌ Okay - Manual creation works but is more verbose
const achievement = await notificationService.createNotification({
  type: 'achievement',
  title: 'Welcome!',
  message: 'Thanks for joining',
  userUUID: 'user-uuid-123',
  category: 'trading',
  priority: 'medium',
  metadata: {
    type: 'success',
    icon: '🏆',
    placement: 'top',
    playSound: true,
    alertType: 'success-emoji'
  }
});
```

### 5. Error Recovery

```typescript
const createNotificationWithRetry = async (data: CreateNotificationRequest, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await notificationService.createNotification(data);
      if (response.success) {
        return response;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      if (i === retries - 1) throw error;
      // Log and continue
      console.warn(`Retry ${i + 1} failed:`, error);
    }
  }
  
  throw new Error('Failed to create notification after retries');
};
```

## 🔍 Advanced Usage

### Real-time Updates with Pusher

```typescript
// Create notification with Pusher
const notification = await notificationService.createNotificationWithPusher(
  {
    type: 'trade',
    title: 'Trade Completed',
    message: 'Your trade was successful',
    userUUID: 'user-uuid-123'
  },
  'private-user-user-uuid-123'
);

// Listen for real-time updates (in your frontend)
const pusher = new Pusher('your-pusher-key');
const channel = pusher.subscribe('private-user-user-uuid-123');

channel.bind('notification', (data) => {
  console.log('New notification:', data);
  // Update your UI
});
```

### Device-Specific Tracking

```typescript
// Get unread notifications for specific device
const unreadForDevice = await notificationService.getNotificationsForDevice(
  'user-uuid-123',
  'device-123',
  { read: false }
);

// Mark as read for specific device
await notificationService.markAsRead(
  'notification-id-123',
  'user-uuid-123',
  { deviceId: 'device-123', markAll: false }
);
```

### Analytics Dashboard

```typescript
const buildNotificationDashboard = async (userUUID: string) => {
  const [stats, unreadCounts] = await Promise.all([
    notificationService.getNotificationStats({ userUUID }),
    notificationService.getAllUnreadCounts(userUUID)
  ]);

  if (stats.success && unreadCounts.success) {
    return {
      totalStats: stats.data,
      unreadByCategory: unreadCounts.data,
      readRate: stats.data.readRate,
      totalUnread: Object.values(unreadCounts.data).reduce((a, b) => a + b, 0)
    };
  }
  
  throw new Error('Failed to build dashboard');
};
```

## 📞 Support

For issues and questions:
- Check the API documentation for endpoint details
- Review the type definitions for proper usage
- Test with the provided examples
- Ensure proper error handling in production code

## 🔄 Migration from Direct API Calls

If you're currently using direct fetch/axios calls, here's how to migrate:

### Before (Direct API)
```typescript
const createNotification = async (data) => {
  const response = await fetch('/api/v1/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### After (NotificationAPIService)
```typescript
const notificationService = new NotificationAPIService('http://localhost:3052');
const createNotification = async (data: CreateNotificationRequest) => {
  return notificationService.createNotification(data);
};
```

**Benefits of Migration:**
- ✅ Full TypeScript support
- ✅ Type safety and IntelliSense
- ✅ Consistent error handling
- ✅ Convenient methods
- ✅ Better maintainability
