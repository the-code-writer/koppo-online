/**
 * @file: useGlobalStorage.ts
 * @description: React hook for accessing the global storage system with real-time updates.
 *               Provides a clean, intuitive API for components to interact with global state.
 *
 * @usage:
 *   const { setItem, getItem, removeItem, updateItem, onItemChanged } = useGlobalStorage();
 *   
 *   // Set a value
 *   setItem('user', { name: 'John', age: 30 });
 *   
 *   // Get a value
 *   const user = getItem('user');
 *   
 *   // Update nested value
 *   updateItem('user.profile.email', 'john@example.com');
 *   
 *   // Listen to changes
 *   onItemChanged('user', (event) => {
 *     console.log('User changed:', event.value, event.action);
 *   });
 */

// Re-export hooks from context for backward compatibility
export {
  useGlobalStorage,
  useGlobalStorageItem,
  useGlobalStorageItems,
  useGlobalStorageContext,
  withGlobalStorage
} from '../contexts/GlobalStorageContext';

// Re-export types
export type { StorageListener, StorageChangeEvent } from '../stores/globalStore';

// Default export
export { default as GlobalStorageProvider } from '../contexts/GlobalStorageContext';
