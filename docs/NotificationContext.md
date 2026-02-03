# NotificationContext Developer Documentation

## Overview

The `NotificationContext` provides a centralized, flexible notification system for the entire application. It supports multiple notification types including standard Ant Design notifications, custom bullet/emoji notifications, message popups, and notifications with progress bars.

## Features

- 🎨 **Multiple Notification Types**: Standard, bullet, emoji, and message notifications
- 📊 **Progress Bar Support**: Visual countdown for timed notifications
- 🎯 **Custom Styling**: Bullet points, emojis, and custom icons
- 🔘 **Action Buttons**: Interactive notifications with custom actions
- ⚡ **TypeScript Support**: Full type safety and IntelliSense
- 🌍 **Global Access**: Available throughout the entire app

## Installation & Setup

The NotificationContext is already set up in your application through the `AppProviders`. No additional installation required.

### Provider Setup

```tsx
// Already configured in AppProviders.tsx
<NotificationProvider>
  <LocalStorageProvider>
    {/* Other providers */}
  </LocalStorageProvider>
</NotificationProvider>
```

## Basic Usage

```tsx
import { useNotification } from '../contexts/NotificationContext';

function MyComponent() {
  const { openNotification } = useNotification();

  const handleClick = () => {
    openNotification('Title', 'Message content');
  };

  return <button onClick={handleClick}>Show Notification</button>;
}
```

## Notification Types

### 1. Standard Notifications

Uses Ant Design's built-in notification types with default icons.

```tsx
// Error notification
openNotification('Error', 'Something went wrong', { 
  type: 'error' 
});

// Success notification
openNotification('Success', 'Operation completed', { 
  type: 'success' 
});

// Warning notification
openNotification('Warning', 'Please review your input', { 
  type: 'warn' 
});

// Info notification
openNotification('Info', 'New update available', { 
  type: 'info' 
});
```

### 2. Bullet Notifications

Custom bullet points before the title for visual emphasis.

```tsx
// Red bullet for errors
openNotification('Login Failed', 'Invalid credentials', { 
  type: 'bullet-error' 
});

// Green bullet for success
openNotification('Upload Complete', 'File uploaded successfully', { 
  type: 'bullet-success' 
});

// Yellow bullet for warnings
openNotification('Attention', 'Disk space running low', { 
  type: 'bullet-warn' 
});

// Blue bullet for info
openNotification('New Message', 'You have a new message', { 
  type: 'bullet-info' 
});
```

### 3. Emoji Notifications

Emoji icons for a more casual, friendly interface.

```tsx
// Error emoji
openNotification('Oops!', 'Something went wrong', { 
  type: 'emoji-error' 
});

// Success emoji
openNotification('Great!', 'Task completed successfully', { 
  type: 'emoji-success' 
});

// Warning emoji
openNotification('Heads Up!', 'Please check this', { 
  type: 'emoji-warn' 
});

// Info emoji
openNotification('FYI', 'Here\'s some information', { 
  type: 'emoji-info' 
});
```

### 4. Message Popups

Quick, non-intrusive messages that auto-dismiss. Perfect for immediate feedback.

```tsx
// Quick success message
openNotification('Success', 'Settings saved', { 
  type: 'message-success' 
});

// Quick error message
openNotification('Error', 'Failed to save', { 
  type: 'message-error' 
});

// Quick info message
openNotification('Info', 'Loading...', { 
  type: 'message-info' 
});

// Quick warning message
openNotification('Warning', 'Unsaved changes', { 
  type: 'message-warn' 
});
```

### 5. Iconless Notifications

Clean notifications without any icons or bullets.

```tsx
// Clean, minimal notification
openNotification('Simple Message', 'Just text, no icons', { 
  type: null 
});
```

## Advanced Features

### Progress Bar Notifications

Visual countdown showing how long the notification will remain visible.

```tsx
// Progress bar with default duration (10 seconds)
openNotification('Processing', 'Your request is being processed', {
  showProgressBar: true
});

// Progress bar with custom duration
openNotification('Uploading', 'File upload in progress', {
  showProgressBar: true,
  duration: 15
});

// Progress bar with custom type
openNotification('Success!', 'Operation completed', {
  type: 'success',
  showProgressBar: true,
  duration: 5
});
```

### Custom Icons

Use any React component as a notification icon.

```tsx
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

// Custom success icon
openNotification('Verified', 'Account verified successfully', {
  icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
});

// Custom warning icon
openNotification('Attention', 'Please review your settings', {
  icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
});

// Custom icon with progress bar
openNotification('Downloading', 'File download started', {
  icon: <DownloadOutlined />,
  showProgressBar: true,
  duration: 20
});
```

