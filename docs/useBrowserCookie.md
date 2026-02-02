# useBrowserCookie Hook Documentation

A React context-based hook for managing browser cookies with automatic localStorage fallback. This hook provides a unified API for cookie operations with built-in security defaults and cross-tab synchronization.

---

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Real-World Examples](#real-world-examples)
- [Configuration Options](#configuration-options)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

`useBrowserCookie` is a custom React hook that:

- **Prioritizes cookies** for storage but automatically falls back to localStorage when cookies are unavailable or fail
- **Sets secure defaults** for cookie properties (secure, sameSite, path, expiration)
- **Provides CRUD operations**: `getItem`, `setItem`, `removeItem`, `updateItem`
- **Supports subscriptions** for reactive updates across components
- **Works seamlessly** with the existing `useLocalStorage` infrastructure

### Why Use This Hook?

| Feature | Native Cookies | useBrowserCookie |
|---------|---------------|------------------|
| Automatic fallback | ❌ | ✅ localStorage fallback |
| Type safety | ❌ | ✅ Full TypeScript support |
| Secure defaults | ❌ | ✅ Auto-configured |
| JSON serialization | ❌ | ✅ Automatic |
| Cross-component sync | ❌ | ✅ Via subscriptions |
| Easy API | ❌ | ✅ Simple CRUD methods |

---

## Installation & Setup

### Provider Setup

The `CookieProvider` is already integrated into `AppProviders.tsx`. It must be nested **inside** `LocalStorageProvider`:

```tsx
// src/providers/AppProviders.tsx
import { LocalStorageProvider } from "../utils/use-local-storage";
import { CookieProvider } from "../contexts/CookieContext";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocalStorageProvider>
      <CookieProvider>
        {/* Other providers */}
        {children}
      </CookieProvider>
    </LocalStorageProvider>
  );
}
```

### Importing the Hook

```tsx
import { useBrowserCookie } from '../contexts/CookieContext';
```

---

## API Reference

### Hook Methods

#### `getItem<T>(key: string): T | null`

Retrieves a value from cookies (with localStorage fallback).

```tsx
const { getItem } = useBrowserCookie();

// Get a simple value
const theme = getItem<string>('theme');

// Get an object
const userPrefs = getItem<{ language: string; timezone: string }>('user_prefs');
```

#### `setItem<T>(key: string, value: T, options?: CookieOptions): void`

Stores a value in cookies (with localStorage fallback).

```tsx
const { setItem } = useBrowserCookie();

// Set a simple value
setItem('theme', 'dark');

// Set an object with custom options
setItem('session_data', { userId: 123, role: 'admin' }, { 
  days: 1,
  secure: true 
});
```

#### `removeItem(key: string, options?: CookieOptions): void`

Removes a value from both cookies and localStorage.

```tsx
const { removeItem } = useBrowserCookie();

removeItem('session_data');
```

#### `updateItem<T>(key: string, updater: (prev: T | null) => T, options?: CookieOptions): void`

Updates an existing value using a callback function.

```tsx
const { updateItem } = useBrowserCookie();

// Increment a counter
updateItem<number>('visit_count', (prev) => (prev ?? 0) + 1);

// Update nested object
updateItem<{ theme: string; fontSize: number }>('settings', (prev) => ({
  ...prev,
  theme: 'dark'
}));
```

#### `subscribe(key: string, listener: (event: unknown) => void, options?: CookieObserverOptions): () => void`

Subscribes to changes for a specific key. Returns an unsubscribe function.

```tsx
const { subscribe } = useBrowserCookie();

useEffect(() => {
  const unsubscribe = subscribe('auth_token', (event) => {
    console.log('Auth token changed:', event);
  });

  return () => unsubscribe();
}, []);
```

---

## How It Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      useBrowserCookie                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   getItem    │    │   setItem    │    │ removeItem   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Cookie Operations (Primary)             │   │
│  │  - CookieUtils.getCookie()                          │   │
│  │  - CookieUtils.setCookie()                          │   │
│  │  - CookieUtils.deleteCookie()                       │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         │ Fallback on failure               │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           LocalStorage (Fallback)                    │   │
│  │  - useLocalStorageContext().getItem()               │   │
│  │  - useLocalStorageContext().setItem()               │   │
│  │  - useLocalStorageContext().removeItem()            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow: Setting a Value

1. **Serialize** the value to JSON string
2. **Attempt cookie storage** with merged options (defaults + custom)
3. **Verify** the cookie was set successfully
4. **If failed**, fall back to localStorage
5. **Trigger** change notifications via `cookieTracker`

### Flow: Getting a Value

1. **Check cookies** first using `CookieUtils.getCookie()`
2. **If found**, deserialize and return
3. **If not found**, check localStorage as fallback
4. **Return** the value or `null`

### Default Cookie Options

| Property | Default Value | Description |
|----------|---------------|-------------|
| `days` | `7` | Cookie expiration in days |
| `path` | `'/'` | Cookie path scope |
| `secure` | `true` (prod) / `false` (dev) | HTTPS only flag |
| `sameSite` | `'lax'` | CSRF protection level |

---

## Real-World Examples

### Example 1: User Preferences

```tsx
import { useBrowserCookie } from '../contexts/CookieContext';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

function SettingsPanel() {
  const { getItem, setItem, updateItem } = useBrowserCookie();
  
  // Load preferences on mount
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    return getItem<UserPreferences>('user_preferences') ?? {
      theme: 'system',
      language: 'en',
      notifications: true,
      fontSize: 'medium'
    };
  });

  const updateTheme = (theme: UserPreferences['theme']) => {
    updateItem<UserPreferences>('user_preferences', (prev) => ({
      ...prev!,
      theme
    }), { days: 365 }); // Persist for 1 year
    
    setPrefs(p => ({ ...p, theme }));
  };

  const toggleNotifications = () => {
    updateItem<UserPreferences>('user_preferences', (prev) => ({
      ...prev!,
      notifications: !prev?.notifications
    }));
    
    setPrefs(p => ({ ...p, notifications: !p.notifications }));
  };

  return (
    <div>
      <select value={prefs.theme} onChange={(e) => updateTheme(e.target.value as any)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      
      <label>
        <input 
          type="checkbox" 
          checked={prefs.notifications} 
          onChange={toggleNotifications}
        />
        Enable Notifications
      </label>
    </div>
  );
}
```

### Example 2: Authentication Token Management

```tsx
import { useBrowserCookie } from '../contexts/CookieContext';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function useOAuth() {
  const { getItem, setItem, removeItem, subscribe } = useBrowserCookie();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const tokens = getItem<AuthTokens>('auth_tokens');
    if (tokens && tokens.expiresAt > Date.now()) {
      setIsAuthenticated(true);
    }
  }, []);

  // Subscribe to token changes (e.g., from other tabs)
  useEffect(() => {
    const unsubscribe = subscribe('auth_tokens', (event: any) => {
      if (event.newValue) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  const login = async (credentials: { email: string; password: string }) => {
    const response = await api.login(credentials);
    
    setItem<AuthTokens>('auth_tokens', {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000
    }, {
      days: 7,
      secure: true,
      sameSite: 'strict'
    });

    setIsAuthenticated(true);
  };

  const logout = () => {
    removeItem('auth_tokens');
    setIsAuthenticated(false);
  };

  const getAccessToken = (): string | null => {
    const tokens = getItem<AuthTokens>('auth_tokens');
    if (!tokens || tokens.expiresAt <= Date.now()) {
      return null;
    }
    return tokens.accessToken;
  };

  return { isAuthenticated, login, logout, getAccessToken };
}
```

### Example 3: Shopping Cart Persistence

```tsx
import { useBrowserCookie } from '../contexts/CookieContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function useShoppingCart() {
  const { getItem, setItem, updateItem, removeItem } = useBrowserCookie();

  const getCart = (): CartItem[] => {
    return getItem<CartItem[]>('shopping_cart') ?? [];
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    updateItem<CartItem[]>('shopping_cart', (prev) => {
      const cart = prev ?? [];
      const existingIndex = cart.findIndex(i => i.id === item.id);
      
      if (existingIndex >= 0) {
        // Increment quantity
        const updated = [...cart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      
      // Add new item
      return [...cart, { ...item, quantity: 1 }];
    }, { days: 30 }); // Keep cart for 30 days
  };

  const removeFromCart = (itemId: string) => {
    updateItem<CartItem[]>('shopping_cart', (prev) => {
      return (prev ?? []).filter(item => item.id !== itemId);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    updateItem<CartItem[]>('shopping_cart', (prev) => {
      return (prev ?? []).map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    removeItem('shopping_cart');
  };

  const getCartTotal = (): number => {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return {
    cart: getCart(),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total: getCartTotal()
  };
}
```

### Example 4: Feature Flags / A/B Testing

```tsx
import { useBrowserCookie } from '../contexts/CookieContext';

interface FeatureFlags {
  newCheckout: boolean;
  darkModeV2: boolean;
  betaFeatures: boolean;
  experimentGroup: 'A' | 'B' | 'control';
}

function useFeatureFlags() {
  const { getItem, setItem } = useBrowserCookie();

  const getFlags = (): FeatureFlags => {
    const stored = getItem<FeatureFlags>('feature_flags');
    
    if (stored) return stored;

    // Initialize with defaults and random experiment group
    const defaults: FeatureFlags = {
      newCheckout: false,
      darkModeV2: false,
      betaFeatures: false,
      experimentGroup: ['A', 'B', 'control'][Math.floor(Math.random() * 3)] as any
    };

    setItem('feature_flags', defaults, { days: 90 });
    return defaults;
  };

  const isEnabled = (flag: keyof Omit<FeatureFlags, 'experimentGroup'>): boolean => {
    return getFlags()[flag];
  };

  const getExperimentGroup = (): FeatureFlags['experimentGroup'] => {
    return getFlags().experimentGroup;
  };

  return { flags: getFlags(), isEnabled, getExperimentGroup };
}

// Usage in component
function CheckoutButton() {
  const { isEnabled } = useFeatureFlags();

  if (isEnabled('newCheckout')) {
    return <NewCheckoutFlow />;
  }

  return <LegacyCheckout />;
}
```

### Example 5: Remember Me / Credential Storage

```tsx
import { useBrowserCookie } from '../contexts/CookieContext';

interface RememberedCredentials {
  email: string;
  rememberMe: boolean;
}

function LoginForm() {
  const { getItem, setItem, removeItem } = useBrowserCookie();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const remembered = getItem<RememberedCredentials>('remembered_login');
    if (remembered) {
      setEmail(remembered.email);
      setRememberMe(remembered.rememberMe);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rememberMe) {
      setItem<RememberedCredentials>('remembered_login', {
        email,
        rememberMe: true
      }, { 
        days: 30,
        secure: true 
      });
    } else {
      removeItem('remembered_login');
    }

    // Proceed with login...
    await login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Remember me
      </label>
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Configuration Options

### CookieOptions Interface

```typescript
interface CookieOptions {
  /** Cookie expiration in days (default: 7) */
  days?: number;
  
  /** Cookie path (default: '/') */
  path?: string;
  
  /** Cookie domain (default: current domain) */
  domain?: string;
  
  /** Secure flag - HTTPS only (default: true in production) */
  secure?: boolean;
  
  /** SameSite attribute (default: 'lax') */
  sameSite?: 'strict' | 'lax' | 'none';
}
```

### SameSite Explained

| Value | Description | Use Case |
|-------|-------------|----------|
| `'strict'` | Cookie only sent in first-party context | Sensitive data, auth tokens |
| `'lax'` | Sent with top-level navigations | General use, good default |
| `'none'` | Sent in all contexts (requires `secure: true`) | Cross-site scenarios |

### Custom Provider Options

You can pass default options to the provider:

```tsx
<CookieProvider defaultOptions={{ 
  days: 30, 
  secure: true,
  sameSite: 'strict' 
}}>
  {children}
</CookieProvider>
```

---

## Best Practices

### 1. Use TypeScript Generics

Always specify types for better type safety:

```tsx
// Good
const user = getItem<User>('current_user');

// Avoid
const user = getItem('current_user');
```

### 2. Handle Null Values

Always handle the case where a cookie doesn't exist:

```tsx
const prefs = getItem<Preferences>('prefs') ?? defaultPreferences;
```

### 3. Use Appropriate Expiration

```tsx
// Session data - short expiration
setItem('session', data, { days: 1 });

// User preferences - long expiration
setItem('preferences', prefs, { days: 365 });

// Sensitive data - strict security
setItem('auth', tokens, { 
  days: 7, 
  secure: true, 
  sameSite: 'strict' 
});
```

### 4. Clean Up Subscriptions

Always unsubscribe in useEffect cleanup:

```tsx
useEffect(() => {
  const unsubscribe = subscribe('key', handler);
  return () => unsubscribe();
}, []);
```

### 5. Don't Store Sensitive Data in Plain Text

For highly sensitive data, consider additional encryption or use httpOnly cookies set by the server.

---

## Troubleshooting

### Cookie Not Being Set

**Possible causes:**
- Cookies disabled in browser
- Cookie size exceeds 4KB limit
- Secure flag set but not on HTTPS

**Solution:** The hook automatically falls back to localStorage. Check browser console for warnings.

### Value Not Persisting

**Possible causes:**
- Cookie expired
- Different path/domain settings
- Private/incognito mode

**Solution:** Check the options being passed and verify in browser DevTools > Application > Cookies.

### Cross-Tab Sync Not Working

**Possible causes:**
- Not using subscribe method
- Different cookie paths

**Solution:** Use the `subscribe` method and ensure consistent options across the app.

### TypeScript Errors

**Solution:** Ensure you're using generics:

```tsx
// Correct
const data = getItem<MyType>('key');

// Will cause type issues
const data = getItem('key');
```

---

## File Locations

- **Context & Hook**: `src/contexts/CookieContext.tsx`
- **Cookie Utilities**: `src/utils/use-cookies/cookieTracker.ts`
- **Provider Integration**: `src/providers/AppProviders.tsx`
- **LocalStorage Fallback**: `src/utils/use-local-storage/`

---

## Related Documentation

- [useLocalStorage Hook](./useLocalStorage.md)
- [useCookies Hook](./useCookies.md)
- [Authentication Context](./OAuthContext.md)
