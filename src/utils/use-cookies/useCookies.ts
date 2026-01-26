/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { envConfig } from "../../config/env.config";
import {
    cookieTracker,
    CookieChangeEvent,
    CookieObserverOptions,
    CookieUtils,
} from "./cookieTracker";
import { useLocalStorage } from "../use-local-storage";
import { User, Tokens } from '../../services/api';
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

export const serializeX = (value: any): string => {
    let serialized: any = value;
    try {
        if (typeof value === "object") {
            serialized = JSON.stringify(value);
        } else {
            serialized = String(value);
        }
    } catch {
        serialized = String(value);
    }
    console.warn("SERIALIZE", { value, serialized });
    return serialized;
};

export const deserialize = (value: string): any => {
    let deserialized: any = value;
    try {
        deserialized = JSON.parse(value);
        try {
            deserialized = JSON.parse(deserialized);
        } catch {
            deserialized = JSON.parse(value);
        }
    } catch {
        deserialized = value as any;
    }

    return deserialized;
};

export function useCookies<T = any>(
    key: string,
    options: UseCookiesOptions<T> = {},
): [
        T | null,
        (value: T | null | ((prev: T | null) => T | null)) => void,
        CookieChangeEvent<T> | null,
    ] {
    const {
        defaultValue = null,
        sync = true,
        encrypt = false,
        expireAfter,
        secure = true, // Default to secure for cookies
        httpOnly = false, // Can't be true for client-side access
        sameSite = "strict", // Default to strict security
        validator,
        sanitizer,
        refreshBefore,
        ...trackerOptions
    } = options;

    const STORAGE_KEYS = {
        USER_DATA: 'user_data',
        TOKENS: 'tokens',
        REMEMBERED_CREDENTIALS: 'rememberedCredentials'
    };

    const [userCookie, setUserCookie] = useLocalStorage<User | null>(STORAGE_KEYS.USER_DATA, {
        defaultValue: null,
    });

    // Use secure cookies for tokens
    const [tokensCookie, setTokensCookie] = useLocalStorage<Tokens | null>(STORAGE_KEYS.TOKENS, {
        defaultValue: null,
    });


    // Get initial value
    const [value, setValue] = useState<T | null>(() => {
        try {
            const item = CookieUtils.getCookie(key);
            console.log(`🍪 Reading cookie "${key}" on init:`, {
                found: item !== null,
                rawValue: item
                    ? item.substring(0, 100) + (item.length > 100 ? "..." : "")
                    : "null",
                key,
                encrypt,
            });

            if (item !== null) {
                const decryptedValue = encrypt
                    ? item // Decryption handled in tracker
                    : item;
                const parsedValue = deserialize(decryptedValue);

                console.warn(`🍪 Parsed cookie "${key}":`, {
                    parsedValue: parsedValue,
                    parsedKeys: parsedValue ? Object.keys(parsedValue) : "null",
                    willValidate: !!validator,
                });

                // Validate initial value
                if (validator && !validator(parsedValue)) {
                    console.warn(
                        `❌ Cookie data for key "${key}" failed validation on read`,
                    );
                    console.log("Validation details:", {
                        parsedValue,
                        validator: validator.toString(),
                    });
                    return defaultValue;
                }

                console.log(`✅ Successfully parsed and validated cookie "${key}"`);
                return parsedValue;
            }else{
                if(key===STORAGE_KEYS.TOKENS){
                    const _value = deserialize(tokensCookie);
                    console.log(`✅ [FALLBACK] Successfully parsed and validated cookie "${key}"`, {_value, tokensCookie});
                    return _value;
                }
                else if(key===STORAGE_KEYS.USER_DATA){
                    const _value = deserialize(userCookie);
                    console.log(`✅ [FALLBACK] Successfully parsed and validated cookie "${key}"`, {_value, userCookie});
                    return _value;
                }
            }
            console.log(`🍪 Cookie "${key}" not found, using default`);
            return defaultValue;
        } catch (error) {
            console.error(`❌ Error reading cookie key "${key}":`, error);
            return defaultValue;
        }
    });

    const [lastEvent, setLastEvent] = useState<CookieChangeEvent<T> | null>(null);
    const isSettingRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Custom setter that updates both state and cookie
    const setCookieValue = useCallback(
        (newValue: T | null | ((prev: T | null) => T | null)) => {
            console.log(`🍪 setCookieValue called for "${key}":`, {
                newValue: !!newValue,
                key,
                encrypt,
                secure,
                sameSite,
            });

            isSettingRef.current = true;

            setValue((prev) => {
                const valueToStore =
                    typeof newValue === "function"
                        ? (newValue as (prev: T | null) => T | null)(prev)
                        : newValue;

                console.log(`🍪 Processed value for "${key}":`, {
                    valueToStore: !!valueToStore,
                    willValidate: !!validator,
                    willSanitize: !!sanitizer,
                });

                // Validate value before storing
                if (valueToStore !== null && validator && !validator(valueToStore)) {
                    console.warn(
                        `❌ Cookie data for key "${key}" failed validation on set`,
                    );
                    return prev; // Don't update if validation fails
                }

                // Sanitize value before storing
                const sanitizedValue =
                    sanitizer && valueToStore !== null
                        ? sanitizer(valueToStore)
                        : valueToStore;

                try {
                    if (sanitizedValue === null || sanitizedValue === undefined) {
                        console.log(`🍪 Deleting cookie "${key}"`);
                        CookieUtils.deleteCookie(key, {
                            secure,
                            domain: optionsRef.current.domain,
                            path: optionsRef.current.path,
                            sameSite,
                        });
                    } else {
                        const serializedValue = serializeX(sanitizedValue);
                        const encryptedValue = encrypt
                            ? serializedValue // Encryption handled in tracker
                            : serializedValue;

                        console.warn(`🍪 Setting cookie "${key}":`, {
                            hasValue: !!sanitizedValue,
                            sanitizedValue,
                            serializedValue,
                            encryptedValue,
                            encrypt,
                            secure,
                            sameSite,
                            valueLength: encryptedValue.length,
                            serializedLength: serializedValue.length,
                        });

                        CookieUtils.setCookie(key, encryptedValue, {
                            ...optionsRef.current,
                            secure,
                            httpOnly,
                            sameSite,
                        });

                        console.log(`🍪 Cookie "${key}" set successfully, checking...`);

                        // Verify the cookie was set
                        setTimeout(() => {
                            const checkValue = CookieUtils.getCookie(key);
                            console.log(`🍪 Verification for "${key}":`, {
                                exists: !!checkValue,
                                length: checkValue?.length,
                                matches: checkValue === encryptedValue,
                            });
                            if (!checkValue) {
                                if (key === STORAGE_KEYS.TOKENS) {
                                    setTokensCookie(encryptedValue as any);
                                }
                                else if (key === STORAGE_KEYS.USER_DATA) {
                                    setUserCookie(encryptedValue as any);
                                }
                            }
                        }, 50);
                    }
                } catch (error) {
                    console.error(`❌ Error setting cookie key "${key}":`, error);
                    return prev; // Return previous value on error
                }

                // Manually trigger cookie event for same-tab listeners
                cookieTracker.checkForKeyChanges(key, optionsRef.current);

                return sanitizedValue;
            });
        },
        [key, encrypt, secure, httpOnly, sameSite, validator, sanitizer],
    );

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
                console.warn(
                    `Cookie data for key "${key}" failed validation on change`,
                );
                return;
            }

            setValue(event.newValue as T | null);
            setLastEvent(event as CookieChangeEvent<T>);
        };

        // Subscribe to changes
        const unsubscribe = cookieTracker.subscribe<T>(
            key,
            handleCookieChange,
            trackerOptions,
        );

        return unsubscribe;
    }, [key, sync, validator]);

    // Return value, setter, and lastEvent
    return [value, setCookieValue, lastEvent];
}

