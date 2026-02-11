# Pusher Service Documentation

## 📖 Overview

The Pusher Service provides a comprehensive real-time communication layer for the Koppo application. It integrates with Pusher Channels to enable real-time updates for trading bots, strategies, and user activities.

## 🚀 Features

- **Environment-based Configuration**: Automatically uses environment variables from `envConfig`
- **Global Listener System**: Register listeners for specific events across all channels
- **Priority-based Execution**: Higher priority listeners are called first
- **One-time Listeners**: Listeners that automatically remove after first execution
- **Event History**: Debug and track received events
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript support with proper interfaces

## 🛠️ Installation & Setup

### Environment Variables

Make sure these environment variables are configured in your `.env` file:

```bash
# Pusher Configuration
VITE_PUSHER_APP_ID=your_app_id
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_SECRET=your_pusher_secret
VITE_PUSHER_CLUSTER=your_cluster
VITE_PUSHER_INSTANCE_ID=your_instance_id
VITE_PUSHER_PRIMARY_KEY=your_primary_key
```

### Basic Usage

```typescript
import { pusherService, PusherListener } from '@/services/pusherService';

// The service is automatically initialized with environment config
// No manual initialization needed
```

## 📚 API Reference

### Core Methods

#### `initialize(): void`
Initializes Pusher with environment configuration. Called automatically on app startup.

#### `addListener(listener: PusherListener): void`
Adds a global listener for specific events.

#### `removeListener(listenerId: string): void`
Removes a specific listener by ID.

#### `subscribeToChannel(config: PusherChannelConfig): void`
Subscribes to a channel and binds events.

#### `unsubscribeFromChannel(channelName: string): void`
Unsubscribes from a specific channel.

#### `getListeners(): Map<string, PusherListener[]>`
Returns all registered listeners for debugging.

#### `getEventHistory(): PusherEvent[]`
Returns the history of received events.

#### `getConnectionState(): string`
Returns the current Pusher connection state.

#### `isConnected(): boolean`
Checks if Pusher is connected.

### Interfaces

#### `PusherListener`
```typescript
interface PusherListener {
  id: string;                    // Unique identifier
  channelName: string;            // Channel to listen to
  eventName: string;              // Event name
  callback: (event: PusherEvent) => void;  // Callback function
  priority?: number;              // Priority (higher = first)
  once?: boolean;                // Remove after first call
}
```

#### `PusherEvent`
```typescript
interface PusherEvent {
  channelName: string;    // Source channel
  eventName: string;      // Event name
  data: any;            // Event data
  timestamp: Date;       // When event was received
}
```

## 🎯 Usage Examples

### Example 1: Basic Bot Trade Monitoring

```typescript
import { pusherService, PusherListener } from '@/services/pusherService';

// Monitor all trade executions
const tradeListener: PusherListener = {
  id: 'trade-monitor-001',
  channelName: 'bot-updates',
  eventName: 'trade-executed',
  priority: 10,
  callback: (event) => {
    const trade = event.data;
    console.log(`New trade on ${trade.symbol}: ${trade.amount} ${trade.currency}`);
    
    // Update UI, show notification, etc.
    if (trade.profit_is_win) {
      showNotification(`Win! ${trade.symbol}`, 'success');
    } else {
      showNotification(`Loss: ${trade.symbol}`, 'error');
    }
  }
};

pusherService.addListener(tradeListener);
```

### Example 2: High-Priority Bot Status Updates

```typescript
// Critical bot status monitoring with high priority
const statusListener: PusherListener = {
  id: 'bot-status-critical',
  channelName: 'bot-updates',
  eventName: 'bot-updated',
  priority: 100, // High priority
  callback: (event) => {
    const bot = event.data;
    
    // Handle critical status changes
    if (bot.status === 'ERROR') {
      // Immediately alert user
      alert(`Bot ${bot.botName} encountered an error!`);
      // Stop the bot
      stopBotEmergency(bot.botUUID);
    }
    
    // Update bot status in UI
    updateBotStatus(bot.botUUID, bot.status);
  }
};

pusherService.addListener(statusListener);
```

### Example 3: One-time Strategy Updates

```typescript
// Listen for strategy updates once (e.g., after user edits a strategy)
const strategyUpdateListener: PusherListener = {
  id: 'strategy-update-once',
  channelName: 'strategy-updates',
  eventName: 'strategy-modified',
  once: true, // Remove after first execution
  callback: (event) => {
    const strategy = event.data;
    console.log('Strategy updated:', strategy);
    
    // Refresh strategy list
    refreshStrategies();
    
    // Show success message
    showNotification(`Strategy "${strategy.title}" updated successfully`, 'success');
  }
};

pusherService.addListener(strategyUpdateListener);
```

### Example 4: User-Specific Notifications

```typescript
// Listen for user-specific events
const userId = getCurrentUserId(); // Get current user ID

const userNotificationListener: PusherListener = {
  id: `user-notifications-${userId}`,
  channelName: `user-updates-${userId}`,
  eventName: 'notification',
  priority: 50,
  callback: (event) => {
    const notification = event.data;
    
    switch (notification.type) {
      case 'bot_completed':
        showNotification(`Bot "${notification.botName}" completed trading session`, 'info');
        break;
        
      case 'profit_target_reached':
        showNotification(`Profit target reached: $${notification.amount}`, 'success');
        break;
        
      case 'margin_warning':
        showNotification(`Margin warning: ${notification.message}`, 'warning');
        break;
        
      default:
        showNotification(notification.message, 'info');
    }
  }
};

pusherService.addListener(userNotificationListener);
```

