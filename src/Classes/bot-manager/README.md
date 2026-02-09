# BotManager Class Documentation

## Overview

The `BotManager` class is a comprehensive bot management system that handles the complete lifecycle of trading bots, including creation, configuration, control operations, and real-time monitoring.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete bots
- **Bot Control**: Start, stop, pause, and resume bot execution
- **Real-time Monitoring**: Live performance updates and status tracking
- **Event-driven Architecture**: Listen to bot events for reactive UI updates
- **Form Integration**: Map StrategyForm data to bot configurations
- **Error Handling**: Robust error handling and validation
- **API Communication**: Full REST API integration with proper authentication

## Quick Start

```typescript
import BotManager from './src/classes/BotManager';

// Initialize bot manager
const botManager = new BotManager('https://api.yourapp.com', 'your-auth-token');

// Create a new bot
const botData = {
  botName: 'My Martingale Bot',
  botDescription: 'A martingale strategy bot for EUR/USD',
  botTags: ['martingale', 'forex', 'automated'],
  createdBy: 'user123',
  strategyId: 'martingale',
  contract: {
    // Contract configuration
  },
  amounts: {
    base_stake: 10,
    maximum_stake: 100,
    take_profit: 50,
    stop_loss: 20
  }
};

const result = await botManager.createBot(botData);
if (result.success) {
  console.log('Bot created:', result.data);
  await botManager.startBot();
}
```

## Core Methods

### Bot Management

- `createBot(data)` - Create a new bot
- `loadBot(botId)` - Load bot configuration from API
- `updateBot(botId, updates)` - Update bot configuration
- `deleteBot(botId)` - Delete a bot
- `getBots(page, limit)` - Get list of all bots

### Bot Control

- `startBot(botId?)` - Start bot execution
- `stopBot(botId?)` - Stop bot execution
- `pauseBot(botId?)` - Pause bot execution
- `resumeBot(botId?)` - Resume bot execution

### Monitoring

- `getStatus()` - Get current bot status
- `getCurrentBot()` - Get current bot configuration
- `getPerformance(botId?)` - Get performance metrics
- `getStatistics(botId?)` - Get bot statistics

### Form Integration

- `mapFormDataToBotConfig(formData, metadata)` - Map form data to bot config
- `validateConfiguration(config)` - Validate bot configuration

## Event System

Listen to bot events for real-time updates:

```typescript
// Status changes
botManager.addEventListener('status_changed', (event) => {
  console.log(`Bot ${event.botId} status: ${event.data.status}`);
});

// Performance updates
botManager.addEventListener('performance_updated', (event) => {
  updateDashboard(event.data);
});

// Error handling
botManager.addEventListener('error_occurred', (event) => {
  showError(event.data.error);
});
```

## Event Types

- `status_changed` - Bot status changed
- `performance_updated` - Performance metrics updated
- `error_occurred` - Error occurred
- `configuration_updated` - Bot configuration updated
- `bot_created` - New bot created
- `bot_deleted` - Bot deleted

## Form Integration

The BotManager integrates seamlessly with the StrategyForm component:

```typescript
import { BotManager } from './src/classes/BotManager';

const botManager = new BotManager(apiUrl);

// Handle form submission
const handleFormSubmit = async (formData: StrategyFormData) => {
  const botConfig = botManager.mapFormDataToBotConfig(formData, {
    botName: formData.botName,
    botDescription: formData.botDescription,
    botTags: formData.botTags,
    createdBy: currentUser.id,
    botCurrency: 'USD'
  });

  // Validate configuration
  const validation = botManager.validateConfiguration(botConfig);
  if (!validation.isValid) {
    showErrors(validation.errors);
    return;
  }

  // Create bot
  const result = await botManager.createBot(botConfig);
  if (result.success) {
    // Bot created successfully
    navigateToBot(result.data.botId);
  }
};
```

## Configuration Structure

The bot configuration includes:

- **Basic Info**: Name, description, tags, currency
- **Strategy**: Strategy type and contract parameters
- **Amounts**: Base stake, maximum stake, take profit, stop loss
- **Recovery**: Risk management and recovery steps
- **Advanced Settings**: Comprehensive strategy-specific settings
- **Performance**: Real-time metrics and statistics

## Error Handling

The BotManager provides robust error handling:

```typescript
botManager.addEventListener('error_occurred', (event) => {
  const error = event.data?.error;
  
  if (error?.includes('authentication')) {
    redirectToLogin();
  } else if (error?.includes('network')) {
    showNetworkError();
  } else {
    showGenericError(error);
  }
});

// Safe operations wrapper
const safeOperation = async (operation, errorMessage) => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## API Integration

The BotManager handles all API communication:

- **Authentication**: Bearer token authentication
- **Error Handling**: Proper HTTP error handling
- **Request/Response**: JSON serialization/deserialization
- **Endpoints**: RESTful API integration

### Expected API Endpoints

- `POST /bots` - Create bot
- `GET /bots/:id` - Get bot
- `PUT /bots/:id` - Update bot
- `DELETE /bots/:id` - Delete bot
- `GET /bots` - List bots
- `POST /bots/:id/start` - Start bot
- `POST /bots/:id/stop` - Stop bot
- `POST /bots/:id/pause` - Pause bot
- `POST /bots/:id/resume` - Resume bot
- `GET /bots/:id/performance` - Get performance
- `GET /bots/:id/statistics` - Get statistics

## React Integration

For React applications, you can create a custom hook:

```typescript
import { useState, useEffect } from 'react';
import BotManager from './BotManager';

export const useBotManager = (apiUrl: string, authToken?: string) => {
  const [botManager] = useState(() => new BotManager(apiUrl, authToken));
  const [currentBot, setCurrentBot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up event listeners
    const handleStatusChange = (event) => {
      // Update state
    };

    botManager.addEventListener('status_changed', handleStatusChange);

    return () => {
      botManager.removeEventListener('status_changed', handleStatusChange);
      botManager.cleanup();
    };
  }, [botManager]);

  return {
    currentBot,
    loading,
    error,
    loadBot: (botId) => botManager.loadBot(botId),
    createBot: (data) => botManager.createBot(data),
    startBot: () => botManager.startBot(),
    stopBot: () => botManager.stopBot(),
    // ... other methods
  };
};
```

## Cleanup

Always cleanup the BotManager when done:

```typescript
// In React useEffect cleanup
useEffect(() => {
  return () => {
    botManager.cleanup();
  };
}, []);

// Or manually
botManager.cleanup();
```

## TypeScript Support

The BotManager is fully typed with TypeScript:

- `BotConfiguration` - Complete bot configuration interface
- `BotStatus` - Bot status type union
- `RealtimePerformance` - Performance metrics interface
- `Statistics` - Bot statistics interface
- `BotEvent` - Event interface
- `ApiResponse<T>` - API response wrapper

## Best Practices

1. **Always validate configurations** before creating bots
2. **Set up event listeners** for real-time updates
3. **Handle errors gracefully** with proper user feedback
4. **Cleanup resources** when the component unmounts
5. **Use TypeScript** for better type safety
6. **Implement proper authentication** for API calls
7. **Monitor performance** metrics for optimization

## Examples

See `BotManager.example.ts` for comprehensive usage examples including:

- Basic bot creation and management
- Event-driven architecture
- Form data integration
- Advanced bot control
- Error handling patterns
- Batch operations