// Alternative hook with callback
export function useCookiesWithCallback<T = any>(
    key: string,
    onChange?: (event: CookieChangeEvent<T>) => void,
    options: Omit<UseCookiesOptions<T>, "sync"> = {},
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
    options: Omit<UseCookiesOptions<T>, "expireAfter"> = {},
): [
        T | null,
        (value: T | null | ((prev: T | null) => T | null)) => void,
        CookieChangeEvent<T> | null,
    ] {
    return useCookies<T>(key, {
        ...options,
        expireAfter: days * 24 * 60 * 60 * 1000, // Convert days to milliseconds
        refreshBefore: 60 * 60 * 1000, // Refresh 1 hour before expiration
    });
}

// Hook for secure cookies with encryption
export function useSecureCookies<T = any>(
    key: string,
    encryptionKey?: string,
    options: Omit<UseCookiesOptions<T>, "encrypt" | "secure"> = {},
): [
        T | null,
        (value: T | null | ((prev: T | null) => T | null)) => void,
        CookieChangeEvent<T> | null,
    ] {
    return useCookies<T>(key, {
        ...options,
        encrypt: true,
        encryptionKey,
        secure: true,
        sameSite: "strict",
    });
}

// Hook for session cookies (expire when browser closes)
export function useSessionCookies<T = any>(
    key: string,
    options: Omit<UseCookiesOptions<T>, "expireAfter"> = {},
): [
        T | null,
        (value: T | null | ((prev: T | null) => T | null)) => void,
        CookieChangeEvent<T> | null,
    ] {
    return useCookies<T>(key, {
        ...options,
        expireAfter: undefined, // No expiration means session cookie
        secure: true,
        sameSite: "strict",
    });
}

// Hook for authentication cookies with enhanced security
export function useAuthCookies<T = any>(
    key: string,
    options: Omit<UseCookiesOptions<T>, "secure" | "httpOnly" | "sameSite"> = {},
): [
        T | null,
        (value: T | null | ((prev: T | null) => T | null)) => void,
        CookieChangeEvent<T> | null,
    ] {
    // Allow non-secure cookies in development
    const isDevelopment =
        envConfig.VITE_NODE_ENV === "development" ||
        window.location.hostname === "localhost";

    return useCookies<T>(key, {
        ...options,
        encrypt: true,
        secure: !isDevelopment, // Only require secure in production
        httpOnly: false, // Must be false for client-side access
        sameSite: isDevelopment ? "lax" : "strict", // Use lax in development for localhost
        expireAfter: 24 * 60 * 60 * 1000, // 24 hours
        refreshBefore: 5 * 60 * 1000, // Refresh 5 minutes before expiration
    });
}
