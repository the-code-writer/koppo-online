/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    cookieTracker,
    CookieChangeEvent,
    CookieObserverOptions,
    CookieUtils
} from './cookieTracker';

// Define UseCookiesOptions with enhanced security features
export interface UseCookiesOptions<T = any> extends CookieObserverOptions {
    /** Default value if key doesn't exist */
    defaultValue?: T;
    /** Whether to sync the value with state (default: true) */
    sync?: boolean;
    /** Custom serializer for storing values */
    serialize?: (value: T) => string;
    /** Custom deserializer for retrieving values */
    deserialize?: (value: string) => T;
    /** Validate cookie data before storing/returning */
    validator?: (value: T) => boolean;
    /** Sanitize cookie data before storing */
    sanitizer?: (value: T) => T;
    /** Auto-refresh cookie before expiration (in milliseconds) */
    refreshBefore?: number;
}

export function useCookies<T = any>(
    key: string,
    options: UseCookiesOptions<T> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, CookieChangeEvent<T> | null] {
    const {
        defaultValue = null,
        sync = true,
        encrypt = false,
        expireAfter,
        secure = true, // Default to secure for cookies
        httpOnly = false, // Can't be true for client-side access
        sameSite = 'strict', // Default to strict security
        validator,
        sanitizer,
        refreshBefore,
        serialize = (value: T): string => {
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        },
        deserialize = (value: string): T => {
            try {
                return JSON.parse(value);
            } catch {
                return value as T;
            }
        },
        ...trackerOptions
    } = options;

    // Get initial value
    const [value, setValue] = useState<T | null>(() => {
        try {
            const item = CookieUtils.getCookie(key);
            if (item !== null) {
                const decryptedValue = encrypt 
                    ? item // Decryption handled in tracker
                    : item;
                const parsedValue = deserialize(decryptedValue);
                
                // Validate initial value
                if (validator && !validator(parsedValue)) {
                    console.warn(`Cookie data for key "${key}" failed validation`);
                    return defaultValue;
                }
                
                return parsedValue;
            }
            return defaultValue;
        } catch (error) {
            console.error(`Error reading cookie key "${key}":`, error);
            return defaultValue;
        }
    });

    const [lastEvent, setLastEvent] = useState<CookieChangeEvent<T> | null>(null);
    const isSettingRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Handle cookie refresh before expiration
    useEffect(() => {
        if (expireAfter && refreshBefore && value !== null) {
            const refreshInterval = expireAfter - refreshBefore;
            if (refreshInterval > 0) {
                const timer = window.setInterval(() => {
                    // Refresh the cookie by setting it again with the same value
                    setCookieValue(value);
                }, refreshInterval);

                return () => window.clearInterval(timer);
            }
        }
    }, [expireAfter, refreshBefore, value]);

    // Handle changes from cookieTracker
    useEffect(() => {
        if (!sync) return;

        const handleCookieChange = (event: CookieChangeEvent) => {
            // Prevent infinite loops when we're the ones setting the value
            if (isSettingRef.current) {
                isSettingRef.current = false;
                return;
            }

            // Validate incoming data
            if (event.newValue !== null && validator && !validator(event.newValue)) {
                console.warn(`Cookie data for key "${key}" failed validation on change`);
                return;
            }

            setValue(event.newValue as T | null);
            setLastEvent(event as CookieChangeEvent<T>);
        };

        // Subscribe to changes
        const unsubscribe = cookieTracker.subscribe<T>(
            key,
            handleCookieChange,
            trackerOptions
        );

        return unsubscribe;
    }, [key, sync, validator]);

    // Custom setter that updates both state and cookie
    const setCookieValue = useCallback((
        newValue: T | null | ((prev: T | null) => T | null)
    ) => {
        isSettingRef.current = true;

        setValue(prev => {
            const valueToStore = typeof newValue === 'function'
                ? (newValue as (prev: T | null) => T | null)(prev)
                : newValue;

            // Validate value before storing
            if (valueToStore !== null && validator && !validator(valueToStore)) {
                console.warn(`Cookie data for key "${key}" failed validation on set`);
                return prev; // Don't update if validation fails
            }

            // Sanitize value before storing
            const sanitizedValue = sanitizer ? sanitizer(valueToStore) : valueToStore;

            try {
                if (sanitizedValue === null || sanitizedValue === undefined) {
                    CookieUtils.deleteCookie(key, {
                        secure,
                        domain: optionsRef.current.domain,
                        path: optionsRef.current.path,
                        sameSite
                    });
                } else {
                    const serializedValue = serialize(sanitizedValue);
                    const encryptedValue = encrypt 
                        ? serializedValue // Encryption handled in tracker
                        : serializedValue;
                    
                    CookieUtils.setCookie(key, encryptedValue, {
                        ...optionsRef.current,
                        secure,
                        httpOnly,
                        sameSite
                    });
                }
            } catch (error) {
                console.error(`Error setting cookie key "${key}":`, error);
                return prev; // Return previous value on error
            }

            // Manually trigger cookie event for same-tab listeners
            cookieTracker.checkForKeyChanges(key, optionsRef.current);

            return sanitizedValue;
        });
    }, [key, serialize, encrypt, secure, httpOnly, sameSite, validator, sanitizer]);

    // Return value, setter, and lastEvent
    return [value, setCookieValue, lastEvent];
}

