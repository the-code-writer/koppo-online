/**
 * @file: GlobalStorageContext.tsx
 * @description: React Context provider for the global storage system.
 *               Provides a clean wrapper pattern for accessing global state throughout the application.
 *
 * @usage:
 *   <GlobalStorageProvider>
 *     <App />
 *   </GlobalStorageProvider>
 *
 *   // In components
 *   const { setItem, getItem, removeItem, updateItem, onItemChanged } = useGlobalStorage();
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { globalStorage, StorageListener, StorageChangeEvent } from '../stores/globalStore';

interface GlobalStorageContextValue {
  setItem: <T>(key: string, value: T) => void;
  getItem: <T>(key: string) => T | undefined;
  removeItem: (key: string) => void;
  updateItem: (path: string, value: any) => void;
  onItemChanged: <T>(key: string, listener: StorageListener<T>) => () => void;
  getAllKeys: () => string[];
  clear: () => void;
  has: (key: string) => boolean;
  size: () => number;
  storage: typeof globalStorage;
}

interface GlobalStorageProviderProps {
  children: ReactNode;
  storage?: typeof globalStorage;
}

const GlobalStorageContext = createContext<GlobalStorageContextValue | null>(null);

/**
 * Provider component that wraps the application with global storage context
 */
export function GlobalStorageProvider({ 
  children, 
  storage = globalStorage 
}: GlobalStorageProviderProps): ReactNode {
  const [, forceUpdate] = useState({});
  const listenersRef = useRef<Map<string, Set<StorageListener>>>(new Map());

  // Force re-render when storage changes
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Set item in storage
  const setItem = useCallback(<T>(key: string, value: T) => {
    storage.setItem(key, value);
  }, [storage]);

  // Get item from storage
  const getItem = useCallback(<T>(key: string): T | undefined => {
    return storage.getItem<T>(key);
  }, [storage]);

  // Remove item from storage
  const removeItem = useCallback((key: string) => {
    storage.removeItem(key);
  }, [storage]);

  // Update nested item using dot notation
  const updateItem = useCallback((path: string, value: any) => {
    storage.updateItem(path, value);
  }, [storage]);

  // Listen to changes on a specific key
  const onItemChanged = useCallback(<T>(key: string, listener: StorageListener<T>) => {
    // Store the listener for cleanup
    if (!listenersRef.current.has(key)) {
      listenersRef.current.set(key, new Set());
    }
    listenersRef.current.get(key)!.add(listener);

    // Subscribe to storage changes
    const unsubscribe = storage.onItemChanged<T>(key, (event) => {
      listener(event);
      triggerUpdate();
    });

    return () => {
      unsubscribe();
      const keyListeners = listenersRef.current.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          listenersRef.current.delete(key);
        }
      }
    };
  }, [storage, triggerUpdate]);

  // Get all keys
  const getAllKeys = useCallback(() => {
    return storage.getKeys();
  }, [storage]);

  // Clear all storage
  const clear = useCallback(() => {
    storage.clear();
  }, [storage]);

  // Check if key exists
  const has = useCallback((key: string) => {
    return storage.has(key);
  }, [storage]);

  // Get storage size
  const size = useCallback(() => {
    return storage.size();
  }, [storage]);

  // Subscribe to global changes for re-rendering
  useEffect(() => {
    const unsubscribe = storage.onGlobalChanged(() => {
      triggerUpdate();
    });

    return unsubscribe;
  }, [storage, triggerUpdate]);

  // Cleanup listeners on unmount
  useEffect(() => {
    const listeners = listenersRef.current;
    return () => {
      listeners.clear();
    };
  }, []);

  const contextValue: GlobalStorageContextValue = {
    setItem,
    getItem,
    removeItem,
    updateItem,
    onItemChanged,
    getAllKeys,
    clear,
    has,
    size,
    storage
  };

  return (
    <GlobalStorageContext.Provider value={contextValue}>
      {children}
    </GlobalStorageContext.Provider>
  );
}

/**
 * Hook for accessing the global storage context
 * Throws an error if used outside of GlobalStorageProvider
 */
export function useGlobalStorageContext(): GlobalStorageContextValue {
  const context = useContext(GlobalStorageContext);
  
  if (!context) {
    throw new Error(
      'useGlobalStorageContext must be used within a GlobalStorageProvider. ' +
      'Please wrap your component with <GlobalStorageProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook for accessing global storage with the same API as before
 * This is the main hook that components should use
 */
export function useGlobalStorage(): GlobalStorageContextValue {
  return useGlobalStorageContext();
}

/**
 * Hook for watching a specific storage key with context
 */
export function useGlobalStorageItem<T>(key: string): [T | undefined, (value: T) => void, () => void] {
  const { storage } = useGlobalStorageContext();
  const [value, setValue] = useState<T | undefined>(() => storage.getItem<T>(key));

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = storage.onItemChanged<T>(key, (event) => {
      if (event.action === 'removed') {
        setValue(undefined);
      } else {
        setValue(event.value);
      }
    });

    // Set initial value after subscription to avoid missing updates
    const initialValue = storage.getItem<T>(key);
    if (initialValue !== undefined) {
      // Use setTimeout to avoid synchronous setState warning
      setTimeout(() => setValue(initialValue), 0);
    }

    return unsubscribe;
  }, [storage, key]);

  const setItem = useCallback((newValue: T) => {
    storage.setItem(key, newValue);
  }, [storage, key]);

  const removeItem = useCallback(() => {
    storage.removeItem(key);
  }, [storage, key]);

  return [value, setItem, removeItem];
}

/**
 * Hook for watching multiple storage keys with context
 */
export function useGlobalStorageItems<T extends Record<string, any>>(
  keys: string[]
): [Partial<T>, (key: keyof T, value: any) => void, (key: keyof T) => void] {
  const { storage } = useGlobalStorageContext();
  const [values, setValues] = useState<Partial<T>>(() => {
    const initial: Partial<T> = {};
    keys.forEach(key => {
      initial[key as keyof T] = storage.getItem<T[keyof T]>(key);
    });
    return initial;
  });

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    keys.forEach(key => {
      // Subscribe to changes first
      const unsubscribe = storage.onItemChanged<T[keyof T]>(key, (event) => {
        if (event.action === 'removed') {
          setValues(prev => {
            const newValues = { ...prev };
            delete newValues[key as keyof T];
            return newValues;
          });
        } else {
          setValues(prev => ({
            ...prev,
            [key]: event.value
          }));
        }
      });

      unsubscribes.push(unsubscribe);
    });

    // Set initial values after subscription to avoid missing updates
    const initial: Partial<T> = {};
    keys.forEach(key => {
      const value = storage.getItem<T[keyof T]>(key);
      if (value !== undefined) {
        initial[key as keyof T] = value;
      }
    });
    // Use setTimeout to avoid synchronous setState warning
    setTimeout(() => setValues(initial), 0);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [storage, keys]);

  const setItem = useCallback((key: keyof T, value: any) => {
    storage.setItem(key as string, value);
  }, [storage]);

  const removeItem = useCallback((key: keyof T) => {
    storage.removeItem(key as string);
  }, [storage]);

  return [values, setItem, removeItem];
}

/**
 * Higher-order component that provides global storage context
 * Useful for class components or when you prefer HOC pattern
 */
export function withGlobalStorage<P extends object>(
  Component: React.ComponentType<P & { globalStorage: GlobalStorageContextValue }>
) {
  return function WithGlobalStorageComponent(props: P) {
    const globalStorage = useGlobalStorageContext();
    return <Component {...props} globalStorage={globalStorage} />;
  };
}

export default GlobalStorageProvider;