### Example 5: Advanced Event Analytics

```typescript
// Advanced listener for analytics and debugging
const analyticsListener: PusherListener = {
  id: 'analytics-collector',
  channelName: '*', // Wildcard for all channels (if supported)
  eventName: '*', // Wildcard for all events
  priority: 1, // Low priority - runs after others
  callback: (event) => {
    // Collect analytics data
    const analyticsData = {
      timestamp: event.timestamp,
      channel: event.channelName,
      event: event.eventName,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
    };
    
    // Send to analytics service
    analyticsService.track('pusher_event_received', analyticsData);
    
    // Log for debugging
    if (import.meta.env.DEV) {
      console.debug('Pusher Analytics:', analyticsData);
    }
  }
};

// Since Pusher doesn't support wildcards, we need to register for specific events
const commonEvents = [
  { channel: 'bot-updates', event: 'trade-executed' },
  { channel: 'bot-updates', event: 'bot-updated' },
  { channel: 'bot-updates', event: 'bot-created' },
  { channel: 'strategy-updates', event: 'strategy-modified' },
];

commonEvents.forEach(({ channel, event }) => {
  pusherService.addListener({
    ...analyticsListener,
    channelName: channel,
    eventName: event,
  });
});
```

## 🔧 Advanced Patterns

### Priority System

Listeners with higher priority values are executed first:

```typescript
// Critical error handler (priority: 100)
pusherService.addListener(criticalErrorListener);

// Normal UI updates (priority: 50)
pusherService.addListener(uiUpdateListener);

// Analytics (priority: 1)
pusherService.addListener(analyticsListener);
```

### Event History Debugging

```typescript
// Get recent events for debugging
const recentEvents = pusherService.getEventHistory();
const lastMinuteEvents = recentEvents.filter(
  event => Date.now() - event.timestamp.getTime() < 60000
);

console.log('Events in last minute:', lastMinuteEvents);
```

### Listener Management

```typescript
// Remove specific listener
pusherService.removeListener('trade-monitor-001');

// Remove all listeners for a specific event
pusherService.removeListeners('bot-updates', 'trade-executed');

// Get all active listeners for debugging
const allListeners = pusherService.getListeners();
console.log('Active listeners:', allListeners);
```

## 🚨 Error Handling

The service includes comprehensive error handling:

```typescript
// Listeners are wrapped in try-catch
const safeListener: PusherListener = {
  id: 'safe-listener',
  channelName: 'bot-updates',
  eventName: 'trade-executed',
  callback: (event) => {
    try {
      // Your logic here
      processTrade(event.data);
    } catch (error) {
      console.error('Error processing trade:', error);
      // Service continues working even if individual listeners fail
    }
  }
};
```

## 🔍 Debugging

Enable debug mode in development:

```typescript
// Check connection state
console.log('Pusher connected:', pusherService.isConnected());
console.log('Connection state:', pusherService.getConnectionState());

// View event history
console.log('Recent events:', pusherService.getEventHistory());

// View active listeners
console.log('Active listeners:', pusherService.getListeners());
```

## 📱 Best Practices

1. **Use Unique IDs**: Always use unique listener IDs for proper management
2. **Set Appropriate Priorities**: Critical operations should have higher priority
3. **Handle Errors**: Always wrap listener logic in try-catch blocks
4. **Clean Up**: Remove listeners when components unmount
5. **Use One-time Listeners**: For one-time events, use the `once` option
6. **Monitor Performance**: Keep an eye on listener count and event frequency

## 🔄 Integration with DiscoveryContext

The service integrates seamlessly with the DiscoveryContext:

```typescript
// In DiscoveryContext, listeners are automatically added for:
// - Trade executions (updates activity history)
// - Bot updates (updates bot lists)
// - Strategy updates (refreshes strategies)
```

## 📄 Environment Configuration

The service automatically reads from `envConfig`:

```typescript
// No configuration needed - uses environment variables
const config = {
  key: envConfig.VITE_PUSHER_KEY,
  cluster: envConfig.VITE_PUSHER_CLUSTER,
  // ... other config
};
```

## 🆘 Troubleshooting

### Common Issues

1. **Connection Failed**: Check environment variables and network connectivity
2. **Events Not Received**: Verify channel names and event names match backend
3. **Listener Not Called**: Check listener ID and channel/event name matching
4. **Performance Issues**: Monitor listener count and remove unused listeners

### Debug Commands

```typescript
// Check connection
pusherService.getConnectionState();

// View recent events
pusherService.getEventHistory();

// Clear event history if it gets too large
pusherService.clearEventHistory();
```

## 📚 Additional Resources

- [Pusher Channels Documentation](https://pusher.com/docs/channels)
- [Environment Configuration Guide](./ENVIRONMENT.md)
- [Real-time Architecture Guide](./REALTIME_ARCHITECTURE.md)

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintainer**: Koppo Development Team
