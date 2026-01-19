# Storage Utilities

This directory contains React hooks for managing browser storage with enhanced security, performance, and developer experience.

## Available Utilities

### 1. useLocalStorage
**Location**: `./use-local-storage/`
- Standard localStorage with React state synchronization
- Cross-tab synchronization
- Debounced updates for performance
- Error handling and fallbacks

### 2. useSession
**Location**: `./use-session/`
- Session storage with enhanced security features
- **Encryption** for sensitive data
- **Auto-expiration** with configurable timeouts
- **Validation** and **sanitization** of data
- **Automatic cleanup** on page unload
- Cross-tab synchronization

#### Specialized Session Hooks:
- `useTemporarySession(key, expireAfter)` - Auto-expiring temporary data
- `useSecureSession(key, encryptionKey)` - Encrypted sensitive data

### 3. useCookies
**Location**: `./use-cookies/`
- Cookie management with enhanced security
- **Encryption** for sensitive cookies
- **Secure cookie flags** (Secure, HttpOnly, SameSite)
- **Auto-refresh** before expiration
- **Domain and path** configuration
- Cross-tab synchronization

#### Specialized Cookie Hooks:
- `usePersistentCookies(key, days)` - Long-term persistent cookies
- `useSecureCookies(key, encryptionKey)` - Encrypted cookies
- `useSessionCookies(key)` - Session cookies (expire on browser close)
- `useAuthCookies(key)` - Authentication cookies with enhanced security

## Security Features

### 🔐 Encryption
- Built-in XOR encryption for sensitive data
- Custom encryption keys support
- Automatic encryption/decryption

### ✅ Validation & Sanitization
- Input validation before storing
- Data sanitization options
- Type safety with TypeScript

### 🛡️ Secure Defaults
- Secure cookie flags by default
- SameSite=Strict for CSRF protection
- HttpOnly where applicable
- Auto-cleanup of sensitive data

### ⏰ Auto-Expiration
- Configurable expiration times
- Auto-refresh before expiration
- Cleanup on page unload
- Session-based expiration

## Performance Features

### ⚡ Instant Updates
- Immediate state synchronization
- Optimistic updates
- Debounced writes to prevent performance issues

### 🔄 Cross-Tab Sync
- Real-time synchronization across browser tabs
- Event-driven updates
- Efficient polling only when needed

### 📊 Resilient Error Handling
- Graceful fallbacks on storage errors
- Error logging and recovery
- Consistent state management

## Usage Examples

### Basic useLocalStorage
```tsx
const [preferences, setPreferences] = useLocalStorage('user_preferences', {
  defaultValue: { theme: 'dark', language: 'en' }
});

// Update preferences
setPreferences(prev => ({ ...prev, theme: 'light' }));
```

### Secure Session Storage
```tsx
const [token, setToken] = useSecureSession('auth_token', 'my-secret-key', {
  validator: (value) => typeof value === 'string' && value.length > 10,
  clearOnUnload: true
});

// Set secure token
setToken('secure-jwt-token-12345');
```

### Auth Cookies
```tsx
const [authCookie, setAuthCookie] = useAuthCookies('auth_token', {
  validator: (value) => value && typeof value === 'object' && 'token' in value
});

// Set auth cookie
setAuthCookie({
  token: 'jwt-token-12345',
  expires: Date.now() + 86400000
});
```

### Temporary Data
```tsx
const [formData, setFormData] = useTemporarySession('form_data', 300000); // 5 minutes

// Auto-expires after 5 minutes
setFormData({ name: 'John', email: 'john@example.com' });
```

## API Reference

### Common Options
All hooks support these common options:

```typescript
interface StorageOptions<T> {
  defaultValue?: T;
  sync?: boolean;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  validator?: (value: T) => boolean;
  sanitizer?: (value: T) => T;
  debounce?: number;
  notifyOnlyOnChange?: boolean;
}
```

### Security Options
Session and cookie hooks support additional security options:

```typescript
interface SecurityOptions {
  encrypt?: boolean;
  encryptionKey?: string;
  expireAfter?: number;
  clearOnUnload?: boolean;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}
```

## Best Practices

### 1. Use Appropriate Storage Type
- **useLocalStorage**: User preferences, non-sensitive settings
- **useSession**: Temporary session data, form states
- **useCookies**: Authentication tokens, user preferences across sessions

### 2. Enable Security Features
- Always use encryption for sensitive data
- Set appropriate expiration times
- Use validation to ensure data integrity
- Enable secure cookie flags

### 3. Handle Errors Gracefully
- Provide meaningful default values
- Use validators to prevent invalid data
- Monitor for storage quota exceeded errors

### 4. Performance Optimization
- Use debouncing for frequent updates
- Clean up unused data
- Prefer session storage for temporary data

## Migration from useLocalStorage

### From useLocalStorage to useSession
```tsx
// Before
const [data, setData] = useLocalStorage('my_data');

// After (with security)
const [data, setData] = useSession('my_data', {
  encrypt: true,
  expireAfter: 3600000, // 1 hour
  clearOnUnload: true
});
```

### From useLocalStorage to useCookies
```tsx
// Before
const [token, setToken] = useLocalStorage('auth_token');

// After (with enhanced security)
const [token, setToken] = useAuthCookies('auth_token', {
  validator: (value) => typeof value === 'string' && value.length > 10
});
```

## Testing

See `./examples/storage-examples.tsx` for comprehensive usage examples and testing scenarios.

## Browser Compatibility

- **LocalStorage**: All modern browsers
- **SessionStorage**: All modern browsers  
- **Cookies**: All modern browsers
- **Encryption**: Uses built-in browser APIs (btoa/atob)

## Security Considerations

1. **Encryption**: Uses XOR encryption - suitable for obfuscation but not for highly sensitive data
2. **Storage**: Client-side storage can be accessed by malicious scripts
3. **Cookies**: Set appropriate security flags to prevent CSRF and XSS
4. **Validation**: Always validate data on the server side
