// Enhanced session tracker with security features
export interface SessionChangeEvent<T = any> {
    key: string;
    oldValue: T | null;
    newValue: T | null;
    timestamp: number;
    source: 'self' | 'external' | 'expired';
}

export interface SessionObserverOptions {
    /** Debounce time in milliseconds for session events */
    debounce?: number;
    /** Only notify when value actually changes (deep equality check) */
    notifyOnlyOnChange?: boolean;
    /** Custom comparison function for value changes */
    compare?: (a: any, b: any) => boolean;
    /** Auto-expire session after inactivity (in milliseconds) */
    expireAfter?: number;
    /** Encrypt sensitive data before storing */
    encrypt?: boolean;
    /** Custom encryption key */
    encryptionKey?: string;
}

export type SessionListener<T = any> = (event: SessionChangeEvent<T>) => void;

// Simple encryption for sensitive session data
class SessionEncryption {
    private static generateKey(key: string): string {
        return btoa(key + 'session-salt-2024').slice(0, 32);
    }

    static encrypt(data: string, key?: string): string {
        try {
            const encKey = this.generateKey(key || 'default-session-key');
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
            const encKey = this.generateKey(key || 'default-session-key');
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

class SessionTracker {
    private listeners: Map<string, Set<SessionListener>> = new Map();
    private debounceTimers: Map<string, number> = new Map();
    private intervalCheckers: Map<string, number> = new Map();
    private lastValues: Map<string, { value: any; timestamp: number }> = new Map();
    private expireTimers: Map<string, number> = new Map();

    private static instance: SessionTracker;

    private constructor() {
        this.setupStorageEvent();
        this.setupCleanupInterval();
    }

    static getInstance(): SessionTracker {
        if (!SessionTracker.instance) {
            SessionTracker.instance = new SessionTracker();
        }
        return SessionTracker.instance;
    }

    private setupStorageEvent() {
        window.addEventListener('storage', (event: StorageEvent) => {
            if (event.key && event.key.startsWith('session_')) {
                const key = event.key.replace('session_', '');
                this.notifyListeners(
                    key,
                    event.oldValue ? this.parseValue(event.oldValue) : null,
                    event.newValue ? this.parseValue(event.newValue) : null,
                    'external'
                );
            }
        });
    }

    private setupCleanupInterval() {
        // Check for expired sessions every 30 seconds
        window.setInterval(() => {
            this.checkExpiredSessions();
        }, 30000);
    }

    private parseValue(value: string): any {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    subscribe<T = any>(
        key: string,
        listener: SessionListener<T>,
        options: SessionObserverOptions = {}
    ): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
            this.setupPolling(key, options);
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

        // Set up expiration timer if specified
        if (options.expireAfter) {
            this.setupExpiration(key, options.expireAfter);
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

    private setupPolling(key: string, options: SessionObserverOptions) {
        const checkInterval = options.debounce ? Math.min(options.debounce, 100) : 100;

        const intervalId = window.setInterval(() => {
            const currentValue = this.getCurrentValue(key, options);
            const lastEntry = this.lastValues.get(key);
            const lastValue = lastEntry?.value;

            const hasChanged = options.compare
                ? !options.compare(lastValue, currentValue)
                : !this.deepEqual(lastValue, currentValue);

            if (options.notifyOnlyOnChange && !hasChanged) {
                return;
            }

            if (hasChanged) {
                this.debounceNotify(key, lastValue, currentValue, options.debounce, 'self');
                this.lastValues.set(key, {
                    value: currentValue,
                    timestamp: Date.now()
                });
            }
        }, checkInterval);

        this.intervalCheckers.set(key, intervalId);
    }

    private setupExpiration(key: string, expireAfter: number) {
        const existingTimer = this.expireTimers.get(key);
        if (existingTimer) {
            window.clearTimeout(existingTimer);
        }

        const timer = window.setTimeout(() => {
            this.expireSession(key);
        }, expireAfter);

        this.expireTimers.set(key, timer);
    }

    private expireSession(key: string) {
        const lastEntry = this.lastValues.get(key);
        if (lastEntry) {
            this.notifyListeners(key, lastEntry.value, null, 'expired');
            this.lastValues.delete(key);
        }
        
        // Remove from sessionStorage
        sessionStorage.removeItem(`session_${key}`);
        this.cleanupKey(key);
    }

    private checkExpiredSessions() {
        const now = Date.now();
        this.lastValues.forEach((entry, key) => {
            // Check if session is older than 24 hours
            if (now - entry.timestamp > 24 * 60 * 60 * 1000) {
                this.expireSession(key);
            }
        });
    }

    private debounceNotify(
        key: string,
        oldValue: any,
        newValue: any,
        debounceTime: number = 0,
        source: 'self' | 'external' | 'expired' = 'self'
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

    private notifyListeners(key: string, oldValue: any, newValue: any, source: 'self' | 'external' | 'expired') {
        const listeners = this.listeners.get(key);
        if (listeners) {
            const event: SessionChangeEvent = { 
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
                    console.error(`Error in session listener for key "${key}":`, error);
                }
            });
        }
    }

    private getCurrentValue(key: string, options: SessionObserverOptions): any {
        try {
            const value = sessionStorage.getItem(`session_${key}`);
            if (value === null) return null;

            const decryptedValue = options.encrypt 
                ? SessionEncryption.decrypt(value, options.encryptionKey)
                : value;

            return this.parseValue(decryptedValue);
        } catch {
            return null;
        }
    }

    private cleanupKey(key: string) {
        const intervalId = this.intervalCheckers.get(key);
        if (intervalId) {
            window.clearInterval(intervalId);
            this.intervalCheckers.delete(key);
        }

        const debounceTimer = this.debounceTimers.get(key);
        if (debounceTimer) {
            window.clearTimeout(debounceTimer);
            this.debounceTimers.delete(key);
        }

        const expireTimer = this.expireTimers.get(key);
        if (expireTimer) {
            window.clearTimeout(expireTimer);
            this.expireTimers.delete(key);
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

    checkForKeyChanges(key: string, options?: SessionObserverOptions): void {
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

    // Security method to clear all session data
    clearAllSessions(): void {
        this.getActiveKeys().forEach(key => {
            sessionStorage.removeItem(`session_${key}`);
        });
        this.destroy();
    }

    destroy(): void {
        this.getActiveKeys().forEach(key => this.cleanupKey(key));
        this.listeners.clear();
        this.debounceTimers.clear();
        this.intervalCheckers.clear();
        this.lastValues.clear();
        this.expireTimers.clear();
    }
}

export const sessionTracker = SessionTracker.getInstance();
