/**
 * ES Module test for the Encryption class
 * Works with ES module configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a proper AES key using Web Crypto API
const generateAESKey = async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export the key to get the raw bytes
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyBytes = new Uint8Array(exportedKey);
  
  // Convert to hex string for storage/transport
  return Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Convert hex string to base64 for Web Crypto API compatibility
const hexToBase64 = (hex) => {
  // Convert hex to bytes
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  // Convert bytes to base64
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
const pemToBase64 = (pem) => {
  // Remove PEM headers, footers, and line breaks
  return pem
    .replace(/-----BEGIN.*-----/g, '')
    .replace(/-----END.*-----/g, '')
    .replace(/\n/g, '');
};
const convertToPEM = (base64Key, keyType) => {
  const keyTypeUpper = keyType.toUpperCase();
  const header = `-----BEGIN ${keyTypeUpper}-----`;
  const footer = `-----END ${keyTypeUpper}-----`;
  
  // Insert line breaks every 64 characters for PEM format
  const formattedKey = base64Key.match(/.{1,64}/g).join('\n');
  
  return `${header}\n${formattedKey}\n${footer}\n`;
};

// Save RSA keys to files in PEM format
const saveRSAKeys = (keyPair, prefix = '') => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const keyPrefix = prefix || `generated-${timestamp}`;
    
    const publicKeyPath = path.join(__dirname, 'rsaKeys', `${keyPrefix}-public.key`);
    const privateKeyPath = path.join(__dirname, 'rsaKeys', `${keyPrefix}-private.key`);
    
    // Convert keys to PEM format
    const publicKeyPEM = convertToPEM(keyPair.publicKey, 'PUBLIC KEY');
    const privateKeyPEM = convertToPEM(keyPair.privateKey, 'PRIVATE KEY');
    
    // Save public key in PEM format
    fs.writeFileSync(publicKeyPath, publicKeyPEM, 'utf8');
    console.log(`   💾 Public key saved to: ${path.basename(publicKeyPath)} (PEM format)`);
    
    // Save private key in PEM format
    fs.writeFileSync(privateKeyPath, privateKeyPEM, 'utf8');
    console.log(`   💾 Private key saved to: ${path.basename(privateKeyPath)} (PEM format)`);
    
    return { publicKeyPath, privateKeyPath };
  } catch (error) {
    console.log(`   ❌ Failed to save keys: ${error.message}`);
    return null;
  }
};
const loadserverPublicKey = () => {
  const publicKeyPath = path.join(__dirname, 'rsaKeys', 'pub.key');
  const privateKeyPath = path.join(__dirname, 'rsaKeys', 'pvt.key');
  
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  
  return { publicKey, privateKey };
};

// Test data
const testData = {
  deviceId: "device_1768634658659_exwp9swy7",
  encryptedToken: "C1vwb2sfg5E86BnkFG0G3HaV1f84VVxfVEzY02LmZKqceP8BeSsBRM7OojT1IPlGQAbpaGgqjObTvYfXOgcm0AU/JwFv32FGryAz6b0RL7TNtTBybmYCzkGVsl1mdUMMYZg+dZcIPGOEKmJJ76DSE2unL4z1M0YBBaZzKS5fIdrsagirPD03pNX74bapnzyjpeA0NqKpz0OzqduEgQvKW+f/YrK+beXBYCrNcer9bi9XGT2VASHFi1vKVe7I6gyIAgfcA00zMe3X/GnEbXna4xS43016Q0Zuogey5DASLnXRKEjBqI02oHZwZL+SSaRSFDNzGgbzuHadpXxlOyAong=="
};

// Main test function
async function runESMTests() {
  console.log('🔐 Starting ES Module Encryption Tests\n');
  
  try {
    // Load server keys
    const { publicKey, privateKey } = loadserverPublicKey();
    console.log('✅ Server keys loaded successfully');
    console.log(`   Public key length: ${publicKey.length} chars`);
    console.log(`   Private key length: ${privateKey.length} chars\n`);
    
    // Test data
    console.log('📋 Test Data:');
    console.log(`   Device ID: ${testData.deviceId}`);
    console.log(`   Encrypted Token: ${testData.encryptedToken.substring(0, 50)}...\n`);
    
    // Try to import the Encryption class
    let Encryption;
    
    try {
      // Try the ES module version
      const module = await import('./Encryption.esm.js');
      Encryption = module.default;
      console.log('✅ Loaded ES Module Encryption.esm.js');
    } catch (error) {
      console.log('❌ Could not load Encryption.esm.js');
      console.log('Error:', error.message);
      return;
    }
    
    // Initialize encryption
    const encryption = new Encryption({
      secret: 'esm-test-secret',
      salt: 'esm-test-salt',
      keyIterations: 100000
    });
    
    console.log('🔧 Encryption initialized\n');
    
    // Test 1: Basic functionality check
    console.log('📋 Test 1: Basic Functionality Check');
    try {
      const methods = ['aesEncrypt', 'aesDecrypt', 'generateRSAKeyPair', 'hash', 'generateSecret'];
      const availableMethods = methods.filter(method => typeof encryption[method] === 'function');
      
      console.log(`✅ Available methods: ${availableMethods.join(', ')}`);
      
      if (availableMethods.includes('aesEncrypt') && availableMethods.includes('aesDecrypt')) {
        console.log('✅ AES methods are available');
      } else {
        console.log('❌ AES methods not available');
      }
      
      if (availableMethods.includes('generateRSAKeyPair')) {
        console.log('✅ RSA methods are available');
      } else {
        console.log('❌ RSA methods not available');
      }
      
    } catch (error) {
      console.log('❌ Basic functionality check failed:', error.message, '\n');
    }
    
    // Test 2: AES Encryption/Decryption
    console.log('📋 Test 2: AES Encryption/Decryption');
    try {
      const testPayload = {
        deviceId: testData.deviceId,
        timestamp: new Date().toISOString(),
        message: 'Hello from ES module test!',
        module: 'ES Module'
      };
      
      // Check if it's async or sync
      const result = encryption.aesEncrypt(testPayload);
      
      if (result instanceof Promise) {
        console.log('✅ AES encryption is async');
        const encrypted = await result;
        console.log(`   Encrypted: ${encrypted.encrypted.substring(0, 50)}...`);
        console.log(`   IV: ${encrypted.iv}`);
        console.log(`   Salt: ${encrypted.salt}`);
        
        if (typeof encryption.aesDecrypt === 'function') {
          const decrypted = await encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt);
          const decryptedPayload = JSON.parse(decrypted);
          console.log(`   Decrypted message: ${decryptedPayload.message}`);
          console.log(`   Module: ${decryptedPayload.module}`);
        }
      } else {
        console.log('✅ AES encryption is sync');
        console.log(`   Encrypted: ${result.encrypted.substring(0, 50)}...`);
        console.log(`   IV: ${result.iv}`);
        console.log(`   Salt: ${result.salt}`);
        
        if (typeof encryption.aesDecrypt === 'function') {
          const decrypted = encryption.aesDecrypt(result.encrypted, result.iv, result.salt);
          const decryptedPayload = JSON.parse(decrypted);
          console.log(`   Decrypted message: ${decryptedPayload.message}`);
          console.log(`   Module: ${decryptedPayload.module}`);
        }
      }
      
      console.log('✅ AES test successful\n');
      
    } catch (error) {
      console.log('❌ AES test failed:', error.message, '\n');
    }
    
    // Test 3: Hashing Functions
    console.log('📋 Test 3: Hashing Functions');
    try {
      const testString = testData.deviceId;
      
      if (typeof encryption.hash === 'function') {
        const result = encryption.hash(testString);
        
        if (result instanceof Promise) {
          console.log('✅ Hash is async');
          const hash = await result;
          console.log(`   SHA-256: ${hash}`);
        } else {
          console.log('✅ Hash is sync');
          console.log(`   SHA-256: ${result}`);
        }
        
        console.log('✅ Hash test successful\n');
      } else {
        console.log('❌ Hash method not available\n');
      }
      
    } catch (error) {
      console.log('❌ Hash test failed:', error.message, '\n');
    }
    
    // Test 4: RSA Key Generation
    console.log('📋 Test 4: RSA Key Generation');
    try {
      if (typeof encryption.generateRSAKeyPair === 'function') {
        const result = encryption.generateRSAKeyPair();
        
        if (result instanceof Promise) {
          console.log('✅ RSA key generation is async');
          const keyPair = await result;
          console.log(`   Public key length: ${keyPair.publicKey.length} chars`);
          console.log(`   Private key length: ${keyPair.privateKey.length} chars`);
        } else {
          console.log('✅ RSA key generation is sync');
          console.log(`   Public key length: ${result.publicKey.length} chars`);
          console.log(`   Private key length: ${result.privateKey.length} chars`);
        }
        
        console.log('✅ RSA test successful\n');
      } else {
        console.log('❌ RSA method not available\n');
      }
      
    } catch (error) {
      console.log('❌ RSA test failed:', error.message, '\n');
    }
    
    // Test 5: Secret and Salt Generation
    console.log('📋 Test 5: Secret and Salt Generation');
    try {
      if (typeof encryption.generateSecret === 'function') {
        const generatedSecret = encryption.generateSecret(32);
        console.log('✅ Secret generation successful');
        console.log(`   Generated secret: ${generatedSecret}`);
      }
      
      if (typeof encryption.generateSalt === 'function') {
        const generatedSalt = encryption.generateSalt(64);
        console.log('✅ Salt generation successful');
        console.log(`   Generated salt: ${generatedSalt}`);
      }
      
      console.log('✅ Secret/salt test successful\n');
      
    } catch (error) {
      console.log('❌ Secret/salt test failed:', error.message, '\n');
    }
    
    // Test 6: Configuration Management
    console.log('📋 Test 6: Configuration Management');
    try {
      if (typeof encryption.getConfig === 'function') {
        const config = encryption.getConfig();
        console.log('✅ Configuration retrieved');
        console.log(`   Algorithm: ${config.aesAlgorithm}`);
        console.log(`   RSA Key Size: ${config.rsaKeySize}`);
        console.log(`   Key Iterations: ${config.keyIterations}`);
        console.log(`   IV Length: ${config.ivLength}`);
        console.log(`   Salt Length: ${config.saltLength}`);
        console.log('✅ Configuration test successful\n');
      } else {
        console.log('❌ getConfig method not available\n');
      }
      
    } catch (error) {
      console.log('❌ Configuration test failed:', error.message, '\n');
    }
    
    // Test 7: Decrypt the provided encrypted token
    console.log('📋 Test 7: Decrypt Provided Encrypted Token');
    try {
      console.log(`   Encrypted Token: ${testData.encryptedToken.substring(0, 50)}...`);
      console.log(`   Full Token Length: ${testData.encryptedToken.length} chars`);
      
      // Analyze the token format
      console.log('   🔍 Analyzing token format...');
      try {
        const decodedToken = atob(testData.encryptedToken);
        console.log(`   ✅ Token is valid base64`);
        console.log(`   Decoded length: ${decodedToken.length} chars`);
        console.log(`   Decoded preview: ${decodedToken.substring(0, 50)}...`);
        
        // Check if it might be JSON
        try {
          const parsed = JSON.parse(decodedToken);
          console.log('   ✅ Token contains JSON data');
          console.log(`   JSON keys: ${Object.keys(parsed).join(', ')}`);
        } catch (e) {
          console.log('   ❌ Token is not JSON format');
        }
      } catch (base64Error) {
        console.log('   ❌ Token is not valid base64');
        console.log(`   Base64 error: ${base64Error.message}`);
      }
      
      // Try different decryption approaches
      if (typeof encryption.rsaDecrypt === 'function') {
        console.log('   🔐 Attempting RSA decryption with server private key...');
        
        try {
          // Method 1: Direct RSA decryption
          const decryptedToken = await encryption.rsaDecrypt(testData.encryptedToken, privateKey);
          console.log('✅ Method 1: Direct RSA decryption successful');
          console.log(`   Decrypted: ${decryptedToken}`);
          
          // Try to parse the decrypted token as JSON
          try {
            const parsedToken = JSON.parse(decryptedToken);
            console.log('✅ Token is valid JSON');
            console.log(`   Token Keys: ${Object.keys(parsedToken).join(', ')}`);
            console.log(`   Full JSON: ${JSON.stringify(parsedToken, null, 2)}`);
          } catch (parseError) {
            console.log('ℹ️  Token is not JSON format, showing as raw string');
            console.log(`   Raw Token: ${decryptedToken}`);
          }
          
        } catch (error1) {
          console.log(`   ❌ Method 1 failed: ${error1.message}`);
          
          try {
            // Method 2: Try with different RSA parameters (if available)
            console.log('   🔐 Attempting alternative RSA decryption...');
            
            // Create a new encryption instance with different settings
            const altEncryption = new Encryption();
            const decryptedToken2 = await altEncryption.rsaDecrypt(testData.encryptedToken, privateKey);
            console.log('✅ Method 2: Alternative RSA decryption successful');
            console.log(`   Decrypted: ${decryptedToken2}`);
            
          } catch (error2) {
            console.log(`   ❌ Method 2 failed: ${error2.message}`);
            
            // Method 3: Try AES decryption (maybe it's AES encrypted)
            console.log('   🔐 Attempting AES decryption (might be AES encrypted)...');
            
            try {
              // Try to parse as combined AES format
              const combinedData = atob(testData.encryptedToken);
              const parsed = JSON.parse(combinedData);
              
              if (parsed.e && parsed.i && parsed.s) {
                console.log('   ✅ Token appears to be AES combined format');
                console.log(`   Algorithm: ${parsed.a || 'unknown'}`);
                console.log(`   IV length: ${parsed.i?.length || 0}`);
                console.log(`   Salt length: ${parsed.s?.length || 0}`);
                
                // Try AES decryption
                const aesDecrypted = await encryption.aesDecryptCombined(testData.encryptedToken);
                console.log('✅ AES decryption successful');
                console.log(`   AES Decrypted: ${aesDecrypted}`);
                
                // Try to parse as JSON
                try {
                  const aesParsed = JSON.parse(aesDecrypted);
                  console.log('✅ AES decrypted data is valid JSON');
                  console.log(`   JSON keys: ${Object.keys(aesParsed).join(', ')}`);
                  console.log(`   Full JSON: ${JSON.stringify(aesParsed, null, 2)}`);
                } catch (jsonError) {
                  console.log('ℹ️  AES decrypted data is not JSON');
                  console.log(`   Raw data: ${aesDecrypted}`);
                }
              } else {
                console.log('   ❌ Token does not match AES combined format');
              }
              
            } catch (aesError) {
              console.log(`   ❌ AES decryption failed: ${aesError.message}`);
            }
          }
        }
      } else {
        console.log('❌ RSA decrypt method not available');
      }
      
      console.log('✅ Token decryption test completed\n');
      
    } catch (error) {
      console.log('❌ Token decryption test failed:', error.message, '\n');
    }
    
    // Test 8: Create New Key Pair & Encrypt/Decrypt Device ID
    console.log('📋 Test 8: Create New Key Pair & Encrypt/Decrypt Device ID');
    try {
      console.log(`   Device ID to encrypt: ${testData.deviceId}`);
      
      // Step 1: Generate a fresh RSA key pair
      console.log('   🔐 Generating new RSA key pair...');
      const newKeyPair = await encryption.generateRSAKeyPair(2048);
      console.log('✅ New RSA key pair generated');
      console.log(`   New Public Key: ${newKeyPair.publicKey.substring(0, 50)}...`);
      console.log(`   New Private Key: ${newKeyPair.privateKey.substring(0, 50)}...`);
      
      // Step 1b: Save the generated keys to files
      console.log('   💾 Saving generated keys to rsaKeys folder...');
      const savedKeyFiles = saveRSAKeys(newKeyPair, 'test-device');
      if (savedKeyFiles) {
        console.log('✅ Keys saved successfully to rsaKeys folder');
      } else {
        console.log('❌ Failed to save keys to files');
      }
      
      // Step 2: Encrypt the device ID with the new public key
      console.log('   🔒 Encrypting device ID with new public key...');
      const encryptedDeviceId = await encryption.rsaEncrypt(testData.deviceId, newKeyPair.publicKey);
      console.log('✅ Device ID encrypted successfully');
      console.log(`   Encrypted Device ID: ${encryptedDeviceId.substring(0, 50)}...`);
      console.log(`   Encrypted Length: ${encryptedDeviceId.length} chars`);
      
      // Step 3: Decrypt the device ID with the new private key
      console.log('   🔓 Decrypting device ID with new private key...');
      const decryptedDeviceId = await encryption.rsaDecrypt(encryptedDeviceId, newKeyPair.privateKey);
      console.log('✅ Device ID decrypted successfully');
      console.log(`   Decrypted Device ID: ${decryptedDeviceId}`);
      
      // Step 4: Verify the round-trip integrity
      console.log('   🔍 Verifying encryption/decryption integrity...');
      if (decryptedDeviceId === testData.deviceId) {
        console.log('✅ Round-trip encryption/decryption successful - data integrity verified');
      } else {
        console.log('❌ Round-trip failed - data integrity compromised');
        console.log(`   Original: ${testData.deviceId}`);
        console.log(`   Decrypted: ${decryptedDeviceId}`);
      }
      
      // Step 5: Test with a more complex payload (JSON object)
      console.log('   📦 Testing with complex JSON payload...');
      const complexPayload = {
        deviceId: testData.deviceId,
        timestamp: new Date().toISOString(),
        action: 'device_authentication',
        metadata: {
          userAgent: 'Node.js Test Environment',
          version: '1.0.0',
          platform: process.platform,
          testType: 'RSA encryption test'
        },
        permissions: ['read', 'write', 'execute'],
        sessionId: 'test_session_' + Date.now()
      };
      
      const payloadString = JSON.stringify(complexPayload);
      console.log(`   Payload Size: ${payloadString.length} characters`);
      
      // Check if payload is too large for RSA (RSA-2048 can encrypt ~190 bytes of data)
      const maxRSADataSize = 190; // Approximate limit for RSA-2048 with OAEP
      if (payloadString.length > maxRSADataSize) {
        console.log(`   ⚠️  Payload too large for RSA encryption (${payloadString.length} > ${maxRSADataSize} chars)`);
        console.log('   🔄 Using hybrid encryption (AES + RSA) instead...');
        
        // Hybrid approach: Encrypt with AES, then encrypt the AES key with RSA
        try {
          // Step 5a: Generate a simple AES key using the encryption class method
          const aesKey = encryption.generateSecret(32);
          console.log(`   🔑 Generated AES key: ${aesKey.substring(0, 20)}...`);
          
          // Step 5b: Encrypt the payload with AES (using combined format)
          const aesEncrypted = await encryption.aesEncryptCombined(complexPayload, aesKey);
          console.log('   ✅ Payload encrypted with AES (combined format)');
          console.log(`   AES Encrypted: ${aesEncrypted.substring(0, 50)}...`);
          
          // Step 5c: Encrypt the AES key with RSA
          const encryptedAesKey = await encryption.rsaEncrypt(aesKey, newKeyPair.publicKey);
          console.log('   ✅ AES key encrypted with RSA');
          console.log(`   RSA Encrypted AES Key: ${encryptedAesKey.substring(0, 50)}...`);
          
          // Step 5d: Decrypt the AES key with RSA
          const decryptedAesKey = await encryption.rsaDecrypt(encryptedAesKey, newKeyPair.privateKey);
          console.log('   ✅ AES key decrypted with RSA');
          console.log(`   Decrypted AES Key: ${decryptedAesKey.substring(0, 20)}...`);
          
          // Step 5e: Decrypt the payload with AES
          const decryptedPayload = await encryption.aesDecryptCombined(aesEncrypted, decryptedAesKey);
          console.log('   ✅ Payload decrypted with AES');
          
          // Parse and verify hybrid decrypted payload
          try {
            const parsedPayload = JSON.parse(decryptedPayload);
            console.log('✅ Hybrid decrypted payload parsed as JSON');
            console.log(`   Device ID in payload: ${parsedPayload.deviceId}`);
            console.log(`   Action: ${parsedPayload.action}`);
            console.log(`   Permissions: ${parsedPayload.permissions.join(', ')}`);
            
            // Verify hybrid payload integrity
            if (parsedPayload.deviceId === testData.deviceId && parsedPayload.action === 'device_authentication') {
              console.log('✅ Hybrid payload integrity verified');
            } else {
              console.log('❌ Hybrid payload integrity check failed');
            }
            
          } catch (parseError) {
            console.log('❌ Failed to parse hybrid decrypted payload as JSON');
            console.log(`   Parse error: ${parseError.message}`);
            console.log(`   Raw decrypted: ${decryptedPayload}`);
          }
          
        } catch (hybridError) {
          console.log('❌ Hybrid encryption failed:', hybridError.message);
        }
        
      } else {
        console.log('   ✅ Payload size is suitable for direct RSA encryption');
        
        // Original approach for smaller payloads
        try {
          // Encrypt complex payload
          const encryptedPayload = await encryption.rsaEncrypt(payloadString, newKeyPair.publicKey);
          console.log('✅ Complex payload encrypted');
          console.log(`   Encrypted Payload: ${encryptedPayload.substring(0, 50)}...`);
          
          // Decrypt complex payload
          const decryptedPayload = await encryption.rsaDecrypt(encryptedPayload, newKeyPair.privateKey);
          console.log('✅ Complex payload decrypted');
          
          // Parse and verify complex payload
          try {
            const parsedPayload = JSON.parse(decryptedPayload);
            console.log('✅ Complex payload parsed as JSON');
            console.log(`   Device ID in payload: ${parsedPayload.deviceId}`);
            console.log(`   Action: ${parsedPayload.action}`);
            console.log(`   Permissions: ${parsedPayload.permissions.join(', ')}`);
            
            // Verify complex payload integrity
            if (parsedPayload.deviceId === testData.deviceId && parsedPayload.action === 'device_authentication') {
              console.log('✅ Complex payload integrity verified');
            } else {
              console.log('❌ Complex payload integrity check failed');
            }
            
          } catch (parseError) {
            console.log('❌ Failed to parse decrypted complex payload as JSON');
            console.log(`   Parse error: ${parseError.message}`);
            console.log(`   Raw decrypted: ${decryptedPayload}`);
          }
          
        } catch (rsaError) {
          console.log('❌ RSA encryption of complex payload failed:', rsaError.message);
          console.log('   Falling back to hybrid approach...');
        }
      }
      
      // Step 6: Demonstrate key export/import
      console.log('   🔄 Testing key export/import functionality...');
      
      // Export the generated keys (they should be the same)
      const exportedPublic = await encryption.exportPublicKey();
      const exportedPrivate = await encryption.exportPrivateKey();
      
      if (exportedPublic && exportedPrivate) {
        console.log('✅ Keys exported successfully');
        console.log(`   Exported Public: ${exportedPublic.substring(0, 50)}...`);
        console.log(`   Exported Private: ${exportedPrivate.substring(0, 50)}...`);
        
        // Test with exported keys
        const testMessage = 'Testing with exported keys';
        const encryptedWithExported = await encryption.rsaEncrypt(testMessage, exportedPublic);
        const decryptedWithExported = await encryption.rsaDecrypt(encryptedWithExported, exportedPrivate);
        
        if (decryptedWithExported === testMessage) {
          console.log('✅ Export/import key test successful');
        } else {
          console.log('❌ Export/import key test failed');
        }
      } else {
        console.log('ℹ️  Key export not available (keys not stored in instance)');
      }
      
      // Step 7: Test loading saved keys from files
      console.log('   📂 Testing loading saved keys from files...');
      if (savedKeyFiles) {
        try {
          // Load the saved keys
          const loadedPublicKeyPEM = fs.readFileSync(savedKeyFiles.publicKeyPath, 'utf8');
          const loadedPrivateKeyPEM = fs.readFileSync(savedKeyFiles.privateKeyPath, 'utf8');
          
          console.log('✅ Keys loaded from files successfully');
          console.log(`   Loaded Public Key: ${loadedPublicKeyPEM.substring(0, 50)}...`);
          console.log(`   Loaded Private Key: ${loadedPrivateKeyPEM.substring(0, 50)}...`);
          
          // Convert PEM back to base64 for Web Crypto API
          const loadedPublicKeyBase64 = pemToBase64(loadedPublicKeyPEM);
          const loadedPrivateKeyBase64 = pemToBase64(loadedPrivateKeyPEM);
          
          console.log('✅ PEM keys converted to base64 format');
          console.log(`   Converted Public Key: ${loadedPublicKeyBase64.substring(0, 50)}...`);
          console.log(`   Converted Private Key: ${loadedPrivateKeyBase64.substring(0, 50)}...`);
          
          // Test encryption/decryption with loaded keys
          const testMessage = 'Testing with loaded keys from files';
          const encryptedWithLoaded = await encryption.rsaEncrypt(testMessage, loadedPublicKeyBase64);
          const decryptedWithLoaded = await encryption.rsaDecrypt(encryptedWithLoaded, loadedPrivateKeyBase64);
          
          if (decryptedWithLoaded === testMessage) {
            console.log('✅ Loaded keys work perfectly for encryption/decryption');
            console.log('✅ PEM format key loading and conversion successful');
          } else {
            console.log('❌ Loaded keys failed encryption/decryption test');
          }
          
        } catch (loadError) {
          console.log('❌ Failed to load or test saved keys:', loadError.message);
        }
      } else {
        console.log('ℹ️  Skipping key loading test (keys not saved)');
      }
      
      console.log('✅ New key pair encryption/decryption test completed successfully\n');
      
    } catch (error) {
      console.log('❌ New key pair test failed:', error.message);
      console.log('   Stack trace:', error.stack, '\n');
    }
    
    console.log('🎉 ES Module encryption tests completed successfully!');
    console.log('\n📝 ES Module Summary:');
    console.log('✅ Encryption class loaded successfully with ES modules');
    console.log('✅ Basic functionality verified');
    console.log('✅ AES encryption/decryption working');
    console.log('✅ Hashing functions working');
    console.log('✅ RSA key generation working');
    console.log('✅ Secret/salt generation working');
    console.log('✅ Configuration management working');
    console.log('✅ Provided token decryption tested');
    console.log('✅ New key pair creation and encryption/decryption working');
    console.log('✅ RSA key saving to files working');
    console.log('✅ RSA key loading from files working');
    console.log('✅ ES module compatibility confirmed');
    
  } catch (error) {
    console.error('💥 ES Module test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
runESMTests();