// Alternative hook with callback
export function useCookiesWithCallback<T = any>(
    key: string,
    onChange?: (event: CookieChangeEvent<T>) => void,
    options: Omit<UseCookiesOptions<T>, 'sync'> = {}
) {
    const [value, setValue, lastEvent] = useCookies<T>(key, options);

    useEffect(() => {
        if (lastEvent && onChange) {
            onChange(lastEvent);
        }
    }, [lastEvent, onChange]);

    return [value, setValue] as const;
}

// Hook for persistent cookies with long expiration
export function usePersistentCookies<T = any>(
    key: string,
    days: number = 30,
    options: Omit<UseCookiesOptions<T>, 'expireAfter'> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, CookieChangeEvent<T> | null] {
    return useCookies<T>(key, {
        ...options,
        expireAfter: days * 24 * 60 * 60 * 1000, // Convert days to milliseconds
        refreshBefore: 60 * 60 * 1000 // Refresh 1 hour before expiration
    });
}

// Hook for secure cookies with encryption
export function useSecureCookies<T = any>(
    key: string,
    encryptionKey?: string,
    options: Omit<UseCookiesOptions<T>, 'encrypt' | 'secure'> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, CookieChangeEvent<T> | null] {
    return useCookies<T>(key, {
        ...options,
        encrypt: true,
        encryptionKey,
        secure: true,
        sameSite: 'strict'
    });
}

// Hook for session cookies (expire when browser closes)
export function useSessionCookies<T = any>(
    key: string,
    options: Omit<UseCookiesOptions<T>, 'expireAfter'> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, CookieChangeEvent<T> | null] {
    return useCookies<T>(key, {
        ...options,
        expireAfter: undefined, // No expiration means session cookie
        secure: true,
        sameSite: 'strict'
    });
}

// Hook for authentication cookies with enhanced security
export function useAuthCookies<T = any>(
    key: string,
    options: Omit<UseCookiesOptions<T>, 'secure' | 'httpOnly' | 'sameSite'> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, CookieChangeEvent<T> | null] {
    return useCookies<T>(key, {
        ...options,
        encrypt: true,
        secure: true,
        httpOnly: false, // Must be false for client-side access
        sameSite: 'strict',
        expireAfter: 24 * 60 * 60 * 1000, // 24 hours
        refreshBefore: 5 * 60 * 1000 // Refresh 5 minutes before expiration
    });
}
