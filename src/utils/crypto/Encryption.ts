/**
 * Encryption class for RSA key generation, AES encryption/decryption, and E2EE support
 * Browser-compatible version using Web Crypto API
 * @class Encryption
 */

export interface EncryptionOptions {
  secret?: string;
  salt?: string;
  rsaKeySize?: number;
  aesAlgorithm?: string;
  ivLength?: number;
  tagLength?: number;
  saltLength?: number;
  keyIterations?: number;
}

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface AESEncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag?: string;
}

export interface E2EEPayload {
  encryptedKey: string;
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface HybridEncryptedData {
  encryptedAESKey: string;
  iv: string;
  encryptedData: string;
}

export interface TokenDecodeResult {
  success: boolean;
  payload?: any;
  error?: string;
}

export interface UUIDVerifyResult {
  valid: boolean;
  expectedUUID: string;
}

export interface DecodeAndVerifyResult extends TokenDecodeResult {
  valid: boolean;
  expectedUUID?: string;
}

export interface TokenMetadata {
  algorithm: string;
  ivLength: number;
  saltLength: number;
  hasAuthTag: boolean;
  encryptedDataLength: number;
}

export interface TokenMetadataResult {
  success: boolean;
  metadata?: TokenMetadata;
  error?: string;
}

export interface VerifiablePayload {
  encryptionKey: string;
  uuid: string;
  payload: any;
}

class Encryption {
  private _secret: string | null = null;
  private _salt: string | null = null;
  private _rsaKeySize: number;
  private _aesAlgorithm: string;
  private _ivLength: number;
  private _tagLength: number;
  private _saltLength: number;
  private _keyIterations: number;
  private _keyLength: number = 32; // 256 bits for AES-256

  private _privateKey: CryptoKey | null = null;
  private _publicKey: CryptoKey | null = null;
  private _peerPublicKey: CryptoKey | null = null; // For E2EE - the other party's public key
  private _sharedSecret: CryptoKey | null = null; // For ECDH-based E2EE

  constructor(options: EncryptionOptions = {}) {
    this._secret = options.secret || null;
    this._salt = options.salt || null;
    this._rsaKeySize = options.rsaKeySize || 2048;
    this._aesAlgorithm = options.aesAlgorithm || 'AES-GCM';
    this._ivLength = options.ivLength || 16;
    this._tagLength = options.tagLength || 16;
    this._saltLength = options.saltLength || 64;
    this._keyIterations = options.keyIterations || 100000;
  }

  // ==================== GETTERS ====================

  get secret(): string | null {
    return this._secret;
  }

  get salt(): string | null {
    return this._salt;
  }

  get rsaKeySize(): number {
    return this._rsaKeySize;
  }

  get aesAlgorithm(): string {
    return this._aesAlgorithm;
  }

  get ivLength(): number {
    return this._ivLength;
  }

  get tagLength(): number {
    return this._tagLength;
  }

  get saltLength(): number {
    return this._saltLength;
  }

  get keyIterations(): number {
    return this._keyIterations;
  }

  get keyLength(): number {
    return this._keyLength;
  }

  // ==================== SETTERS ====================

  set secret(value: string | null) {
    this._secret = value;
  }

  set salt(value: string | null) {
    this._salt = value;
  }

  set rsaKeySize(value: number) {
    if (![1024, 2048, 4096].includes(value)) {
      throw new Error('RSA key size must be 1024, 2048, or 4096');
    }
    this._rsaKeySize = value;
  }

  set aesAlgorithm(value: string) {
    const validAlgorithms = ['AES-GCM', 'AES-CBC'];
    if (!validAlgorithms.includes(value)) {
      throw new Error(`Invalid AES algorithm. Must be one of: ${validAlgorithms.join(', ')}`);
    }
    this._aesAlgorithm = value;
  }

  set ivLength(value: number) {
    this._ivLength = value;
  }

  set tagLength(value: number) {
    this._tagLength = value;
  }

  set saltLength(value: number) {
    this._saltLength = value;
  }

  set keyIterations(value: number) {
    if (value < 10000) {
      throw new Error('Key iterations must be at least 10000 for security');
    }
    this._keyIterations = value;
  }

