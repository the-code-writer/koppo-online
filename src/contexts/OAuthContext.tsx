/**
 * @file: OAuthContext.tsx
 * @description: React context provider for OAuth authentication state management.
 *               Provides comprehensive auth methods and user state with cookie persistence.
 *
 * @components:
 *   - OAuthContext: React context for OAuth state
 *   - OAuthProvider: Provider component that manages OAuth state
 *   - useOAuth: Custom hook for consuming OAuth context
 * @dependencies:
 *   - React: createContext, useContext, useState, useEffect, useCallback
 *   - CookieContext: useBrowserCookie for persistent storage
 *   - services/api: authAPI for authentication endpoints
 * @usage:
 *   // Use OAuth state in components
 *   const { user, isLoggedIn, login, logout } = useOAuth();
 *
 * @architecture: Context Provider pattern with cookie-based persistence
 * @relationships:
 *   - Used by: Any component needing authentication state
 *   - Depends on: CookieProvider (must be nested inside)
 */
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode
} from 'react';
import { useBrowserCookie } from './CookieContext';
import { authAPI, User, Tokens, LoginData } from '../services/api';
import { useLocalStorage } from '../utils/use-local-storage';

// Storage keys for cookie persistence
export const OAUTH_STORAGE_KEYS = {
    USER_DATA: 'koppo_oauth_user',
    TOKENS: 'koppo_oauth_tokens',
    ACCOUNTS: 'koppo_oauth_accounts',
    DEVICE_KEYS: 'koppo_oauth_device_keys',
    DEVICE_PUBLIC_KEY: 'koppo_oauth_device_public_key',
    DEVICE_PRIVATE_KEY: 'koppo_oauth_device_private_key',
    DEVICE_ID: 'koppo_oauth_device_id',
    DEVICE_INFO: 'koppo_oauth_device_info',
    DEVICE_PUSHER_ID: 'koppo_oauth_device_pusher_id',
    DEVICE_HASH_DATA: 'koppo_oauth_device_hash_data',
    DEVICE_PAYLOAD_DATA: 'koppo_oauth_device_payload_data',
    DEVICE_BROWSER_FINGERPRINT: 'koppo_oauth_device_browser_fingeprint',
    DEVICE_TOKEN: 'koppo_oauth_device_token',
    SERVER_KEYS: 'koppo_oauth_server_keys',
    SESSION_ID: 'koppo_oauth_session_id',
    LAST_ACTIVITY: 'koppo_oauth_last_activity',
    ACCESS_TOKEN: 'koppo_oauth_access_token'
} as const;

// Session configuration
const SESSION_CONFIG = {
    TOKEN_REFRESH_INTERVAL: 60 * 1000, // Check every minute
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 minutes before expiry
} as const;

// Types for OAuth operations
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phoneNumber?: string;
    photoURL?: string;
}

export interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface OAuthError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface OAuthResult<T = void> {
    success: boolean;
    data?: T;
    error?: OAuthError;
}

// OAuth Context value interface
interface OAuthContextValue {
    // User object and derived properties
    user: User | null;
    email: string | null;
    photoURL: string | null;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    isKYCVerified: boolean;
    isEmailVerified: boolean;
    isAccountActive: boolean;

    // Local storage data
    userDataProfile: any;
    userDataAccounts: any;

    // State flags
    isLoggedIn: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    isLoggingIn: boolean;

    // Authentication methods
    login: (credentials: LoginCredentials) => Promise<OAuthResult<User>>;
    logout: () => Promise<OAuthResult>;
    refreshToken: () => Promise<OAuthResult<Tokens>>;

    // Profile methods
    refreshProfile: () => Promise<OAuthResult<User>>;
    getUser: () => User | null;
    updateProfile: (data: UpdateProfileData) => Promise<OAuthResult<User>>;
    updatePassword: (data: UpdatePasswordData) => Promise<OAuthResult>;
    sendResetPasswordLink: (email: string) => Promise<OAuthResult>;
}

const OAuthContext = createContext<OAuthContextValue | undefined>(undefined);

// Validation utilities
function isTokenExpired(expiresAt: string | undefined): boolean {
    if (!expiresAt) return true;
    try {
        const exp = new Date(expiresAt).getTime();
        return exp < Date.now();
    } catch {
        return true;
    }
}

