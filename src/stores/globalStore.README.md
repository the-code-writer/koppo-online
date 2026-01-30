# Global Storage System

A lightweight, comprehensive global state management system with real-time updates for React applications. This provides a single source of truth for application state with an intuitive hook-based API.

## Features

- **Real-time Updates**: All components automatically reflect state changes
- **Nested Object Support**: Update deeply nested values using dot notation
- **Event-Driven**: Listen to specific key changes or global changes
- **TypeScript Support**: Full type safety with generic types
- **Persistent Storage**: Optional localStorage/sessionStorage integration
- **Memory Efficient**: Singleton pattern with minimal overhead
- **React Hooks**: Clean, intuitive hook-based API

## Basic Usage

```typescript
import { useGlobalStorage } from '../hooks/useGlobalStorage';

function MyComponent() {
  const { setItem, getItem, removeItem, updateItem, onItemChanged } = useGlobalStorage();

  // Set a value
  const handleSetUser = () => {
    setItem('user', { name: 'John', age: 30 });
  };

  // Get a value
  const user = getItem('user');

  // Update nested value
  const handleUpdateEmail = () => {
    updateItem('user.profile.email', 'john@example.com');
  };

  // Listen to changes
  useEffect(() => {
    const unsubscribe = onItemChanged('user', (event) => {
      console.log('User changed:', event.action, event.value);
    });
    return unsubscribe;
  }, [onItemChanged]);

  return <div>{user?.name}</div>;
}
```

## API Reference

### useGlobalStorage()

Main hook that provides access to the global storage system.

**Returns:**
- `setItem<T>(key: string, value: T): void` - Set a value
- `getItem<T>(key: string): T | undefined` - Get a value
- `removeItem(key: string): void` - Remove a value
- `updateItem(path: string, value: any): void` - Update nested value using dot notation
- `onItemChanged<T>(key: string, listener: StorageListener<T>): () => void` - Listen to changes
- `getAllKeys(): string[]` - Get all storage keys
- `clear(): void` - Clear all storage
- `has(key: string): boolean` - Check if key exists
- `size(): number` - Get number of items

### useGlobalStorageItem<T>(key: string)

Hook for watching a specific storage key with reactive updates.

**Returns:** `[value: T | undefined, setValue: (value: T) => void, removeValue: () => void]`

```typescript
const [user, setUser, removeUser] = useGlobalStorageItem<User>('user');
```

### useGlobalStorageItems<T>(keys: string[])

Hook for watching multiple storage keys.

**Returns:** `[values: Partial<T>, setItem: (key: keyof T, value: any) => void, removeItem: (key: keyof T) => void]`

```typescript
const [data, setData, removeData] = useGlobalStorageItems<{
  user: User;
  settings: Settings;
  cart: CartItem[];
}>(['user', 'settings', 'cart']);
```

## Advanced Usage

### Nested Object Updates

Update deeply nested values using dot notation:

```typescript
// Set up nested object
setItem('app', {
  user: {
    profile: {
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    }
  }
});

// Update deeply nested value
updateItem('app.user.profile.notifications.push', true);
```

### Event Listeners

Listen to storage changes with detailed event information:

```typescript
const unsubscribe = onItemChanged('user', (event) => {
  console.log('Action:', event.action); // 'added' | 'updated' | 'removed'
  console.log('Value:', event.value);
  console.log('Timestamp:', event.timestamp);
});
```

### Persistence

The storage system supports persistence to localStorage or sessionStorage:

```typescript
// In globalStore.ts - configuration
export const globalStorage = GlobalStorage.getInstance({
  persist: 'localStorage', // or 'sessionStorage' or 'memory'
  key: 'my_app_storage'
});
```

## Examples

### Real-time Synchronization

Multiple components automatically stay in sync:

```typescript
// Component A
function ComponentA() {
  const { setItem } = useGlobalStorage();
  return <button onClick={() => setItem('counter', Math.random())}>Update</button>;
}

// Component B
function ComponentB() {
  const [counter] = useGlobalStorageItem('counter');
  return <div>Counter: {counter}</div>;
}
```

### Form State Management

```typescript
function UserProfile() {
  const [profile, setProfile] = useGlobalStorageItem<UserProfile>('userProfile');
  
  return (
    <form>
      <input
        value={profile?.name || ''}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <input
        value={profile?.email || ''}
        onChange={(e) => updateItem('userProfile.email', e.target.value)}
      />
    </form>
  );
}
```

### Shopping Cart

```typescript
function ShoppingCart() {
  const [cart, setCart] = useGlobalStorageItem<CartItem[]>('cart');
  
  const addItem = (item: CartItem) => {
    setCart([...(cart || []), item]);
  };
  
  const removeItem = (id: string) => {
    setCart(cart?.filter(item => item.id !== id) || []);
  };
  
  return (
    <div>
      {cart?.map(item => (
        <div key={item.id}>
          {item.name} - ${item.price}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

## Performance Considerations

- **Selective Updates**: Only components using specific keys re-render when those keys change
- **Efficient Listeners**: Listeners are managed automatically with cleanup
- **Minimal Overhead**: Singleton pattern prevents multiple instances
- **Lazy Loading**: Values are only retrieved when needed

## Comparison with Redux

| Feature | Global Storage | Redux |
|---------|----------------|-------|
| Setup | Zero configuration | Boilerplate required |
| Bundle Size | ~2KB | ~15KB+ |
| Learning Curve | Minimal | Steep |
| TypeScript | Built-in | Requires extra setup |
| DevTools | Simple | Advanced |
| Middleware | Not needed | Extensive |

## Best Practices

1. **Use Specific Keys**: Prefer specific keys over large objects for better performance
2. **Structure Data**: Organize data logically with clear key naming
3. **Use Type Safety**: Define TypeScript interfaces for your data structures
4. **Cleanup Listeners**: Always return and call unsubscribe functions
5. **Avoid Large Objects**: Break large data into smaller, manageable pieces

## Migration from Other State Management

### From Context API

```typescript
// Before (Context)
const { user, setUser } = useContext(UserContext);

// After (Global Storage)
const [user, setUser] = useGlobalStorageItem('user');
```

### From Redux

```typescript
// Before (Redux)
const dispatch = useDispatch();
const user = useSelector(state => state.user);
dispatch(setUser(userData));

// After (Global Storage)
const [user, setUser] = useGlobalStorageItem('user');
setUser(userData);
```

## Error Handling

The storage system includes built-in error handling:

- Invalid keys are handled gracefully
- Type errors are caught and logged
- Persistence failures don't break the app
- Listener errors are isolated

## Testing

The storage system is designed to be testable:

```typescript
import { globalStorage } from '../stores/globalStore';

// Clear storage before each test
beforeEach(() => {
  globalStorage.clear();
});

test('should set and get values', () => {
  globalStorage.setItem('test', 'value');
  expect(globalStorage.getItem('test')).toBe('value');
});
```

## Browser Support

- Modern browsers (ES2018+)
- React 16.8+ (hooks support)
- TypeScript 4.0+ (optional)

## License

MIT License - feel free to use in any project.
