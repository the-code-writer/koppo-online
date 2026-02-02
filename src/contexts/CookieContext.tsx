import { createContext, useContext, useCallback, ReactNode } from "react";
import { useLocalStorageContext } from "../utils/use-local-storage";
import { CookieUtils, CookieObserverOptions, cookieTracker } from "../utils/use-cookies/cookieTracker";

export interface CookieOptions extends Omit<CookieObserverOptions, 'debounce' | 'notifyOnlyOnChange' | 'compare'> {
    /** Cookie expiration in days (default: 7) */
    days?: number;
    /** Cookie path (default: '/') */
    path?: string;
    /** Cookie domain */
    domain?: string;
    /** Secure flag (default: true in production, false in development) */
    secure?: boolean;
    /** SameSite attribute (default: 'lax') */
    sameSite?: 'strict' | 'lax' | 'none';
}

interface CookieContextValue {
    getItem: <T = any>(key: string) => T | null;
    setItem: <T = any>(key: string, value: T, options?: CookieOptions) => void;
    removeItem: (key: string, options?: CookieOptions) => void;
    updateItem: <T = any>(key: string, updater: (prev: T | null) => T, options?: CookieOptions) => void;
    subscribe: (
        key: string,
        listener: (event: unknown) => void,
        options?: CookieObserverOptions
    ) => () => void;
}

const CookieContext = createContext<CookieContextValue | undefined>(undefined);

interface CookieProviderProps {
    children: ReactNode;
    /** Default cookie options applied to all operations unless overridden */
    defaultOptions?: CookieOptions;
}

const isDevelopment = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
    days: 7,
    path: '/',
    secure: !isDevelopment,
    sameSite: 'lax',
};

function serialize(value: any): string {
    try {
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    } catch {
        return String(value);
    }
}

function deserialize<T>(value: string): T {
    try {
        return JSON.parse(value);
    } catch {
        return value as T;
    }
}

function isCookiesEnabled(): boolean {
    try {
        document.cookie = '__cookie_test__=1';
        const result = document.cookie.indexOf('__cookie_test__') !== -1;
        document.cookie = '__cookie_test__=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return result;
    } catch {
        return false;
    }
}

export function CookieProvider({ children, defaultOptions = {} }: CookieProviderProps) {
    const localStorage = useLocalStorageContext();
    const cookiesEnabled = isCookiesEnabled();

    const mergeOptions = useCallback((options?: CookieOptions): CookieOptions => {
        return {
            ...DEFAULT_COOKIE_OPTIONS,
            ...defaultOptions,
            ...options,
        };
    }, [defaultOptions]);

    const getItem = useCallback(<T,>(key: string): T | null => {
        // Try cookies first
        if (cookiesEnabled) {
            try {
                const cookieValue = CookieUtils.getCookie(key);
                if (cookieValue !== null) {
                    return deserialize<T>(cookieValue);
                }
            } catch {
                // Silent fail - will fallback to localStorage
            }
        }

        // Fallback to localStorage
        try {
            return localStorage.getItem<T>(key);
        } catch {
            return null;
        }
    }, [cookiesEnabled, localStorage]);

    const setItem = useCallback(<T,>(key: string, value: T, options?: CookieOptions): void => {
        const mergedOptions = mergeOptions(options);
        const serializedValue = serialize(value);

        // Try to set cookie first
        if (cookiesEnabled) {
            try {
                const expireAfter = mergedOptions.days 
                    ? mergedOptions.days * 24 * 60 * 60 * 1000 
                    : undefined;

                CookieUtils.setCookie(key, serializedValue, {
                    expireAfter,
                    path: mergedOptions.path,
                    domain: mergedOptions.domain,
                    secure: mergedOptions.secure,
                    sameSite: mergedOptions.sameSite,
                });

                // Verify cookie was set
                const verifyValue = CookieUtils.getCookie(key);
                
                if (verifyValue !== null) {
                    cookieTracker.checkForKeyChanges(key);
                    return;
                }
            } catch {
                // Silent fail - will fallback to localStorage
            }
        }

        // Fallback to localStorage
        try {
            localStorage.setItem(key, value);
        } catch {
            // Silent fail
        }
    }, [cookiesEnabled, localStorage, mergeOptions]);

    const removeItem = useCallback((key: string, options?: CookieOptions): void => {
        const mergedOptions = mergeOptions(options);

        // Remove from cookies
        if (cookiesEnabled) {
            try {
                CookieUtils.deleteCookie(key, {
                    path: mergedOptions.path,
                    domain: mergedOptions.domain,
                    secure: mergedOptions.secure,
                    sameSite: mergedOptions.sameSite,
                });
                cookieTracker.checkForKeyChanges(key);
            } catch {
                // Silent fail
            }
        }

        // Also remove from localStorage (in case it was stored there as fallback)
        try {
            localStorage.removeItem(key);
        } catch {
            // Silent fail
        }
    }, [cookiesEnabled, localStorage, mergeOptions]);

    const updateItem = useCallback(<T,>(
        key: string, 
        updater: (prev: T | null) => T, 
        options?: CookieOptions
    ): void => {
        const currentValue = getItem<T>(key);
        const newValue = updater(currentValue);
        setItem(key, newValue, options);
    }, [getItem, setItem]);

    const subscribe = useCallback((
        key: string,
        listener: (event: unknown) => void,
        options?: CookieObserverOptions
    ) => {
        // Subscribe to cookie changes
        const cookieUnsubscribe = cookieTracker.subscribe(key, listener, options);
        
        // Also subscribe to localStorage changes for fallback
        const storageUnsubscribe = localStorage.subscribe(key, listener, options);

        // Return combined unsubscribe function
        return () => {
            cookieUnsubscribe();
            storageUnsubscribe();
        };
    }, [localStorage]);

    const value: CookieContextValue = {
        getItem,
        setItem,
        removeItem,
        updateItem,
        subscribe,
    };

    return (
        <CookieContext.Provider value={value}>
            {children}
        </CookieContext.Provider>
    );
}

export function useBrowserCookie(): CookieContextValue {
    const context = useContext(CookieContext);
    if (!context) {
        throw new Error(
            "useBrowserCookie must be used within CookieProvider"
        );
    }
    return context;
}