function isTokenExpiringSoon(expiresAt: string | undefined): boolean {
    if (!expiresAt) return true;
    try {
        const exp = new Date(expiresAt).getTime();
        return exp - Date.now() < SESSION_CONFIG.TOKEN_REFRESH_THRESHOLD;
    } catch {
        return true;
    }
}

function validateUser(user: unknown): user is User {
    if (!user || typeof user !== 'object') return false;
    const u = user as Record<string, unknown>;
    return (
        typeof u.email === 'string' &&
        typeof u.username === 'string' &&
        typeof u.displayName === 'string'
    );
}

function validateTokens(tokens: unknown): tokens is Tokens {
    if (!tokens || typeof tokens !== 'object') return false;
    const t = tokens as Record<string, unknown>;
    return (
        t.access !== null &&
        typeof t.access === 'object' &&
        t.refresh !== null &&
        typeof t.refresh === 'object'
    );
}

function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function createError(code: string, message: string, details?: Record<string, unknown>): OAuthError {
    return { code, message, details };
}

interface OAuthProviderProps {
    children: ReactNode;
    onAuthStateChange?: (isLoggedIn: boolean, user: User | null) => void;
    sessionTimeout?: number;
}

export function OAuthProvider({
    children,
    onAuthStateChange,
    sessionTimeout = SESSION_CONFIG.SESSION_TIMEOUT
}: OAuthProviderProps) {

    const { getItem, setItem, removeItem } = useBrowserCookie();

    // Core state
    const [user, setUser] = useState<User | null>(null);
    const [tokens, setTokens] = useState<Tokens | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [, setSessionId] = useState<string | null>(null);

    // Derived state
    const isLoggedIn = useMemo(() => {
        if (!user || !tokens) return false;
        return !isTokenExpired(tokens?.access?.expiresAt);
    }, [user, tokens]);

    // User property getters
    const email = user?.email ?? null;
    const photoURL = (user as Record<string, unknown>)?.photoURL as string | null ?? null;
    const displayName = user?.displayName ?? null;
    const firstName = user?.firstName ?? null;
    const lastName = user?.lastName ?? null;
    const phoneNumber = user?.phoneNumber ?? null;
    const isKYCVerified = (user?.meta as Record<string, unknown>)?.kycVerified === true;
    const isEmailVerified = user?.isEmailVerified ?? false;
    const isAccountActive = user?.isActivated ?? false;

    const [userDataProfile, setLocalStorageUserData] = useLocalStorage(OAUTH_STORAGE_KEYS.USER_DATA);

    const [userDataAccounts, setLocalStorageAccountsData] = useLocalStorage(OAUTH_STORAGE_KEYS.ACCOUNTS);

    // Persist auth data to cookies
    const persistAuthData = useCallback((userData: User | null, tokenData: Tokens | null, accounts?: any) => {

        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!userData) {
            removeItem(OAUTH_STORAGE_KEYS.USER_DATA);
            removeItem(OAUTH_STORAGE_KEYS.TOKENS);
            removeItem(OAUTH_STORAGE_KEYS.ACCOUNTS);
            removeItem(OAUTH_STORAGE_KEYS.SESSION_ID);
            removeItem(OAUTH_STORAGE_KEYS.LAST_ACTIVITY);
            window.localStorage.removeItem('koppo_oauth_user_full');
            return;
        }

        if (userData) {
            // Create minimal user object for cookies (to avoid 4KB limit)
            const minimalUser = {
                id: userData.id,
                uuid: userData.uuid,
                email: userData.email,
                username: userData.username,
                displayName: userData.displayName,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phoneNumber: userData.phoneNumber,
                photoURL: userData.photoURL,
                isEmailVerified: userData.isEmailVerified,
                isActivated: userData.isActivated,
                role: (userData as any).role,
                meta: (userData as any).meta
            };

            // Store minimal user in cookies
            setItem(OAUTH_STORAGE_KEYS.USER_DATA, minimalUser, {
                days: 7,
                secure: !isDev,
                sameSite: 'lax'
            });

            // Store full user in localStorage for complete data access
            setLocalStorageUserData(userData);

        }

        if (tokenData) {

            setItem(OAUTH_STORAGE_KEYS.TOKENS, tokenData, {
                days: 7,
                secure: !isDev,
                sameSite: 'lax'
            });

        }

        if (accounts) {
            // Accounts are also large, store in localStorage only
            setLocalStorageAccountsData(accounts);
        }

        setItem(OAUTH_STORAGE_KEYS.LAST_ACTIVITY, Date.now(), {
            days: 7
        });

    }, [removeItem, setItem, setLocalStorageAccountsData, setLocalStorageUserData]);

    // Update activity timestamp
    const updateActivity = useCallback(() => {
        if (isLoggedIn) {
            setItem(OAUTH_STORAGE_KEYS.LAST_ACTIVITY, Date.now(), { days: 7 });
        }
    }, [setItem, isLoggedIn]);

    // Check session timeout
    const checkSessionTimeout = useCallback(() => {
        const lastActivity = getItem<number>(OAUTH_STORAGE_KEYS.LAST_ACTIVITY);
        if (lastActivity && Date.now() - lastActivity > sessionTimeout) {
            return true;
        }
        return false;
    }, [getItem, sessionTimeout]);

    // Login method
    const login = useCallback(async (credentials: LoginCredentials): Promise<OAuthResult<User>> => {
        setIsLoggingIn(true);
        try {
            const loginData: LoginData = {
                email: credentials.email,
                password: credentials.password
            };

            const response = await authAPI.login(loginData);

            if (response.success && response.data) {

                if (response.data.user && response.data.tokens) {
                    const userValid = validateUser(response.data.user.profile);

                    if (!userValid) {
                        return {
                            success: false,
                            error: createError('INVALID_USER_DATA', 'Invalid user data received from server'),
                        };
                    }

                    const tokensValid = validateTokens(response.data.tokens);

                    if (!tokensValid) {
                        return {
                            success: false,
                            error: createError('INVALID_TOKEN_DATA', 'Invalid token data received from server'),
                        };
                    }

                    // Generate new session
                    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const newSessionId = generateSessionId();
                    setSessionId(newSessionId);
                    setItem(OAUTH_STORAGE_KEYS.SESSION_ID, newSessionId, {
                        days: credentials.rememberMe ? 30 : 1,
                        secure: !isDev,
                        sameSite: 'lax'
                    });

                    const _user: any = response.data.user.profile;
                    const _accounts: any = response.data.user.accounts;
                    const _tokens: any = response.data.tokens;

                    // Update state
                    setUser(_user);
                    setTokens(_tokens);
                    persistAuthData(_user, _tokens, _accounts);

                    return { success: true, data: response.data };
                }

            }

            return {
                success: false,
                error: createError('LOGIN_FAILED', response.message || 'Login failed'),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            return {
                success: false,
                error: createError('LOGIN_ERROR', errorMessage),
            };
        } finally {
            setIsLoggingIn(false);
        }
    }, [persistAuthData, setItem]);

    // Logout method
    const logout = useCallback(async (): Promise<OAuthResult> => {
        setIsLoading(true);
        try {
            // Clear state
            setUser(null);
            setTokens(null);
            setSessionId(null);

            // Clear persisted data
            persistAuthData(null, null, null);

            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            return {
                success: false,
                error: createError('LOGOUT_ERROR', errorMessage),
            };
        } finally {
            setIsLoading(false);
        }
    }, [persistAuthData]);

    // Refresh token method
    const refreshToken = useCallback(async (): Promise<OAuthResult<Tokens>> => {
        if (!tokens?.refresh?.token) {
            return {
                success: false,
                error: createError('NO_REFRESH_TOKEN', 'No refresh token available'),
            };
        }

        try {
            const response = await authAPI.refreshToken();

            if (response.data.user.profile && response.tokens) {
                if (!validateTokens(response.tokens)) {
                    return {
                        success: false,
                        error: createError('INVALID_TOKEN_DATA', 'Invalid token data received'),
                    };
                }

                setUser(response.data.user.profile);
                setTokens(response.tokens);
                persistAuthData(response.data.user.profile, response.tokens);

                return { success: true, data: response.tokens };
            }

            // Token refresh failed, logout
            await logout();
            return {
                success: false,
                error: createError('TOKEN_REFRESH_FAILED', 'Failed to refresh token'),
            };
        } catch (error) {
            await logout();
            const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
            return {
                success: false,
                error: createError('TOKEN_REFRESH_ERROR', errorMessage),
            };
        }
    }, [tokens, persistAuthData, logout]);

    // Refresh profile method
    const refreshProfile = useCallback(async (): Promise<OAuthResult<User>> => {
        if (!isLoggedIn) {
            return {
                success: false,
                error: createError('NOT_AUTHENTICATED', 'User is not authenticated'),
            };
        }

        try {
            const response = await authAPI.getProfile();

            console.log('PROFILE 1', response)

            if (response.success && response?.user ){

                console.log('PROFILE 2', response?.user )

                if (!validateUser(response?.user )) {
                    return {
                        success: false,
                        error: createError('INVALID_USER_DATA', 'Invalid user data received'),
                    };
                }

                console.log('PROFILE 3', response?.user )

                const _user: any = response?.user ;
                const _accounts: any = response?.user?.accounts;

            console.log('PROFILE', {_user, _accounts})

                // Update state
                setUser(_user);
                if (_accounts) {
                    // Accounts are also large, store in localStorage only
                    setLocalStorageAccountsData(_accounts);
                }
                // Only update user data, keep existing tokens
                persistAuthData(_user, tokens, _accounts);

                return { success: true, data: response?.user };
            }else{
                console.warn('PROFILE', {response})
            }

            return {
                success: false,
                error: createError('PROFILE_FETCH_FAILED', response.error || 'Failed to fetch profile'),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Profile refresh failed';
            return {
                success: false,
                error: createError('PROFILE_REFRESH_ERROR', errorMessage),
            };
        }
    }, [isLoggedIn, tokens, persistAuthData, setLocalStorageAccountsData]);

    // Get user method
    const getUser = useCallback((): User | null => {
        return user;
    }, [user]);

    // Update profile method
    const updateProfile = useCallback(async (data: UpdateProfileData): Promise<OAuthResult<User>> => {
        if (!isLoggedIn) {
            return {
                success: false,
                error: createError('NOT_AUTHENTICATED', 'User is not authenticated'),
            };
        }

        setIsLoading(true);
        try {
            const response = await authAPI.updateUserProfile(data);

            if (response.success && response.data.user.profile) {
                setUser(response.data.user.profile);
                if (tokens) {
                    persistAuthData(response.data.user.profile, tokens, response.data.user.accounts);
                }

                return { success: true, data: response.data.user.profile };
            }

            return {
                success: false,
                error: createError('PROFILE_UPDATE_FAILED', response.error || 'Failed to update profile'),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
            return {
                success: false,
                error: createError('PROFILE_UPDATE_ERROR', errorMessage),
            };
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn, tokens, persistAuthData]);

    // Update password method
    const updatePassword = useCallback(async (data: UpdatePasswordData): Promise<OAuthResult> => {
        if (!isLoggedIn) {
            return {
                success: false,
                error: createError('NOT_AUTHENTICATED', 'User is not authenticated'),
            };
        }

        if (data.newPassword !== data.confirmPassword) {
            return {
                success: false,
                error: createError('PASSWORD_MISMATCH', 'New password and confirmation do not match'),
            };
        }

        if (data.newPassword.length < 8) {
            return {
                success: false,
                error: createError('PASSWORD_TOO_SHORT', 'Password must be at least 8 characters'),
            };
        }

        setIsLoading(true);
        try {
            const response = await authAPI.updateUserProfile({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });

            if (response.success) {
                return { success: true };
            }

            return {
                success: false,
                error: createError('PASSWORD_UPDATE_FAILED', response.error || 'Failed to update password'),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Password update failed';
            return {
                success: false,
                error: createError('PASSWORD_UPDATE_ERROR', errorMessage),
            };
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    // Send reset password link method
    const sendResetPasswordLink = useCallback(async (email: string): Promise<OAuthResult> => {
        if (!email || !email.includes('@')) {
            return {
                success: false,
                error: createError('INVALID_EMAIL', 'Please provide a valid email address'),
            };
        }

        setIsLoading(true);
        try {
            const response = await authAPI.forgotPassword({ email });

            if (response.success) {
                return { success: true };
            }

            return {
                success: false,
                error: createError('RESET_LINK_FAILED', response.message || 'Failed to send reset link'),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send reset link';
            return {
                success: false,
                error: createError('RESET_LINK_ERROR', errorMessage),
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initialize auth state from cookies - runs once on mount
    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);

            try {
                const storedUser = getItem<User>(OAUTH_STORAGE_KEYS.USER_DATA);
                const storedTokens = getItem<Tokens>(OAUTH_STORAGE_KEYS.TOKENS);
                const storedSessionId = getItem<string>(OAUTH_STORAGE_KEYS.SESSION_ID);

                // Try to get full user data from native localStorage
                let fullUser: User | null = null;
                try {
                    const fullUserData = window.localStorage.getItem('koppo_oauth_user_full');
                    if (fullUserData) {
                        fullUser = JSON.parse(fullUserData) as User;
                    }
                } catch {
                    // Failed to parse full user data from localStorage
                }

                // Check for session timeout
                if (checkSessionTimeout()) {
                    persistAuthData(null, null, null);
                    setIsInitialized(true);
                    setIsLoading(false);
                    return;
                }

                if (storedUser && storedTokens && validateUser(storedUser) && validateTokens(storedTokens)) {
                    // Check if access token is still valid
                    if (!isTokenExpired(storedTokens.access?.expiresAt)) {
                        // Use full user data if available, otherwise use minimal user from cookie
                        setUser(fullUser || storedUser);
                        setTokens(storedTokens);
                        setSessionId(storedSessionId);
                        updateActivity();
                    } else if (!isTokenExpired(storedTokens.refresh?.expiresAt)) {
                        // Try to refresh the token
                        setTokens(storedTokens); // Set temporarily for refresh
                        const refreshResult = await refreshToken();
                        if (!refreshResult.success) {
                            persistAuthData(null, null, null);
                        }
                    } else {
                        // Both tokens expired
                        persistAuthData(null, null, null);
                    }
                }
            } catch {
                persistAuthData(null, null, null);
            } finally {
                setIsInitialized(true);
                setIsLoading(false);
            }
        };

        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto token refresh
    useEffect(() => {
        if (!isLoggedIn || !tokens?.access?.expiresAt) return;

        const checkAndRefresh = async () => {
            if (isTokenExpiringSoon(tokens?.access?.expiresAt)) {
                await refreshToken();
            }
        };

        const interval = setInterval(checkAndRefresh, SESSION_CONFIG.TOKEN_REFRESH_INTERVAL);
        checkAndRefresh(); // Check immediately

        return () => clearInterval(interval);
    }, [isLoggedIn, tokens, refreshToken]);

    // Activity tracking
    useEffect(() => {
        if (!isLoggedIn) return;

        const handleActivity = () => updateActivity();

        window.addEventListener('click', handleActivity);
        window.addEventListener('keypress', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keypress', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [isLoggedIn, updateActivity]);

    // Notify auth state changes
    useEffect(() => {
        if (isInitialized && onAuthStateChange) {
            onAuthStateChange(isLoggedIn, user);
        }
    }, [isLoggedIn, user, isInitialized, onAuthStateChange]);

    const contextValue: OAuthContextValue = {
        // User object and derived properties
        user,
        email,
        photoURL,
        displayName,
        firstName,
        lastName,
        phoneNumber,
        isKYCVerified,
        isEmailVerified,
        isAccountActive,

        userDataProfile,
        userDataAccounts,

        // State flags
        isLoggedIn,
        isLoading,
        isInitialized,
        isLoggingIn,

        // Authentication methods
        login,
        logout,
        refreshToken,

        // Profile methods
        refreshProfile,
        getUser,
        updateProfile,
        updatePassword,
        sendResetPasswordLink,
    };

    return (
        <OAuthContext.Provider value={contextValue}>
            {children}
        </OAuthContext.Provider>
    );
}

export function useOAuth(): OAuthContextValue {
    const context = useContext(OAuthContext);
    if (context === undefined) {
        throw new Error('useOAuth must be used within an OAuthProvider');
    }
    return context;
}
