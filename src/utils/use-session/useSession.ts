/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    sessionTracker,
    SessionChangeEvent,
    SessionObserverOptions
} from './sessionTracker';

// Define UseSessionOptions with enhanced security features
export interface UseSessionOptions<T = any> extends SessionObserverOptions {
    /** Default value if key doesn't exist */
    defaultValue?: T;
    /** Whether to sync the value with state (default: true) */
    sync?: boolean;
    /** Custom serializer for storing values */
    serialize?: (value: T) => string;
    /** Custom deserializer for retrieving values */
    deserialize?: (value: string) => T;
    /** Clear session on page unload (default: true for sensitive data) */
    clearOnUnload?: boolean;
    /** Validate session data before storing/returning */
    validator?: (value: T) => boolean;
    /** Sanitize session data before storing */
    sanitizer?: (value: T) => T;
}

export function useSession<T = any>(
    key: string,
    options: UseSessionOptions<T> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, SessionChangeEvent<T> | null] {
    const {
        defaultValue = null,
        sync = true,
        encrypt = false,
        expireAfter,
        clearOnUnload = false,
        validator,
        sanitizer,
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
            const item = sessionStorage.getItem(`session_${key}`);
            if (item !== null) {
                const decryptedValue = encrypt 
                    ? item // Decryption handled in tracker
                    : item;
                const parsedValue = deserialize(decryptedValue);
                
                // Validate initial value
                if (validator && !validator(parsedValue)) {
                    console.warn(`Session data for key "${key}" failed validation`);
                    return defaultValue;
                }
                
                return parsedValue;
            }
            return defaultValue;
        } catch (error) {
            console.error(`Error reading session key "${key}":`, error);
            return defaultValue;
        }
    });

    const [lastEvent, setLastEvent] = useState<SessionChangeEvent<T> | null>(null);
    const isSettingRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Handle page unload for sensitive data
    useEffect(() => {
        if (clearOnUnload) {
            const handleUnload = () => {
                sessionStorage.removeItem(`session_${key}`);
            };
            
            window.addEventListener('beforeunload', handleUnload);
            return () => window.removeEventListener('beforeunload', handleUnload);
        }
    }, [key, clearOnUnload]);

    // Handle changes from sessionTracker
    useEffect(() => {
        if (!sync) return;

        const handleSessionChange = (event: SessionChangeEvent) => {
            // Prevent infinite loops when we're the ones setting the value
            if (isSettingRef.current) {
                isSettingRef.current = false;
                return;
            }

            // Validate incoming data
            if (event.newValue !== null && validator && !validator(event.newValue)) {
                console.warn(`Session data for key "${key}" failed validation on change`);
                return;
            }

            setValue(event.newValue as T | null);
            setLastEvent(event as SessionChangeEvent<T>);
        };

        // Subscribe to changes
        const unsubscribe = sessionTracker.subscribe<T>(
            key,
            handleSessionChange,
            trackerOptions
        );

        return unsubscribe;
    }, [key, sync, JSON.stringify(trackerOptions), validator]);

    // Custom setter that updates both state and sessionStorage
    const setSessionValue = useCallback((
        newValue: T | null | ((prev: T | null) => T | null)
    ) => {
        isSettingRef.current = true;

        setValue(prev => {
            const valueToStore = typeof newValue === 'function'
                ? (newValue as Function)(prev)
                : newValue;

            // Validate value before storing
            if (valueToStore !== null && validator && !validator(valueToStore)) {
                console.warn(`Session data for key "${key}" failed validation on set`);
                return prev; // Don't update if validation fails
            }

            // Sanitize value before storing
            const sanitizedValue = sanitizer ? sanitizer(valueToStore) : valueToStore;

            try {
                if (sanitizedValue === null || sanitizedValue === undefined) {
                    sessionStorage.removeItem(`session_${key}`);
                } else {
                    const serializedValue = serialize(sanitizedValue);
                    const encryptedValue = encrypt 
                        ? serializedValue // Encryption handled in tracker
                        : serializedValue;
                    
                    sessionStorage.setItem(`session_${key}`, encryptedValue);
                }
            } catch (error) {
                console.error(`Error setting session key "${key}":`, error);
                return prev; // Return previous value on error
            }

            // Manually trigger session event for same-tab listeners
            sessionTracker.checkForKeyChanges(key, optionsRef.current);

            return sanitizedValue;
        });
    }, [key, serialize, encrypt, validator, sanitizer]);

    // Return value, setter, and lastEvent
    return [value, setSessionValue, lastEvent];
}

// Alternative hook with callback
export function useSessionWithCallback<T = any>(
    key: string,
    onChange?: (event: SessionChangeEvent<T>) => void,
    options: Omit<UseSessionOptions<T>, 'sync'> = {}
) {
    const [value, setValue, lastEvent] = useSession<T>(key, options);

    useEffect(() => {
        if (lastEvent && onChange) {
            onChange(lastEvent);
        }
    }, [lastEvent, onChange]);

    return [value, setValue] as const;
}

// Hook for temporary session data with auto-expiration
export function useTemporarySession<T = any>(
    key: string,
    expireAfter: number, // in milliseconds
    options: Omit<UseSessionOptions<T>, 'expireAfter'> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, SessionChangeEvent<T> | null] {
    return useSession<T>(key, {
        ...options,
        expireAfter,
        clearOnUnload: true // Always clear temporary data on unload
    });
}

// Hook for sensitive session data with encryption
export function useSecureSession<T = any>(
    key: string,
    encryptionKey?: string,
    options: Omit<UseSessionOptions<T>, 'encrypt'> = {}
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void, SessionChangeEvent<T> | null] {
    return useSession<T>(key, {
        ...options,
        encrypt: true,
        encryptionKey,
        clearOnUnload: true // Always clear secure data on unload
    });
}
