/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    createContext,
    useContext,
    useCallback,
    useRef,
    useMemo,
    ReactNode,
    useSyncExternalStore,
} from 'react';
import { useBrowserCookie } from './CookieContext';
import CryptoJS from 'crypto-js';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Event types for storage changes */
export type StorageEventType = 'add' | 'update' | 'remove' | 'batch';

/** Storage change event */
export interface StorageChangeEvent<T = any> {
    type: StorageEventType;
    path: string;
    oldValue: T | undefined;
    newValue: T | undefined;
    timestamp: number;
}

/** Options for setItem */
export interface SetItemOptions {
    /** Persist to localStorage as well */
    persist?: boolean;
    /** Encrypt the value before storing */
    encrypt?: boolean;
    /** Custom encryption key (uses default if not provided) */
    encryptionKey?: string;
    /** Merge with existing object instead of replacing */
    merge?: boolean;
    /** Silent update - don't trigger listeners */
    silent?: boolean;
}

/** Options for getItem */
export interface GetItemOptions {
    /** Default value if path doesn't exist */
    defaultValue?: any;
    /** Clone the value to prevent mutations */
    clone?: boolean;
}

/** Listener callback type */
export type StorageListener<T = any> = (event: StorageChangeEvent<T>) => void;

/** Subscription options */
export interface SubscriptionOptions {
    /** Only trigger on specific event types */
    eventTypes?: StorageEventType[];
    /** Debounce notifications (ms) */
    debounce?: number;
    /** Deep watch - trigger on nested changes */
    deep?: boolean;
}

/** Persisted item metadata */
interface PersistedItemMeta {
    path: string;
    encrypt: boolean;
    encryptionKey?: string;
}

/** Context value interface */
export interface AppStorageContextValue {
    /** Set a value at a path (supports dot notation) */
    setItem: <T = any>(path: string, value: T, options?: SetItemOptions) => void;
    /** Get a value at a path (supports dot notation) */
    getItem: <T = any>(path: string, options?: GetItemOptions) => T | undefined;
    /** Remove a value at a path (supports dot notation) */
    removeItem: (path: string, options?: { silent?: boolean }) => void;
    /** Update a value at a path using an updater function */
    updateItem: <T = any>(
        path: string,
        updater: (prev: T | undefined) => T,
        options?: SetItemOptions
    ) => void;
    /** Subscribe to item additions */
    onItemAdded: <T = any>(
        path: string,
        listener: StorageListener<T>,
        options?: SubscriptionOptions
    ) => () => void;
    /** Subscribe to item updates */
    onItemUpdated: <T = any>(
        path: string,
        listener: StorageListener<T>,
        options?: SubscriptionOptions
    ) => () => void;
    /** Subscribe to item removals */
    onItemRemoved: <T = any>(
        path: string,
        listener: StorageListener<T>,
        options?: SubscriptionOptions
    ) => () => void;
    /** Subscribe to any change at a path */
    subscribe: <T = any>(
        path: string,
        listener: StorageListener<T>,
        options?: SubscriptionOptions
    ) => () => void;
    /** Get the entire data object */
    dataObject: Record<string, any>;
    /** Check if a path exists */
    hasItem: (path: string) => boolean;
    /** Get all keys at a path */
    getKeys: (path?: string) => string[];
    /** Clear all data */
    clear: (options?: { preservePersisted?: boolean }) => void;
    /** Batch multiple operations */
    batch: (operations: BatchOperation[]) => void;
    /** Get snapshot of data at path */
    getSnapshot: <T = any>(path?: string) => T;
    /** Merge data at path */
    merge: <T extends object>(path: string, data: Partial<T>, options?: SetItemOptions) => void;
}

/** Batch operation type */
export interface BatchOperation {
    type: 'set' | 'remove' | 'update';
    path: string;
    value?: any;
    updater?: (prev: any) => any;
    options?: SetItemOptions;
}

// ============================================================================
// Constants
// ============================================================================

const APP_STORAGE_PREFIX = 'app_storage_';
const DEFAULT_ENCRYPTION_KEY = 'koppo_app_storage_key_2024';
const PERSISTED_KEYS_META = 'app_storage_persisted_meta';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get value at a dot-notation path
 */
function getByPath<T = any>(obj: any, path: string): T | undefined {
    if (!path || path === '') return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        // Handle array indices
        if (Array.isArray(current) && /^\d+$/.test(key)) {
            current = current[parseInt(key, 10)];
        } else {
            current = current[key];
        }
    }
    
    return current as T;
}

