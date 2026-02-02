# useLocalStorage Hook Documentation

A comprehensive React hook and context system for managing localStorage with automatic synchronization, cross-tab communication, debouncing, custom serialization, and reactive state updates.

---

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
  - [useLocalStorage Hook](#uselocalstorage-hook)
  - [useLocalStorageWithCallback Hook](#uselocalstorageWithcallback-hook)
  - [useLocalStorageContext Hook](#uselocalstoragecontext-hook)
  - [LocalStorageProvider](#localstorageprovider)
  - [StorageTracker](#storagetracker)
- [How It Works](#how-it-works)
- [Configuration Options](#configuration-options)
- [Real-World Examples](#real-world-examples)
- [Advanced Patterns](#advanced-patterns)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

---

## Overview

The `useLocalStorage` system provides a complete solution for localStorage management in React applications:

### Core Features

| Feature | Description |
|---------|-------------|
| **Reactive State** | Automatically syncs React state with localStorage |
| **Cross-Tab Sync** | Changes in one tab reflect in all other tabs |
| **Same-Tab Sync** | Multiple components using the same key stay synchronized |
| **Debouncing** | Configurable debounce for high-frequency updates |
| **Custom Serialization** | Support for custom serialize/deserialize functions |
| **Type Safety** | Full TypeScript support with generics |
| **Change Events** | Access to previous and new values on changes |
| **Context API** | Provider-based access for imperative operations |

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    useLocalStorage System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  useLocalStorage │  │ useLocalStorage  │  │ useLocalStorage│ │
│  │      Hook        │  │  WithCallback    │  │    Context     │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 │                               │
│                                 ▼                               │
│           ┌─────────────────────────────────────────┐           │
│           │          LocalStorageTracker            │           │
│           │  (Singleton - manages subscriptions)    │           │
│           └─────────────────────┬───────────────────┘           │
│                                 │                               │
│                                 ▼                               │
│           ┌─────────────────────────────────────────┐           │
│           │            localStorage API              │           │
│           └─────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### Provider Setup

The `LocalStorageProvider` should wrap your application at the root level:

```tsx
// src/providers/AppProviders.tsx
import { LocalStorageProvider } from '../utils/use-local-storage';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocalStorageProvider globalDebounce={100}>
      {/* Other providers */}
      {children}
    </LocalStorageProvider>
  );
}
```

### Importing

```tsx
// Hook-based approach (recommended for components)
import { useLocalStorage, useLocalStorageWithCallback } from '../utils/use-local-storage';

// Context-based approach (for imperative operations)
import { useLocalStorageContext } from '../utils/use-local-storage';

// Types
import type { 
  UseLocalStorageOptions, 
  StorageChangeEvent, 
  StorageObserverOptions 
} from '../utils/use-local-storage';
```

---

## API Reference

### useLocalStorage Hook

The primary hook for reactive localStorage management.

#### Signature

```typescript
function useLocalStorage<T = any>(
  key: string,
  options?: UseLocalStorageOptions<T>
): [
  T | null,                                           // Current value
  (value: T | null | ((prev: T | null) => T | null)) => void,  // Setter
  StorageChangeEvent<T> | null                        // Last change event
]
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | The localStorage key to manage |
| `options` | `UseLocalStorageOptions<T>` | Configuration options (optional) |

#### Return Value

| Index | Type | Description |
|-------|------|-------------|
| `[0]` | `T \| null` | Current stored value |
| `[1]` | `Function` | Setter function (supports functional updates) |
| `[2]` | `StorageChangeEvent<T> \| null` | Last change event with old/new values |

#### Basic Usage

```tsx
import { useLocalStorage } from '../utils/use-local-storage';

function MyComponent() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', {
    defaultValue: 'light'
  });

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

#### Functional Updates

```tsx
const [count, setCount] = useLocalStorage<number>('counter', { defaultValue: 0 });

// Increment based on previous value
setCount(prev => (prev ?? 0) + 1);

// Reset to null (removes from localStorage)
setCount(null);
```

---

### useLocalStorageWithCallback Hook

Hook variant that triggers a callback on value changes.

#### Signature

```typescript
function useLocalStorageWithCallback<T = any>(
  key: string,
  onChange?: (event: StorageChangeEvent<T>) => void,
  options?: Omit<UseLocalStorageOptions<T>, 'sync'>
): readonly [T | null, (value: T | null | ((prev: T | null) => T | null)) => void]
```

#### Usage

```tsx
import { useLocalStorageWithCallback } from '../utils/use-local-storage';

function NotificationSettings() {
  const [settings, setSettings] = useLocalStorageWithCallback<NotificationConfig>(
    'notification_settings',
    (event) => {
      console.log('Settings changed:', event.oldValue, '→', event.newValue);
      // Trigger side effects
      updateNotificationService(event.newValue);
    },
    { defaultValue: defaultNotificationConfig }
  );

  return (/* ... */);
}
```

---

### useLocalStorageContext Hook

Context-based hook for imperative localStorage operations.

#### Signature

```typescript
function useLocalStorageContext(): {
  getItem: <T = any>(key: string) => T | null;
  setItem: <T = any>(key: string, value: T) => void;
  removeItem: (key: string) => void;
  subscribe: <T = any>(
    key: string,
    listener: (event: StorageChangeEvent<T>) => void,
    options?: StorageObserverOptions
  ) => () => void;
  checkForChanges: (key: string) => void;
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `getItem<T>(key)` | Get a value from localStorage |
| `setItem<T>(key, value)` | Set a value in localStorage |
| `removeItem(key)` | Remove a key from localStorage |
| `subscribe(key, listener, options)` | Subscribe to changes for a key |
| `checkForChanges(key)` | Manually trigger change detection |

#### Usage

```tsx
import { useLocalStorageContext } from '../utils/use-local-storage';

function StorageManager() {
  const storage = useLocalStorageContext();

  const handleExport = () => {
    const userData = storage.getItem('user_data');
    const settings = storage.getItem('settings');
    downloadAsJSON({ userData, settings });
  };

  const handleClearAll = () => {
    storage.removeItem('user_data');
    storage.removeItem('settings');
    storage.removeItem('cache');
  };

  return (
    <div>
      <button onClick={handleExport}>Export Data</button>
      <button onClick={handleClearAll}>Clear All</button>
    </div>
  );
}
```

---

### LocalStorageProvider

Context provider that enables `useLocalStorageContext` and provides global configuration.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Child components |
| `globalDebounce` | `number` | `undefined` | Global debounce time in ms |

#### Usage

```tsx
<LocalStorageProvider globalDebounce={150}>
  <App />
</LocalStorageProvider>
```

---

### StorageTracker

The underlying singleton that manages subscriptions and change detection.

#### Key Methods

| Method | Description |
|--------|-------------|
| `subscribe(key, listener, options)` | Subscribe to key changes |
| `checkForKeyChanges(key)` | Manually check for changes |
| `getActiveKeys()` | Get all keys with active subscriptions |
| `destroy()` | Clean up all subscriptions |

---

## How It Works

### Change Detection Flow

```
┌─────────────────┐
│  setValue()     │
│  called         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update React    │
│ State           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write to        │
│ localStorage    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trigger         │
│ checkForChanges │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compare with    │
│ lastValue       │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Changed?│
    └────┬────┘
         │
    ┌────┴────┐
    │   Yes   │───────────────┐
    └─────────┘               │
                              ▼
                   ┌─────────────────┐
                   │ Notify all      │
                   │ subscribers     │
                   └─────────────────┘
```

### Cross-Tab Synchronization

```
┌─────────────────┐          ┌─────────────────┐
│     Tab A       │          │     Tab B       │
├─────────────────┤          ├─────────────────┤
│                 │          │                 │
│  setValue('x')  │          │                 │
│       │         │          │                 │
│       ▼         │          │                 │
│  localStorage   │─────────▶│  storage event  │
│  .setItem()     │          │  triggered      │
│                 │          │       │         │
│                 │          │       ▼         │
│                 │          │  State updated  │
│                 │          │  automatically  │
└─────────────────┘          └─────────────────┘
```

### Polling Mechanism

For same-tab synchronization (where storage events don't fire), the tracker uses polling:

```
┌─────────────────────────────────────────────────────────────┐
│                    Polling Loop (100ms)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Read current value from localStorage                     │
│  2. Compare with cached lastValue                            │
│  3. If different:                                            │
│     a. Apply debounce (if configured)                        │
│     b. Notify all listeners                                  │
│     c. Update lastValue cache                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Options

### UseLocalStorageOptions

```typescript
interface UseLocalStorageOptions<T = any> {
  /** Default value if key doesn't exist */
  defaultValue?: T;
  
  /** Whether to sync the value with state (default: true) */
  sync?: boolean;
  
  /** Custom serializer for storing values */
  serialize?: (value: T) => string;
  
  /** Custom deserializer for retrieving values */
  deserialize?: (value: string) => T;
  
  /** Debounce time in milliseconds for storage events */
  debounce?: number;
  
  /** Only notify when value actually changes (deep equality check) */
  notifyOnlyOnChange?: boolean;
  
  /** Custom comparison function for value changes */
  compare?: (a: any, b: any) => boolean;
}
```

### Option Details

#### `defaultValue`

Initial value when key doesn't exist in localStorage.

```tsx
const [user, setUser] = useLocalStorage<User>('user', {
  defaultValue: { name: 'Guest', role: 'visitor' }
});
```

#### `sync`

Enable/disable automatic synchronization with other components.

```tsx
// Disable sync for isolated state
const [localOnly, setLocalOnly] = useLocalStorage('temp_data', {
  sync: false
});
```

#### `serialize` / `deserialize`

Custom serialization for special data types.

```tsx
// Handle Date objects
const [lastVisit, setLastVisit] = useLocalStorage<Date>('last_visit', {
  serialize: (date) => date.toISOString(),
  deserialize: (str) => new Date(str)
});

// Handle Map objects
const [cache, setCache] = useLocalStorage<Map<string, any>>('cache', {
  serialize: (map) => JSON.stringify([...map.entries()]),
  deserialize: (str) => new Map(JSON.parse(str))
});
```

#### `debounce`

Delay notifications for high-frequency updates.

```tsx
// Debounce search input persistence
const [searchQuery, setSearchQuery] = useLocalStorage('search_query', {
  debounce: 300 // Wait 300ms after last change
});
```

#### `notifyOnlyOnChange`

Only trigger updates when value actually changes.

```tsx
const [settings, setSettings] = useLocalStorage('settings', {
  notifyOnlyOnChange: true // Skip notifications if value is same
});
```

#### `compare`

Custom comparison function for change detection.

```tsx
// Custom comparison for arrays (order-independent)
const [tags, setTags] = useLocalStorage<string[]>('tags', {
  compare: (a, b) => {
    if (!a || !b) return a === b;
    return a.length === b.length && a.every(tag => b.includes(tag));
  }
});
```

---

## Real-World Examples

### Example 1: Theme Persistence

```tsx
import { useLocalStorage } from '../utils/use-local-storage';

type Theme = 'light' | 'dark' | 'system';

function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('app_theme', {
    defaultValue: 'system'
  });

  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  return { theme, setTheme, resolvedTheme };
}

// Usage in component
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="theme-toggle">
      <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <span>Current: {resolvedTheme}</span>
    </div>
  );
}
```

### Example 2: Form Draft Auto-Save

```tsx
import { useLocalStorage } from '../utils/use-local-storage';
import { useEffect, useCallback } from 'react';

interface FormDraft {
  title: string;
  content: string;
  tags: string[];
  lastSaved: number;
}

function ArticleEditor({ articleId }: { articleId: string }) {
  const storageKey = `article_draft_${articleId}`;
  
  const [draft, setDraft, lastEvent] = useLocalStorage<FormDraft>(storageKey, {
    defaultValue: { title: '', content: '', tags: [], lastSaved: 0 },
    debounce: 1000 // Auto-save after 1 second of inactivity
  });

  const [formData, setFormData] = useState(draft);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData && (
        formData.title !== draft?.title ||
        formData.content !== draft?.content
      )) {
        setDraft({
          ...formData,
          lastSaved: Date.now()
        });
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, draft, setDraft]);

  // Restore draft notification
  useEffect(() => {
    if (draft?.lastSaved && draft.lastSaved > 0) {
      const savedDate = new Date(draft.lastSaved);
      console.log(`Draft restored from ${savedDate.toLocaleString()}`);
    }
  }, []);

  const handleClearDraft = () => {
    setDraft(null);
    setFormData({ title: '', content: '', tags: [], lastSaved: 0 });
  };

  return (
    <div className="editor">
      <div className="editor-header">
        <span className="save-status">
          {isSaving ? 'Saving...' : draft?.lastSaved ? 
            `Last saved: ${new Date(draft.lastSaved).toLocaleTimeString()}` : 
            'Not saved'}
        </span>
        <button onClick={handleClearDraft}>Clear Draft</button>
      </div>

      <input
        type="text"
        value={formData?.title || ''}
        onChange={(e) => setFormData(prev => ({ ...prev!, title: e.target.value }))}
        placeholder="Article title"
      />

      <textarea
        value={formData?.content || ''}
        onChange={(e) => setFormData(prev => ({ ...prev!, content: e.target.value }))}
        placeholder="Write your article..."
        rows={20}
      />
    </div>
  );
}
```

### Example 3: Shopping Cart with Cross-Tab Sync

```tsx
import { useLocalStorage, useLocalStorageWithCallback } from '../utils/use-local-storage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Cart {
  items: CartItem[];
  updatedAt: number;
}

function useShoppingCart() {
  const [cart, setCart] = useLocalStorageWithCallback<Cart>(
    'shopping_cart',
    (event) => {
      // Show notification when cart changes in another tab
      if (event.oldValue && event.newValue) {
        const oldCount = event.oldValue.items.reduce((sum, i) => sum + i.quantity, 0);
        const newCount = event.newValue.items.reduce((sum, i) => sum + i.quantity, 0);
        
        if (newCount !== oldCount) {
          showToast(`Cart updated in another tab (${newCount} items)`);
        }
      }
    },
    { defaultValue: { items: [], updatedAt: 0 } }
  );

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const items = prev?.items || [];
      const existingIndex = items.findIndex(i => i.id === item.id);

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = items.map((i, idx) => 
          idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...items, { ...item, quantity: 1 }];
      }

      return { items: newItems, updatedAt: Date.now() };
    });
  }, [setCart]);

  const removeItem = useCallback((itemId: string) => {
    setCart(prev => ({
      items: (prev?.items || []).filter(i => i.id !== itemId),
      updatedAt: Date.now()
    }));
  }, [setCart]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart(prev => ({
      items: (prev?.items || []).map(i => 
        i.id === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
      ).filter(i => i.quantity > 0),
      updatedAt: Date.now()
    }));
  }, [setCart]);

  const clearCart = useCallback(() => {
    setCart({ items: [], updatedAt: Date.now() });
  }, [setCart]);

  const total = useMemo(() => 
    (cart?.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const itemCount = useMemo(() =>
    (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  return {
    items: cart?.items || [],
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}

// Cart Badge Component (updates across tabs)
function CartBadge() {
  const { itemCount } = useShoppingCart();

  return (
    <div className="cart-badge">
      <ShoppingCartIcon />
      {itemCount > 0 && <span className="badge">{itemCount}</span>}
    </div>
  );
}
```

### Example 4: User Preferences with Validation

```tsx
import { useLocalStorage } from '../utils/use-local-storage';

interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium'
  }
};

function validatePreferences(prefs: any): prefs is UserPreferences {
  return (
    prefs &&
    typeof prefs.language === 'string' &&
    typeof prefs.timezone === 'string' &&
    ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(prefs.dateFormat) &&
    typeof prefs.notifications === 'object' &&
    typeof prefs.accessibility === 'object'
  );
}

function useUserPreferences() {
  const [prefs, setPrefs] = useLocalStorage<UserPreferences>('user_preferences', {
    defaultValue: defaultPreferences,
    deserialize: (str) => {
      try {
        const parsed = JSON.parse(str);
        // Validate and merge with defaults
        if (validatePreferences(parsed)) {
          return { ...defaultPreferences, ...parsed };
        }
        return defaultPreferences;
      } catch {
        return defaultPreferences;
      }
    }
  });

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPrefs(prev => ({
      ...prev!,
      [key]: value
    }));
  }, [setPrefs]);

  const resetToDefaults = useCallback(() => {
    setPrefs(defaultPreferences);
  }, [setPrefs]);

  return {
    preferences: prefs || defaultPreferences,
    updatePreference,
    resetToDefaults
  };
}

// Usage
function PreferencesPage() {
  const { preferences, updatePreference, resetToDefaults } = useUserPreferences();

  return (
    <div className="preferences">
      <h2>User Preferences</h2>

      <section>
        <h3>Language & Region</h3>
        <select
          value={preferences.language}
          onChange={(e) => updatePreference('language', e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>

        <select
          value={preferences.dateFormat}
          onChange={(e) => updatePreference('dateFormat', e.target.value as any)}
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </section>

      <section>
        <h3>Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.notifications.email}
            onChange={(e) => updatePreference('notifications', {
              ...preferences.notifications,
              email: e.target.checked
            })}
          />
          Email notifications
        </label>
      </section>

      <section>
        <h3>Accessibility</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.accessibility.reducedMotion}
            onChange={(e) => updatePreference('accessibility', {
              ...preferences.accessibility,
              reducedMotion: e.target.checked
            })}
          />
          Reduce motion
        </label>

        <select
          value={preferences.accessibility.fontSize}
          onChange={(e) => updatePreference('accessibility', {
            ...preferences.accessibility,
            fontSize: e.target.value as any
          })}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </section>

      <button onClick={resetToDefaults}>Reset to Defaults</button>
    </div>
  );
}
```

### Example 5: Search History with Limit

```tsx
import { useLocalStorage } from '../utils/use-local-storage';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

const MAX_HISTORY_ITEMS = 20;

function useSearchHistory() {
  const [history, setHistory] = useLocalStorage<SearchHistoryItem[]>('search_history', {
    defaultValue: []
  });

  const addSearch = useCallback((query: string, resultCount?: number) => {
    if (!query.trim()) return;

    setHistory(prev => {
      const filtered = (prev || []).filter(
        item => item.query.toLowerCase() !== query.toLowerCase()
      );

      const newHistory = [
        { query: query.trim(), timestamp: Date.now(), resultCount },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS);

      return newHistory;
    });
  }, [setHistory]);

  const removeSearch = useCallback((query: string) => {
    setHistory(prev => 
      (prev || []).filter(item => item.query !== query)
    );
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const recentSearches = useMemo(() => 
    (history || []).slice(0, 5),
    [history]
  );

  return {
    history: history || [],
    recentSearches,
    addSearch,
    removeSearch,
    clearHistory
  };
}

// Search Component
function SearchBar() {
  const [query, setQuery] = useState('');
  const { recentSearches, addSearch, removeSearch, clearHistory } = useSearchHistory();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const results = await performSearch(query);
    addSearch(query, results.length);
    setShowSuggestions(false);
  };

  const handleSelectRecent = (recentQuery: string) => {
    setQuery(recentQuery);
    setShowSuggestions(false);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Search..."
      />
      <button onClick={handleSearch}>Search</button>

      {showSuggestions && recentSearches.length > 0 && (
        <div className="suggestions">
          <div className="suggestions-header">
            <span>Recent Searches</span>
            <button onClick={clearHistory}>Clear</button>
          </div>
          {recentSearches.map((item) => (
            <div key={item.query} className="suggestion-item">
              <button onClick={() => handleSelectRecent(item.query)}>
                <ClockIcon />
                <span>{item.query}</span>
                {item.resultCount !== undefined && (
                  <span className="result-count">{item.resultCount} results</span>
                )}
              </button>
              <button 
                className="remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearch(item.query);
                }}
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 6: Multi-Step Form Progress

```tsx
import { useLocalStorage } from '../utils/use-local-storage';

interface FormProgress {
  currentStep: number;
  completedSteps: number[];
  data: {
    step1?: { name: string; email: string };
    step2?: { address: string; city: string; zip: string };
    step3?: { cardNumber: string; expiry: string };
  };
  startedAt: number;
  lastUpdated: number;
}

function useMultiStepForm(formId: string) {
  const [progress, setProgress] = useLocalStorage<FormProgress>(
    `form_progress_${formId}`,
    {
      defaultValue: {
        currentStep: 1,
        completedSteps: [],
        data: {},
        startedAt: Date.now(),
        lastUpdated: Date.now()
      },
      debounce: 500
    }
  );

  const goToStep = useCallback((step: number) => {
    setProgress(prev => ({
      ...prev!,
      currentStep: step,
      lastUpdated: Date.now()
    }));
  }, [setProgress]);

  const completeStep = useCallback((step: number, data: any) => {
    setProgress(prev => ({
      ...prev!,
      currentStep: step + 1,
      completedSteps: [...new Set([...(prev?.completedSteps || []), step])],
      data: {
        ...prev?.data,
        [`step${step}`]: data
      },
      lastUpdated: Date.now()
    }));
  }, [setProgress]);

  const resetForm = useCallback(() => {
    setProgress({
      currentStep: 1,
      completedSteps: [],
      data: {},
      startedAt: Date.now(),
      lastUpdated: Date.now()
    });
  }, [setProgress]);

  const isStepCompleted = useCallback((step: number) => {
    return progress?.completedSteps.includes(step) || false;
  }, [progress]);

  return {
    currentStep: progress?.currentStep || 1,
    completedSteps: progress?.completedSteps || [],
    formData: progress?.data || {},
    goToStep,
    completeStep,
    resetForm,
    isStepCompleted,
    startedAt: progress?.startedAt,
    lastUpdated: progress?.lastUpdated
  };
}

// Multi-step form component
function CheckoutForm() {
  const {
    currentStep,
    completedSteps,
    formData,
    goToStep,
    completeStep,
    resetForm,
    isStepCompleted,
    lastUpdated
  } = useMultiStepForm('checkout');

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Shipping' },
    { number: 3, title: 'Payment' },
    { number: 4, title: 'Review' }
  ];

  return (
    <div className="checkout-form">
      {/* Progress indicator */}
      <div className="steps-indicator">
        {steps.map((step) => (
          <button
            key={step.number}
            className={`step ${currentStep === step.number ? 'active' : ''} 
                       ${isStepCompleted(step.number) ? 'completed' : ''}`}
            onClick={() => isStepCompleted(step.number) && goToStep(step.number)}
            disabled={!isStepCompleted(step.number) && step.number !== currentStep}
          >
            <span className="step-number">{step.number}</span>
            <span className="step-title">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Auto-save indicator */}
      {lastUpdated && (
        <div className="auto-save-indicator">
          Progress saved: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}

      {/* Step content */}
      {currentStep === 1 && (
        <Step1Form
          initialData={formData.step1}
          onComplete={(data) => completeStep(1, data)}
        />
      )}
      {currentStep === 2 && (
        <Step2Form
          initialData={formData.step2}
          onComplete={(data) => completeStep(2, data)}
          onBack={() => goToStep(1)}
        />
      )}
      {/* ... more steps */}

      <button onClick={resetForm} className="reset-btn">
        Start Over
      </button>
    </div>
  );
}
```

### Example 7: Feature Flags with Remote Sync

```tsx
import { useLocalStorage, useLocalStorageContext } from '../utils/use-local-storage';
import { useEffect } from 'react';

interface FeatureFlags {
  newDashboard: boolean;
  darkModeV2: boolean;
  betaFeatures: boolean;
  experimentalAPI: boolean;
  lastSynced: number;
}

const defaultFlags: FeatureFlags = {
  newDashboard: false,
  darkModeV2: false,
  betaFeatures: false,
  experimentalAPI: false,
  lastSynced: 0
};

function useFeatureFlags() {
  const [flags, setFlags] = useLocalStorage<FeatureFlags>('feature_flags', {
    defaultValue: defaultFlags
  });

  // Sync with remote on mount and periodically
  useEffect(() => {
    const syncFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        const remoteFlags = await response.json();
        
        setFlags(prev => ({
          ...prev,
          ...remoteFlags,
          lastSynced: Date.now()
        }));
      } catch (error) {
        console.error('Failed to sync feature flags:', error);
      }
    };

    // Sync on mount
    syncFlags();

    // Sync every 5 minutes
    const interval = setInterval(syncFlags, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setFlags]);

  const isEnabled = useCallback((flag: keyof Omit<FeatureFlags, 'lastSynced'>) => {
    return flags?.[flag] ?? defaultFlags[flag];
  }, [flags]);

  const overrideFlag = useCallback((
    flag: keyof Omit<FeatureFlags, 'lastSynced'>,
    value: boolean
  ) => {
    setFlags(prev => ({
      ...prev!,
      [flag]: value
    }));
  }, [setFlags]);

  return {
    flags: flags || defaultFlags,
    isEnabled,
    overrideFlag,
    lastSynced: flags?.lastSynced
  };
}

// Feature flag wrapper component
function FeatureFlag({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: keyof Omit<FeatureFlags, 'lastSynced'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isEnabled } = useFeatureFlags();

  if (isEnabled(flag)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Usage
function Dashboard() {
  return (
    <div>
      <FeatureFlag flag="newDashboard" fallback={<OldDashboard />}>
        <NewDashboard />
      </FeatureFlag>
    </div>
  );
}
```

### Example 8: Undo/Redo History

```tsx
import { useLocalStorage } from '../utils/use-local-storage';
import { useCallback, useMemo } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function useUndoableState<T>(key: string, initialValue: T, maxHistory = 50) {
  const [history, setHistory] = useLocalStorage<HistoryState<T>>(key, {
    defaultValue: {
      past: [],
      present: initialValue,
      future: []
    }
  });

  const canUndo = useMemo(() => 
    (history?.past.length ?? 0) > 0,
    [history]
  );

  const canRedo = useMemo(() => 
    (history?.future.length ?? 0) > 0,
    [history]
  );

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    setHistory(prev => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev!.present)
        : newValue;

      return {
        past: [...prev!.past, prev!.present].slice(-maxHistory),
        present: resolvedValue,
        future: []
      };
    });
  }, [setHistory, maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev!.past.length === 0) return prev;

      const newPast = [...prev!.past];
      const newPresent = newPast.pop()!;

      return {
        past: newPast,
        present: newPresent,
        future: [prev!.present, ...prev!.future]
      };
    });
  }, [setHistory]);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev!.future.length === 0) return prev;

      const newFuture = [...prev!.future];
      const newPresent = newFuture.shift()!;

      return {
        past: [...prev!.past, prev!.present],
        present: newPresent,
        future: newFuture
      };
    });
  }, [setHistory]);

  const reset = useCallback((value: T) => {
    setHistory({
      past: [],
      present: value,
      future: []
    });
  }, [setHistory]);

  return {
    value: history?.present ?? initialValue,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historyLength: history?.past.length ?? 0
  };
}

