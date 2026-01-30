
/**
 * @file: AuthContext.tsx
 * @description: React context provider for authentication state management,
 *               handling real user data, tokens, and token refresh logic.
 *
 * @components:
 *   - AuthContext: React context for auth state
 *   - AuthProvider: Provider component that manages auth state
 *   - useAuth: Custom hook for consuming auth context
 * @dependencies:
 *   - React: createContext, useContext, useState, useEffect
 *   - services/api: authAPI for token refresh and login with token
 *   - stores/authStore: Global auth state store
 * @usage:
 *   // Wrap application with provider
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 *   // Use auth state in components
 *   const { user, tokens, isAuthenticated, refreshTokens } = useAuth();
 *
 * @architecture: Context Provider pattern with real user data and token management
 * @relationships:
 *   - Used by: App component and any component needing auth state
 *   - Interacts with: authStore for global state synchronization
 * @dataFlow:
 *   - State management: Manages user data, tokens, and authentication status
 *   - Persistence: Syncs with localStorage and authStore
 *   - Token refresh: Automatic token refresh before expiration
 */
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authAPI, User, Tokens } from '../services/api';
import { authStore } from '../stores/authStore';
import { useAuthCookies } from '../utils/use-cookies';
import { runAuthDiagnostic } from '../utils/auth-diagnostic';

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthData: (user: User, tokens: Tokens) => void;
  refreshTokens: () => Promise<boolean>;
  loginWithToken: () => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<boolean>;
}

const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  TOKENS: 'tokens',
  REMEMBERED_CREDENTIALS: 'rememberedCredentials'
};

// Validation functions for auth data
const validateUser = (user: any): user is User => {
  console.log('🔍 Validating user data:', {
    user: !!user,
    userType: typeof user,
    userKeys: user ? Object.keys(user) : 'no user',
    username: user?.username,
    email: user?.email,
    displayName: user?.displayName
  });

  const isValid = user &&
    typeof user === 'object' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.displayName === 'string';

  console.log('✅ User validation result:', isValid);
  return isValid;
};

const validateTokens = (tokens: any): tokens is Tokens => {
  console.log('🔍 Validating token data:', {
    tokens: !!tokens,
    tokensType: typeof tokens,
    tokensKeys: tokens ? Object.keys(tokens) : 'no tokens',
    access: tokens?.access?.token,
    refresh: tokens?.refresh?.token,
  });

  const isValid = tokens &&
    typeof tokens === 'object' &&
    typeof tokens.access === 'object' &&
    typeof tokens.refresh === 'object' &&
    typeof tokens.access?.token === 'object' &&
    typeof tokens.refresh?.token === 'object';

  console.log('✅ Token validation result:', isValid);
  return isValid;
};

