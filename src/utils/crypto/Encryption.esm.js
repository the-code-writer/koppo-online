/**
 * Simple ES Module version of Encryption for testing
 * Uses Web Crypto API for browser compatibility
 */

export class Encryption {
  constructor(options = {}) {
    this._secret = options.secret || null;
    this._salt = options.salt || null;
    this._rsaKeySize = options.rsaKeySize || 2048;
    this._aesAlgorithm = options.aesAlgorithm || 'AES-GCM';
    this._ivLength = options.ivLength || 16;
    this._tagLength = options.tagLength || 16;
    this._saltLength = options.saltLength || 64;
    this._keyIterations = options.keyIterations || 100000;
    this._keyLength = 32; // 256 bits for AES-256
  }

  // Getters
  get secret() { return this._secret; }
  get salt() { return this._salt; }
  get rsaKeySize() { return this._rsaKeySize; }
  get aesAlgorithm() { return this._aesAlgorithm; }
  get ivLength() { return this._ivLength; }
  get tagLength() { return this._tagLength; }
  get saltLength() { return this._saltLength; }
  get keyIterations() { return this._keyIterations; }
  get keyLength() { return this._keyLength; }

  // Setters
  set secret(value) { this._secret = value; }
  set salt(value) { this._salt = value; }
  set rsaKeySize(value) {
    if (![1024, 2048, 4096].includes(value)) {
      throw new Error('RSA key size must be 1024, 2048, or 4096');
    }
    this._rsaKeySize = value;
  }
  set aesAlgorithm(value) {
    const validAlgorithms = ['AES-GCM', 'AES-CBC'];
    if (!validAlgorithms.includes(value)) {
      throw new Error(`Invalid AES algorithm. Must be one of: ${validAlgorithms.join(', ')}`);
    }
    this._aesAlgorithm = value;
  }
  set ivLength(value) { this._ivLength = value; }
  set tagLength(value) { this._tagLength = value; }
  set saltLength(value) { this._saltLength = value; }
  set keyIterations(value) {
    if (value < 10000) {
      throw new Error('Key iterations must be at least 10000 for security');
    }
    this._keyIterations = value;
  }

  // Utility methods
  stringToArrayBuffer(str) {
    return new TextEncoder().encode(str).buffer;
  }

  arrayBufferToString(buffer) {
    return new TextDecoder().decode(buffer);
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // RSA Key Generation
  async generateRSAKeyPair(keySize) {
    const size = keySize || this._rsaKeySize;

    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: size,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: this.arrayBufferToBase64(publicKeySpki),
      privateKey: this.arrayBufferToBase64(privateKeyPkcs8),
    };
  }

  // RSA Encryption/Decryption
  async rsaEncrypt(data, publicKey) {
    const key = publicKey || await this.exportPublicKey();
    if (!key) {
      throw new Error('Public key is required for RSA encryption');
    }

    const cryptoKey = await this.importPublicKey(key);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      cryptoKey,
      this.stringToArrayBuffer(data)
    );