/**
 * Set value at a dot-notation path (immutably)
 */
function setByPath<T = any>(obj: any, path: string, value: T): any {
    if (!path || path === '') return value;
    
    const keys = path.split('.');
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKey = keys[i + 1];
        const isNextArray = /^\d+$/.test(nextKey);
        
        if (Array.isArray(current)) {
            const index = parseInt(key, 10);
            if (current[index] === null || current[index] === undefined) {
                current[index] = isNextArray ? [] : {};
            } else {
                current[index] = Array.isArray(current[index]) 
                    ? [...current[index]] 
                    : { ...current[index] };
            }
            current = current[index];
        } else {
            if (current[key] === null || current[key] === undefined) {
                current[key] = isNextArray ? [] : {};
            } else {
                current[key] = Array.isArray(current[key]) 
                    ? [...current[key]] 
                    : { ...current[key] };
            }
            current = current[key];
        }
    }
    
    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current)) {
        current[parseInt(lastKey, 10)] = value;
    } else {
        current[lastKey] = value;
    }
    
    return result;
}

/**
 * Remove value at a dot-notation path (immutably)
 */
function removeByPath(obj: any, path: string): any {
    if (!path || path === '') return {};
    
    const keys = path.split('.');
    if (keys.length === 1) {
        const { [keys[0]]: _, ...rest } = obj || {};
        return rest;
    }
    
    const parentPath = keys.slice(0, -1).join('.');
    const lastKey = keys[keys.length - 1];
    const parent = getByPath(obj, parentPath);
    
    if (parent === null || parent === undefined) {
        return obj;
    }
    
    let newParent: any;
    if (Array.isArray(parent)) {
        newParent = parent.filter((_, i) => i !== parseInt(lastKey, 10));
    } else {
        const { [lastKey]: _, ...rest } = parent;
        newParent = rest;
    }
    
    return setByPath(obj, parentPath, newParent);
}

/**
 * Check if a path exists in an object
 */
function hasPath(obj: any, path: string): boolean {
    if (!path || path === '') return obj !== undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined) {
            return false;
        }
        if (Array.isArray(current)) {
            const index = parseInt(key, 10);
            if (isNaN(index) || index < 0 || index >= current.length) {
                return false;
            }
            current = current[index];
        } else if (typeof current === 'object') {
            if (!(key in current)) {
                return false;
            }
            current = current[key];
        } else {
            return false;
        }
    }
    
    return true;
}

/**
 * Get all keys at a path
 */
function getKeysAtPath(obj: any, path?: string): string[] {
    const target = path ? getByPath(obj, path) : obj;
    if (target === null || target === undefined) return [];
    if (Array.isArray(target)) return target.map((_, i) => String(i));
    if (typeof target === 'object') return Object.keys(target);
    return [];
}

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof RegExp) return new RegExp(obj) as any;
    if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any;
    
    const cloned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone((obj as any)[key]);
        }
    }
    return cloned;
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = (target as any)[key];
            
            if (
                sourceValue !== null &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue !== null &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)
            ) {
                (result as any)[key] = deepMerge(targetValue, sourceValue as any);
            } else {
                (result as any)[key] = sourceValue;
            }
        }
    }
    
    return result;
}

/**
 * Encrypt a value
 */
function encryptValue(value: any, key: string): string {
    const json = JSON.stringify(value);
    return CryptoJS.AES.encrypt(json, key).toString();
}

/**
 * Decrypt a value
 */
function decryptValue<T>(encrypted: string, key: string): T | null {
    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, key);
        const json = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(json);
    } catch {
        console.error('Failed to decrypt value');
        return null;
    }
}

/**
 * Check if path matches a pattern (supports wildcards)
 */
function pathMatches(path: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === path) return true;
    
    // Check if path starts with pattern (for deep watching)
    if (pattern.endsWith('.*')) {
        const basePath = pattern.slice(0, -2);
        return path === basePath || path.startsWith(basePath + '.');
    }
    
    // Check if pattern is parent of path
    if (path.startsWith(pattern + '.')) return true;
    
    return false;
}

// ============================================================================
// Storage Store (External Store for useSyncExternalStore)
// ============================================================================

type Listener = () => void;

