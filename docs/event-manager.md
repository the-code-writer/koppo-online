# Event Manager - Complete Use-Case Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Basic Usage](#basic-usage)
4. [Advanced Use-Cases](#advanced-use-cases)
5. [Real-World Scenarios](#real-world-scenarios)
6. [Performance Considerations](#performance-considerations)
7. [Testing Strategies](#testing-strategies)
8. [Migration Guide](#migration-guide)

## Overview

The Event Manager is a powerful, type-safe event system for React applications that provides:
- **Publish-Subscribe Pattern**: Decoupled communication between components
- **Duplicate Prevention**: Automatic prevention of duplicate listeners
- **Memory Safety**: Automatic cleanup and memory leak prevention
- **TypeScript Support**: Full type safety with generic event data
- **Performance Optimized**: Efficient event propagation with minimal overhead

## Core Concepts

### Event Types
```typescript
// Base event interface
interface EventData {
  [key: string]: any;
}

// Specific event types
interface UserActionEvent extends EventData {
  type: 'CLICK' | 'SUBMIT' | 'NAVIGATE';
  userId: string;
  timestamp: number;
  metadata?: {
    source: string;
    target?: string;
  };
}

interface SystemEvent extends EventData {
  level: 'INFO' | 'WARNING' | 'ERROR';
  component: string;
  message: string;
  timestamp: number;
}
```

### Hook Types
- **`useEventSubscription`**: Subscribe to events with automatic cleanup
- **`useEventPublisher`**: Publish events to all listeners
- **`useEventManager`**: Combined hook with full API access

## Basic Usage

### Simple Event Publishing
```typescript
import { useEventPublisher } from '../hooks/useEventManager';

const ActionButton: React.FC = () => {
  const { publish } = useEventPublisher();

  const handleClick = () => {
    publish('BUTTON_CLICKED', {
      buttonId: 'submit-form',
      timestamp: Date.now(),
      userData: { sessionId: 'abc123' }
    });
  };

  return <button onClick={handleClick}>Submit</button>;
};
```

### Simple Event Subscription
```typescript
import { useEventSubscription } from '../hooks/useEventManager';

const ActivityLogger: React.FC = () => {
  const [activities, setActivities] = useState<string[]>([]);

  useEventSubscription('BUTTON_CLICKED', (data) => {
    const logMessage = `Button ${data.buttonId} clicked at ${new Date(data.timestamp).toLocaleTimeString()}`;
    setActivities(prev => [...prev.slice(-9), logMessage]);
  });

  return (
    <div>
      <h4>Recent Activities:</h4>
      <ul>
        {activities.map((activity, index) => (
          <li key={index}>{activity}</li>
        ))}
      </ul>
    </div>
  );
};
```

## Advanced Use-Cases

### 1. Cross-Component Communication

#### Parent-Child Communication
```typescript
// Parent Component
const Dashboard: React.FC = () => {
  const { publish } = useEventPublisher();

  const handleWidgetUpdate = (widgetId: string, data: any) => {
    publish('WIDGET_UPDATE', {
      widgetId,
      data,
      source: 'dashboard',
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <WidgetControlPanel onUpdate={handleWidgetUpdate} />
      <WidgetContainer />
      <NotificationPanel />
    </div>
  );
};

// Child Widget Component
const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEventSubscription('WIDGET_UPDATE', (event) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === event.widgetId 
        ? { ...widget, ...event.data, lastUpdated: event.timestamp }
        : widget
    ));
  });

  return (
    <div>
      {widgets.map(widget => (
        <Widget key={widget.id} widget={widget} />
      ))}
    </div>
  );
};

// Notification Component
const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEventSubscription('WIDGET_UPDATE', (event) => {
    const message = `Widget ${event.widgetId} updated by ${event.source}`;
    setNotifications(prev => [...prev.slice(-4), message]);
  });

  return (
    <div>
      <h4>Updates:</h4>
      {notifications.map((notif, index) => (
        <div key={index}>{notif}</div>
      ))}
    </div>
  );
};
```

### 2. Global State Management

#### Application State Events
```typescript
// State Events
interface StateChangeEvent extends EventData {
  stateKey: string;
  previousValue: any;
  newValue: any;
  source: string;
}

// State Manager Component
const StateManager: React.FC = () => {
  const { publish } = useEventPublisher();
  const [globalState, setGlobalState] = useState<Record<string, any>>({});

  const updateState = useCallback((key: string, value: any, source: string) => {
    const previousValue = globalState[key];
    const newValue = value;
    
    setGlobalState(prev => ({ ...prev, [key]: newValue }));
    
    publish('STATE_CHANGE', {
      stateKey: key,
      previousValue,
      newValue,
      source,
      timestamp: Date.now()
    });
  }, [globalState, publish]);

  return (
    <StateContext.Provider value={{ state: globalState, updateState }}>
      {children}
    </StateContext.Provider>
  );
};

// Theme Manager Component
const ThemeManager: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEventSubscription('STATE_CHANGE', (event: StateChangeEvent) => {
    if (event.stateKey === 'theme') {
      setTheme(event.newValue);
      document.documentElement.setAttribute('data-theme', event.newValue);
    }
  });

  return (
    <div className={`app-theme-${theme}`}>
      {/* App content */}
    </div>
  );
};

// Settings Component
const SettingsPanel: React.FC = () => {
  const { updateState } = useContext(StateContext);

  const toggleTheme = () => {
    updateState('theme', 'dark', 'settings-panel');
  };

  return (
    <div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

### 3. Error Handling and Logging

#### Global Error Handler
```typescript
// Error Events
interface ErrorEvent extends EventData {
  error: Error;
  component: string;
  action: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<Props, State> {
  const { publish } = useEventPublisher();

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    publish('APPLICATION_ERROR', {
      error,
      component: errorInfo.componentStack,
      action: 'render',
      sessionId: getSessionId(),
      timestamp: Date.now()
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Error Logger Component
const ErrorLogger: React.FC = () => {
  useEventSubscription('APPLICATION_ERROR', (event: ErrorEvent) => {
    // Log to console
    console.error('Application Error:', event);
    
    // Send to external service
    sendToErrorService({
      message: event.error.message,
      stack: event.error.stack,
      component: event.component,
      action: event.action,
      userId: event.userId,
      sessionId: event.sessionId,
      timestamp: event.timestamp
    });
    
    // Show user notification
    showNotification('An error occurred. We\'re working on it.', 'error');
  });

  return null; // This component doesn't render anything
};

// API Error Handler
const ApiErrorHandler: React.FC = () => {
  useEventSubscription('API_ERROR', (event) => {
    const { error, request, response } = event;
    
    if (response?.status === 401) {
      publish('SESSION_EXPIRED', { 
        message: 'Your session has expired',
        redirectTo: '/login'
      });
    } else if (response?.status >= 500) {
      publish('SERVER_ERROR', {
        message: 'Server is experiencing issues',
        retryable: true
      });
    }
  });

  return null;
};
```

### 4. Real-time Data Updates

#### WebSocket Integration
```typescript
// WebSocket Events
interface WebSocketEvent extends EventData {
  type: 'CONNECT' | 'DISCONNECT' | 'MESSAGE' | 'ERROR';
  data?: any;
  timestamp: number;
}

// WebSocket Manager
const WebSocketManager: React.FC = () => {
  const { publish } = useEventPublisher();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/realtime');
    wsRef.current = ws;

    ws.onopen = () => {
      publish('WEBSOCKET_CONNECT', { timestamp: Date.now() });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        publish('WEBSOCKET_MESSAGE', { data, timestamp: Date.now() });
      } catch (error) {
        publish('WEBSOCKET_ERROR', { error, timestamp: Date.now() });
      }
    };

    ws.onclose = () => {
      publish('WEBSOCKET_DISCONNECT', { timestamp: Date.now() });
    };

    ws.onerror = (error) => {
      publish('WEBSOCKET_ERROR', { error, timestamp: Date.now() });
    };

    return () => {
      ws.close();
    };
  }, [publish]);

  return null;
};

// Live Data Component
const LiveDataFeed: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  useEventSubscription('WEBSOCKET_MESSAGE', (event) => {
    if (event.data.type === 'price_update') {
      setData(prev => {
        const existing = prev.findIndex(item => item.symbol === event.data.symbol);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...event.data };
          return updated;
        }
        return [...prev, event.data];
      });
    }
  });

  return (
    <div>
      <h3>Live Prices</h3>
      {data.map(item => (
        <div key={item.symbol}>
          {item.symbol}: ${item.price}
        </div>
      ))}
    </div>
  );
};

// Connection Status Component
const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  useEventSubscription('WEBSOCKET_CONNECT', () => setStatus('connected'));
  useEventSubscription('WEBSOCKET_DISCONNECT', () => setStatus('disconnected'));
  useEventSubscription('WEBSOCKET_ERROR', () => setStatus('error'));

  const statusColor = {
    connected: 'green',
    disconnected: 'gray',
    error: 'red'
  }[status];

  return (
    <div style={{ color: statusColor }}>
      Status: {status.toUpperCase()}
    </div>
  );
};
```

### 5. User Activity Tracking

#### Analytics Events
```typescript
// Analytics Events
interface AnalyticsEvent extends EventData {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
}

// Analytics Tracker
const AnalyticsTracker: React.FC = () => {
  useEventSubscription('ANALYTICS_EVENT', (event: AnalyticsEvent) => {
    // Send to Google Analytics
    gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      custom_map: { sessionId: event.sessionId }
    });

    // Send to custom analytics
    sendToCustomAnalytics(event);
  });

  return null;
};