// Usage in a text editor
function TextEditor() {
  const {
    value,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength
  } = useUndoableState('editor_content', '');

  return (
    <div className="editor">
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo}>
          Undo ({historyLength})
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => set(e.target.value)}
        rows={20}
      />
    </div>
  );
}
```

### Example 9: Tab State Synchronization

```tsx
import { useLocalStorageWithCallback } from '../utils/use-local-storage';
import { useState, useEffect } from 'react';

interface TabSyncState {
  activeTabId: string;
  lastActivity: number;
  sharedData: any;
}

function useTabSync(tabId: string) {
  const [isLeader, setIsLeader] = useState(false);

  const [syncState, setSyncState] = useLocalStorageWithCallback<TabSyncState>(
    'tab_sync_state',
    (event) => {
      // Another tab became active
      if (event.newValue?.activeTabId !== tabId) {
        setIsLeader(false);
      }
    },
    {
      defaultValue: {
        activeTabId: tabId,
        lastActivity: Date.now(),
        sharedData: null
      }
    }
  );

  // Claim leadership on focus
  useEffect(() => {
    const handleFocus = () => {
      setSyncState(prev => ({
        ...prev!,
        activeTabId: tabId,
        lastActivity: Date.now()
      }));
      setIsLeader(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [tabId, setSyncState]);

  // Share data across tabs
  const shareData = useCallback((data: any) => {
    setSyncState(prev => ({
      ...prev!,
      sharedData: data,
      lastActivity: Date.now()
    }));
  }, [setSyncState]);

  return {
    isLeader,
    sharedData: syncState?.sharedData,
    shareData,
    activeTabId: syncState?.activeTabId
  };
}

// Usage
function App() {
  const tabId = useMemo(() => `tab_${Date.now()}`, []);
  const { isLeader, sharedData, shareData } = useTabSync(tabId);

  return (
    <div>
      <div className="tab-status">
        {isLeader ? '👑 Leader Tab' : '📋 Follower Tab'}
      </div>
      
      {isLeader && (
        <button onClick={() => shareData({ message: 'Hello from leader!' })}>
          Share Data
        </button>
      )}

      {sharedData && (
        <div className="shared-data">
          Received: {JSON.stringify(sharedData)}
        </div>
      )}
    </div>
  );
}
```

### Example 10: Offline Data Queue

```tsx
import { useLocalStorage, useLocalStorageContext } from '../utils/use-local-storage';
import { useEffect, useCallback } from 'react';

interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
}

function useOfflineQueue() {
  const [queue, setQueue] = useLocalStorage<QueuedAction[]>('offline_queue', {
    defaultValue: []
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queue when online
  useEffect(() => {
    if (!isOnline || !queue?.length) return;

    const processQueue = async () => {
      const currentQueue = [...(queue || [])];
      
      for (const action of currentQueue) {
        try {
          await processAction(action);
          // Remove successful action
          setQueue(prev => prev?.filter(a => a.id !== action.id) || []);
        } catch (error) {
          // Increment retry count
          setQueue(prev => prev?.map(a => 
            a.id === action.id 
              ? { ...a, retries: a.retries + 1 }
              : a
          ) || []);
        }
      }
    };

    processQueue();
  }, [isOnline, queue, setQueue]);

  const enqueue = useCallback((type: string, payload: any) => {
    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0
    };

    setQueue(prev => [...(prev || []), action]);
    return action.id;
  }, [setQueue]);

  const removeFromQueue = useCallback((actionId: string) => {
    setQueue(prev => prev?.filter(a => a.id !== actionId) || []);
  }, [setQueue]);

  return {
    queue: queue || [],
    isOnline,
    enqueue,
    removeFromQueue,
    queueLength: queue?.length || 0
  };
}

// Usage
function DataForm() {
  const { enqueue, isOnline, queueLength } = useOfflineQueue();

  const handleSubmit = async (data: any) => {
    if (isOnline) {
      try {
        await submitData(data);
      } catch {
        enqueue('SUBMIT_DATA', data);
      }
    } else {
      enqueue('SUBMIT_DATA', data);
      showToast('Saved offline. Will sync when online.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!isOnline && (
        <div className="offline-banner">
          You're offline. Changes will sync when connected.
          {queueLength > 0 && ` (${queueLength} pending)`}
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

---

## Advanced Patterns

### Pattern 1: Namespaced Storage

```tsx
function createNamespacedStorage(namespace: string) {
  return function useNamespacedStorage<T>(key: string, options?: UseLocalStorageOptions<T>) {
    return useLocalStorage<T>(`${namespace}:${key}`, options);
  };
}

// Create namespaced hooks
const useUserStorage = createNamespacedStorage('user');
const useAppStorage = createNamespacedStorage('app');
const useCacheStorage = createNamespacedStorage('cache');

// Usage
function UserProfile() {
  const [profile] = useUserStorage('profile');
  const [settings] = useUserStorage('settings');
  // Keys become: user:profile, user:settings
}
```

### Pattern 2: Encrypted Storage

```tsx
import CryptoJS from 'crypto-js';

function useEncryptedStorage<T>(key: string, encryptionKey: string, options?: UseLocalStorageOptions<T>) {
  return useLocalStorage<T>(key, {
    ...options,
    serialize: (value) => {
      const json = JSON.stringify(value);
      return CryptoJS.AES.encrypt(json, encryptionKey).toString();
    },
    deserialize: (encrypted) => {
      const bytes = CryptoJS.AES.decrypt(encrypted, encryptionKey);
      const json = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(json);
    }
  });
}

// Usage
function SecureData() {
  const [sensitiveData, setSensitiveData] = useEncryptedStorage(
    'sensitive_data',
    process.env.ENCRYPTION_KEY!
  );
}
```

### Pattern 3: Versioned Storage with Migration

```tsx
interface VersionedData<T> {
  version: number;
  data: T;
}

function useVersionedStorage<T>(
  key: string,
  currentVersion: number,
  migrations: Record<number, (data: any) => any>,
  options?: UseLocalStorageOptions<T>
) {
  return useLocalStorage<T>(key, {
    ...options,
    deserialize: (str) => {
      const parsed: VersionedData<any> = JSON.parse(str);
      let { version, data } = parsed;

      // Apply migrations
      while (version < currentVersion) {
        const migration = migrations[version + 1];
        if (migration) {
          data = migration(data);
        }
        version++;
      }

      return data;
    },
    serialize: (value) => {
      return JSON.stringify({
        version: currentVersion,
        data: value
      });
    }
  });
}

// Usage
const migrations = {
  2: (data: any) => ({ ...data, newField: 'default' }),
  3: (data: any) => ({ ...data, renamedField: data.oldField, oldField: undefined })
};

const [data, setData] = useVersionedStorage('app_data', 3, migrations);
```

---

## Performance Optimization

### Debouncing High-Frequency Updates

```tsx
// For search inputs or sliders
const [value, setValue] = useLocalStorage('search', {
  debounce: 300 // Only persist after 300ms of inactivity
});
```

### Selective Sync

```tsx
// Disable sync for temporary/local-only state
const [tempData, setTempData] = useLocalStorage('temp', {
  sync: false // Won't trigger re-renders from other components
});
```

### Memoized Selectors

```tsx
function useStoredSettings() {
  const [settings] = useLocalStorage<Settings>('settings');
  
  // Memoize derived values
  const theme = useMemo(() => settings?.theme ?? 'light', [settings]);
  const language = useMemo(() => settings?.language ?? 'en', [settings]);
  
  return { theme, language, settings };
}
```

---

## Best Practices

### 1. Use TypeScript Generics

```tsx
// Good - type-safe
const [user, setUser] = useLocalStorage<User>('user');

// Avoid - loses type information
const [user, setUser] = useLocalStorage('user');
```

### 2. Provide Default Values

```tsx
// Good - always has a value
const [count, setCount] = useLocalStorage<number>('count', {
  defaultValue: 0
});

// Risky - may be null
const [count, setCount] = useLocalStorage<number>('count');
// count could be null!
```

### 3. Handle Null Gracefully

```tsx
const [items, setItems] = useLocalStorage<string[]>('items', {
  defaultValue: []
});

// Safe to use
items.map(item => /* ... */);
```

### 4. Use Functional Updates for Derived State

```tsx
// Good - based on previous value
setCount(prev => (prev ?? 0) + 1);

// Risky - may cause race conditions
setCount(count + 1);
```

### 5. Clean Up Unused Keys

```tsx
const storage = useLocalStorageContext();

// Remove deprecated keys on app start
useEffect(() => {
  storage.removeItem('deprecated_key_v1');
  storage.removeItem('old_settings');
}, []);
```

### 6. Validate Stored Data

```tsx
const [data, setData] = useLocalStorage<MyData>('data', {
  deserialize: (str) => {
    const parsed = JSON.parse(str);
    if (!isValidMyData(parsed)) {
      return defaultData; // Return default if invalid
    }
    return parsed;
  }
});
```

---

## Troubleshooting

### Value Not Persisting

**Possible causes:**
- localStorage is full (5MB limit)
- Private/incognito mode
- Serialization error

**Solution:**
```tsx
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage not available:', e);
}
```

### Cross-Tab Sync Not Working

**Possible causes:**
- Different origins
- `sync: false` option set
- Browser restrictions

**Solution:** Ensure same origin and `sync: true` (default).

### State Not Updating

**Possible causes:**
- Using stale closure
- Missing dependency in useCallback

**Solution:** Use functional updates:
```tsx
setItems(prev => [...prev, newItem]); // Good
setItems([...items, newItem]); // May be stale
```

### Performance Issues

**Possible causes:**
- Large objects being serialized frequently
- Missing debounce on high-frequency updates

**Solution:**
```tsx
const [data, setData] = useLocalStorage('data', {
  debounce: 500,
  notifyOnlyOnChange: true
});
```

### TypeScript Errors

**Solution:** Always specify generic type:
```tsx
const [value, setValue] = useLocalStorage<MyType>('key');
```

---

## Migration Guide

### From useState to useLocalStorage

```tsx
// Before
const [theme, setTheme] = useState<Theme>('light');

// After
const [theme, setTheme] = useLocalStorage<Theme>('theme', {
  defaultValue: 'light'
});
```

### From Raw localStorage

```tsx
// Before
const [value, setValue] = useState(() => {
  const stored = localStorage.getItem('key');
  return stored ? JSON.parse(stored) : defaultValue;
});

useEffect(() => {
  localStorage.setItem('key', JSON.stringify(value));
}, [value]);

// After
const [value, setValue] = useLocalStorage('key', {
  defaultValue
});
```

---

## File Locations

- **Hook**: `src/utils/use-local-storage/useLocalStorage.ts`
- **Provider**: `src/utils/use-local-storage/LocalStorageProvider.tsx`
- **Tracker**: `src/utils/use-local-storage/localStorageTracker.ts`
- **Index**: `src/utils/use-local-storage/index.ts`

---

## Related Documentation

- [useBrowserCookie Hook](./useBrowserCookie.md)
- [useOAuth Hook](./useOAuth.md)