  // ==================== RSA KEY GENERATION ====================

  /**
   * Generate RSA key pair
   * @param {number} [keySize] - Optional key size override
   * @returns {Promise<RSAKeyPair>}
   */
  async generateRSAKeyPair(keySize?: number): Promise<RSAKeyPair> {
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

    this._publicKey = keyPair.publicKey;
    this._privateKey = keyPair.privateKey;

    const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: this.arrayBufferToBase64(publicKeySpki),
      privateKey: this.arrayBufferToBase64(privateKeyPkcs8),
    };
  }

  /**
   * Generate RSA key pair in PEM format
   * @param {number} [keySize] - Optional key size override
   * @returns {Promise<RSAKeyPair>} Keys in PEM format
   */
  async generateRSAKeyPairPEM(keySize?: number): Promise<RSAKeyPair> {
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

    this._publicKey = keyPair.publicKey;
    this._privateKey = keyPair.privateKey;

    const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKeyBase64 = this.arrayBufferToBase64(publicKeySpki);
    const privateKeyBase64 = this.arrayBufferToBase64(privateKeyPkcs8);

    // Format as PEM
    const publicKeyPEM = this.formatAsPEM(publicKeyBase64, 'PUBLIC KEY');
    const privateKeyPEM = this.formatAsPEM(privateKeyBase64, 'PRIVATE KEY');

    return {
      publicKey: publicKeyPEM,
      privateKey: privateKeyPEM,
    };
  }

  // ==================== RSA ENCRYPTION/DECRYPTION ====================

  /**
   * Encrypt data using RSA public key
   * @param {string} data - Data to encrypt
   * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  async rsaEncrypt(data: string, publicKey?: string): Promise<string> {
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

  /**
   * Decrypt data using RSA private key
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
   * @returns {Promise<string>} Decrypted data
   */
  async rsaDecrypt(encryptedData: string, privateKey?: string): Promise<string> {
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

  // ==================== AES ENCRYPTION/DECRYPTION ====================

  /**
   * Derive encryption key from secret and salt using PBKDF2
   * @param {string} [secret] - Secret to use (uses instance secret if not provided)
   * @param {string} [salt] - Salt to use (uses instance salt or generates if not provided)
   * @returns {Promise<{key: CryptoKey, salt: ArrayBuffer}>}
   */
  async deriveKey(secret?: string, salt?: string): Promise<{ key: CryptoKey; salt: ArrayBuffer }> {
    const secretToUse = secret || this._secret;
    if (!secretToUse) {
      throw new Error('Secret is required for key derivation');
    }

    let saltBuffer: ArrayBuffer;
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

  /**
   * Encrypt data using AES
   * @param {string|Object} data - Data to encrypt (objects will be JSON stringified)
   * @param {string} [secret] - Optional secret (uses instance secret if not provided)
   * @param {string} [salt] - Optional salt (uses instance salt or generates if not provided)
   * @returns {Promise<AESEncryptedData>}
   */
  async aesEncrypt(data: string | object, secret?: string, salt?: string): Promise<AESEncryptedData> {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    const { key, salt: saltBuffer } = await this.deriveKey(secret, salt);
    const iv = crypto.getRandomValues(new Uint8Array(this._ivLength));

    const cryptoKey = key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this._aesAlgorithm,
        iv: iv.buffer,
      },
      cryptoKey,
      this.stringToArrayBuffer(dataString)
    );

    const result: AESEncryptedData = {
      encrypted: this.arrayBufferToHex(encrypted),
      iv: this.arrayBufferToHex(iv.buffer),
      salt: this.arrayBufferToHex(saltBuffer),
    };

    // Add authentication tag for GCM mode
    if (this._aesAlgorithm.includes('GCM')) {
      // In Web Crypto API, the auth tag is included in the encrypted data
      // We don't need to extract it separately
    }

    return result;
  }

