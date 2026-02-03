# useOAuth Hook Documentation

A comprehensive React context-based hook for OAuth authentication management. Provides secure user authentication, session management, profile operations, and automatic token refresh with cookie persistence.

---

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
  - [State Properties](#state-properties)
  - [Authentication Methods](#authentication-methods)
  - [Profile Methods](#profile-methods)
- [How It Works](#how-it-works)
- [Real-World Examples](#real-world-examples)
- [Security Features](#security-features)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

`useOAuth` is a production-ready authentication hook that:

- **Manages authentication state** with automatic persistence via cookies
- **Provides user properties** directly accessible (email, displayName, etc.)
- **Handles token lifecycle** with automatic refresh before expiration
- **Tracks session activity** with configurable timeout
- **Offers comprehensive error handling** with typed error responses
- **Integrates with useBrowserCookie** for secure storage with localStorage fallback

### Key Features

| Feature | Description |
|---------|-------------|
| Cookie Persistence | Auth state persists across sessions via `useBrowserCookie` |
| Auto Token Refresh | Tokens refresh automatically before expiration |
| Session Timeout | Configurable inactivity timeout |
| Activity Tracking | Automatic session extension on user activity |
| Type Safety | Full TypeScript support with typed responses |
| Error Handling | Structured error responses with codes and messages |

---

## Installation & Setup

### Provider Hierarchy

The `OAuthProvider` is integrated into `AppProviders.tsx` and must be nested **inside** `CookieProvider`:

```tsx
// src/providers/AppProviders.tsx
<LocalStorageProvider>
  <CookieProvider>
    <OAuthProvider>
      <AuthProvider>
        {/* Other providers */}
        {children}
      </AuthProvider>
    </OAuthProvider>
  </CookieProvider>
</LocalStorageProvider>
```

### Importing the Hook

```tsx
import { useOAuth } from '../contexts/OAuthContext';
```

### Provider Configuration

```tsx
<OAuthProvider
  sessionTimeout={30 * 60 * 1000} // 30 minutes (optional)
  onAuthStateChange={(isLoggedIn, user) => {
    // Called when auth state changes
    console.log('Auth state:', isLoggedIn, user?.email);
  }}
>
  {children}
</OAuthProvider>
```

---

## API Reference

### State Properties

#### User Object

```tsx
const { user } = useOAuth();
// Full User object or null
```

#### Derived User Properties

| Property | Type | Description |
|----------|------|-------------|
| `email` | `string \| null` | User's email address |
| `photoURL` | `string \| null` | Profile photo URL |
| `displayName` | `string \| null` | Display name |
| `firstName` | `string \| null` | First name |
| `lastName` | `string \| null` | Last name |
| `phoneNumber` | `string \| null` | Phone number |
| `isKYCVerified` | `boolean` | KYC verification status |
| `isEmailVerified` | `boolean` | Email verification status |
| `isAccountActive` | `boolean` | Account activation status |

```tsx
const { 
  email, 
  displayName, 
  firstName, 
  lastName,
  phoneNumber,
  photoURL,
  isEmailVerified,
  isKYCVerified,
  isAccountActive 
} = useOAuth();
```

#### State Flags

| Property | Type | Description |
|----------|------|-------------|
| `isLoggedIn` | `boolean` | Whether user is authenticated with valid token |
| `isLoading` | `boolean` | Whether an auth operation is in progress |
| `isInitialized` | `boolean` | Whether initial auth check is complete |

```tsx
const { isLoggedIn, isLoading, isInitialized } = useOAuth();

if (!isInitialized) {
  return <SplashScreen />;
}

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isLoggedIn) {
  return <LoginPage />;
}
```

---

### Authentication Methods

#### `login(credentials): Promise<OAuthResult<User>>`

Authenticates a user with email and password.

```tsx
const { login } = useOAuth();

const handleLogin = async () => {
  const result = await login({
    email: 'user@example.com',
    password: 'securePassword123',
    rememberMe: true // Optional: extends session to 30 days
  });

  if (result.success) {
    openNotification('Login successful', `Login successful, welcome ${result.data?.email}` );
    navigate('/dashboard');
  } else {
    openNotification('Login Error', result?.error?.message, { type: 'message-error' });
    console.error('Login failed:', result.error?.message);
  }
};
```

#### `logout(): Promise<OAuthResult>`

Logs out the current user and clears all auth data.

```tsx
const { logout } = useOAuth();

const handleLogout = async () => {
  const result = await logout();
  
  if (result.success) {
    navigate('/login');
  }
};
```

#### `refreshToken(): Promise<OAuthResult<Tokens>>`

Manually refreshes the authentication tokens.

```tsx
const { refreshToken } = useOAuth();

const handleRefresh = async () => {
  const result = await refreshToken();
  
  if (result.success) {
    console.log('Tokens refreshed');
  } else {
    console.error('Refresh failed:', result.error?.message);
  }
};
```

---

### Profile Methods

#### `getUser(): User | null`

Returns the current user object synchronously.

```tsx
const { getUser } = useOAuth();

const currentUser = getUser();
if (currentUser) {
  console.log('Current user:', currentUser.email);
}
```

#### `refreshProfile(): Promise<OAuthResult<User>>`

Fetches the latest user profile from the server.

```tsx
const { refreshProfile } = useOAuth();

const handleRefreshProfile = async () => {
  const result = await refreshProfile();
  
  if (result.success) {
    console.log('Profile updated:', result.data);
  }
};
```

#### `updateProfile(data): Promise<OAuthResult<User>>`

Updates user profile information.

```tsx
const { updateProfile } = useOAuth();

const handleUpdateProfile = async () => {
  const result = await updateProfile({
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'JohnD',
    phoneNumber: '+1234567890',
    photoURL: 'https://example.com/photo.jpg'
  });

  if (result.success) {
    console.log('Profile updated:', result.data);
  } else {
    console.error('Update failed:', result.error?.message);
  }
};
```

#### `updatePassword(data): Promise<OAuthResult>`

Updates the user's password.

```tsx
const { updatePassword } = useOAuth();

const handleChangePassword = async () => {
  const result = await updatePassword({
    currentPassword: 'oldPassword123',
    newPassword: 'newSecurePassword456',
    confirmPassword: 'newSecurePassword456'
  });

  if (result.success) {
    console.log('Password updated successfully');
  } else {
    console.error('Password update failed:', result.error?.message);
  }
};
```

#### `sendResetPasswordLink(email): Promise<OAuthResult>`

Sends a password reset email to the specified address.

```tsx
const { sendResetPasswordLink } = useOAuth();

const handleForgotPassword = async (email: string) => {
  const result = await sendResetPasswordLink(email);

  if (result.success) {
    console.log('Reset link sent to:', email);
  } else {
    console.error('Failed to send reset link:', result.error?.message);
  }
};
```

---

## How It Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         useOAuth Hook                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    State Management                         │ │
│  │  user, tokens, isLoggedIn, isLoading, isInitialized        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   useBrowserCookie                          │ │
│  │  Persistent storage with localStorage fallback             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      authAPI                                │ │
│  │  login, refreshToken, getProfile, updateProfile, etc.      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───▶│ Validate │───▶│  Store   │───▶│ Update   │
│  Request │    │ Response │    │ Cookies  │    │  State   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Generate     │
              │ Session ID   │
              └──────────────┘
```

### Token Refresh Flow

```
┌─────────────────┐
│ Check Token     │
│ Every 60 sec    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No      ┌─────────────────┐
│ Expiring Soon?  │────────────▶│ Continue        │
│ (< 5 min)       │             └─────────────────┘
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Call            │
│ refreshToken()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Fail    ┌─────────────────┐
│ Success?        │────────────▶│ Logout User     │
└────────┬────────┘             └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Update Tokens   │
│ & Persist       │
└─────────────────┘
```

### Session Timeout Flow

```
┌─────────────────┐
│ User Activity   │
│ (click/key/     │
│  scroll)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Last     │
│ Activity Time   │
└─────────────────┘

┌─────────────────┐
│ On Init/Resume  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Yes     ┌─────────────────┐
│ Timeout         │────────────▶│ Clear Auth      │
│ Exceeded?       │             │ Force Login     │
└────────┬────────┘             └─────────────────┘
         │ No
         ▼
┌─────────────────┐
│ Restore         │
│ Session         │
└─────────────────┘
```

---

## Real-World Examples

### Example 1: Complete Login Form

```tsx
import { useState } from 'react';
import { useOAuth } from '../contexts/OAuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login, isLoading, isLoggedIn } = useOAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login({ email, password, rememberMe });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={isLoading}
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        disabled={isLoading}
      />
      
      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Remember me
      </label>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Example 2: Protected Route Component

```tsx
import { useOAuth } from '../contexts/OAuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerified?: boolean;
  requireKYC?: boolean;
}

function ProtectedRoute({ 
  children, 
  requireEmailVerified = false,
  requireKYC = false 
}: ProtectedRouteProps) {
  const { 
    isLoggedIn, 
    isInitialized, 
    isLoading,
    isEmailVerified,
    isKYCVerified 
  } = useOAuth();
  const location = useLocation();

  // Wait for initialization
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Email verification required
  if (requireEmailVerified && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // KYC required
  if (requireKYC && !isKYCVerified) {
    return <Navigate to="/kyc" replace />;
  }

  return <>{children}</>;
}

// Usage in router
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute requireEmailVerified>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Example 3: User Profile Page

```tsx
import { useState } from 'react';
import { useOAuth } from '../contexts/OAuthContext';

function ProfilePage() {
  const { 
    user,
    firstName,
    lastName,
    displayName,
    email,
    phoneNumber,
    photoURL,
    isEmailVerified,
    isKYCVerified,
    updateProfile,
    refreshProfile,
    isLoading 
  } = useOAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: firstName || '',
    lastName: lastName || '',
    displayName: displayName || '',
    phoneNumber: phoneNumber || '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setMessage(null);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error?.message || 'Update failed' });
    }
  };

  const handleRefresh = async () => {
    const result = await refreshProfile();
    if (result.success) {
      setFormData({
        firstName: result.data?.firstName || '',
        lastName: result.data?.lastName || '',
        displayName: result.data?.displayName || '',
        phoneNumber: result.data?.phoneNumber || '',
      });
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={photoURL || '/default-avatar.png'} alt="Profile" />
        <h1>{displayName}</h1>
        <p>{email}</p>
        
        <div className="badges">
          {isEmailVerified && <span className="badge verified">Email Verified</span>}
          {isKYCVerified && <span className="badge kyc">KYC Verified</span>}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="profile-form">
        <div className="form-group">
          <label>First Name</label>
          <input
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            disabled={!isEditing || isLoading}
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            disabled={!isEditing || isLoading}
          />
        </div>

        <div className="form-group">
          <label>Display Name</label>
          <input
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            disabled={!isEditing || isLoading}
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            disabled={!isEditing || isLoading}
          />
        </div>

        <div className="actions">
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setIsEditing(false)} disabled={isLoading}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button onClick={handleRefresh} disabled={isLoading}>
                Refresh
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Example 4: Password Change Form

```tsx
import { useState } from 'react';
import { useOAuth } from '../contexts/OAuthContext';

function ChangePasswordForm() {
  const { updatePassword, isLoading } = useOAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const result = await updatePassword(formData);

    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setMessage({ type: 'error', text: result.error?.message || 'Failed to change password' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Change Password</h2>

      {message && (
        <div className={`alert ${message.type}`}>{message.text}</div>
      )}

      <div className="form-group">
        <label>Current Password</label>
        <input
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label>New Password</label>
        <input
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
          required
          minLength={8}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label>Confirm New Password</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          required
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Change Password'}
      </button>
    </form>
  );
}
```

### Example 5: Forgot Password Flow

```tsx
import { useState } from 'react';
import { useOAuth } from '../contexts/OAuthContext';

function ForgotPasswordPage() {
  const { sendResetPasswordLink, isLoading } = useOAuth();
  
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await sendResetPasswordLink(email);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error?.message || 'Failed to send reset link');
    }
  };

  if (submitted) {
    return (
      <div className="success-message">
        <h2>Check Your Email</h2>
        <p>
          We've sent a password reset link to <strong>{email}</strong>.
          Please check your inbox and follow the instructions.
        </p>
        <button onClick={() => setSubmitted(false)}>
          Send Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Forgot Password</h2>
      <p>Enter your email address and we'll send you a reset link.</p>

      {error && <div className="error">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        required
        disabled={isLoading}
      />

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
```

### Example 6: Header with User Menu

```tsx
import { useOAuth } from '../contexts/OAuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { 
    isLoggedIn, 
    displayName, 
    photoURL, 
    email,
    logout 
  } = useOAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isLoggedIn) {
    return (
      <header>
        <nav>
          <button onClick={() => navigate('/login')}>Sign In</button>
          <button onClick={() => navigate('/register')}>Sign Up</button>
        </nav>
      </header>
    );
  }

  return (
    <header>
      <div className="user-menu" onClick={() => setMenuOpen(!menuOpen)}>
        <img 
          src={photoURL || '/default-avatar.png'} 
          alt={displayName || 'User'} 
          className="avatar"
        />
        <span>{displayName || email}</span>
        
        {menuOpen && (
          <div className="dropdown">
            <button onClick={() => navigate('/profile')}>Profile</button>
            <button onClick={() => navigate('/settings')}>Settings</button>
            <hr />
            <button onClick={handleLogout}>Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}
```

---

## Security Features

### Token Security

- **Secure cookie storage** with `secure` and `sameSite` flags
- **Automatic token refresh** before expiration
- **Token validation** on every state restoration
- **Immediate logout** on refresh failure

### Session Security

- **Session ID generation** for each login
- **Activity-based timeout** (configurable, default 30 minutes)
- **Automatic session extension** on user activity
- **Session validation** on app initialization

### Data Validation

- **User data validation** before storage
- **Token structure validation** before use
- **Password validation** (minimum length, match confirmation)
- **Email validation** for reset password

---

## Error Handling

### OAuthResult Type

All methods return a typed result object:

```typescript
interface OAuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: OAuthError;
}

interface OAuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `LOGIN_FAILED` | Login credentials invalid |
| `LOGIN_ERROR` | Network or server error during login |
| `LOGOUT_ERROR` | Error during logout |
| `NO_REFRESH_TOKEN` | No refresh token available |
| `TOKEN_REFRESH_FAILED` | Server rejected token refresh |
| `TOKEN_REFRESH_ERROR` | Network error during refresh |
| `NOT_AUTHENTICATED` | Operation requires authentication |
| `INVALID_USER_DATA` | Server returned invalid user data |
| `INVALID_TOKEN_DATA` | Server returned invalid token data |
| `PROFILE_FETCH_FAILED` | Failed to fetch profile |
| `PROFILE_UPDATE_FAILED` | Failed to update profile |
| `PASSWORD_MISMATCH` | New password and confirmation don't match |
| `PASSWORD_TOO_SHORT` | Password less than 8 characters |
| `PASSWORD_UPDATE_FAILED` | Failed to update password |
| `INVALID_EMAIL` | Invalid email format |
| `RESET_LINK_FAILED` | Failed to send reset link |

### Error Handling Pattern

```tsx
const { login } = useOAuth();

const handleLogin = async (credentials: LoginCredentials) => {
  const result = await login(credentials);

  if (!result.success) {
    switch (result.error?.code) {
      case 'LOGIN_FAILED':
        showError('Invalid email or password');
        break;
      case 'LOGIN_ERROR':
        showError('Network error. Please try again.');
        break;
      default:
        showError(result.error?.message || 'An error occurred');
    }
    return;
  }

  // Success handling
  navigate('/dashboard');
};
```

---

## Best Practices

### 1. Wait for Initialization

```tsx
const { isInitialized, isLoggedIn } = useOAuth();

if (!isInitialized) {
  return <SplashScreen />;
}
```

### 2. Handle Loading States

```tsx
const { isLoading } = useOAuth();

<button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### 3. Use Derived Properties

```tsx
// Prefer derived properties
const { email, displayName, isEmailVerified } = useOAuth();

// Over accessing user object directly
const { user } = useOAuth();
const email = user?.email; // Less convenient
```

### 4. Handle Errors Gracefully

```tsx
const result = await login(credentials);

if (!result.success) {
  // Always provide user feedback
  setError(result.error?.message || 'An error occurred');
}
```

### 5. Use Type Safety

```tsx
import { LoginCredentials, OAuthResult, User } from '../contexts/OAuthContext';

const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
  const result: OAuthResult<User> = await login(credentials);
  // TypeScript knows result.data is User | undefined
};
```

---

## Troubleshooting

### User Not Persisting After Refresh

**Possible causes:**
- Cookies disabled
- Session timeout exceeded
- Token expired

**Solution:** Check `isInitialized` before rendering protected content.

### Token Refresh Failing

**Possible causes:**
- Refresh token expired
- Network issues
- Server configuration

**Solution:** The hook automatically logs out on refresh failure. Handle the logout gracefully.

### Session Timing Out Too Quickly

**Solution:** Increase the `sessionTimeout` prop:

```tsx
<OAuthProvider sessionTimeout={60 * 60 * 1000}> {/* 1 hour */}
```

### isLoggedIn is False Despite Valid Tokens

**Possible causes:**
- Token validation failed
- User data validation failed

**Solution:** Check browser console for validation errors.

---

## File Locations

- **Context & Hook**: `src/contexts/OAuthContext.tsx`
- **Cookie Storage**: `src/contexts/CookieContext.tsx`
- **API Service**: `src/services/api.ts`
- **Provider Integration**: `src/providers/AppProviders.tsx`

---

## Related Documentation

- [useBrowserCookie Hook](./useBrowserCookie.md)
- [useLocalStorage Hook](./useLocalStorage.md)
- [useOAuth Hook](./useOAuth.md)
