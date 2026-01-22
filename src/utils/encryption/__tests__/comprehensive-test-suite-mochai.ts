
import { expect } from 'chai';
import { EncryptionBrowser } from '../EncryptionBrowser';

describe('EncryptionBrowser Class', () => {
  let encryption: EncryptionBrowser;

  beforeEach(() => {
    encryption = new EncryptionBrowser();
  });

  describe('Constructor and Configuration', () => {
    it('should create instance with default configuration', () => {
      expect(encryption).to.be.an('object');
      expect(encryption.rsaKeySize).to.equal(2048);
      expect(encryption.aesAlgorithm).to.equal('aes-256-gcm');
      expect(encryption.ivLength).to.equal(16);
      expect(encryption.tagLength).to.equal(16);
      expect(encryption.saltLength).to.equal(64);
      expect(encryption.keyIterations).to.equal(100000);
      expect(encryption.keyLength).to.equal(64);
    });

    it('should accept custom configuration', () => {
      const customEncryption = new EncryptionBrowser({
        rsaKeySize: 4096,
        aesAlgorithm: 'aes-192-gcm',
        secret: 'test-secret',
        salt: 'test-salt',
        keyIterations: 50000
      });
      
      expect(customEncryption.rsaKeySize).to.equal(4096);
      expect(customEncryption.aesAlgorithm).to.equal('aes-192-gcm');
      expect(customEncryption.secret).to.equal('test-secret');
      expect(customEncryption.salt).to.equal('test-salt');
      expect(customEncryption.keyIterations).to.equal(50000);
    });
  });

  describe('Getters and Setters', () => {
    it('should get and set secret', () => {
      encryption.secret = 'new-secret';
      expect(encryption.secret).to.equal('new-secret');
    });

    it('should get and set salt', () => {
      encryption.salt = 'new-salt';
      expect(encryption.salt).to.equal('new-salt');
    });

    it('should validate RSA key size', () => {
      expect(() => { encryption.rsaKeySize = 1024; }).to.not.throw();
      expect(() => { encryption.rsaKeySize = 2048; }).to.not.throw();
      expect(() => { encryption.rsaKeySize = 4096; }).to.not.throw();
      expect(() => { encryption.rsaKeySize = 512; }).to.throw('RSA key size must be 1024, 2048, or 4096');
    });

    it('should validate AES algorithm', () => {
      const validAlgorithms = ['aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm', 'aes-256-cbc', 'aes-128-cbc'];
      validAlgorithms.forEach(algo => {
        expect(() => { encryption.aesAlgorithm = algo; }).to.not.throw();
      });
      
      expect(() => { encryption.aesAlgorithm = 'invalid-algo'; }).to.throw();
    });

    it('should validate key iterations', () => {
      expect(() => { encryption.keyIterations = 10000; }).to.not.throw();
      expect(() => { encryption.keyIterations = 9999; }).to.throw('Key iterations must be at least 10000 for security');
    });
  });

  describe('RSA Key Generation', () => {
    it('should generate RSA key pair synchronously', () => {
      const keys = encryption.generateRSAKeyPairSync();
      
      expect(keys).to.have.property('publicKey');
      expect(keys).to.have.property('privateKey');
      expect(keys.publicKey).to.be.a('string');
      expect(keys.privateKey).to.be.a('string');
      expect(keys.publicKey).to.include('-----BEGIN PUBLIC KEY-----');
      expect(keys.privateKey).to.include('-----BEGIN PRIVATE KEY-----');
      
      expect(encryption.publicKey).to.equal(keys.publicKey);
      expect(encryption.privateKey).to.equal(keys.privateKey);
    });

    it('should generate RSA key pair asynchronously', async () => {
      const keys = await encryption.generateRSAKeyPair();
      
      expect(keys).to.have.property('publicKey');
      expect(keys).to.have.property('privateKey');
      expect(keys.publicKey).to.be.a('string');
      expect(keys.privateKey).to.be.a('string');
      expect(keys.publicKey).to.include('-----BEGIN PUBLIC KEY-----');
      expect(keys.privateKey).to.include('-----BEGIN PRIVATE KEY-----');
    });

    it('should accept custom key size', () => {
      const keys = encryption.generateRSAKeyPairSync(1024);
      expect(keys.publicKey).to.be.a('string');
      expect(keys.privateKey).to.be.a('string');
    });
  });

  describe('RSA Encryption/Decryption', () => {
    beforeEach(() => {
      encryption.generateRSAKeyPairSync();
    });

    it('should encrypt and decrypt data using RSA', () => {
      const plaintext = 'Hello, RSA!';
      const encrypted = encryption.rsaEncrypt(plaintext);
      const decrypted = encryption.rsaDecrypt(encrypted);
      
      expect(encrypted).to.be.a('string');
      expect(encrypted).to.not.equal(plaintext);
      expect(decrypted).to.equal(plaintext);
    });

    it('should encrypt and decrypt object data', () => {
      const data = { message: 'Hello', number: 42 };
      const encrypted = encryption.rsaEncrypt(data);
      const decrypted = encryption.rsaDecrypt(encrypted);
      
      expect(decrypted).to.equal(JSON.stringify(data));
    });

    it('should work with unicode characters', () => {
      const unicodeText = 'Hello, 🔐🔑🛡️!';
      const encrypted = encryption.rsaEncrypt(unicodeText);
      const decrypted = encryption.rsaDecrypt(encrypted);
      
      expect(decrypted).to.equal(unicodeText);
    });

    it('should throw error when public key is missing', () => {
      const noKeyEncryption = new EncryptionBrowser();
      expect(() => { noKeyEncryption.rsaEncrypt('test'); }).to.throw('Public key is required for RSA encryption');
    });

    it('should throw error when private key is missing', () => {
      const noKeyEncryption = new EncryptionBrowser();
      expect(() => { noKeyEncryption.rsaDecrypt('encrypted'); }).to.throw('Private key is required for RSA decryption');
    });
  });

  describe('AES Encryption/Decryption', () => {
    beforeEach(() => {
      encryption.secret = encryption.generateSecret();
      encryption.salt = encryption.generateSalt();
    });

    it('should derive key from secret and salt', () => {
      const { key, salt } = encryption.deriveKey();
      
      expect(key).to.be.instanceOf(Buffer);
      expect(salt).to.be.instanceOf(Buffer);
      expect(key.length).to.equal(32);
      expect(salt.length).to.equal(64);
    });

    it('should encrypt and decrypt data using AES', () => {
      const plaintext = 'Hello, AES!';
      const encrypted = encryption.aesEncrypt(plaintext);
      const decrypted = encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
      
      expect(encrypted).to.have.property('encrypted');
      expect(encrypted).to.have.property('iv');
      expect(encrypted).to.have.property('salt');
      expect(encrypted).to.have.property('tag');
      
      expect(decrypted).to.equal(plaintext);
    });

    it('should encrypt and decrypt object data', () => {
      const data = { message: 'Hello', number: 42 };
      const encrypted = encryption.aesEncrypt(data);
      const decrypted = encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
      
      expect(decrypted).to.equal(JSON.stringify(data));
    });

    it('should work with combined encryption', () => {
      const plaintext = 'Hello, Combined!';
      const combined = encryption.aesEncryptCombined(plaintext);
      const decrypted = encryption.aesDecryptCombined(combined);
      
      expect(combined).to.be.a('string');
      expect(decrypted).to.equal(plaintext);
    });

    it('should throw error when secret is missing for key derivation', () => {
      const noSecretEncryption = new EncryptionBrowser();
      expect(() => { noSecretEncryption.deriveKey(); }).to.throw('Secret is required for key derivation');
    });

    it('should throw error when tag is missing for GCM mode', () => {
      const encrypted = encryption.aesEncrypt('test');
      expect(() => { encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt); }).to.throw('Authentication tag is required for GCM mode');
    });
  });

  describe('E2EE (End-to-End Encryption)', () => {
    it('should generate E2EE key pair', () => {
      const keys = encryption.generateE2EEKeyPair();
      
      expect(keys).to.have.property('publicKey');
      expect(keys).to.have.property('privateKey');
      expect(keys.publicKey).to.be.a('string');
      expect(keys.privateKey).to.be.a('string');
    });

    it('should compute shared secret', () => {
      const alice = new EncryptionBrowser();
      const bob = new EncryptionBrowser();
      
      const aliceKeys = alice.generateE2EEKeyPair();
      const bobKeys = bob.generateE2EEKeyPair();
      
      const aliceShared = alice.computeSharedSecret(bobKeys.publicKey);
      const bobShared = bob.computeSharedSecret(aliceKeys.publicKey);
      
      expect(aliceShared).to.equal(bobShared);
      expect(aliceShared).to.be.a('string');
    });

    it('should encrypt and decrypt using E2EE', () => {
      const alice = new EncryptionBrowser();
      const bob = new EncryptionBrowser();
      
      alice.generateE2EEKeyPair();
      bob.generateE2EEKeyPair();
      
      alice.computeSharedSecret(bob.publicKey);
      bob.computeSharedSecret(alice.publicKey);
      
      const message = 'Secret E2EE message';
      const encrypted = alice.e2eeEncrypt(message);
      const decrypted = bob.e2eeDecrypt(encrypted);
      
      expect(encrypted).to.be.a('string');
      expect(decrypted).to.equal(message);
    });

    it('should throw error when shared secret is not computed', () => {
      encryption.generateE2EEKeyPair();
      expect(() => { encryption.e2eeEncrypt('test'); }).to.throw('Shared secret not computed. Call computeSharedSecret first.');
      expect(() => { encryption.e2eeDecrypt('encrypted'); }).to.throw('Shared secret not computed. Call computeSharedSecret first.');
    });
  });

  describe('Hybrid Encryption', () => {
    beforeEach(() => {
      encryption.generateRSAKeyPairSync();
    });

    it('should encrypt and decrypt small data using RSA only', () => {
      const smallData = 'Small message';
      const encrypted = encryption.hybridEncrypt(smallData);
      const decrypted = encryption.hybridDecrypt(encrypted);
      
      expect(encrypted).to.be.a('string');
      expect(decrypted).to.equal(smallData);
    });

    it('should encrypt and decrypt large data using hybrid encryption', () => {
      const largeData = 'A'.repeat(200); // Larger than RSA limit
      const encrypted = encryption.hybridEncrypt(largeData);
      const decrypted = encryption.hybridDecrypt(encrypted);
      
      expect(encrypted).to.be.an('object');
      expect(encrypted).to.have.property('encryptedAESKey');
      expect(encrypted).to.have.property('iv');
      expect(encrypted).to.have.property('encryptedData');
      expect(decrypted).to.equal(largeData);
    });

    it('should handle object data in hybrid encryption', () => {
      const data = { message: 'Large object data', payload: 'x'.repeat(150) };
      const encrypted = encryption.hybridEncrypt(data);
      const decrypted = encryption.hybridDecrypt(encrypted);
      
      expect(decrypted).to.equal(JSON.stringify(data));
    });
  });

  describe('Utility Methods', () => {
    it('should generate random secret', () => {
      const secret = encryption.generateSecret();
      
      expect(secret).to.be.a('string');
      expect(secret.length).to.equal(64); // 32 bytes = 64 hex chars
      expect(encryption.secret).to.equal(secret);
    });

    it('should generate random salt', () => {
      const salt = encryption.generateSalt();
      
      expect(salt).to.be.a('string');
      expect(salt.length).to.equal(128); // 64 bytes = 128 hex chars
      expect(encryption.salt).to.equal(salt);
    });

    it('should generate custom length secret', () => {
      const secret = encryption.generateSecret(16);
      expect(secret.length).to.equal(32); // 16 bytes = 32 hex chars
    });

    it('should hash data using SHA-256', () => {
      const data = 'Hello, hash!';
      const hash = encryption.hash(data);
      
      expect(hash).to.be.a('string');
      expect(hash.length).to.equal(64); // SHA-256 produces 32 bytes = 64 hex chars
    });

    it('should hash data using SHA-512', () => {
      const data = 'Hello, hash!';
      const hash = encryption.hash512(data);
      
      expect(hash).to.be.a('string');
      expect(hash.length).to.equal(128); // SHA-512 produces 64 bytes = 128 hex chars
    });

    it('should create and verify HMAC', () => {
      encryption.secret = 'hmac-secret';
      const data = 'Hello, HMAC!';
      const hmac = encryption.hmac(data);
      
      expect(hmac).to.be.a('string');
      expect(encryption.verifyHmac(data, hmac)).to.be.true;
      expect(encryption.verifyHmac(data, 'invalid')).to.be.false;
    });

    it('should sign and verify using RSA', () => {
      encryption.generateRSAKeyPairSync();
      const data = 'Hello, signature!';
      const signature = encryption.rsaSign(data);
      
      expect(signature).to.be.a('string');
      expect(encryption.rsaVerify(data, signature)).to.be.true;
      expect(encryption.rsaVerify(data, 'invalid')).to.be.false;
    });
  });

  describe('Key Management', () => {
    it('should export and import keys', () => {
      encryption.generateRSAKeyPairSync();
      const exported = encryption.exportKeys();
      
      expect(exported).to.have.property('publicKey');
      expect(exported).to.have.property('privateKey');
      
      const newEncryption = new EncryptionBrowser();
      newEncryption.importKeys(exported);
      
      expect(newEncryption.publicKey).to.equal(encryption.publicKey);
      expect(newEncryption.privateKey).to.equal(encryption.privateKey);
    });

    it('should reset all keys and secrets', () => {
      encryption.secret = 'test-secret';
      encryption.salt = 'test-salt';
      encryption.generateRSAKeyPairSync();
      
      encryption.reset();
      
      expect(encryption.secret).to.be.undefined;
      expect(encryption.salt).to.be.undefined;
      expect(encryption.publicKey).to.be.undefined;
      expect(encryption.privateKey).to.be.undefined;
      expect(encryption.peerPublicKey).to.be.undefined;
      expect(encryption.sharedSecret).to.be.undefined;
    });

    it('should get and set configuration', () => {
      const config = encryption.getConfig();
      
      expect(config).to.have.property('rsaKeySize');
      expect(config).to.have.property('aesAlgorithm');
      expect(config).to.have.property('ivLength');
      expect(config).to.have.property('tagLength');
      expect(config).to.have.property('saltLength');
      expect(config).to.have.property('keyIterations');
      expect(config).to.have.property('keyLength');
      
      const newConfig = {
        rsaKeySize: 4096,
        aesAlgorithm: 'aes-192-gcm',
        keyIterations: 50000
      };
      
      encryption.setConfig(newConfig);
      
      expect(encryption.rsaKeySize).to.equal(4096);
      expect(encryption.aesAlgorithm).to.equal('aes-192-gcm');
      expect(encryption.keyIterations).to.equal(50000);
    });
  });

  describe('E2EE Request/Response', () => {
    beforeEach(() => {
      encryption.generateRSAKeyPairSync();
    });

    it('should create and decrypt E2EE request', () => {
      const server = new EncryptionBrowser();
      server.generateRSAKeyPairSync();
      
      const data = { message: 'Secure request', token: 'abc123' };
      const request = encryption.createE2EERequest(data, server.publicKey!);
      const decrypted = server.decryptE2EERequest(request);
      
      expect(request).to.have.property('encryptedKey');
      expect(request).to.have.property('encryptedData');
      expect(request).to.have.property('iv');
      expect(request).to.have.property('tag');
      
      expect(decrypted).to.equal(JSON.stringify(data));
    });

    it('should create and decrypt E2EE response', () => {
      const client = new EncryptionBrowser();
      client.generateRSAKeyPairSync();
      
      const data = { response: 'Secure response', status: 'success' };
      const response = encryption.createE2EEResponse(data, client.publicKey!);
      const decrypted = client.decryptE2EEResponse(response, client.privateKey!);
      
      expect(decrypted).to.equal(JSON.stringify(data));
    });
  });

  describe('Token Decoding', () => {
    beforeEach(() => {
      encryption.secret = encryption.generateSecret();
      encryption.salt = encryption.generateSalt();
    });

    it('should decode encryption key successfully', () => {
      const payload = { userId: 123, role: 'admin' };
      const token = encryption.aesEncryptCombined(payload);
      const decoded = encryption.decodeEncryptionKey(token);
      
      expect(decoded.success).to.be.true;
      expect(decoded.payload).to.deep.equal(JSON.parse(JSON.stringify(payload)));
    });

    it('should handle invalid encryption key', () => {
      const decoded = encryption.decodeEncryptionKey('invalid-token');
      
      expect(decoded.success).to.be.false;
      expect(decoded).to.have.property('error');
    });

    it('should generate UUID from token', () => {
      const payload = { data: 'test' };
      const token = encryption.aesEncryptCombined(payload);
      const uuid = encryption.generateUUIDFromToken(token);
      
      expect(uuid).to.be.a('string');
      expect(uuid).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing secret in HMAC', () => {
      expect(() => { encryption.hmac('test'); }).to.throw('Secret is required for HMAC');
    });

    it('should handle missing private key in signing', () => {
      expect(() => { encryption.rsaSign('test'); }).to.throw('Private key is required for signing');
    });

    it('should handle missing public key in verification', () => {
      expect(() => { encryption.rsaVerify('test', 'signature'); }).to.throw('Public key is required for verification');
    });

    it('should handle missing private key in E2EE request decryption', () => {
      const payload = { encryptedKey: 'test', encryptedData: 'test', iv: 'test', tag: 'test' };
      expect(() => { encryption.decryptE2EERequest(payload); }).to.throw('Private key is required for E2EE request decryption');
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle different AES algorithms', () => {
      const algorithms = ['aes-256-gcm', 'aes-256-cbc', 'aes-128-gcm'];
      
      algorithms.forEach(algo => {
        const enc = new EncryptionBrowser({
          secret: 'test-secret-12345678901234567890123456789012',
          aesAlgorithm: algo
        });
        
        const data = `Test data for ${algo}`;
        const encrypted = enc.aesEncrypt(data);
        const decrypted = enc.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
        
        expect(decrypted).to.equal(data);
      });
    });

    it('should handle unicode and special characters', () => {
      const testCases = [
        'Simple text',
        'Unicode: 🔐🔑🛡️',
        'Special chars: !@#$%^&*()',
        'Mixed: Hello 世界 🌍',
        'Emojis: 🚀🎉💻'
      ];
      
      testCases.forEach(text => {
        const encrypted = encryption.aesEncrypt(text);
        const decrypted = encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
        expect(decrypted).to.equal(text);
      });
    });

    it('should handle large data encryption', () => {
      const largeData = 'x'.repeat(10000); // 10KB
      const encrypted = encryption.aesEncrypt(largeData);
      const decrypted = encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
      
      expect(decrypted).to.equal(largeData);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle multiple encryption operations', () => {
      const operations = 100;
      const testData = 'Performance test data';
      
      for (let i = 0; i < operations; i++) {
        const encrypted = encryption.aesEncrypt(`${testData} ${i}`);
        const decrypted = encryption.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
        expect(decrypted).to.equal(`${testData} ${i}`);
      }
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      const concurrentCount = 10;
      
      for (let i = 0; i < concurrentCount; i++) {
        promises.push(new Promise((resolve) => {
          const enc = new EncryptionBrowser({ secret: `secret-${i}` });
          const data = `concurrent-test-${i}`;
          const encrypted = enc.aesEncrypt(data);
          const decrypted = enc.aesDecrypt(encrypted.encrypted, encrypted.iv, encrypted.salt, encrypted.tag);
          resolve(decrypted === data);
        }));
      }
      
      const results = await Promise.all(promises);
      expect(results.every(r => r)).to.be.true;
    });
  });
});