function isTokenExpired(expiresAt: string): boolean {
  try {
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    return exp < now;
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use secure cookies for user data
  const [userCookie, setUserCookie] = useAuthCookies<User | null>(STORAGE_KEYS.USER_DATA, {
    defaultValue: null,
    validator: (value): value is User => validateUser(value)
  });

  // Use secure cookies for tokens
  const [tokensCookie, setTokensCookie] = useAuthCookies<Tokens | null>(STORAGE_KEYS.TOKENS, {
    defaultValue: null,
    validator: (value): value is Tokens => validateTokens(value)
  });

  const [user, setUserState] = useState<User | null>(userCookie);
  const [tokens, setTokensState] = useState<Tokens | null>(tokensCookie);
  const [isLoading, setIsLoading] = useState(true);

  // Update state when cookies change
  useEffect(() => {
    setUserState(userCookie);
  }, [userCookie]);

  useEffect(() => {
    setTokensState(tokensCookie);
  }, [tokensCookie]);

  const isAuthenticated = !!user && !!tokens && !isTokenExpired(tokens?.access?.token?.expiresAt);

  // Debug authentication state
  console.log('Auth Debug:', {
    user: !!user,
    tokens: !!tokens,
    tokenExpired: tokens ? isTokenExpired(tokens?.access?.token?.expiresAt) : 'no tokens',
    isAuthenticated,
    userEmail: user?.email,
    tokenPresent: !!tokens?.access?.token
  });

  const setAuthData = (userData: User, tokenData: Tokens) => {
    console.log('setAuthData called with:', {
      userData: !!userData,
      tokenData: !!tokenData,
      userEmail: userData?.email,
      hasAccessToken: !!tokenData?.access?.token,
      hasRefreshToken: !!tokenData?.refresh?.token,
      userDataKeys: userData ? Object.keys(userData) : 'no user data',
      tokenDataKeys: tokenData ? Object.keys(tokenData) : 'no token data'
    });

    console.warn({userData, tokenData});

    // Validate user data before storing
    if (!validateUser(userData)) {
      console.error('❌ User data validation failed:', userData);
      return;
    }

    // Validate token data before storing
    if (!validateTokens(tokenData)) {
      console.error('❌ Token data validation failed:', tokenData);
      return;
    }

    console.log('✅ Validation passed, storing in state and cookies');

    // Store in secure cookies
    console.log('🍪 Setting user cookie...', {userData});
    setUserCookie(userData);
    console.log('🍪 Setting tokens cookie...', {tokenData});
    setTokensCookie(tokenData);

    console.log('After storing in cookies:', {
      userStored: !!userCookie,
      tokensStored: !!tokensCookie,
      userCookieValue: userCookie,
      tokensCookieValue: !!tokensCookie
    });

    // Check cookies directly
    setTimeout(() => {
      const userCookieExists = document.cookie.split(';').some(c => c.trim().startsWith('user_data='));
      const tokensCookieExists = document.cookie.split(';').some(c => c.trim().startsWith('tokens='));
      console.log('🔍 Direct cookie check after 100ms:', {
        userCookieExists,
        tokensCookieExists,
        allCookies: document.cookie.split(';').map(c => c.trim().split('=')[0])
      });
    }, 100);

  };

  const refreshTokens = async (): Promise<boolean> => {
    try {
      if (!tokens?.refresh.token) {
        return false;
      }

      // Check if refresh token is expired
      if (isTokenExpired(tokens?.refresh?.token?.expiresAt)) {
        logout();
        return false;
      }

      const response = await authAPI.refreshToken();

      if (response.user && response.tokens) {
        setAuthData(response.user, response.tokens);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const loginWithToken = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Get the native token from remembered credentials
      const rememberedCredentials = localStorage.getItem(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
      if (!rememberedCredentials) {
        console.error('No remembered credentials found for login with token');
        return false;
      }
      const credentials = JSON.parse(rememberedCredentials);
      // For now, we'll use the email as a simple token identifier
      // In a real implementation, you'd store a proper native token
      const nativeToken = credentials.email;
      const response = await authAPI.loginWithToken(nativeToken);
      if (response.user && response.tokens) {
        setAuthData(response.user, response.tokens);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login with token failed:', error);
      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUserState(null);
    setTokensState(null);

    // Clear secure cookies
    setUserCookie(null);
    setTokensCookie(null);

    // Clear remembered credentials from localStorage (keep this for compatibility)
    localStorage.removeItem(STORAGE_KEYS.REMEMBERED_CREDENTIALS);

    // Clear legacy auth store
    authStore.clearAuth();
  };

  const refreshProfile = async (): Promise<boolean> => {
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.user && tokens) {
        // Update user data while keeping existing tokens
        setAuthData(response.user, tokens);
        return true;
      }
      console.warn('Failed to refresh profile:', response.error);
      return false;
    } catch (error) {
      console.error('Profile refresh failed:', error);
      return false;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 Auth initialization starting...');

      // Run diagnostic
      runAuthDiagnostic();

      setIsLoading(true);

      // Get data from secure cookies instead of localStorage
      const storedUser = userCookie;
      const storedTokens = tokensCookie;

      console.log('🔍 Stored auth data:', {
        hasStoredUser: !!storedUser,
        hasStoredTokens: !!storedTokens,
        userEmail: storedUser?.email,
        hasAccessToken: !!storedTokens?.access.token,
        tokenExpired: storedTokens ? isTokenExpired(storedTokens.access.token.expiresAt) : 'no tokens'
      });

      if (storedUser && storedTokens) {
        // Check if access token is still valid
        if (!isTokenExpired(storedTokens.access.token.expiresAt)) {
          console.log('✅ Access token valid, setting auth state');
          setUserState(storedUser);
          setTokensState(storedTokens);
        } else if (!isTokenExpired(storedTokens.refresh.token.expiresAt)) {
          //  token is valid, try to refresh
          console.log('🔄 Access token expired, refresh token valid, attempting refresh');
          const refreshed = await refreshTokens();
          if (!refreshed) {
            console.log('❌ Refresh failed, trying login with token');
            await loginWithToken();
          }
        } else {
          // Both tokens expired, try login with stored native token
          console.log('❌ Both tokens expired, trying login with token');
          await loginWithToken();
        }
      } else {
        // No stored data, check if we have remembered credentials
        console.log('🔍 No stored auth data, checking remembered credentials');
        const rememberedCredentials = localStorage.getItem(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
        if (rememberedCredentials) {
          console.log('🔍 Found remembered credentials, attempting login');
          await loginWithToken();
        } else {
          console.log('🔍 No remembered credentials found');
        }
      }

      setIsLoading(false);
      console.log('🔍 Auth initialization completed');
    };

    initializeAuth();
  }, [userCookie, tokensCookie]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!tokens?.access.token) return;
    const checkTokenExpiry = () => {
      if (isTokenExpired(tokens.access?.token?.expiresAt)) {
        refreshTokens();
      }
    };
    // Check token expiry every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    // Also check immediately
    checkTokenExpiry();
    return () => clearInterval(interval);
  }, [tokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated,
        isLoading,
        setAuthData,
        refreshTokens,
        loginWithToken,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}