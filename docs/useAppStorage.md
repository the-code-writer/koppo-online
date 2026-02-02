# useAppStorage Hook Documentation

A high-performance, in-memory state management solution for React applications with dot-notation path support, optional localStorage persistence, encryption, and event-driven updates.

---

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [How It Works](#how-it-works)
- [Real-World Examples](#real-world-examples)
- [Advanced Patterns](#advanced-patterns)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

`useAppStorage` is a centralized, in-memory state management system that acts as a **single source of truth** for your React application.

### Core Features

| Feature | Description |
|---------|-------------|
| **In-Memory Storage** | Fast, synchronous access to application state |
| **Dot Notation Paths** | Access nested data with `app.user.profile.name` syntax |
| **Optional Persistence** | Flag items to persist in localStorage/cookies |
| **On-the-fly Encryption** | Encrypt sensitive data before persistence |
| **Event-Driven Updates** | Subscribe to add, update, remove events |
| **Optimized Re-renders** | Uses `useSyncExternalStore` for minimal re-renders |
| **Batch Operations** | Group multiple operations for atomic updates |
| **Selectors** | Derive computed values with memoization |

---

## Installation & Setup

### Provider Hierarchy

```tsx
// src/providers/AppProviders.tsx
<LocalStorageProvider>
  <CookieProvider>
    <AppStorageProvider>
      {children}
    </AppStorageProvider>
  </CookieProvider>
</LocalStorageProvider>
```

### Importing

```tsx
import { 
  useAppStorage,
  useAppDataContext,
  useAppStorageWatch,
  usePersistedAppData,
  useAppStorageBatch,
  useAppStorageSelector
} from '../contexts/AppStorageContext';
```

---

## API Reference

### useAppStorage Hook

Main hook providing full access to the storage system.

```typescript
const {
  setItem,      // Set value at path
  getItem,      // Get value at path
  removeItem,   // Remove value at path
  updateItem,   // Update with function
  onItemAdded,  // Subscribe to additions
  onItemUpdated,// Subscribe to updates
  onItemRemoved,// Subscribe to removals
  subscribe,    // Subscribe to any change
  dataObject,   // Full data object
  hasItem,      // Check if path exists
  getKeys,      // Get keys at path
  clear,        // Clear all data
  batch,        // Batch operations
  merge,        // Merge data at path
  getSnapshot,  // Get snapshot
} = useAppStorage();
```

#### Basic Usage

```tsx
// Set a value (supports dot notation)
setItem('app.user.name', 'John Doe');

// Set with persistence and encryption
setItem('app.user.tokens', tokens, { persist: true, encrypt: true });

// Get a value
const name = getItem<string>('app.user.name');

// Update with function
updateItem<number>('app.counter', prev => (prev || 0) + 1);

// Remove a value
removeItem('app.user.tempData');

// Check existence
if (hasItem('app.user.profile')) { /* ... */ }

// Get all keys at path
const keys = getKeys('app.user'); // ['name', 'email', 'profile']
```

### useAppDataContext Hook

Access data at a specific path with automatic re-renders.

```tsx
// Basic usage
const [user, setUser] = useAppDataContext<User>('app.user');

// With default value
const [items, setItems] = useAppDataContext<Item[]>('app.cart.items', {
  defaultValue: []
});

// Deep watching (re-render on nested changes)
const [settings, setSettings] = useAppDataContext<Settings>('app.settings', {
  deep: true
});

// Functional updates
setUser(prev => ({ ...prev, name: 'New Name' }));
```

### useAppStorageWatch Hook

Watch for changes without causing re-renders.

```tsx
useAppStorageWatch<Notification[]>(
  'app.notifications',
  (event) => {
    console.log('Type:', event.type);      // 'add' | 'update' | 'remove'
    console.log('Path:', event.path);
    console.log('Old:', event.oldValue);
    console.log('New:', event.newValue);
  },
  { 
    eventTypes: ['add', 'update'],  // Filter event types
    debounce: 300                    // Debounce notifications
  }
);
```

### usePersistedAppData Hook

Data that persists to localStorage automatically.

```tsx
const [theme, setTheme] = usePersistedAppData<'light' | 'dark'>(
  'app.settings.theme',
  'light',           // Default value
  { encrypt: false } // Options
);
```

### useAppStorageBatch Hook

Batch multiple operations atomically.

```tsx
const { addOperation, commit, reset } = useAppStorageBatch();

addOperation({ type: 'set', path: 'app.user.name', value: 'John' });
addOperation({ type: 'set', path: 'app.user.email', value: 'john@example.com' });
addOperation({ type: 'remove', path: 'app.user.tempData' });

commit(); // Execute all at once
```

### useAppStorageSelector Hook

Derive computed values with optimized re-renders.

```tsx
const total = useAppStorageSelector<CartItem[], number>(
  'app.cart.items',
  (items) => (items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
);
```

---

## Configuration Options

### SetItemOptions

```typescript
interface SetItemOptions {
  persist?: boolean;        // Save to localStorage
  encrypt?: boolean;        // Encrypt before storing
  encryptionKey?: string;   // Custom encryption key
  merge?: boolean;          // Merge with existing object
  silent?: boolean;         // Don't trigger listeners
}
```

### SubscriptionOptions

```typescript
interface SubscriptionOptions {
  eventTypes?: ('add' | 'update' | 'remove' | 'batch')[];
  debounce?: number;
  deep?: boolean;
}
```

---

## How It Works

### Dot Notation Path Resolution

```
Path: "app.user.profiles.social.0.platform"

{
  app: {
    user: {
      profiles: {
        social: [
          { platform: "twitter" },  // ← Returns "twitter"
        ]
      }
    }
  }
}
```

### Event System

| Event Type | Triggered When |
|------------|----------------|
| `add` | New path created |
| `update` | Existing path modified |
| `remove` | Path deleted |
| `batch` | Multiple operations executed |

---

## Real-World Examples

### Example 1: User Session

```tsx
function useUserSession() {
  const { setItem, removeItem } = useAppStorage();
  const [user] = useAppDataContext<User | null>('app.session.user');

  const login = (userData: User, tokens: Tokens) => {
    setItem('app.session.user', userData);
    setItem('app.session.tokens', tokens, { persist: true, encrypt: true });
  };

  const logout = () => {
    removeItem('app.session.user');
    removeItem('app.session.tokens');
  };

  return { user, login, logout, isLoggedIn: !!user };
}
```

### Example 2: Shopping Cart

```tsx
function useShoppingCart() {
  const { updateItem, setItem } = useAppStorage();
  const [items] = useAppDataContext<CartItem[]>('app.cart.items', { defaultValue: [] });

  const addItem = (item: CartItem) => {
    updateItem<CartItem[]>('app.cart.items', prev => {
      const existing = (prev || []).find(i => i.id === item.id);
      if (existing) {
        return (prev || []).map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...(prev || []), { ...item, quantity: 1 }];
    }, { persist: true });
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, addItem, total };
}
```

### Example 3: Form Auto-Save

```tsx
function useAutoSaveForm(formId: string) {
  const path = `app.forms.${formId}`;
  const [data, setData] = useAppDataContext<FormData>(path);

  useAppStorageWatch(path, async (event) => {
    await saveDraftToServer(formId, event.newValue);
  }, { debounce: 2000 });

  return { data, setData };
}
```

### Example 4: Notifications

```tsx
function useNotifications() {
  const { updateItem, setItem } = useAppStorage();
  const [notifications] = useAppDataContext<Notification[]>('app.notifications', {
    defaultValue: []
  });

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp'>) => {
    updateItem<Notification[]>('app.notifications', prev => [
      { ...notif, id: Date.now().toString(), timestamp: Date.now() },
      ...(prev || [])
    ].slice(0, 50));
  };

  const markAsRead = (id: string) => {
    updateItem<Notification[]>('app.notifications', prev =>
      (prev || []).map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return { notifications, addNotification, markAsRead };
}
```

### Example 5: Feature Flags

```tsx
function useFeatureFlags() {
  const [flags, setFlags] = usePersistedAppData<FeatureFlags>('app.featureFlags', defaultFlags);

  const isEnabled = (flag: keyof FeatureFlags) => flags?.[flag] ?? false;

  return { flags, isEnabled, setFlags };
}

// Usage
function Dashboard() {
  const { isEnabled } = useFeatureFlags();
  
  return isEnabled('newDashboard') ? <NewDashboard /> : <OldDashboard />;
}
```

---

## Advanced Patterns

### Namespaced Storage

```tsx
function createNamespacedStorage(namespace: string) {
  return function useNamespacedStorage<T>(path: string, options?: any) {
    return useAppDataContext<T>(`${namespace}.${path}`, options);
  };
}

const useUserStorage = createNamespacedStorage('app.user');
const [profile] = useUserStorage('profile');
```

### Computed Values

```tsx
const cartTotal = useAppStorageSelector<CartItem[], number>(
  'app.cart.items',
  items => (items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
);
```

---

## Performance Optimization

1. **Use specific paths** instead of watching entire objects
2. **Use selectors** for derived data
3. **Batch related updates** together
4. **Debounce** high-frequency watchers
5. **Use silent updates** for internal state

```tsx
// Good
const [name] = useAppDataContext('app.user.name');

// Bad
const [user] = useAppDataContext('app.user');
const name = user?.name;
```

---

## Best Practices

1. **Organize by domain**: `app.user`, `app.cart`, `app.ui`
2. **Use TypeScript generics** for type safety
3. **Provide default values** to avoid undefined
4. **Clean up temporary data** on unmount
5. **Persist only necessary data**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not updating | Use functional updates |
| Infinite re-renders | Memoize selectors |
| Persisted data not loading | Check encryption key |
| Memory leaks | Unsubscribe from watchers |

---

## File Locations

- **Context**: `src/contexts/AppStorageContext.tsx`
- **Provider**: Integrated in `src/providers/AppProviders.tsx`

---

## Related Documentation

- [useBrowserCookie Hook](./useBrowserCookie.md)
- [useLocalStorage Hook](./useLocalStorage.md)
- [useOAuth Hook](./useOAuth.md)

---

## License

MIT License

Copyright (c) 2024 Koppo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