class AppStorageStore {
    private data: Record<string, any> = {};
    private listeners: Set<Listener> = new Set();
    private pathListeners: Map<string, Set<{ 
        listener: StorageListener; 
        options: SubscriptionOptions;
        debounceTimer?: number;
    }>> = new Map();
    private persistedMeta: Map<string, PersistedItemMeta> = new Map();
    private cookieStorage: {
        getItem: <T>(key: string) => T | null;
        setItem: <T>(key: string, value: T, options?: any) => void;
        removeItem: (key: string) => void;
    } | null = null;

    constructor() {
        this.loadPersistedMeta();
    }

    setCookieStorage(storage: typeof this.cookieStorage) {
        this.cookieStorage = storage;
        this.loadPersistedItems();
    }

    private loadPersistedMeta() {
        try {
            const meta = localStorage.getItem(PERSISTED_KEYS_META);
            if (meta) {
                const parsed: PersistedItemMeta[] = JSON.parse(meta);
                parsed.forEach(item => {
                    this.persistedMeta.set(item.path, item);
                });
            }
        } catch (error) {
            console.error('Failed to load persisted meta:', error);
        }
    }

    private savePersistedMeta() {
        try {
            const meta = Array.from(this.persistedMeta.values());
            localStorage.setItem(PERSISTED_KEYS_META, JSON.stringify(meta));
        } catch (error) {
            console.error('Failed to save persisted meta:', error);
        }
    }

    private loadPersistedItems() {
        this.persistedMeta.forEach((meta, path) => {
            try {
                const storageKey = APP_STORAGE_PREFIX + path.replace(/\./g, '_');
                let value: any;

                // Try cookie storage first, then localStorage
                if (this.cookieStorage) {
                    value = this.cookieStorage.getItem(storageKey);
                }
                
                if (value === null || value === undefined) {
                    const stored = localStorage.getItem(storageKey);
                    if (stored) {
                        value = JSON.parse(stored);
                    }
                }

                if (value !== null && value !== undefined) {
                    // Decrypt if needed
                    if (meta.encrypt) {
                        const key = meta.encryptionKey || DEFAULT_ENCRYPTION_KEY;
                        value = decryptValue(value, key);
                    }

                    if (value !== null) {
                        this.data = setByPath(this.data, path, value);
                    }
                }
            } catch (error) {
                console.error(`Failed to load persisted item at ${path}:`, error);
            }
        });
    }

