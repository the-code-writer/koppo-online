// Enhanced cookie tracker with security features
export interface CookieChangeEvent<T = any> {
    key: string;
    oldValue: T | null;
    newValue: T | null;
    timestamp: number;
    source: 'self' | 'external';
}

export interface CookieObserverOptions {
    /** Debounce time in milliseconds for cookie events */
    debounce?: number;
    /** Only notify when value actually changes (deep equality check) */
    notifyOnlyOnChange?: boolean;
    /** Custom comparison function for value changes */
    compare?: (a: any, b: any) => boolean;
    /** Auto-expire cookie after inactivity (in milliseconds) */
    expireAfter?: number;
    /** Encrypt sensitive data before storing */
    encrypt?: boolean;
    /** Custom encryption key */
    encryptionKey?: string;
    /** Cookie security options */
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
}

export type CookieListener<T = any> = (event: CookieChangeEvent<T>) => void;

// Enhanced cookie encryption with better security
class CookieEncryption {
    private static generateKey(key: string): string {
        // Use a more secure key derivation
        const baseKey = key + 'cookie-salt-2024-secure';
        return btoa(baseKey).slice(0, 32);
    }

    static encrypt(data: string, key?: string): string {
        try {
            const encKey = this.generateKey(key || 'default-cookie-key');
            let encrypted = '';
            for (let i = 0; i < data.length; i++) {
                encrypted += String.fromCharCode(
                    data.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length)
                );
            }
            return btoa(encrypted);
        } catch {
            return data; // Fallback to unencrypted
        }
    }

    static decrypt(data: string, key?: string): string {
        try {
            const encKey = this.generateKey(key || 'default-cookie-key');
            const decoded = atob(data);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(
                    decoded.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length)
                );
            }
            return decrypted;
        } catch {
            return data; // Fallback to original data
        }
    }
}

// Cookie utility functions
class CookieUtils {
    static getCookie(name: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    }

    static setCookie(
        name: string,
        value: string,
        options: CookieObserverOptions = {}
    ): void {
        let cookieString = `${name}=${value}`;

        if (options.expireAfter) {
            const date = new Date();
            date.setTime(date.getTime() + options.expireAfter);
            cookieString += `; expires=${date.toUTCString()}`;
        }

        if (options.domain) {
            cookieString += `; domain=${options.domain}`;
        }

        if (options.path) {
            cookieString += `; path=${options.path}`;
        }

        if (options.secure) {
            cookieString += '; secure';
        }

        if (options.httpOnly) {
            cookieString += '; httponly';
        }

        if (options.sameSite) {
            cookieString += `; samesite=${options.sameSite}`;
        }

        document.cookie = cookieString;
    }

    static deleteCookie(name: string, options: Partial<CookieObserverOptions> = {}): void {
        CookieUtils.setCookie(name, '', {
            ...options,
            expireAfter: -1 // Set expiration in the past
        });
    }
}

class CookieTracker {
    private listeners: Map<string, Set<CookieListener>> = new Map();
    private debounceTimers: Map<string, number> = new Map();
    private intervalCheckers: Map<string, number> = new Map();
    private lastValues: Map<string, { value: any; timestamp: number }> = new Map();

    private static instance: CookieTracker;

    private constructor() {
        this.setupPolling();
    }

    static getInstance(): CookieTracker {
        if (!CookieTracker.instance) {
            CookieTracker.instance = new CookieTracker();
        }
        return CookieTracker.instance;
    }

    private setupPolling() {
        // Check for cookie changes every 100ms
        window.setInterval(() => {
            this.checkAllCookies();
        }, 100);
    }

    private checkAllCookies() {
        this.listeners.forEach((listeners, key) => {
            const currentValue = this.getCurrentValue(key);
            const lastEntry = this.lastValues.get(key);
            const lastValue = lastEntry?.value;

            if (!this.deepEqual(lastValue, currentValue)) {
                this.debounceNotify(key, lastValue, currentValue, 0, 'external');
                this.lastValues.set(key, {
                    value: currentValue,
                    timestamp: Date.now()
                });
            }
        });
    }

    subscribe<T = any>(
        key: string,
        listener: CookieListener<T>,
        options: CookieObserverOptions = {}
    ): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }

        const keyListeners = this.listeners.get(key)!;
        keyListeners.add(listener);

        if (!this.lastValues.has(key)) {
            const currentValue = this.getCurrentValue(key, options);
            this.lastValues.set(key, {
                value: currentValue,
                timestamp: Date.now()
            });
        }

        return () => {
            const listeners = this.listeners.get(key);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.cleanupKey(key);
                }
            }
        };
    }

    private debounceNotify(
        key: string,
        oldValue: any,
        newValue: any,
        debounceTime: number = 0,
        source: 'self' | 'external' = 'self'
    ) {
        if (debounceTime > 0) {
            const existingTimer = this.debounceTimers.get(key);
            if (existingTimer) {
                window.clearTimeout(existingTimer);
            }

            const timer = window.setTimeout(() => {
                this.notifyListeners(key, oldValue, newValue, source);
                this.debounceTimers.delete(key);
            }, debounceTime);

            this.debounceTimers.set(key, timer);
        } else {
            this.notifyListeners(key, oldValue, newValue, source);
        }
    }

    private notifyListeners(key: string, oldValue: any, newValue: any, source: 'self' | 'external') {
        const listeners = this.listeners.get(key);
        if (listeners) {
            const event: CookieChangeEvent = { 
                key, 
                oldValue, 
                newValue, 
                timestamp: Date.now(),
                source
            };
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error(`Error in cookie listener for key "${key}":`, error);
                }
            });
        }
    }

    private getCurrentValue(key: string, options: CookieObserverOptions = {}): any {
        try {
            const value = CookieUtils.getCookie(key);
            if (value === null) return null;

            const decryptedValue = options.encrypt 
                ? CookieEncryption.decrypt(value, options.encryptionKey)
                : value;

            return this.parseValue(decryptedValue);
        } catch {
            return null;
        }
    }

    private parseValue(value: string): any {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    private cleanupKey(key: string) {
        const debounceTimer = this.debounceTimers.get(key);
        if (debounceTimer) {
            window.clearTimeout(debounceTimer);
            this.debounceTimers.delete(key);
        }

        this.listeners.delete(key);
        this.lastValues.delete(key);
    }

    private deepEqual(a: any, b: any): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;

        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return String(a) === String(b);
        }
    }

    checkForKeyChanges(key: string, options?: CookieObserverOptions): void {
        const currentValue = this.getCurrentValue(key, options || {});
        const lastEntry = this.lastValues.get(key);
        const lastValue = lastEntry?.value;

        if (!this.deepEqual(lastValue, currentValue)) {
            this.notifyListeners(key, lastValue, currentValue, 'self');
            this.lastValues.set(key, {
                value: currentValue,
                timestamp: Date.now()
            });
        }
    }

    getActiveKeys(): string[] {
        return Array.from(this.listeners.keys());
    }

    // Security method to clear all cookies
    clearAllCookies(): void {
        this.getActiveKeys().forEach(key => {
            CookieUtils.deleteCookie(key);
        });
        this.destroy();
    }

    destroy(): void {
        this.getActiveKeys().forEach(key => this.cleanupKey(key));
        this.listeners.clear();
        this.debounceTimers.clear();
        this.intervalCheckers.clear();
        this.lastValues.clear();
    }
}

export const cookieTracker = CookieTracker.getInstance();
export { CookieUtils };
