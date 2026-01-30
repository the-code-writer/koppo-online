# Event Manager Hook

A custom React hook system for publishing and subscribing to events with built-in duplicate listener prevention.

## Features

- **Type-safe event handling** with TypeScript generics
- **Duplicate listener prevention** - same handler won't be registered multiple times for the same event
- **Automatic cleanup** on component unmount
- **Error handling** with try-catch around event handlers
- **Listener count tracking** for debugging
- **Memory leak prevention** with proper cleanup

## Available Hooks

### `useEventSubscription`
Subscribe to events with automatic cleanup.

```typescript
import { useEventSubscription } from '../hooks/useEventManager';

const MyComponent = () => {
  useEventSubscription('USER_ACTION', (data) => {
    console.log('User action:', data);
  });

  return <div>Listening for USER_ACTION events</div>;
};
```

### `useEventPublisher`
Publish events to all subscribed listeners.

```typescript
import { useEventPublisher } from '../hooks/useEventManager';

const PublisherComponent = () => {
  const { publish } = useEventPublisher();

  const handleClick = () => {
    publish('USER_ACTION', {
      type: 'BUTTON_CLICK',
      timestamp: Date.now(),
      userId: 'user123'
    });
  };

  return <button onClick={handleClick}>Publish Event</button>;
};
```

### `useEventManager`
Combined hook with both publishing and subscribing capabilities.

```typescript
import { useEventManager } from '../hooks/useEventManager';

const ManagerComponent = () => {
  const { publish, subscribe, getListenerCount } = useEventManager();

  useEffect(() => {
    const listenerId = subscribe('NOTIFICATION', (data) => {
      console.log('Notification:', data);
    });

    return () => {
      // Manual cleanup if needed
      // eventManager.unsubscribe('NOTIFICATION', listenerId);
    };
  }, [subscribe]);

  return (
    <div>
      <p>Listeners for NOTIFICATION: {getListenerCount('NOTIFICATION')}</p>
      <button onClick={() => publish('NOTIFICATION', { message: 'Hello!' })}>
        Send Notification
      </button>
    </div>
  );
};
```

## Event Data Structure

Events are strongly typed with the `EventData` interface:

```typescript
interface EventData {
  [key: string]: any;
}

// Specific event type
interface UserActionEvent extends EventData {
  type: 'BUTTON_CLICK' | 'FORM_SUBMIT';
  timestamp: number;
  userId: string;
  metadata?: {
    source: string;
    [key: string]: any;
  };
}
```

## Usage Patterns

### 1. Component Communication
```typescript
// Parent component publishes events
const ParentComponent = () => {
  const { publish } = useEventPublisher();

  const handleChildAction = (action: string) => {
    publish('CHILD_ACTION', { action, timestamp: Date.now() });
  };

  return <ChildComponent onAction={handleChildAction} />;
};

// Child component listens to events
const ChildComponent = () => {
  const [lastAction, setLastAction] = useState('');

  useEventSubscription('CHILD_ACTION', (data) => {
    setLastAction(data.action);
  });

  return <div>Last action: {lastAction}</div>;
};
```

### 2. Global State Updates
```typescript
// Multiple components can listen to state changes
const ComponentA = () => {
  useEventSubscription('GLOBAL_STATE_UPDATE', (data) => {
    // React to state changes
  });
};

const ComponentB = () => {
  useEventSubscription('GLOBAL_STATE_UPDATE', (data) => {
    // Different reaction to same state changes
  });
};

// Any component can trigger state updates
const StateUpdater = () => {
  const { publish } = useEventPublisher();
  
  const updateState = () => {
    publish('GLOBAL_STATE_UPDATE', { key: 'theme', value: 'dark' });
  };
};
```

### 3. Error Handling and Logging
```typescript
const ErrorBoundary = () => {
  useEventSubscription('ERROR_OCCURRED', (error) => {
    // Log errors to external service
    console.error('Application error:', error);
    // Send to monitoring service
  });
};

const ErrorThrowingComponent = () => {
  const { publish } = useEventPublisher();
  
  const riskyOperation = () => {
    try {
      // Some risky operation
    } catch (error) {
      publish('ERROR_OCCURRED', {
        error: error.message,
        stack: error.stack,
        component: 'ErrorThrowingComponent',
        timestamp: Date.now()
      });
    }
  };
};
```

## Duplicate Listener Prevention

The system automatically prevents duplicate listeners:

```typescript
const MyComponent = () => {
  const handler = (data) => console.log('Event received:', data);
  
  // This will only register once, even if component re-renders
  useEventSubscription('MY_EVENT', handler);
  
  // The same handler won't be registered again
  useEventSubscription('MY_EVENT', handler); // Warning logged, no duplicate
};
```

## Cleanup and Memory Management

- **Automatic cleanup**: Subscriptions are automatically cleaned up when components unmount
- **Manual cleanup**: You can manually unsubscribe using the returned `unsubscribe` function
- **Memory leak prevention**: The EventManager tracks all listeners and cleans up empty event maps

## Debugging

Use the `getListenerCount` function to debug listener issues:

```typescript
const DebugComponent = () => {
  const { getListenerCount } = useEventPublisher();
  
  useEffect(() => {
    console.log('MY_EVENT listeners:', getListenerCount('MY_EVENT'));
  });
};
```

## Best Practices

1. **Use descriptive event names**: Use uppercase with underscores (e.g., 'USER_ACTION', 'DATA_LOADED')
2. **Include timestamps**: Always include a `timestamp` field in event data
3. **Type your events**: Create specific interfaces for your event data
4. **Handle errors gracefully**: Event handlers are wrapped in try-catch, but handle your own errors too
5. **Avoid heavy operations**: Keep event handlers lightweight to avoid blocking the event loop
6. **Use dependency arrays**: Pass dependencies to `useEventSubscription` to control re-subscription behavior

## Example Integration

See `EventManagerDemo/index.tsx` for a complete working example demonstrating:
- Event publishing
- Event subscription
- Listener count tracking
- Multiple event types
- Real-time updates
