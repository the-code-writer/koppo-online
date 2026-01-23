import { envConfig } from '../../config/env.config';
import {
  EncryptionOptions,
  RSAKeyPair,
  AESEncryptionResult,
  CombinedEncryptionPayload,
  E2EEPayload,
  DecryptionResult,
  UUIDVerificationResult,
  DecodeAndVerifyResult,
  TokenMetadata,
  MetadataResult,
  VerifiablePayload,
  AESAlgorithm,
  RSAKeySize
} from './types';

/**
 * Browser-compatible Encryption class using Web Crypto API
 * @class Encryption
 */
export class Encryption {
  private _secret: string | null;
  private _salt: string | null;
  private _rsaKeySize: RSAKeySize;
  private _aesAlgorithm: AESAlgorithm;
  private _ivLength: number;
  private _tagLength: number;
  private _saltLength: number;
  private _keyIterations: number;
  private _keyLength: number;
  private _privateKey: string | null;
  private _publicKey: string | null;
  private _peerPublicKey: string | null;
  private _sharedSecret: ArrayBuffer | null;

  constructor(options: EncryptionOptions = {}) {

    this._secret = options.secret || envConfig.VITE_ENCRYPTION_SECRET;
    this._salt = options.salt || envConfig.VITE_ENCRYPTION_SALT;
    this._rsaKeySize = (options.rsaKeySize as RSAKeySize) || 2048;
    this._aesAlgorithm = (options.aesAlgorithm as AESAlgorithm) || 'aes-256-gcm';
    this._ivLength = options.ivLength || 16;
    this._tagLength = options.tagLength || 16;
    this._saltLength = options.saltLength || 64;
    this._keyIterations = options.keyIterations || 100000;
    this._keyLength = 32; // 256 bits for AES-256

    this._privateKey = null;
    this._publicKey = null;
    this._peerPublicKey = null;
    this._sharedSecret = null;
  }

  // ==================== GETTERS ====================

  get secret() {
    return this._secret;
  }

  get salt() {
    return this._salt;
  }

  get rsaKeySize() {
    return this._rsaKeySize;
  }

  get aesAlgorithm() {
    return this._aesAlgorithm;
  }

  get ivLength() {
    return this._ivLength;
  }

  get tagLength() {
    return this._tagLength;
  }

  get saltLength() {
    return this._saltLength;
  }

  get keyIterations() {
    return this._keyIterations;
  }

  get keyLength() {
    return this._keyLength;
  }

  get privateKey() {
    return this._privateKey;
  }

  get publicKey() {
    return this._publicKey;
  }

  get peerPublicKey() {
    return this._peerPublicKey;
  }

  get sharedSecret() {
    return this._sharedSecret;
  }

  // ==================== SETTERS ====================

  set secret(value) {
    this._secret = value;
  }

  set salt(value) {
    this._salt = value;
  }

  set rsaKeySize(value) {
    if (![1024, 2048, 4096].includes(value)) {
      throw new Error('RSA key size must be 1024, 2048, or 4096');
    }
    this._rsaKeySize = value;
  }

  set aesAlgorithm(value) {
    const validAlgorithms = ['aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm', 'aes-256-cbc', 'aes-128-cbc'];
    if (!validAlgorithms.includes(value)) {
      throw new Error(`Invalid AES algorithm. Must be one of: ${validAlgorithms.join(', ')}`);
    }
    this._aesAlgorithm = value;
  }

  set ivLength(value) {
    this._ivLength = value;
  }

  set tagLength(value) {
    this._tagLength = value;
  }

  set saltLength(value) {
    this._saltLength = value;
  }

  set keyIterations(value) {
    if (value < 10000) {
      throw new Error('Key iterations must be at least 10000 for security');
    }
    this._keyIterations = value;
  }

  set privateKey(value) {
    this._privateKey = value;
  }

  set publicKey(value) {
    this._publicKey = value;
  }

