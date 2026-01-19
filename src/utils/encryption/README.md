# Browser-Compatible Encryption Module

This is a TypeScript version of the Node.js Encryption class, converted to work with the Web Crypto API in browser environments like Vite applications.

## Key Differences from Node.js Version

1. **Web Crypto API**: Uses browser's native Web Crypto API instead of Node.js `crypto` module
2. **ES Module**: Written as ES Module instead of CommonJS
3. **TypeScript**: Full TypeScript support with proper type definitions
4. **Async Operations**: All cryptographic operations are async (return Promises)
5. **Browser Compatibility**: Works in modern browsers that support Web Crypto API

## Basic Usage

```typescript
import Encryption from './EncryptionBrowser';

// Initialize with options
const encryption = new Encryption({
  secret: 'your-secret-key',
  salt: 'your-salt',
  keyIterations: 100000
});

// AES Encryption/Decryption
const data = { userId: '123', message: 'Hello World' };
const encrypted = await encryption.aesEncrypt(data);
const decrypted = await encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt);

// Combined AES Encryption (single string)
const combined = await encryption.aesEncryptCombined(data);
const decryptedCombined = await encryption.aesDecryptCombined(combined);

// RSA Key Generation and Encryption
await encryption.generateRSAKeyPair();
const rsaEncrypted = await encryption.rsaEncrypt('sensitive data');
const rsaDecrypted = await encryption.rsaDecrypt(rsaEncrypted);

// Hashing
const hash = await encryption.hash('data to hash');
const hash512 = await encryption.hash512('data to hash');

// Token Operations
const token = await encryption.aesEncryptCombined({ payload: 'secret' });
const decoded = await encryption.decodeEncryptionKey(token);
const uuid = await encryption.generateUUIDFromToken(token);
const verified = await encryption.verifyUUID(uuid, token);
```

## API Compatibility

This browser version maintains API compatibility with the original Node.js version. All methods that were synchronous in Node.js are now asynchronous (return Promises) in the browser version.

### Available Methods

- **AES Operations**: `aesEncrypt()`, `aesDecrypt()`, `aesEncryptCombined()`, `aesDecryptCombined()`
- **RSA Operations**: `generateRSAKeyPair()`, `rsaEncrypt()`, `rsaDecrypt()`
- **Hashing**: `hash()`, `hash512()`
- **Key Management**: `generateSecret()`, `generateSalt()`, `deriveKey()`
- **Token Operations**: `decodeEncryptionKey()`, `generateUUIDFromToken()`, `verifyUUID()`, `decodeAndVerify()`
- **Utilities**: `reset()`, `getConfig()`, `setConfig()`

## Security Notes

1. **Key Storage**: Keys are stored in memory only. Consider using a secure key management system for production
2. **Random Generation**: Uses browser's `crypto.getRandomValues()` for cryptographically secure random numbers
3. **Algorithm Support**: Supports AES-GCM and AES-CBC for symmetric encryption, RSA-OAEP for asymmetric encryption

## Browser Support

Requires a modern browser that supports the Web Crypto API:
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 79+

## Migration from Node.js Version

1. Change `require('./Encryption')` to `import Encryption from './EncryptionBrowser'`
2. Add `await` to all encryption/decryption calls
3. Update error handling for async operations

```typescript
// Node.js (synchronous)
const encrypted = enc.aesEncrypt(data);

// Browser (asynchronous)
const encrypted = await enc.aesEncrypt(data);
```