  /**
   * Decrypt AES encrypted data
   * @param {string} encryptedData - Hex encoded encrypted data
   * @param {string} iv - Hex encoded initialization vector
   * @param {string} salt - Hex encoded salt
   * @param {string} [tag] - Hex encoded authentication tag (required for GCM mode)
   * @param {string} [secret] - Optional secret (uses instance secret if not provided)
   * @returns {Promise<string>} Decrypted data
   */
  async aesDecrypt(encryptedData: string, iv: string, salt: string, tag?: string, secret?: string): Promise<string> {
    const { key } = await this.deriveKey(secret, salt);
    const ivBuffer = this.hexToArrayBuffer(iv);

    const cryptoKey = key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this._aesAlgorithm,
        iv: ivBuffer,
      },
      cryptoKey,
      this.hexToArrayBuffer(encryptedData)
    );

    return this.arrayBufferToString(decrypted);
  }

  /**
   * Encrypt data and return as a single combined string
   * @param {string|Object} data - Data to encrypt
   * @param {string} [secret] - Optional secret
   * @param {string} [salt] - Optional salt
   * @returns {Promise<string>} Combined encrypted string (base64)
   */
  async aesEncryptCombined(data: string | object, secret?: string, salt?: string): Promise<string> {
    const { encrypted, iv, salt: saltHex } = await this.aesEncrypt(data, secret, salt);

    const combined = {
      e: encrypted,
      i: iv,
      s: saltHex,
      a: this._aesAlgorithm,
    };

    return this.arrayBufferToBase64(this.stringToArrayBuffer(JSON.stringify(combined)));
  }

  /**
   * Decrypt a combined encrypted string
   * @param {string} combinedData - Base64 encoded combined encrypted data
   * @param {string} [secret] - Optional secret
   * @returns {Promise<string>} Decrypted data
   */
  async aesDecryptCombined(combinedData: string, secret?: string): Promise<string> {
    const decoded = JSON.parse(this.arrayBufferToString(this.base64ToArrayBuffer(combinedData)));

    // Temporarily set algorithm if different
    const originalAlgorithm = this._aesAlgorithm;
    if (decoded.a) {
      this._aesAlgorithm = decoded.a;
    }

    const decrypted = await this.aesDecrypt(decoded.e, decoded.i, decoded.s, decoded.t, secret);

    // Restore original algorithm
    this._aesAlgorithm = originalAlgorithm;

    return decrypted;
  }

  // ==================== E2EE (End-to-End Encryption) ====================

  /**
   * Generate ECDH key pair for E2EE key exchange
   * @param {string} [curve='P-256'] - Elliptic curve to use
   * @returns {Promise<RSAKeyPair>}
   */
  async generateE2EEKeyPair(curve: string = 'P-256'): Promise<RSAKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: curve,
      },
      true,
      ['deriveKey']
    );

    const publicKeySpki = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    this._publicKey = keyPair.publicKey;
    this._privateKey = keyPair.privateKey;

    return {
      publicKey: this.arrayBufferToBase64(publicKeySpki),
      privateKey: this.arrayBufferToBase64(privateKeyPkcs8),
    };
  }

  /**
   * Compute shared secret from peer's public key (ECDH)
   * @param {string} peerPublicKey - Peer's public key in base64 format
   * @param {string} [curve='P-256'] - Elliptic curve to use
   * @returns {Promise<string>} Shared secret in hex format
   */
  async computeSharedSecret(peerPublicKey: string, curve: string = 'P-256'): Promise<string> {
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

  // ==================== UTILITY METHODS ====================

  /**
   * Generate a random secret key
   * @param {number} [length=32] - Length of the secret in bytes
   * @returns {string} Hex encoded random secret
   */
  generateSecret(length: number = 32): string {
    const secret = this.arrayBufferToHex(crypto.getRandomValues(new Uint8Array(length)).buffer);
    this._secret = secret;
    return secret;
  }

  /**
   * Generate a random salt
   * @param {number} [length] - Length of the salt in bytes (uses instance saltLength if not provided)
   * @returns {string} Hex encoded random salt
   */
  generateSalt(length?: number): string {
    const saltLength = length || this._saltLength;
    const salt = this.arrayBufferToHex(crypto.getRandomValues(new Uint8Array(saltLength)).buffer);
    this._salt = salt;
    return salt;
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  async hash(data: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', this.stringToArrayBuffer(data));
    return this.arrayBufferToHex(hashBuffer);
  }

  /**
   * Hash data using SHA-512
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  async hash512(data: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-512', this.stringToArrayBuffer(data));
    return this.arrayBufferToHex(hashBuffer);
  }

  /**
   * Export public key to PEM format
   * @returns {Promise<string|null>}
   */
  async exportPublicKey(): Promise<string | null> {
    if (!this._publicKey) return null;
    const exported = await crypto.subtle.exportKey('spki', this._publicKey);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * Export private key to PEM format
   * @returns {Promise<string|null>}
   */
  async exportPrivateKey(): Promise<string | null> {
    if (!this._privateKey) return null;
    const exported = await crypto.subtle.exportKey('pkcs8', this._privateKey);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * Import public key from PEM format
   * @param {string} publicKey - PEM or base64 encoded public key
   * @returns {Promise<CryptoKey>}
   */
  async importPublicKey(publicKey: string): Promise<CryptoKey> {
    // Check if it's PEM format and convert to base64 if needed
    const base64Key = this.isPEMFormat(publicKey) ? this.pemToBase64(publicKey) : publicKey;
    
    return crypto.subtle.importKey(
      'spki',
      this.base64ToArrayBuffer(base64Key),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Import private key from PEM format
   * @param {string} privateKey - PEM or base64 encoded private key
   * @returns {Promise<CryptoKey>}
   */
  async importPrivateKey(privateKey: string): Promise<CryptoKey> {
    // Check if it's PEM format and convert to base64 if needed
    const base64Key = this.isPEMFormat(privateKey) ? this.pemToBase64(privateKey) : privateKey;
    
    return crypto.subtle.importKey(
      'pkcs8',
      this.base64ToArrayBuffer(base64Key),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt']
    );
  }

  /**
   * Check if a key is in PEM format
   * @param {string} key - Key string to check
   * @returns {boolean}
   */
  private isPEMFormat(key: string): boolean {
    return key.includes('-----BEGIN') && key.includes('-----END');
  }

  /**
   * Convert PEM format to base64
   * @param {string} pem - PEM formatted key
   * @returns {string} Base64 encoded key
   */
  private pemToBase64(pem: string): string {
    // Remove PEM header, footer, and newlines
    return pem
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\n/g, '')
      .trim();
  }

  // ==================== TOKEN/KEY DECODING & UUID VERIFICATION ====================

  /**
   * Decode an encryption key (token) back to its original payload
   * @param {string} encryptionKey - The encrypted token (base64 combined format)
   * @param {string} [secret] - Optional secret (uses instance secret if not provided)
   * @returns {Promise<TokenDecodeResult>}
   */
  async decodeEncryptionKey(encryptionKey: string, secret?: string): Promise<TokenDecodeResult> {
    try {
      const decrypted = await this.aesDecryptCombined(encryptionKey, secret);
      const payload = JSON.parse(decrypted);
      return {
        success: true,
        payload,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate UUID from an encryption key (token)
   * @param {string} encryptionKey - The encrypted token
   * @returns {Promise<string>} UUID in 8-4-4-4-12 format
   */
  async generateUUIDFromToken(encryptionKey: string): Promise<string> {
    const tokenHash = await this.hash(encryptionKey);
    return [
      tokenHash.substring(0, 8),
      tokenHash.substring(8, 12),
      tokenHash.substring(12, 16),
      tokenHash.substring(16, 20),
      tokenHash.substring(20, 32),
    ].join('-');
  }

  /**
   * Verify if a UUID matches the encryption key
   * @param {string} uuid - The UUID to verify
   * @param {string} encryptionKey - The encrypted token
   * @returns {Promise<UUIDVerifyResult>}
   */
  async verifyUUID(uuid: string, encryptionKey: string): Promise<UUIDVerifyResult> {
    const expectedUUID = await this.generateUUIDFromToken(encryptionKey);
    return {
      valid: uuid === expectedUUID,
      expectedUUID,
    };
  }

  /**
   * Decode encryption key and verify UUID in one call
   * @param {string} encryptionKey - The encrypted token
   * @param {string} uuid - The UUID to verify
   * @param {string} [secret] - Optional secret (uses instance secret if not provided)
   * @returns {Promise<DecodeAndVerifyResult>}
   */
  async decodeAndVerify(encryptionKey: string, uuid: string, secret?: string): Promise<DecodeAndVerifyResult> {
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

  /**
   * Extract token metadata without decrypting (for debugging)
   * @param {string} encryptionKey - The encrypted token (base64 combined format)
   * @returns {TokenMetadataResult}
   */
  extractTokenMetadata(encryptionKey: string): TokenMetadataResult {
    try {
      const decoded = JSON.parse(this.arrayBufferToString(this.base64ToArrayBuffer(encryptionKey)));
      return {
        success: true,
        metadata: {
          algorithm: decoded.a || 'unknown',
          ivLength: decoded.i ? decoded.i.length / 2 : 0,
          saltLength: decoded.s ? decoded.s.length / 2 : 0,
          hasAuthTag: !!decoded.t,
          encryptedDataLength: decoded.e ? decoded.e.length / 2 : 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a verifiable payload with embedded UUID
   * @param {Object} data - Data to encrypt
   * @param {string} [uuid] - Optional UUID (will generate if not provided)
   * @returns {Promise<VerifiablePayload>}
   */
  async createVerifiablePayload(data: any, uuid?: string): Promise<VerifiablePayload> {
    // Generate UUID if not provided
    const payloadUUID = uuid || await this.generateUUIDFromToken('temp');

    // Add UUID to payload
    const payloadWithUUID = {
      ...data,
      uuid: payloadUUID,
    };

    // Encrypt the payload
    const encryptionKey = await this.aesEncryptCombined(payloadWithUUID);

    return {
      encryptionKey,
      uuid: payloadUUID,
      payload: payloadWithUUID,
    };
  }

  // ==================== UTILITY METHODS FOR CONVERSION ====================

  private stringToArrayBuffer(str: string): ArrayBuffer {
    return new TextEncoder().encode(str).buffer;
  }

  private arrayBufferToString(buffer: ArrayBuffer): string {
    return new TextDecoder().decode(buffer);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Format base64 key data as PEM format
   * @param {string} base64Key - Base64 encoded key data
   * @param {string} keyType - Key type (e.g., 'PUBLIC KEY', 'PRIVATE KEY')
   * @returns {string} PEM formatted key
   */
  private formatAsPEM(base64Key: string, keyType: string): string {
    const beginLine = `-----BEGIN ${keyType}-----`;
    const endLine = `-----END ${keyType}-----`;
    
    // Split base64 into 64-character lines
    const lines = [];
    for (let i = 0; i < base64Key.length; i += 64) {
      lines.push(base64Key.substring(i, i + 64));
    }
    
    return [beginLine, ...lines, endLine].join('\n');
  }

  /**
   * Reset all keys and secrets
   */
  reset(): void {
    this._secret = null;
    this._salt = null;
    this._privateKey = null;
    this._publicKey = null;
    this._peerPublicKey = null;
    this._sharedSecret = null;
  }

  /**
   * Get configuration object
   * @returns {Object}
   */
  getConfig(): EncryptionOptions {
    return {
      rsaKeySize: this._rsaKeySize,
      aesAlgorithm: this._aesAlgorithm,
      ivLength: this._ivLength,
      tagLength: this._tagLength,
      saltLength: this._saltLength,
      keyIterations: this._keyIterations,
    };
  }

  /**
   * Set configuration from object
   * @param {EncryptionOptions} config
   */
  setConfig(config: EncryptionOptions): void {
    if (config.rsaKeySize) this.rsaKeySize = config.rsaKeySize;
    if (config.aesAlgorithm) this.aesAlgorithm = config.aesAlgorithm;
    if (config.ivLength) this._ivLength = config.ivLength;
    if (config.tagLength) this._tagLength = config.tagLength;
    if (config.saltLength) this._saltLength = config.saltLength;
    if (config.keyIterations) this.keyIterations = config.keyIterations;
  }
}

export default Encryption;