  set peerPublicKey(value) {
    this._peerPublicKey = value;
  }

  // ==================== BROWSER COMPATIBLE METHODS ====================

  /**
   * Generate random bytes using Web Crypto API
   * @param {number} length - Number of bytes to generate
   * @returns {Uint8Array} Random bytes
   */
  private async generateRandomBytes(length: number): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Convert string to Uint8Array
   * @param {string} str - String to convert
   * @returns {Uint8Array} Byte array
   */
  private stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Convert Uint8Array to string
   * @param {Uint8Array} bytes - Byte array to convert
   * @returns {string} String
   */
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  /**
   * Convert Uint8Array to hex string
   * @param {Uint8Array} bytes - Byte array to convert
   * @returns {string} Hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to Uint8Array
   * @param {string} hex - Hex string to convert
   * @returns {Uint8Array} Byte array
   */
  private hexToBytes(hex: string): Uint8Array {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  }

  /**
   * Derive encryption key from secret and salt using PBKDF2
   * @param {string} [secret] - Secret to use
   * @param {string|Uint8Array} [salt] - Salt to use
   * @returns {Promise<{key: Uint8Array, salt: Uint8Array}>}
   */
  async deriveKey(secret: string | null = null, salt: string | Uint8Array | null = null): Promise<{ key: Uint8Array; salt: Uint8Array }> {
    const secretToUse = secret || this._secret;
    if (!secretToUse) {
      throw new Error('Secret is required for key derivation');
    }

    let saltBuffer: Uint8Array;
    if (salt) {
      saltBuffer = salt instanceof Uint8Array ? salt : this.hexToBytes(salt);
    } else if (this._salt) {
      saltBuffer = this._salt instanceof Uint8Array ? this._salt : this.hexToBytes(this._salt);
    } else {
      saltBuffer = await this.generateRandomBytes(this._saltLength);
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretToUse),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this._keyIterations,
        hash: 'SHA-512'
      },
      keyMaterial,
      { name: 'AES-GCM', length: this._keyLength * 8 },
      true,
      ['encrypt', 'decrypt']
    );

    const rawKey = await crypto.subtle.exportKey('raw', key);
    return { key: new Uint8Array(rawKey), salt: saltBuffer };
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string|Object} data - Data to encrypt
   * @param {string} [secret] - Optional secret
   * @param {string} [salt] - Optional salt
   * @returns {Promise<AESEncryptionResult>}
   */
  async aesEncrypt(data: string | object, secret: string | null = null, salt: string | null = null): Promise<AESEncryptionResult> {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const { key, salt: saltBuffer } = await this.deriveKey(secret, salt);
    const iv = await this.generateRandomBytes(this._ivLength);

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      'AES-GCM',
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength)
      },
      cryptoKey,
      encoder.encode(dataString)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const result: AESEncryptionResult = {
      encrypted: this.bytesToHex(encryptedArray),
      iv: this.bytesToHex(iv),
      salt: this.bytesToHex(saltBuffer)
    };

    return result;
  }

  /**
   * Decrypt AES encrypted data
   * @param {string} encryptedData - Hex encoded encrypted data
   * @param {string} iv - Hex encoded initialization vector
   * @param {string} salt - Hex encoded salt
   * @param {string} [tag] - Hex encoded authentication tag (not used in Web Crypto API)
   * @param {string} [secret] - Optional secret
   * @returns {Promise<string>} Decrypted data
   */
  async aesDecrypt(encryptedData: string, iv: string, salt: string, _tag: string | null = null, secret: string | null = null): Promise<string> {
    const { key } = await this.deriveKey(secret, salt);
    const ivBuffer = this.hexToBytes(iv);
    const encryptedBuffer = this.hexToBytes(encryptedData);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      'AES-GCM',
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      cryptoKey,
      encryptedBuffer
    );

    return this.bytesToString(new Uint8Array(decrypted));
  }

  /**
   * Generate a random secret key
   * @param {number} [length=32] - Length of the secret in bytes
   * @returns {Promise<string>} Hex encoded random secret
   */
  async generateSecret(length = 32): Promise<string> {
    const secretBytes = await this.generateRandomBytes(length);
    const secret = this.bytesToHex(secretBytes);
    this._secret = secret;
    return secret;
  }

  /**
   * Generate a random salt
   * @param {number} [length] - Length of the salt in bytes
   * @returns {Promise<string>} Hex encoded random salt
   */
  async generateSalt(length = null): Promise<string> {
    const saltLength = length || this._saltLength;
    const saltBytes = await this.generateRandomBytes(saltLength);
    const salt = this.bytesToHex(saltBytes);
    this._salt = salt;
    return salt;
  }

  /**
   * Hash data using SHA-256
   * @param {string|Uint8Array} data - Data to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  async hash(data: string | Uint8Array): Promise<string> {
    const dataBuffer = typeof data === 'string' ? this.stringToBytes(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.bytesToHex(new Uint8Array(hashBuffer));
  }

  /**
   * Hash data using SHA-512
   * @param {string|Uint8Array} data - Data to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  async hash512(data: string | Uint8Array): Promise<string> {
    const dataBuffer = typeof data === 'string' ? this.stringToBytes(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
    return this.bytesToHex(new Uint8Array(hashBuffer));
  }

  // ==================== SIMPLIFIED SYNC VERSIONS ====================
  // These provide basic functionality for simple use cases

  /**
   * Simple synchronous encryption (for demo purposes only)
   * Note: This is a simplified version for basic use cases
   * @param {string} data - Data to encrypt
   * @param {string} secret - Secret key
   * @returns {Promise<string>} Encrypted data (base64)
   */
  async simpleEncrypt(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('default-salt'),
        iterations: 1000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Simple synchronous decryption (for demo purposes only)
   * Note: This is a simplified version for basic use cases
   * @param {string} encryptedData - Encrypted data (base64)
   * @param {string} secret - Secret key
   * @returns {Promise<string>} Decrypted data
   */
  async simpleDecrypt(encryptedData: string, secret: string): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('default-salt'),
        iterations: 1000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return this.bytesToString(new Uint8Array(decrypted));
  }

  // ==================== PLACEHOLDER METHODS ====================
  // These methods are not fully implemented for browser compatibility
  // but are kept for API compatibility

  async generateRSAKeyPair(_keySize = null): Promise<RSAKeyPair> {
    throw new Error('RSA operations are not fully supported in browser environment. Use Web Crypto API directly or implement WebCrypto-based RSA.');
  }

  async rsaEncrypt(_data: string | Uint8Array, _publicKey = null): Promise<string> {
    throw new Error('RSA operations are not fully supported in browser environment.');
  }

  async rsaDecrypt(_encryptedData: string, _privateKey = null): Promise<string> {
    throw new Error('RSA operations are not fully supported in browser environment.');
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Reset all keys and secrets
   */
  reset() {
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
  getConfig() {
    return {
      rsaKeySize: this._rsaKeySize,
      aesAlgorithm: this._aesAlgorithm,
      ivLength: this._ivLength,
      tagLength: this._tagLength,
      saltLength: this._saltLength,
      keyIterations: this._keyIterations,
      keyLength: this._keyLength,
    };
  }

  /**
   * Set configuration from object
   * @param {Object} config
   */
  setConfig(config: any) {
    if (config.rsaKeySize) this.rsaKeySize = config.rsaKeySize;
    if (config.aesAlgorithm) this.aesAlgorithm = config.aesAlgorithm;
    if (config.ivLength) this._ivLength = config.ivLength;
    if (config.tagLength) this._tagLength = config.tagLength;
    if (config.saltLength) this._saltLength = config.saltLength;
    if (config.keyIterations) this.keyIterations = config.keyIterations;
  }
}
