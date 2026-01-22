import * as forge from "node-forge";
/**
 * Browser-compatible encryption class using Web Crypto API
 * Maintains all function names from the original Encryption.js
 */
export declare class EncryptionBrowser {
    private _secret?;
    private _salt?;
    private _rsaKeySize;
    private _aesAlgorithm;
    private _ivLength;
    private _tagLength;
    private _saltLength;
    private _keyIterations;
    private _keyLength;
    private _publicKey?;
    private _privateKey?;
    private _peerPublicKey?;
    private _sharedSecret?;
    /**
     * Creates an instance of Encryption
     * @param {Object} options - Configuration options
     * @param {string} [options.secret] - Secret key for AES encryption
     * @param {string} [options.salt] - Salt for key derivation
     * @param {number} [options.rsaKeySize=2048] - RSA key size in bits
     * @param {string} [options.aesAlgorithm='aes-256-gcm'] - AES algorithm to use
     * @param {number} [options.ivLength=16] - Initialization vector length
     * @param {number} [options.tagLength=16] - Authentication tag length for GCM
     * @param {number} [options.saltLength=64] - Salt length for key derivation
     * @param {number} [options.keyIterations=100000] - PBKDF2 iterations
     */
    constructor(options?: {
        ivLength?: number;
        tagLength?: number;
        saltLength?: number;
        keyIterations?: number;
        secret?: string;
        salt?: string;
        rsaKeySize?: number;
        aesAlgorithm?: string;
        hashAlgorithm?: string;
        encoding?: string;
    });
    /**
     * Get the secret key
     * @returns {string|null}
     */
    get secret(): string;
    /**
     * Get the salt
     * @returns {string|null}
     */
    get salt(): string;
    /**
     * Get the RSA key size
     * @returns {number}
     */
    get rsaKeySize(): number;
    /**
     * Get the AES algorithm
     * @returns {string}
     */
    get aesAlgorithm(): string;
    /**
     * Get the IV length
     * @returns {number}
     */
    get ivLength(): number;
    /**
     * Get the tag length
     * @returns {number}
     */
    get tagLength(): number;
    /**
     * Get the salt length
     * @returns {number}
     */
    get saltLength(): number;
    /**
     * Get the key iterations
     * @returns {number}
     */
    get keyIterations(): number;
    /**
     * Get the key length
     * @returns {number}
     */
    get keyLength(): number;
    /**
     * Get the private key (PEM format)
     * @returns {string|null}
     */
    get privateKey(): string;
    /**
     * Get the public key (PEM format)
     * @returns {string|null}
     */
    get publicKey(): string;
    /**
     * Get the peer's public key for E2EE
     * @returns {string|null}
     */
    get peerPublicKey(): string;
    /**
     * Get the shared secret for E2EE
     * @returns {Buffer|null}
     */
    get sharedSecret(): Buffer<ArrayBufferLike>;
    /**
     * Set the secret key
     * @param {string} value
     */
    set secret(value: string);
    /**
     * Set the salt
     * @param {string} value
     */
    set salt(value: string);
    /**
     * Set the RSA key size
     * @param {number} value
     */
    set rsaKeySize(value: number);
    /**
     * Set the AES algorithm
     * @param {string} value
     */
    set aesAlgorithm(value: string);
    /**
     * Set the IV length
     * @param {number} value
     */
    set ivLength(value: number);
    /**
     * Set the tag length
     * @param {number} value
     */
    set tagLength(value: number);
    /**
     * Set the salt length
     * @param {number} value
     */
    set saltLength(value: number);
    /**
     * Set the key iterations
     * @param {number} value
     */
    set keyIterations(value: number);
    /**
     * Set the private key
     * @param {string} value - PEM formatted private key
     */
    set privateKey(value: string);
    /**
     * Set the public key
     * @param {string} value - PEM formatted public key
     */
    set publicKey(value: string);
    /**
     * Set the peer's public key for E2EE
     * @param {string} value - PEM formatted public key
     */
    set peerPublicKey(value: string);
    /**
     * Generate RSA key pair
     * @param {number} [keySize] - Optional key size override
     * @returns {Promise<{publicKey: string, privateKey: string}>}
     */
    generateRSAKeyPair(keySize?: number): Promise<unknown>;
    /**
     * Generate RSA key pair
     * @param {number} [keySize] - Optional key size override
     * @returns {Promise<{publicKey: string, privateKey: string}>}
     */
    generateRSAKeyPair2(keySize: number, callback: any): void;
    /**
     * Generate RSA key pair synchronously
     * @param {number} [keySize] - Optional key size override
     * @returns {{publicKey: string, privateKey: string}}
     */
    generateRSAKeyPairSync(keySize?: number): {
        publicKey: string;
        privateKey: string;
    };
    /**
     * Generate RSA key pair synchronously
     * @param {number} [keySize] - Optional key size override
     * @returns {{publicKey: string, privateKey: string}}
     */
    generateRSAKeyPairSync2(keySize?: number): forge.pki.rsa.KeyPair;
    /**
     * Encrypt data using RSA public key
     * @param {string|Buffer} data - Data to encrypt
     * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
     * @returns {string} Base64 encoded encrypted data
     */
    rsaEncrypt(data: any, publicKey?: string): string;
    /**
     * Decrypt data using RSA private key
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    rsaDecrypt(encryptedData: string, privateKey?: string): string;
    /**
     * Derive encryption key from secret and salt using PBKDF2
     * @param {string} [secret] - Secret to use (uses instance secret if not provided)
     * @param {string|Buffer} [salt] - Salt to use (uses instance salt or generates if not provided)
     * @returns {{key: Buffer, salt: Buffer}}
     */
    deriveKey(secret?: string, salt?: string | Uint8Array): {
        key: Buffer<ArrayBuffer>;
        salt: Buffer<ArrayBuffer>;
    };
    /**
     * Encrypt data using AES
     * @param {string|Object} data - Data to encrypt (objects will be JSON stringified)
     * @param {string} [secret] - Optional secret (uses instance secret if not provided)
     * @param {string} [salt] - Optional salt (uses instance salt or generates if not provided)
     * @returns {{encrypted: string, iv: string, salt: string, tag?: string}}
     */
    aesEncrypt(data: any, secret?: string, salt?: string): {
        encrypted: string;
        iv: string;
        salt: string;
        tag?: string;
    };
    /**
     * Decrypt AES encrypted data
     * @param {string} encryptedData - Hex encoded encrypted data
     * @param {string} iv - Hex encoded initialization vector
     * @param {string} salt - Hex encoded salt
     * @param {string} [tag] - Hex encoded authentication tag (required for GCM mode)
     * @param {string} [secret] - Optional secret (uses instance secret if not provided)
     * @returns {string} Decrypted data
     */
    aesDecrypt(encryptedData: string, iv: string, salt: string, tag?: string, secret?: string): string;
    /**
     * Encrypt data and return as a single combined string
     * @param {string|Object} data - Data to encrypt
     * @param {string} [secret] - Optional secret
     * @param {string} [salt] - Optional salt
     * @returns {string} Combined encrypted string (base64)
     */
    aesEncryptCombined(data: any, secret?: string, salt?: string): string;
    /**
     * Decrypt a combined encrypted string
     * @param {string} combinedData - Base64 encoded combined encrypted data
     * @param {string} [secret] - Optional secret
     * @returns {string} Decrypted data
     */
    aesDecryptCombined(combinedData: string, secret?: string): string;
    /**
     * Generate ECDH key pair for E2EE key exchange
     * @param {string} [curve='prime256v1'] - Elliptic curve to use
     * @returns {{publicKey: string, privateKey: string}}
     */
    generateE2EEKeyPair(): {
        publicKey: string;
        privateKey: string;
    };
    /**
     * Compute shared secret from peer's public key (ECDH)
     * @param {string} peerPublicKey - Peer's public key in hex format
     * @param {string} [curve='prime256v1'] - Elliptic curve to use
     * @returns {string} Shared secret in hex format
     */
    computeSharedSecret(peerPublicKey: string): string;
    /**
     * Encrypt data for E2EE transmission
     * Uses the shared secret derived from ECDH key exchange
     * @param {string|Object} data - Data to encrypt
     * @returns {string} Encrypted payload (base64)
     */
    e2eeEncrypt(data: any): string;
    /**
     * Decrypt E2EE encrypted data
     * @param {string} encryptedPayload - Base64 encoded encrypted payload
     * @returns {string} Decrypted data
     */
    e2eeDecrypt(encryptedPayload: string): string;
    /**
     * Create an E2EE encrypted request payload for API interaction
     * Includes RSA-encrypted session key for hybrid encryption
     * @param {string|Object} data - Data to encrypt
     * @param {string} serverPublicKey - Server's RSA public key (PEM format)
     * @returns {{encryptedKey: string, encryptedData: string, iv: string, tag: string}}
     */
    createE2EERequest(data: any, serverPublicKey: string): {
        encryptedKey: string;
        encryptedData: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt an E2EE request payload (server-side)
     * @param {{encryptedKey: string, encryptedData: string, iv: string, tag: string}} payload
     * @param {string} [privateKey] - Server's RSA private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    decryptE2EERequest(payload: any, privateKey?: string): string;
    /**
     * Create an E2EE encrypted response payload for API interaction
     * @param {string|Object} data - Data to encrypt
     * @param {string} clientPublicKey - Client's RSA public key (PEM format)
     * @returns {{encryptedKey: string, encryptedData: string, iv: string, tag: string}}
     */
    createE2EEResponse(data: any, clientPublicKey: string): {
        encryptedKey: string;
        encryptedData: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt an E2EE response payload (client-side)
     * @param {{encryptedKey: string, encryptedData: string, iv: string, tag: string}} payload
     * @param {string} [privateKey] - Client's RSA private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    decryptE2EEResponse(payload: any, privateKey: string): string;
    /**
     * Generate a random secret key
     * @param {number} [length=32] - Length of the secret in bytes
     * @returns {string} Hex encoded random secret
     */
    generateSecret(length?: number): string;
    /**
     * Generate a random salt
     * @param {number} [length] - Length of the salt in bytes (uses instance saltLength if not provided)
     * @returns {string} Hex encoded random salt
     */
    generateSalt(length?: any): string;
    /**
     * Hash data using SHA-256
     * @param {string|Buffer} data - Data to hash
     * @returns {string} Hex encoded hash
     */
    hash(data: any): string;
    /**
     * Hash data using SHA-512
     * @param {string|Buffer} data - Data to hash
     * @returns {string} Hex encoded hash
     */
    hash512(data: any): string;
    /**
     * Create HMAC signature
     * @param {string|Buffer} data - Data to sign
     * @param {string} [secret] - Secret key (uses instance secret if not provided)
     * @returns {string} Hex encoded HMAC
     */
    hmac(data: any, secret?: string): string;
    /**
     * Verify HMAC signature
     * @param {string|Buffer} data - Original data
     * @param {string} signature - HMAC signature to verify
     * @param {string} [secret] - Secret key (uses instance secret if not provided)
     * @returns {boolean} True if signature is valid
     */
    verifyHmac(data: any, signature: string, secret?: string): boolean;
    /**
     * Sign data using RSA private key
     * @param {string|Buffer} data - Data to sign
     * @param {string} [privateKey] - Private key (uses instance key if not provided)
     * @returns {string} Base64 encoded signature
     */
    rsaSign(data: any, privateKey?: string): string;
    /**
     * Verify RSA signature
     * @param {string|Buffer} data - Original data
     * @param {string} signature - Base64 encoded signature
     * @param {string} [publicKey] - Public key (uses instance key if not provided)
     * @returns {boolean} True if signature is valid
     */
    rsaVerify(data: any, signature: string, publicKey?: string): boolean;
    /**
     * Export keys to JSON format
     * @returns {{publicKey: string|null, privateKey: string|null}}
     */
    exportKeys(): {
        publicKey: string;
        privateKey: string;
    };
    /**
     * Import keys from JSON format
     * @param {{publicKey?: string, privateKey?: string}} keys
     */
    importKeys(keys: any): void;
    /**
     * Reset all keys and secrets
     */
    reset(): void;
    /**
     * Get configuration object
     * @returns {Object}
     */
    getConfig(): {
        rsaKeySize: number;
        aesAlgorithm: string;
        ivLength: number;
        tagLength: number;
        saltLength: number;
        keyIterations: number;
        keyLength: number;
    };
    /**
     * Set configuration from object
     * @param {Object} config
     */
    setConfig(config: any): void;
    /**
     * Generate random AES key for hybrid encryption
     * @returns {Buffer} 256-bit AES key
     */
    generateAESKey(): Buffer<ArrayBuffer>;
    /**
     * Encrypt data with AES-256-CBC
     * @param {string} data - Data to encrypt
     * @param {Buffer} key - AES key (32 bytes)
     * @returns {{iv: string, encryptedData: string}} IV and encrypted data
     */
    encryptWithAES(data: any, key: any): {
        iv: string;
        encryptedData: string;
    };
    /**
     * Decrypt data with AES-256-CBC
     * @param {string} encryptedData - Hex encoded encrypted data
     * @param {Buffer} key - AES key (32 bytes)
     * @param {string} iv - Hex encoded IV
     * @returns {string} Decrypted data
     */
    decryptWithAES(encryptedData: string, key: any, iv: string): string;
    /**
     * Encrypt AES key with RSA public key
     * @param {Buffer} aesKey - AES key to encrypt
     * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
     * @returns {string} Base64 encoded encrypted AES key
     */
    encryptAESKeyWithRSA(aesKey: any, publicKey?: string): string;
    /**
     * Decrypt AES key with RSA private key
     * @param {string} encryptedAESKey - Base64 encoded encrypted AES key
     * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
     * @returns {Buffer} Decrypted AES key
     */
    decryptAESKeyWithRSA(encryptedAESKey: string, privateKey?: string): Buffer<ArrayBuffer>;
    /**
     * Hybrid encryption: AES for data + RSA for AES key
     * Automatically handles large data by using hybrid encryption
     * @param {string|Object} data - Data to encrypt
     * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
     * @returns {string|Object} Base64 string for small data, or object for hybrid encryption
     */
    hybridEncrypt(data: any, publicKey: string): string | {
        encryptedAESKey: string;
        iv: string;
        encryptedData: string;
    };
    /**
     * Hybrid decryption: RSA for AES key + AES for data
     * Automatically detects and handles both RSA and hybrid encryption
     * @param {string|Object} encryptedInput - Encrypted data (string or object)
     * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    hybridDecrypt(encryptedInput: any, privateKey: string): string;
    /**
     * Decode an encryption key (token) back to its original payload
     * @param {string} encryptionKey - The encrypted token (base64 combined format)
     * @param {string} [secret] - Optional secret (uses instance secret if not provided)
     * @returns {{success: boolean, payload?: Object, error?: string}}
     */
    decodeEncryptionKey(encryptionKey: string, secret: string): {
        success: boolean;
        payload: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        payload?: undefined;
    };
    /**
     * Generate UUID from an encryption key (token)
     * @param {string} encryptionKey - The encrypted token
     * @returns {string} UUID in 8-4-4-4-12 format
     */
    generateUUIDFromToken(encryptionKey: string): string;
    /**
     * Verify if a UUID matches the encryption key
     * @param {string} uuid - The UUID to verify
     * @param {string} encryptionKey - The encrypted token
     * @returns {{valid: boolean, expectedUUID: string}}
     */
    verifyUUID(uuid: string, encryptionKey: string): {
        valid: boolean;
        expectedUUID: string;
    };
    /**
     * Decode encryption key and verify UUID in one call
     * @param {string} encryptionKey - The encrypted token
     * @param {string} uuid - The UUID to verify
     * @param {string} [secret] - Optional secret (uses instance secret if not provided)
     * @returns {{success: boolean, valid: boolean, payload?: Object, expectedUUID?: string, error?: string}}
     */
    decodeAndVerify(encryptionKey: string, uuid: string, secret: string): {
        success: boolean;
        valid: boolean;
        error: any;
        payload?: undefined;
        expectedUUID?: undefined;
    } | {
        success: boolean;
        valid: boolean;
        payload: any;
        expectedUUID: string;
        error?: undefined;
    };
    /**
     * Extract token metadata without decrypting (for debugging)
     * @param {string} encryptionKey - The encrypted token (base64 combined format)
     * @returns {{success: boolean, metadata?: Object, error?: string}}
     */
    extractTokenMetadata(encryptionKey: string): {
        success: boolean;
        metadata: {
            algorithm: any;
            ivLength: number;
            saltLength: number;
            hasAuthTag: boolean;
            encryptedDataLength: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        metadata?: undefined;
    };
    /**
     * Find UUID in payload (helper method for verification)
     * @param {Object} payload - Payload to search
     * @param {string[]} [fieldNames] - Custom field names to search
     * @returns {string|null} Found UUID or null
     */
    findUUIDInPayload(payload: any, fieldNames?: string[]): any;
    /**
     * Create a verifiable payload with embedded UUID
     * @param {Object} data - Data to encrypt
     * @param {string} [uuid] - Optional UUID (will generate if not provided)
     * @returns {{encryptionKey: string, uuid: string, payload: Object}}
     */
    createVerifiablePayload(data: any, uuid: string): {
        encryptionKey: string;
        uuid: string;
        payload: any;
    };
}
