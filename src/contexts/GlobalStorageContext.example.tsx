/**
 * @file: GlobalStorageContext.example.tsx
 * @description: Usage examples for the GlobalStorageContext with React Context wrapper pattern.
 */

import React from 'react';
import { GlobalStorageProvider, useGlobalStorage, useGlobalStorageItem } from './GlobalStorageContext';

// Example 1: Basic usage with provider wrapper
function App() {
  return (
    <GlobalStorageProvider>
      <MyComponent />
      <AnotherComponent />
    </GlobalStorageProvider>
  );
}

// Example 2: Using the hook in components
function MyComponent() {
  const { setItem, getItem, removeItem, updateItem, onItemChanged } = useGlobalStorage();

  const handleSetUser = () => {
    setItem('user', { name: 'John', age: 30 });
  };

  const handleUpdateProfile = () => {
    updateItem('user.profile.email', 'john@example.com');
  };

  const handleRemoveUser = () => {
    removeItem('user');
  };

  React.useEffect(() => {
    // Listen to user changes
    const unsubscribe = onItemChanged('user', (event) => {
      console.log('User changed:', event.action, event.value);
    });

    return unsubscribe;
  }, [onItemChanged]);

  return (
    <div>
      <h2>MyComponent</h2>
      <button onClick={handleSetUser}>Set User</button>
      <button onClick={handleUpdateProfile}>Update Profile</button>
      <button onClick={handleRemoveUser}>Remove User</button>
      <pre>{JSON.stringify(getItem('user'), null, 2)}</pre>
    </div>
  );
}

// Example 3: Using the item-specific hook
function AnotherComponent() {
  const [user, setUser] = useGlobalStorageItem('user');

  return (
    <div>
      <h2>AnotherComponent</h2>
      <p>User: {user?.name || 'Not set'}</p>
      <button onClick={() => setUser({ name: 'Alice', age: 25 })}>
        Set Alice
      </button>
    </div>
  );
}

// Example 4: Real-time synchronization
function ComponentA() {
  const { setItem } = useGlobalStorage();

  return (
    <div>
      <h3>Component A</h3>
      <button onClick={() => setItem('counter', Math.random())}>
        Update Counter
      </button>
    </div>
  );
}

function ComponentB() {
  const [counter] = useGlobalStorageItem('counter');

  return (
    <div>
      <h3>Component B</h3>
      <p>Counter from Component A: {counter?.toFixed(4) || 'Not set'}</p>
    </div>
  );
}

// Example 5: Complete app with context
function CompleteExample() {
  return (
    <GlobalStorageProvider>
      <h1>Global Storage with Context</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <ComponentA />
        <ComponentB />
      </div>
      <hr />
      <MyComponent />
      <hr />
      <AnotherComponent />
    </GlobalStorageProvider>
  );
}

export default CompleteExample;
