/**
 * @file: globalStore.example.tsx
 * @description: Usage examples and demonstrations of the global storage system.
 *               This file contains practical examples showing how to use the global storage
 *               in various scenarios within React components.
 */

import React, { useEffect } from 'react';
import { useGlobalStorage, useGlobalStorageItem, useGlobalStorageItems } from '../hooks/useGlobalStorage';

// Example 1: Basic usage with useGlobalStorage hook
export function BasicUsageExample() {
  const { setItem, getItem, removeItem, updateItem, onItemChanged } = useGlobalStorage();

  const handleSetUser = () => {
    setItem('user', {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      profile: {
        age: 30,
        location: 'New York'
      }
    });
  };

  const handleUpdateProfile = () => {
    updateItem('user.profile.age', 31);
    updateItem('user.profile.location', 'San Francisco');
  };

  const handleRemoveUser = () => {
    removeItem('user');
  };

  useEffect(() => {
    // Listen to user changes
    const unsubscribe = onItemChanged('user', (event) => {
      console.log('User changed:', event.action, event.value);
    });

    return unsubscribe;
  }, [onItemChanged]);

  return (
    <div>
      <h2>Basic Usage Example</h2>
      <button onClick={handleSetUser}>Set User</button>
      <button onClick={handleUpdateProfile}>Update Profile</button>
      <button onClick={handleRemoveUser}>Remove User</button>
      <pre>{JSON.stringify(getItem('user'), null, 2)}</pre>
    </div>
  );
}

// Example 2: Using useGlobalStorageItem for reactive updates
export function ReactiveItemExample() {
  const [user, setUser] = useGlobalStorageItem('user');
  const [settings, setSettings] = useGlobalStorageItem('settings');

  const handleUpdateTheme = (theme: string) => {
    setSettings({
      ...settings,
      theme,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div>
      <h2>Reactive Item Example</h2>
      <p>User: {user?.name || 'Not set'}</p>
      <p>Theme: {settings?.theme || 'default'}</p>
      <button onClick={() => handleUpdateTheme('dark')}>Dark Theme</button>
      <button onClick={() => handleUpdateTheme('light')}>Light Theme</button>
      {user && <button onClick={() => setUser(null)}>Clear User</button>}
    </div>
  );
}

// Example 3: Watching multiple items
export function MultipleItemsExample() {
  const [data, setData, removeData] = useGlobalStorageItems(['user', 'settings', 'cart']);

  const handleAddToCart = (item: string) => {
    const currentCart = data.cart || [];
    setData('cart', [...currentCart, { id: Date.now(), name: item }]);
  };

  return (
    <div>
      <h2>Multiple Items Example</h2>
      <p>User: {data.user?.name || 'Not logged in'}</p>
      <p>Settings Theme: {data.settings?.theme || 'default'}</p>
      <p>Cart Items: {data.cart?.length || 0}</p>
      <button onClick={() => handleAddToCart('Product A')}>Add Product A</button>
      <button onClick={() => handleAddToCart('Product B')}>Add Product B</button>
      <button onClick={() => removeData('cart')}>Clear Cart</button>
    </div>
  );
}

// Example 4: Real-time synchronization across components
export function ComponentA() {
  const { setItem } = useGlobalStorage();

  const handleUpdateCounter = () => {
    const current = Math.floor(Math.random() * 100);
    setItem('counter', current);
  };

  return (
    <div>
      <h3>Component A</h3>
      <button onClick={handleUpdateCounter}>Update Counter</button>
    </div>
  );
}

export function ComponentB() {
  const [counter] = useGlobalStorageItem('counter');

  return (
    <div>
      <h3>Component B</h3>
      <p>Counter from Component A: {counter || 'Not set'}</p>
    </div>
  );
}

// Example 5: Advanced usage with nested objects
export function AdvancedUsageExample() {
  const { setItem, updateItem, getItem } = useGlobalStorage();

  const initializeComplexData = () => {
    setItem('app', {
      user: {
        profile: {
          personal: {
            name: 'Alice',
            email: 'alice@example.com'
          },
          preferences: {
            theme: 'dark',
            language: 'en',
            notifications: {
              email: true,
              push: false,
              sms: true
            }
          }
        },
        activity: {
          lastLogin: new Date().toISOString(),
          loginCount: 5
        }
      },
      ui: {
        sidebar: {
          collapsed: false,
          activeSection: 'dashboard'
        },
        modals: {
          open: []
        }
      }
    });
  };

  const updateNestedValue = () => {
    // Update deeply nested value
    updateItem('app.user.profile.preferences.notifications.push', true);
    updateItem('app.ui.sidebar.collapsed', true);
  };

  return (
    <div>
      <h2>Advanced Usage Example</h2>
      <button onClick={initializeComplexData}>Initialize Complex Data</button>
      <button onClick={updateNestedValue}>Update Nested Values</button>
      <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
        {JSON.stringify(getItem('app'), null, 2)}
      </pre>
    </div>
  );
}

// Example 6: Persistence and recovery
export function PersistenceExample() {
  const { setItem, getItem, clear, getAllKeys } = useGlobalStorage();

  const handleSaveData = () => {
    setItem('persistentData', {
      message: 'This data persists across page reloads',
      timestamp: new Date().toISOString()
    });
  };

  const handleClearAll = () => {
    clear();
  };

  return (
    <div>
      <h2>Persistence Example</h2>
      <button onClick={handleSaveData}>Save Persistent Data</button>
      <button onClick={handleClearAll}>Clear All Storage</button>
      <p>Storage Keys: {getAllKeys().join(', ')}</p>
      <pre>{JSON.stringify(getItem('persistentData'), null, 2)}</pre>
      <small>
        Note: This data is saved to localStorage and will persist across page reloads.
      </small>
    </div>
  );
}

// Complete example component showing all features
export function GlobalStorageDemo() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Global Storage System Demo</h1>
      <p>This demonstrates the lightweight, comprehensive global state management system.</p>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        <BasicUsageExample />
        <hr />
        <ReactiveItemExample />
        <hr />
        <MultipleItemsExample />
        <hr />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <ComponentA />
          <ComponentB />
        </div>
        <hr />
        <AdvancedUsageExample />
        <hr />
        <PersistenceExample />
      </div>
    </div>
  );
}

export default GlobalStorageDemo;