### Action Buttons

Interactive notifications with custom action buttons.

```tsx
// Notification with action button
openNotification(
  'Device Not Authorized', 
  'This device needs to be registered before use.',
  {
    type: 'error',
    button: {
      label: 'Register Device',
      callback: () => {
        navigate('/device-registration');
      }
    }
  }
);

// Multiple actions (close + custom action)
openNotification(
  'Update Available', 
  'A new version of the app is ready to install.',
  {
    type: 'info',
    button: {
      label: 'Update Now',
      callback: () => {
        // Handle update
      }
    }
  }
);
```

### Custom Placement

Control where notifications appear on the screen.

```tsx
// Top left
openNotification('Alert', 'System maintenance scheduled', {
  type: 'warn',
  placement: 'topLeft'
});

// Top right (default)
openNotification('Info', 'New features available', {
  type: 'info',
  placement: 'topRight'
});

// Bottom left
openNotification('Status', 'Connection established', {
  type: 'success',
  placement: 'bottomLeft'
});

// Bottom right
openNotification('Error', 'Connection lost', {
  type: 'error',
  placement: 'bottomRight'
});
```

### Custom Duration

Control how long notifications remain visible.

```tsx
// Quick notification (2 seconds)
openNotification('Quick', 'Brief message', {
  type: 'info',
  duration: 2
});

// Longer notification (30 seconds)
openNotification('Important', 'Please read this carefully', {
  type: 'warn',
  duration: 30
});

// Persistent notification (no auto-dismiss)
openNotification('Critical', 'Requires your attention', {
  type: 'error',
  duration: 0
});
```

## Real-World Examples

### E-commerce Application

```tsx
// Product added to cart
const handleAddToCart = (product) => {
  addToCart(product);
  openNotification(
    'Added to Cart', 
    `${product.name} has been added to your cart`,
    { type: 'message-success' }
  );
};

// Order confirmation
const handleOrderComplete = (order) => {
  openNotification(
    'Order Confirmed!',
    `Order #${order.id} has been placed successfully`,
    { 
      type: 'bullet-success',
      showProgressBar: true,
      duration: 8,
      button: {
        label: 'View Order',
        callback: () => navigate(`/orders/${order.id}`)
      }
    }
  );
};

// Payment error
const handlePaymentError = (error) => {
  openNotification(
    'Payment Failed',
    error.message || 'Unable to process payment',
    { 
      type: 'emoji-error',
      button: {
        label: 'Try Again',
        callback: () => retryPayment()
      }
    }
  );
};
```

### File Management System

```tsx
// File upload start
const handleFileUpload = (file) => {
  openNotification(
    'Uploading File',
    `Uploading ${file.name}...`,
    { 
      type: 'info',
      showProgressBar: true,
      duration: 30
    }
  );
};

// Upload complete
const handleUploadComplete = (file) => {
  openNotification(
    'Upload Complete',
    `${file.name} uploaded successfully`,
    { 
      type: 'success',
      showProgressBar: true,
      duration: 5
    }
  );
};

// Upload error
const handleUploadError = (file, error) => {
  openNotification(
    'Upload Failed',
    `Failed to upload ${file.name}: ${error.message}`,
    { 
      type: 'message-error',
      button: {
        label: 'Retry',
        callback: () => retryUpload(file)
      }
    }
  );
};
```

### User Authentication

```tsx
// Login success
const handleLoginSuccess = (user) => {
  openNotification(
    'Welcome Back!',
    `Welcome ${user.displayName}`,
    { 
      type: 'message-success',
      showProgressBar: true,
      duration: 4
    }
  );
  navigate('/dashboard');
};

// Login error
const handleLoginError = (error) => {
  openNotification(
    'Login Failed',
    error.message || 'Invalid credentials',
    { 
      type: 'bullet-error',
      button: {
        label: 'Reset Password',
        callback: () => navigate('/forgot-password')
      }
    }
  );
};

// Session timeout warning
const handleSessionWarning = () => {
  openNotification(
    'Session Expiring',
    'Your session will expire in 5 minutes',
    { 
      type: 'warn',
      showProgressBar: true,
      duration: 300, // 5 minutes
      button: {
        label: 'Extend Session',
        callback: () => extendSession()
      }
    }
  );
};
```

### Data Processing

```tsx
// Data export started
const handleExportStart = (format) => {
  openNotification(
    'Export Started',
    `Exporting data as ${format.toUpperCase()}...`,
    { 
      type: 'info',
      showProgressBar: true,
      duration: 60
    }
  );
};

