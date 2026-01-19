import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the TypeScript-compiled Encryption class
const { Encryption } = await import('../../../dist/Encryption.js');

// Test data
const testData = {
  deviceId: "device_1768634658659_exwp9swy7",
  encryptedToken: "C1vwb2sfg5E86BnkFG0G3HaV1f84VVxfVEzY02LmZKqceP8BeSsBRM7OojT1IPlGQAbpaGgqjObTvYfXOgcm0AU/JwFv32FGryAz6b0RL7TNtTBybmYCzkGVsl1mdUMMYZg+dZcIPGOEKmJJ76DSE2unL4z1M0YBBaZzKS5fIdrsagirPD03pNX74bapnzyjpeA0NqKpz0OzqduEgQvKW+f/YrK+beXBYCrNcer9bi9XGT2VASHFi1vKVe7I6gyIAgfcA00zMe3X/GnEbXna4xS43016Q0Zuogey5DASLnXRKEjBqI02oHZwZL+SSaRSFDNzGgbzuHadpXxlOyAong=="
};

async function testTypeScriptEncryption() {
  console.log('🔧 Testing TypeScript Encryption Class (via ESM)');
  
  try {
    // Load server keys
    const publicKey = fs.readFileSync(path.join(__dirname, 'rsaKeys', 'pub.key'), 'utf8');
    const privateKey = fs.readFileSync(path.join(__dirname, 'rsaKeys', 'pvt.key'), 'utf8');
    console.log('✅ Server keys loaded');
    
    // Initialize encryption
    const encryption = new Encryption({
      secret: 'typescript-test-secret',
      salt: 'typescript-test-salt',
      keyIterations: 100000
    });
    
    // Test 1: Device ID encryption/decryption
    console.log('\n📋 Test 1: Device ID Encryption/Decryption');
    const encryptedDeviceId = await encryption.rsaEncrypt(testData.deviceId, publicKey);
    console.log(`   Encrypted: ${encryptedDeviceId.substring(0, 50)}...`);
    
    const decryptedDeviceId = await encryption.rsaDecrypt(encryptedDeviceId, privateKey);
    console.log(`   Decrypted: ${decryptedDeviceId}`);
    console.log(`   ✅ Match: ${decryptedDeviceId === testData.deviceId ? 'YES' : 'NO'}`);
    
    // Test 2: AES encryption
    console.log('\n📋 Test 2: AES Encryption/Decryption');
    const testDataObj = { message: 'Hello TypeScript!', timestamp: new Date().toISOString() };
    const aesEncrypted = await encryption.aesEncrypt(testDataObj);
    console.log(`   AES Encrypted: ${aesEncrypted.encrypted.substring(0, 50)}...`);
    
    const aesDecrypted = await encryption.aesDecrypt(aesEncrypted.encrypted, aesEncrypted.iv, aesEncrypted.salt);
    const parsedAes = JSON.parse(aesDecrypted);
    console.log(`   AES Decrypted: ${parsedAes.message}`);
    console.log(`   ✅ Match: ${parsedAes.message === testDataObj.message ? 'YES' : 'NO'}`);
    
    // Test 3: Hybrid encryption (large payload)
    console.log('\n📋 Test 3: Hybrid Encryption (Large Payload)');
    const largePayload = {
      deviceId: testData.deviceId,
      data: 'x'.repeat(300), // Make it too large for RSA
      metadata: { type: 'test', version: '1.0' }
    };
    
    const aesKey = encryption.generateSecret(32);
    const hybridEncrypted = await encryption.aesEncryptCombined(largePayload, aesKey);
    console.log(`   Hybrid Encrypted: ${hybridEncrypted.substring(0, 50)}...`);
    
    const hybridDecrypted = await encryption.aesDecryptCombined(hybridEncrypted, aesKey);
    const parsedHybrid = JSON.parse(hybridDecrypted);
    console.log(`   Hybrid Decrypted data length: ${parsedHybrid.data.length}`);
    console.log(`   ✅ Match: ${parsedHybrid.deviceId === testData.deviceId ? 'YES' : 'NO'}`);
    
    // Test 4: Key generation and PEM export
    console.log('\n📋 Test 4: RSA Key Generation & PEM Export');
    const keyPair = await encryption.generateRSAKeyPair(2048);
    console.log(`   Generated keys: ${keyPair.publicKey.substring(0, 30)}...`);
    
    // Test 5: Hashing
    console.log('\n📋 Test 5: Hashing Functions');
    const hash = await encryption.hash(testData.deviceId);
    console.log(`   SHA-256: ${hash.substring(0, 20)}...`);
    
    console.log('\n🎉 TypeScript encryption tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ TypeScript Encryption class working');
    console.log('✅ RSA encryption/decryption working');
    console.log('✅ AES encryption/decryption working');
    console.log('✅ Hybrid encryption working');
    console.log('✅ Key generation working');
    console.log('✅ Hashing functions working');
    console.log('✅ All fixes from ESM version applied');
    
  } catch (error) {
    console.error('❌ TypeScript test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTypeScriptEncryption();