    private persistItem(path: string, value: any, options: SetItemOptions) {
        const storageKey = APP_STORAGE_PREFIX + path.replace(/\./g, '_');
        let valueToStore = value;

        // Encrypt if needed
        if (options.encrypt) {
            const key = options.encryptionKey || DEFAULT_ENCRYPTION_KEY;
            valueToStore = encryptValue(value, key);
        }

        // Save to localStorage
        try {
            localStorage.setItem(storageKey, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Failed to persist item at ${path}:`, error);
        }

        // Also save to cookie storage if available
        if (this.cookieStorage) {
            try {
                this.cookieStorage.setItem(storageKey, valueToStore);
            } catch (error) {
                console.error(`Failed to persist item to cookies at ${path}:`, error);
            }
        }

        // Update meta
        this.persistedMeta.set(path, {
            path,
            encrypt: options.encrypt || false,
            encryptionKey: options.encryptionKey,
        });
        this.savePersistedMeta();
    }

    private removePersistedItem(path: string) {
        const storageKey = APP_STORAGE_PREFIX + path.replace(/\./g, '_');
        
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error(`Failed to remove persisted item at ${path}:`, error);
        }

        if (this.cookieStorage) {
            try {
                this.cookieStorage.removeItem(storageKey);
            } catch (error) {
                console.error(`Failed to remove persisted item from cookies at ${path}:`, error);
            }
        }

        this.persistedMeta.delete(path);
        this.savePersistedMeta();
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    subscribePath<T>(
        path: string,
        listener: StorageListener<T>,
        options: SubscriptionOptions = {}
    ): () => void {
        if (!this.pathListeners.has(path)) {
            this.pathListeners.set(path, new Set());
        }
        
        const listenerEntry = { listener: listener as StorageListener, options };
        this.pathListeners.get(path)!.add(listenerEntry);

        return () => {
            const listeners = this.pathListeners.get(path);
            if (listeners) {
                // Clear any pending debounce timer
                if (listenerEntry.debounceTimer) {
                    clearTimeout(listenerEntry.debounceTimer);
                }
                listeners.delete(listenerEntry);
                if (listeners.size === 0) {
                    this.pathListeners.delete(path);
                }
            }
        };
    }

    getSnapshot(): Record<string, any> {
        return this.data;
    }

    getServerSnapshot(): Record<string, any> {
        return this.data;
    }

    private emitChange() {
        this.listeners.forEach(listener => listener());
    }

    private notifyPathListeners(event: StorageChangeEvent) {
        this.pathListeners.forEach((listeners, pattern) => {
            if (pathMatches(event.path, pattern) || 
                (pattern !== '*' && event.path.startsWith(pattern + '.'))) {
                listeners.forEach(entry => {
                    // Check event type filter
                    if (entry.options.eventTypes && 
                        !entry.options.eventTypes.includes(event.type)) {
                        return;
                    }

                    // Handle debounce
                    if (entry.options.debounce && entry.options.debounce > 0) {
                        if (entry.debounceTimer) {
                            clearTimeout(entry.debounceTimer);
                        }
                        entry.debounceTimer = window.setTimeout(() => {
                            entry.listener(event);
                            entry.debounceTimer = undefined;
                        }, entry.options.debounce);
                    } else {
                        entry.listener(event);
                    }
                });
            }
        });
    }

    setItem<T>(path: string, value: T, options: SetItemOptions = {}): void {
        const oldValue = getByPath(this.data, path);
        const isNew = !hasPath(this.data, path);
        
        let newValue = value;
        if (options.merge && typeof value === 'object' && typeof oldValue === 'object') {
            newValue = deepMerge(oldValue || {}, value as any);
        }

        this.data = setByPath(this.data, path, newValue);

        // Handle persistence
        if (options.persist) {
            this.persistItem(path, newValue, options);
        }

        // Emit changes
        if (!options.silent) {
            this.emitChange();
            this.notifyPathListeners({
                type: isNew ? 'add' : 'update',
                path,
                oldValue,
                newValue,
                timestamp: Date.now(),
            });
        }
    }

    getItem<T>(path: string, options: GetItemOptions = {}): T | undefined {
        const value = getByPath<T>(this.data, path);
        
        if (value === undefined && options.defaultValue !== undefined) {
            return options.defaultValue;
        }
        
        if (options.clone && value !== undefined) {
            return deepClone(value);
        }
        
        return value;
    }

    removeItem(path: string, options: { silent?: boolean } = {}): void {
        const oldValue = getByPath(this.data, path);
        
        if (!hasPath(this.data, path)) {
            return;
        }

        this.data = removeByPath(this.data, path);

        // Remove from persistence
        if (this.persistedMeta.has(path)) {
            this.removePersistedItem(path);
        }

        if (!options.silent) {
            this.emitChange();
            this.notifyPathListeners({
                type: 'remove',
                path,
                oldValue,
                newValue: undefined,
                timestamp: Date.now(),
            });
        }
    }

    updateItem<T>(
        path: string,
        updater: (prev: T | undefined) => T,
        options: SetItemOptions = {}
    ): void {
        const oldValue = getByPath<T>(this.data, path);
        const newValue = updater(oldValue);
        this.setItem(path, newValue, options);
    }

    hasItem(path: string): boolean {
        return hasPath(this.data, path);
    }

    getKeys(path?: string): string[] {
        return getKeysAtPath(this.data, path);
    }

    clear(options: { preservePersisted?: boolean } = {}): void {
        const oldData = this.data;
        
        if (options.preservePersisted) {
            // Only clear non-persisted data
            this.data = {};
            this.persistedMeta.forEach((_, path) => {
                const value = getByPath(oldData, path);
                if (value !== undefined) {
                    this.data = setByPath(this.data, path, value);
                }
            });
        } else {
            this.data = {};
            // Clear all persisted items
            this.persistedMeta.forEach((_, path) => {
                this.removePersistedItem(path);
            });
            this.persistedMeta.clear();
            this.savePersistedMeta();
        }

        this.emitChange();
    }

    batch(operations: BatchOperation[]): void {
        const events: StorageChangeEvent[] = [];

        operations.forEach(op => {
            const oldValue = getByPath(this.data, op.path);
            const isNew = !hasPath(this.data, op.path);

            switch (op.type) {
                case 'set':
                    this.data = setByPath(this.data, op.path, op.value);
                    if (op.options?.persist) {
                        this.persistItem(op.path, op.value, op.options);
                    }
                    events.push({
                        type: isNew ? 'add' : 'update',
                        path: op.path,
                        oldValue,
                        newValue: op.value,
                        timestamp: Date.now(),
                    });
                    break;

                case 'remove':
                    this.data = removeByPath(this.data, op.path);
                    if (this.persistedMeta.has(op.path)) {
                        this.removePersistedItem(op.path);
                    }
                    events.push({
                        type: 'remove',
                        path: op.path,
                        oldValue,
                        newValue: undefined,
                        timestamp: Date.now(),
                    });
                    break;

                case 'update':
                    if (op.updater) {
                        const newValue = op.updater(oldValue);
                        this.data = setByPath(this.data, op.path, newValue);
                        if (op.options?.persist) {
                            this.persistItem(op.path, newValue, op.options);
                        }
                        events.push({
                            type: isNew ? 'add' : 'update',
                            path: op.path,
                            oldValue,
                            newValue,
                            timestamp: Date.now(),
                        });
                    }
                    break;
            }
        });

        this.emitChange();
        
        // Notify with batch event
        this.notifyPathListeners({
            type: 'batch',
            path: '*',
            oldValue: undefined,
            newValue: events,
            timestamp: Date.now(),
        });

        // Also notify individual path listeners
        events.forEach(event => {
            this.notifyPathListeners(event);
        });
    }

    merge<T extends object>(path: string, data: Partial<T>, options: SetItemOptions = {}): void {
        this.setItem(path, data, { ...options, merge: true });
    }
}

// Singleton store instance
const appStorageStore = new AppStorageStore();

// ============================================================================
// Context
// ============================================================================

const AppStorageContext = createContext<AppStorageContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface AppStorageProviderProps {
    children: ReactNode;
    /** Initial data to populate the store */
    initialData?: Record<string, any>;
    /** Called when any data changes */
    onDataChange?: (data: Record<string, any>) => void;
}

// ============================================================================
// Provider Component
// ============================================================================

export function AppStorageProvider({
    children,
    initialData,
    onDataChange,
}: AppStorageProviderProps) {
    const cookies = useBrowserCookie();
    const onDataChangeRef = useRef(onDataChange);
    onDataChangeRef.current = onDataChange;

    // Initialize store with cookie storage
    useMemo(() => {
        appStorageStore.setCookieStorage({
            getItem: cookies.getItem,
            setItem: cookies.setItem,
            removeItem: cookies.removeItem,
        });

        // Set initial data if provided
        if (initialData) {
            Object.entries(initialData).forEach(([key, value]) => {
                if (!appStorageStore.hasItem(key)) {
                    appStorageStore.setItem(key, value, { silent: true });
                }
            });
        }
    }, []);

    // Subscribe to store changes
    const data = useSyncExternalStore(
        appStorageStore.subscribe.bind(appStorageStore),
        appStorageStore.getSnapshot.bind(appStorageStore),
        appStorageStore.getServerSnapshot.bind(appStorageStore)
    );

    // Notify on data change
    useMemo(() => {
        if (onDataChangeRef.current) {
            onDataChangeRef.current(data);
        }
    }, [data]);

    // Memoized context value
    const contextValue = useMemo<AppStorageContextValue>(() => ({
        setItem: appStorageStore.setItem.bind(appStorageStore),
        getItem: appStorageStore.getItem.bind(appStorageStore),
        removeItem: appStorageStore.removeItem.bind(appStorageStore),
        updateItem: appStorageStore.updateItem.bind(appStorageStore),
        onItemAdded: (path, listener, options) => 
            appStorageStore.subscribePath(path, listener, { ...options, eventTypes: ['add'] }),
        onItemUpdated: (path, listener, options) => 
            appStorageStore.subscribePath(path, listener, { ...options, eventTypes: ['update'] }),
        onItemRemoved: (path, listener, options) => 
            appStorageStore.subscribePath(path, listener, { ...options, eventTypes: ['remove'] }),
        subscribe: appStorageStore.subscribePath.bind(appStorageStore),
        dataObject: data,
        hasItem: appStorageStore.hasItem.bind(appStorageStore),
        getKeys: appStorageStore.getKeys.bind(appStorageStore),
        clear: appStorageStore.clear.bind(appStorageStore),
        batch: appStorageStore.batch.bind(appStorageStore),
        getSnapshot: (path?: string) => path 
            ? appStorageStore.getItem(path, { clone: true }) 
            : { ...data },
        merge: appStorageStore.merge.bind(appStorageStore),
    }), [data]);

    return (
        <AppStorageContext.Provider value={contextValue}>
            {children}
        </AppStorageContext.Provider>
    );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Main hook to access the app storage context
 */
export function useAppStorage(): AppStorageContextValue {
    const context = useContext(AppStorageContext);
    if (!context) {
        throw new Error('useAppStorage must be used within AppStorageProvider');
    }
    return context;
}

/**
 * Hook to access data at a specific path with automatic re-renders on changes
 */
export function useAppDataContext<T = any>(
    path: string,
    options?: {
        defaultValue?: T;
        /** Subscribe to nested changes */
        deep?: boolean;
    }
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void] {
    const { getItem, setItem, subscribe } = useAppStorage();
    const pathRef = useRef(path);
    pathRef.current = path;

    // Create a stable subscription callback
    const subscribeToPath = useCallback(
        (onStoreChange: () => void) => {
            const pattern = options?.deep ? `${pathRef.current}.*` : pathRef.current;
            return subscribe(pattern, onStoreChange, { deep: options?.deep });
        },
        [subscribe, options?.deep]
    );

    // Get snapshot for the specific path
    const getPathSnapshot = useCallback(() => {
        return getItem<T>(pathRef.current, { defaultValue: options?.defaultValue });
    }, [getItem, options?.defaultValue]);

    // Use sync external store for efficient updates
    const value = useSyncExternalStore(
        subscribeToPath,
        getPathSnapshot,
        getPathSnapshot
    );

    // Setter function
    const setValue = useCallback(
        (newValue: T | ((prev: T | undefined) => T)) => {
            if (typeof newValue === 'function') {
                const current = getItem<T>(pathRef.current);
                setItem(pathRef.current, (newValue as Function)(current));
            } else {
                setItem(pathRef.current, newValue);
            }
        },
        [getItem, setItem]
    );

    return [value, setValue];
}

/**
 * Hook to watch for changes at a path
 */
export function useAppStorageWatch<T = any>(
    path: string,
    callback: StorageListener<T>,
    options?: SubscriptionOptions
): void {
    const { subscribe } = useAppStorage();
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useMemo(() => {
        return subscribe<T>(path, (event) => {
            callbackRef.current(event);
        }, options);
    }, [path, subscribe, JSON.stringify(options)]);
}

/**
 * Hook to get a persisted value with automatic loading
 */
export function usePersistedAppData<T = any>(
    path: string,
    defaultValue?: T,
    options?: Omit<SetItemOptions, 'persist'>
): [T | undefined, (value: T) => void] {
    const [value, setValue] = useAppDataContext<T>(path, { defaultValue });

    const setPersistedValue = useCallback(
        (newValue: T) => {
            setValue(newValue);
            appStorageStore.setItem(path, newValue, { ...options, persist: true });
        },
        [path, setValue, options]
    );

    return [value, setPersistedValue];
}

/**
 * Hook for batch operations
 */
export function useAppStorageBatch() {
    const { batch } = useAppStorage();
    const operationsRef = useRef<BatchOperation[]>([]);

    const addOperation = useCallback((operation: BatchOperation) => {
        operationsRef.current.push(operation);
    }, []);

    const commit = useCallback(() => {
        if (operationsRef.current.length > 0) {
            batch(operationsRef.current);
            operationsRef.current = [];
        }
    }, [batch]);

    const reset = useCallback(() => {
        operationsRef.current = [];
    }, []);

    return { addOperation, commit, reset };
}

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

/**
 * Create a selector for derived data
 */
export function createAppStorageSelector<T, R>(
    path: string,
    selector: (data: T | undefined) => R
): () => R {
    return () => {
        const data = appStorageStore.getItem<T>(path);
        return selector(data);
    };
}

/**
 * Hook to use a selector
 */
export function useAppStorageSelector<T, R>(
    path: string,
    selector: (data: T | undefined) => R,
    equalityFn?: (a: R, b: R) => boolean
): R {
    const { subscribe, getItem } = useAppStorage();
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const prevResultRef = useRef<R>();

    const subscribeToPath = useCallback(
        (onStoreChange: () => void) => {
            return subscribe(path, () => {
                const newResult = selectorRef.current(getItem(path));
                const isEqual = equalityFn 
                    ? equalityFn(prevResultRef.current as R, newResult)
                    : prevResultRef.current === newResult;
                
                if (!isEqual) {
                    prevResultRef.current = newResult;
                    onStoreChange();
                }
            });
        },
        [path, subscribe, getItem, equalityFn]
    );

    const getSnapshot = useCallback(() => {
        const result = selectorRef.current(getItem(path));
        prevResultRef.current = result;
        return result;
    }, [path, getItem]);

    return useSyncExternalStore(subscribeToPath, getSnapshot, getSnapshot);
}