// Export complete
const handleExportComplete = (filename) => {
  openNotification(
    'Export Complete',
    `Your data has been exported to ${filename}`,
    { 
      type: 'success',
      button: {
        label: 'Download',
        callback: () => downloadFile(filename)
      }
    }
  );
};

// Processing error
const handleProcessingError = (error) => {
  openNotification(
    'Processing Error',
    `Failed to process data: ${error.message}`,
    { 
      type: 'emoji-error',
      duration: 0 // Persistent until dismissed
    }
  );
};
```

## API Reference

### `useNotification()` Hook

Returns an object with the `openNotification` function.

```tsx
const { openNotification } = useNotification();
```

### `openNotification(title, description, options?)`

**Parameters:**

- `title: string` - Notification title
- `description: string` - Notification message/content
- `options?: NotificationOptions` - Optional configuration object

**NotificationOptions Interface:**

```tsx
interface NotificationOptions {
  button?: NotificationButton | null;
  icon?: ReactNode | null;
  type?: 'error' | 'warn' | 'info' | 'success' | 
         'emoji-error' | 'emoji-info' | 'emoji-warn' | 'emoji-success' |
         'bullet-error' | 'bullet-info' | 'bullet-warn' | 'bullet-success' |
         'message-error' | 'message-info' | 'message-warn' | 'message-success' |
         null;
  duration?: number;
  placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
  showProgressBar?: boolean;
  progressColor?: string; // Future enhancement
}
```

**NotificationButton Interface:**

```tsx
interface NotificationButton {
  label: string;
  callback: () => void;
}
```

## Styling

### Progress Bar Styling

The progress bar can be customized through CSS:

```scss
// src/styles/custom.scss
.ant-notification .ant-notification-notice-wrapper .ant-notification-notice-progress {
  height: 4px;
  bottom: 4px;
}
```

### Theme Customization

Progress bar colors are configured through the ConfigProvider in NotificationContext:

```tsx
const defaultProgressColor = 'linear-gradient(135deg,#6253e1, #04befe)';
```

## Best Practices

### 1. Choose the Right Type

- **`message-*`**: Quick feedback, status updates, non-critical info
- **`bullet-*`**: Important alerts that need visual emphasis
- **`emoji-*`**: Friendly, casual interactions
- **Standard types**: Professional, business-critical notifications

### 2. Use Progress Bars Appropriately

- **Good for**: Time-sensitive operations, uploads, processing
- **Avoid for**: Critical errors, persistent information
- **Default duration**: 10 seconds when showing progress bar

### 3. Action Buttons

- **Use for**: Actions the user might want to take immediately
- **Clear labels**: Use action-oriented text ("View Order", "Retry")
- **Single action**: Keep it simple, one primary action per notification

### 4. Duration Guidelines

- **`message-*`**: 3 seconds (auto-dismiss)
- **Progress bar**: 5-15 seconds
- **Critical info**: 0 (persistent)
- **Standard notifications**: 0 (persistent) or 4-8 seconds

### 5. Error Handling

```tsx
// Good: Specific error with action
openNotification('Login Failed', 'Invalid email or password', {
  type: 'bullet-error',
  button: {
    label: 'Reset Password',
    callback: () => navigate('/forgot-password')
  }
});

// Avoid: Generic error message
openNotification('Error', 'Something went wrong', { type: 'error' });
```

## Troubleshooting

### Common Issues

1. **Progress bar not showing**: Ensure `showProgressBar: true` is set
2. **Message types not working**: Check that type starts with `message-`
3. **Custom buttons not appearing**: Verify button object has `label` and `callback`
4. **Duration not working**: For message types, duration is fixed at 3 seconds

### Debug Tips

```tsx
// Check notification options
const options = { type: 'success', showProgressBar: true };
console.log('Notification options:', options);
openNotification('Test', 'Debug message', options);
```

## Migration Guide

If you're migrating from the old local notification system:

### Before (Local Implementation)
```tsx
// Old way - 70+ lines of local code
const [api, contextHolder] = notification.useNotification();
const openNotification = (title, description, options) => {
  // ... complex local implementation
};
```

### After (Context Implementation)
```tsx
// New way - clean and simple
import { useNotification } from '../contexts/NotificationContext';
const { openNotification } = useNotification();
```

## Future Enhancements

- Custom progress bar colors via `progressColor` option
- Notification queuing system
- Sound effects for notifications
- Notification history/log
- Batch notifications
- Rich HTML content support

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Compatible**: Ant Design 5.x, React 18+