    return this.arrayBufferToBase64(encrypted);
  }

  async rsaDecrypt(encryptedData, privateKey) {
    const key = privateKey || await this.exportPrivateKey();
    if (!key) {
      throw new Error('Private key is required for RSA decryption');
    }

    const cryptoKey = await this.importPrivateKey(key);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      cryptoKey,
      this.base64ToArrayBuffer(encryptedData)
    );

    return this.arrayBufferToString(decrypted);
  }

  // Key Derivation
  // Key derivation with proper CryptoKey handling
  async deriveKey(secret, salt) {
    const secretToUse = secret || this._secret;
    if (!secretToUse) {
      throw new Error('Secret is required for key derivation');
    }

    let saltBuffer;
    if (salt) {
      saltBuffer = this.hexToArrayBuffer(salt);
    } else if (this._salt) {
      saltBuffer = this.hexToArrayBuffer(this._salt);
    } else {
      saltBuffer = crypto.getRandomValues(new Uint8Array(this._saltLength)).buffer;
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretToUse),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this._keyIterations,
        hash: 'SHA-512',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, salt: saltBuffer };
  }

  // AES Encryption/Decryption
  async aesEncrypt(data, secret, salt) {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    const { key, salt: saltBuffer } = await this.deriveKey(secret, salt);
    const iv = crypto.getRandomValues(new Uint8Array(this._ivLength));

    const cryptoKey = key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer,
      },
      cryptoKey,
      this.stringToArrayBuffer(dataString)
    );

    return {
      encrypted: this.arrayBufferToHex(encrypted),
      iv: this.arrayBufferToHex(iv.buffer),
      salt: this.arrayBufferToHex(saltBuffer),
    };
  }

  async aesDecrypt(encryptedData, iv, salt, tag, secret) {
    const { key } = await this.deriveKey(secret, salt);
    const ivBuffer = this.hexToArrayBuffer(iv);

    const cryptoKey = key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      cryptoKey,
      this.hexToArrayBuffer(encryptedData)
    );

    return this.arrayBufferToString(decrypted);
  }

  // Combined AES Encryption
  async aesEncryptCombined(data, secret, salt) {
    const { encrypted, iv, salt: saltHex } = await this.aesEncrypt(data, secret, salt);

    const combined = {
      e: encrypted,
      i: iv,
      s: saltHex,
      a: this._aesAlgorithm,
    };

    return this.arrayBufferToBase64(this.stringToArrayBuffer(JSON.stringify(combined)));
  }

  async aesDecryptCombined(combinedData, secret) {
    const decoded = JSON.parse(this.arrayBufferToString(this.base64ToArrayBuffer(combinedData)));

    const originalAlgorithm = this._aesAlgorithm;
    if (decoded.a) {
      this._aesAlgorithm = decoded.a;
    }

    const decrypted = await this.aesDecrypt(decoded.e, decoded.i, decoded.s, decoded.t, secret);

    this._aesAlgorithm = originalAlgorithm;

    return decrypted;
  }

  // Hashing
  async hash(data) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', this.stringToArrayBuffer(data));
    return this.arrayBufferToHex(hashBuffer);
  }

  async hash512(data) {
    const hashBuffer = await crypto.subtle.digest('SHA-512', this.stringToArrayBuffer(data));
    return this.arrayBufferToHex(hashBuffer);
  }

  // Secret and Salt Generation
  generateSecret(length = 32) {
    const secret = this.arrayBufferToHex(crypto.getRandomValues(new Uint8Array(length)).buffer);
    this._secret = secret;
    return secret;
  }

  generateSalt(length) {
    const saltLength = length || this._saltLength;
    const salt = this.arrayBufferToHex(crypto.getRandomValues(new Uint8Array(saltLength)).buffer);
    this._salt = salt;
    return salt;
  }

  // Key Export/Import
  async exportPublicKey() {
    if (!this._publicKey) {
      return null;
    }
    const publicKeySpki = await crypto.subtle.exportKey('spki', this._publicKey);
    return this.arrayBufferToBase64(publicKeySpki);
  }

  async exportPrivateKey() {
    if (!this._privateKey) {
      return null;
    }
    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', this._privateKey);
    return this.arrayBufferToBase64(privateKeyPkcs8);
  }

  async importPublicKey(publicKey) {
    return crypto.subtle.importKey(
      'spki',
      this.base64ToArrayBuffer(publicKey),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
  }

  async importPrivateKey(privateKey) {
    return crypto.subtle.importKey(
      'pkcs8',
      this.base64ToArrayBuffer(privateKey),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt']
    );
  }

  async computeSharedSecret(peerPublicKey, curve = 'P-256') {
    if (!this._privateKey) {
      throw new Error('Private key is required. Generate E2EE key pair first.');
    }

    const peerKey = await crypto.subtle.importKey(
      'raw',
      this.base64ToArrayBuffer(peerPublicKey),
      {
        name: 'ECDH',
        namedCurve: curve,
      },
      false,
      []
    );

    this._sharedSecret = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerKey,
      },
      this._privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    return this.arrayBufferToHex(await crypto.subtle.exportKey('raw', this._sharedSecret));
  }

  async decodeEncryptionKey(encryptionKey, secret) {
    try {
      const decrypted = await this.aesDecryptCombined(encryptionKey, secret);
      const payload = JSON.parse(decrypted);
      return {
        success: true,
        payload,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateUUIDFromToken(encryptionKey) {
    const tokenHash = await this.hash(encryptionKey);
    return [
      tokenHash.substring(0, 8),
      tokenHash.substring(8, 12),
      tokenHash.substring(12, 16),
      tokenHash.substring(16, 20),
      tokenHash.substring(20, 32),
    ].join('-');
  }

  async verifyUUID(uuid, encryptionKey) {
    const expectedUUID = await this.generateUUIDFromToken(encryptionKey);
    return {
      valid: uuid === expectedUUID,
      expectedUUID,
    };
  }

  async decodeAndVerify(encryptionKey, uuid, secret) {
    const decodeResult = await this.decodeEncryptionKey(encryptionKey, secret);

    if (!decodeResult.success) {
      return {
        success: false,
        valid: false,
        error: decodeResult.error,
      };
    }

    const verifyResult = await this.verifyUUID(uuid, encryptionKey);

    return {
      success: true,
      valid: verifyResult.valid,
      payload: decodeResult.payload,
      expectedUUID: verifyResult.expectedUUID,
    };
  }

  async createVerifiablePayload(data, uuid) {
    const payloadUUID = uuid || await this.generateUUIDFromToken('temp');

    const payloadWithUUID = {
      ...data,
      uuid: payloadUUID,
    };

    const encryptionKey = await this.aesEncryptCombined(payloadWithUUID);

    return {
      encryptionKey,
      uuid: payloadUUID,
      payload: payloadWithUUID,
    };
  }

  // Configuration
  getConfig() {
    return {
      rsaKeySize: this._rsaKeySize,
      aesAlgorithm: this._aesAlgorithm,
      ivLength: this._ivLength,
      tagLength: this._tagLength,
      saltLength: this._saltLength,
      keyIterations: this._keyIterations,
    };
  }

  setConfig(config) {
    if (config.rsaKeySize) this.rsaKeySize = config.rsaKeySize;
    if (config.aesAlgorithm) this.aesAlgorithm = config.aesAlgorithm;
    if (config.ivLength) this._ivLength = config.ivLength;
    if (config.tagLength) this._tagLength = config.tagLength;
    if (config.saltLength) this._saltLength = config.saltLength;
    if (config.keyIterations) this.keyIterations = config.keyIterations;
  }

  reset() {
    this._secret = null;
    this._salt = null;
  }
}

export default Encryption;