// Page View Tracker
const PageViewTracker: React.FC = () => {
  const location = useLocation();
  const { publish } = useEventPublisher();

  useEffect(() => {
    publish('ANALYTICS_EVENT', {
      event: 'page_view',
      category: 'navigation',
      action: location.pathname,
      sessionId: getSessionId(),
      timestamp: Date.now()
    });
  }, [location, publish]);

  return null;
};

// Component Usage Tracker
const TrackableButton: React.FC<{ 
  eventName: string; 
  eventCategory: string; 
  eventLabel?: string;
  children: React.ReactNode;
}> = ({ eventName, eventCategory, eventLabel, children }) => {
  const { publish } = useEventPublisher();

  const handleClick = () => {
    publish('ANALYTICS_EVENT', {
      event: eventName,
      category: eventCategory,
      action: 'click',
      label: eventLabel,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      timestamp: Date.now()
    });
  };

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

// Usage
const MyComponent: React.FC = () => {
  return (
    <div>
      <TrackableButton 
        eventName="signup_button_click" 
        eventCategory="user_acquisition"
        eventLabel="homepage_hero"
      >
        Sign Up Now
      </TrackableButton>
    </div>
  );
};
```

## Real-World Scenarios

### 1. E-commerce Application

#### Cart Management
```typescript
// Cart Events
interface CartEvent extends EventData {
  type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'UPDATE_QUANTITY' | 'CLEAR_CART';
  productId: string;
  quantity?: number;
  price?: number;
  timestamp: number;
}

// Cart Component
const ShoppingCart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { publish } = useEventPublisher();

  const addToCart = (product: Product, quantity: number = 1) => {
    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      addedAt: Date.now()
    };

    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, cartItem];
    });

    publish('CART_UPDATE', {
      type: 'ADD_ITEM',
      productId: product.id,
      quantity,
      price: product.price,
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.map(item => (
        <CartItem key={item.productId} item={item} />
      ))}
    </div>
  );
};

