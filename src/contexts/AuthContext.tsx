
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

function getStoredValue<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
}

function setStoredValue<T>(key: string, value: T | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => 
    getStoredValue<User>(STORAGE_KEYS.USER_DATA)
  );
  
  const [tokens, setTokensState] = useState<Tokens | null>(() => 
    getStoredValue<Tokens>(STORAGE_KEYS.TOKENS)
  );
  
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens && !isTokenExpired(tokens.access.token);

  const setAuthData = (userData: User, tokenData: Tokens) => {
    setUserState(userData);
    setTokensState(tokenData);
    setStoredValue(STORAGE_KEYS.USER_DATA, userData);
    setStoredValue(STORAGE_KEYS.TOKENS, tokenData);
    
    // Update legacy auth store for compatibility
    const legacyAuthParams = {
      token1: tokenData.access.token,
      loginid: userData.username,
    };
    
    const legacyAuthorizeResponse = {
      msg_type: "authorize" as const,
      authorize: {
        email: userData.email,
        currency: "USD",
        balance: 10000,
        loginid: userData.username,
        fullname: userData.displayName,
        token1: tokenData.access.token,
        account_list: [
          {
            loginid: userData.username,
            currency: "USD",
            balance: 10000,
          },
        ],
      },
    };
    
    authStore.setAuthParams(legacyAuthParams);
    authStore.setAuthorizeResponse(legacyAuthorizeResponse);
  };

  const refreshTokens = async (): Promise<boolean> => {
    try {
      if (!tokens?.refresh.token) {
                return false;
      }

      // Check if refresh token is expired
      if (isTokenExpired(tokens.refresh.token)) {
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
            
      const response = await authAPI.loginWithToken();
      
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
    setStoredValue(STORAGE_KEYS.USER_DATA, null);
    setStoredValue(STORAGE_KEYS.TOKENS, null);
    localStorage.removeItem(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
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
      setIsLoading(true);
      
      const storedUser = getStoredValue<User>(STORAGE_KEYS.USER_DATA);
      const storedTokens = getStoredValue<Tokens>(STORAGE_KEYS.TOKENS);
      
      if (storedUser && storedTokens) {
        // Check if access token is still valid
        if (!isTokenExpired(storedTokens.access.token)) {
          setUserState(storedUser);
          setTokensState(storedTokens);
                  } else if (!isTokenExpired(storedTokens.refresh.token)) {
          //  token is valid, try to refresh
                    const refreshed = await refreshTokens();
          if (!refreshed) {
                        await loginWithToken();
          }
        } else {
          // Both tokens expired, try login with stored native token
                    await loginWithToken();
        }
      } else {
        // No stored data, check if we have remembered credentials
        const rememberedCredentials = getStoredValue(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
        if (rememberedCredentials) {
                    await loginWithToken();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!tokens?.access.token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(tokens.access.token)) {
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