// Cart Badge Component
const CartBadge: React.FC = () => {
  const [itemCount, setItemCount] = useState(0);

  useEventSubscription('CART_UPDATE', (event: CartEvent) => {
    // Update badge count based on cart changes
    // This would typically sync with cart state
    setItemCount(prev => {
      switch (event.type) {
        case 'ADD_ITEM':
          return prev + (event.quantity || 1);
        case 'REMOVE_ITEM':
          return Math.max(0, prev - (event.quantity || 1));
        case 'CLEAR_CART':
          return 0;
        default:
          return prev;
      }
    });
  });

  return (
    <div className="cart-badge">
      🛒 {itemCount > 0 && <span className="badge">{itemCount}</span>}
    </div>
  );
};

// Analytics Integration
const CartAnalytics: React.FC = () => {
  useEventSubscription('CART_UPDATE', (event: CartEvent) => {
    publish('ANALYTICS_EVENT', {
      event: 'cart_interaction',
      category: 'ecommerce',
      action: event.type.toLowerCase(),
      label: event.productId,
      value: event.price ? event.price * (event.quantity || 1) : undefined,
      timestamp: Date.now()
    });
  });

  return null;
};
```

### 2. Multi-step Form Wizard

#### Form Progress Events
```typescript
// Form Events
interface FormEvent extends EventData {
  step: number;
  totalSteps: number;
  data?: any;
  isValid?: boolean;
  timestamp: number;
}

// Form Wizard Component
const FormWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { publish } = useEventPublisher();

  const totalSteps = 4;

  const nextStep = (stepData: any) => {
    const newStep = currentStep + 1;
    const updatedData = { ...formData, ...stepData };
    
    setFormData(updatedData);
    setCurrentStep(newStep);

    publish('FORM_STEP_CHANGE', {
      step: newStep,
      totalSteps,
      data: updatedData,
      timestamp: Date.now()
    });
  };

  const prevStep = () => {
    const newStep = Math.max(0, currentStep - 1);
    setCurrentStep(newStep);

    publish('FORM_STEP_CHANGE', {
      step: newStep,
      totalSteps,
      data: formData,
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <FormProgress currentStep={currentStep} totalSteps={totalSteps} />
      <FormStep step={currentStep} data={formData} onNext={nextStep} onPrev={prevStep} />
    </div>
  );
};

// Progress Bar Component
const FormProgress: React.FC<{ currentStep: number; totalSteps: number }> = ({ 
  currentStep, 
  totalSteps 
}) => {
  const [progress, setProgress] = useState(0);

  useEventSubscription('FORM_STEP_CHANGE', (event: FormEvent) => {
    const newProgress = (event.step / event.totalSteps) * 100;
    setProgress(newProgress);
  });

  return (
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${progress}%` }}
      />
      <span>{currentStep + 1} of {totalSteps}</span>
    </div>
  );
};

// Form Validation Component
const FormValidator: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEventSubscription('FORM_STEP_CHANGE', (event: FormEvent) => {
    // Validate form data for the current step
    const stepErrors = validateStepData(event.step, event.data);
    setErrors(stepErrors);

    publish('FORM_VALIDATION', {
      step: event.step,
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors,
      timestamp: Date.now()
    });
  });

  return (
    <div>
      {Object.entries(errors).map(([field, error]) => (
        <div key={field} className="error-message">
          {error}
        </div>
      ))}
    </div>
  );
};
```

### 3. Real-time Collaboration

#### Collaborative Editing Events
```typescript
// Collaboration Events
interface CollaborationEvent extends EventData {
  type: 'USER_JOIN' | 'USER_LEAVE' | 'CONTENT_CHANGE' | 'CURSOR_MOVE';
  userId: string;
  userName: string;
  data?: any;
  timestamp: number;
}

// Document Editor Component
const DocumentEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const { publish } = useEventPublisher();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    publish('CONTENT_CHANGE', {
      type: 'CONTENT_CHANGE',
      userId: getCurrentUserId(),
      userName: getCurrentUserName(),
      data: { content: newContent, position: content.length },
      timestamp: Date.now()
    });
  };

  useEventSubscription('CONTENT_CHANGE', (event: CollaborationEvent) => {
    if (event.userId !== getCurrentUserId()) {
      // Apply remote changes
      setContent(prev => applyRemoteChange(prev, event.data));
    }
  });

  useEventSubscription('USER_JOIN', (event: CollaborationEvent) => {
    setUsers(prev => [...prev, { 
      id: event.userId, 
      name: event.userName 
    }]);
  });

  return (
    <div>
      <UserList users={users} />
      <textarea 
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
      />
    </div>
  );
};

// User Presence Component
const UserPresence: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEventSubscription('USER_JOIN', (event: CollaborationEvent) => {
    setActiveUsers(prev => [...prev, { id: event.userId, name: event.userName }]);
  });

  useEventSubscription('USER_LEAVE', (event: CollaborationEvent) => {
    setActiveUsers(prev => prev.filter(user => user.id !== event.userId));
  });

  return (
    <div className="user-presence">
      <h4>Active Users ({activeUsers.length})</h4>
      {activeUsers.map(user => (
        <div key={user.id} className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
};
```

## Performance Considerations

### 1. Event Handler Optimization

#### Debouncing Frequent Events
```typescript
import { useCallback, useRef } from 'react';
import { debounce } from 'lodash';

const OptimizedSearchComponent: React.FC = () => {
  const [query, setQuery] = useState('');
  const { publish } = useEventPublisher();

  // Debounced search to avoid excessive events
  const debouncedSearch = useRef(
    debounce((searchQuery: string) => {
      publish('SEARCH_QUERY', {
        query: searchQuery,
        timestamp: Date.now()
      });
    }, 300)
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return <input value={query} onChange={handleInputChange} />;
};
```

#### Throttling High-Frequency Events
```typescript
import { throttle } from 'lodash';

const MouseTracker: React.FC = () => {
  const { publish } = useEventPublisher();

  const throttledMouseMove = useRef(
    throttle((event: MouseEvent) => {
      publish('MOUSE_MOVE', {
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      });
    }, 16) // ~60fps
  ).current;

  useEffect(() => {
    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      throttledMouseMove.cancel();
    };
  }, [throttledMouseMove]);

  return <div>Mouse position tracking active</div>;
};
```

### 2. Memory Management

#### Cleanup Strategies
```typescript
const ResourceIntensiveComponent: React.FC = () => {
  const { publish, subscribe } = useEventManager();
  const subscriptions = useRef<string[]>([]);

  useEffect(() => {
    // Subscribe to multiple events
    const sub1 = subscribe('DATA_UPDATE', handleDataUpdate);
    const sub2 = subscribe('USER_ACTION', handleUserAction);
    const sub3 = subscribe('SYSTEM_EVENT', handleSystemEvent);

    subscriptions.current = [sub1, sub2, sub3];

    return () => {
      // Manual cleanup for multiple subscriptions
      subscriptions.current.forEach(id => {
        eventManager.unsubscribe('DATA_UPDATE', id);
        eventManager.unsubscribe('USER_ACTION', id);
        eventManager.unsubscribe('SYSTEM_EVENT', id);
      });
      subscriptions.current = [];
    };
  }, [subscribe]);

  return <div>Resource intensive component</div>;
};
```

### 3. Event Filtering

#### Selective Event Processing
```typescript
const FilteredEventListener: React.FC = () => {
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);

  useEventSubscription('SYSTEM_EVENT', (event) => {
    // Only process events that match our criteria
    if (event.level === 'ERROR' || event.component === 'CriticalComponent') {
      setRelevantEvents(prev => [...prev.slice(-9), event]);
    }
  });

  return (
    <div>
      <h4>Critical Events Only</h4>
      {relevantEvents.map((event, index) => (
        <div key={index}>
          {event.level}: {event.message}
        </div>
      ))}
    </div>
  );
};
```

## Testing Strategies

### 1. Unit Testing Event Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useEventPublisher, useEventSubscription } from '../hooks/useEventManager';

describe('Event Manager', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    eventManager.clear();
  });

  test('should publish and receive events', () => {
    const mockHandler = jest.fn();
    
    // Setup subscriber
    const { result: subscriberResult } = renderHook(() => 
      useEventSubscription('TEST_EVENT', mockHandler)
    );
    
    // Setup publisher
    const { result: publisherResult } = renderHook(() => useEventPublisher());
    
    // Publish event
    act(() => {
      publisherResult.current.publish('TEST_EVENT', { message: 'test' });
    });
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith({ message: 'test' });
  });

  test('should prevent duplicate listeners', () => {
    const mockHandler = jest.fn();
    
    // Subscribe with same handler twice
    renderHook(() => useEventSubscription('TEST_EVENT', mockHandler));
    renderHook(() => useEventSubscription('TEST_EVENT', mockHandler));
    
    const { result: publisherResult } = renderHook(() => useEventPublisher());
    
    // Publish event
    act(() => {
      publisherResult.current.publish('TEST_EVENT', { message: 'test' });
    });
    
    // Should only be called once
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  test('should cleanup on unmount', () => {
    const mockHandler = jest.fn();
    
    const { unmount } = renderHook(() => 
      useEventSubscription('TEST_EVENT', mockHandler)
    );
    
    const { result: publisherResult } = renderHook(() => useEventPublisher());
    
    // Unmount subscriber
    unmount();
    
    // Publish event
    act(() => {
      publisherResult.current.publish('TEST_EVENT', { message: 'test' });
    });
    
    // Handler should not be called
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
```

### 2. Integration Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EventPublisher, EventListener } from '../components/EventManagerDemo';

describe('Event Integration', () => {
  beforeEach(() => {
    eventManager.clear();
  });

  test('components should communicate via events', () => {
    render(
      <div>
        <EventPublisher />
        <EventListener eventName="USER_ACTION" />
      </div>
    );
    
    // Initially no events
    expect(screen.queryByText(/No events received yet/)).toBeInTheDocument();
    
    // Click publish button
    fireEvent.click(screen.getByText('Publish User Action'));
    
    // Event should be received
    expect(screen.queryByText(/No events received yet/)).not.toBeInTheDocument();
    expect(screen.getByText(/BUTTON_CLICK/)).toBeInTheDocument();
  });
});
```

## Migration Guide

### From Context API

#### Before (Context API)
```typescript
// Context setup
const AppContext = createContext();

const AppProvider: React.FC = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  const updateState = (key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <AppContext.Provider value={{ state, updateState }}>
      {children}
    </AppContext.Provider>
  );
};

// Component usage
const MyComponent: React.FC = () => {
  const { state, updateState } = useContext(AppContext);
  
  const handleClick = () => {
    updateState('counter', state.counter + 1);
  };
  
  return (
    <div>
      <button onClick={handleClick}>Count: {state.counter}</button>
    </div>
  );
};
```

#### After (Event Manager)
```typescript
// Event types
interface StateChangeEvent extends EventData {
  key: string;
  value: any;
  timestamp: number;
}

// State manager component
const StateManager: React.FC = ({ children }) => {
  const [state, setState] = useState(initialState);
  const { publish } = useEventPublisher();
  
  const updateState = useCallback((key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
    
    publish('STATE_CHANGE', {
      key,
      value,
      timestamp: Date.now()
    });
  }, [publish]);
  
  return (
    <StateContext.Provider value={{ state, updateState }}>
      {children}
    </StateContext.Provider>
  );
};

// Component usage
const MyComponent: React.FC = () => {
  const [counter, setCounter] = useState(0);
  
  useEventSubscription('STATE_CHANGE', (event: StateChangeEvent) => {
    if (event.key === 'counter') {
      setCounter(event.value);
    }
  });
  
  const { updateState } = useContext(StateContext);
  
  const handleClick = () => {
    updateState('counter', counter + 1);
  };
  
  return (
    <div>
      <button onClick={handleClick}>Count: {counter}</button>
    </div>
  );
};
```

### From Redux

#### Before (Redux)
```typescript
// Redux setup
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    }
  }
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});

// Component usage
const MyComponent: React.FC = () => {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();
  
  const handleClick = () => {
    dispatch(increment());
  };
  
  return (
    <div>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
};
```

#### After (Event Manager)
```typescript
// Event types
interface CounterEvent extends EventData {
  action: 'increment' | 'decrement';
  value: number;
  timestamp: number;
}

// Counter store component
const CounterStore: React.FC = ({ children }) => {
  const [count, setCount] = useState(0);
  const { publish } = useEventPublisher();
  
  useEventSubscription('COUNTER_ACTION', (event: CounterEvent) => {
    switch (event.action) {
      case 'increment':
        setCount(prev => prev + 1);
        break;
      case 'decrement':
        setCount(prev => prev - 1);
        break;
    }
    
    publish('COUNTER_CHANGED', {
      value: count,
      timestamp: Date.now()
    });
  });
  
  return (
    <CounterContext.Provider value={{ count }}>
      {children}
    </CounterContext.Provider>
  );
};

// Component usage
const MyComponent: React.FC = () => {
  const { publish } = useEventPublisher();
  const count = useContext(CounterContext).count;
  
  const handleClick = () => {
    publish('COUNTER_ACTION', {
      action: 'increment',
      value: count,
      timestamp: Date.now()
    });
  };
  
  return (
    <div>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
};
```

## Best Practices Summary

1. **Use descriptive event names** with consistent naming conventions
2. **Include timestamps** in all event data for debugging and analytics
3. **Type your events** with specific interfaces for type safety
4. **Handle errors gracefully** in event handlers
5. **Keep handlers lightweight** to avoid performance issues
6. **Use dependency arrays** to control re-subscription behavior
7. **Test event flows** thoroughly with unit and integration tests
8. **Monitor listener counts** to detect memory leaks
9. **Document event contracts** for team collaboration
10. **Consider performance** for high-frequency events with debouncing/throttling

This comprehensive documentation provides a complete guide for implementing and using the Event Manager system in various real-world scenarios.
