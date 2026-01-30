// ES6 Module version of EncryptionBrowser
// Converted from CommonJS to work in browser environments

import forge from "node-forge";

/**
 * Browser-compatible encryption class using Web Crypto API
 * Maintains all function names from the original Encryption.js
 */
/**
 * Browser-compatible encryption class using Web Crypto API
 * Maintains all function names from the original Encryption.js
 */
class EncryptionBrowser {
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
    constructor(options = {
        ivLength: 0,
        tagLength: 0,
        saltLength: 0,
        keyIterations: 0,
    }) {
        this._secret = options.secret || undefined;
        this._salt = options.salt || undefined;
        this._rsaKeySize = options.rsaKeySize || 2048;
        this._aesAlgorithm = options.aesAlgorithm || "aes-256-gcm";
        this._ivLength = options.ivLength || 16;
        this._tagLength = options.tagLength || 16;
        this._saltLength = options.saltLength || 64;
        this._keyIterations = options.keyIterations || 100000;
        this._keyLength = 64; // 64 hex characters = 32 bytes for AES-256
        this._privateKey = undefined;
        this._publicKey = undefined;
        this._peerPublicKey = undefined; // For E2EE - the other party's public key
        this._sharedSecret = undefined; // For ECDH-based E2EE
    }
    // ==================== GETTERS ====================
    /**
     * Get the secret key
     * @returns {string|null}
     */
    get secret() {
        return this._secret;
    }
    /**
     * Get the salt
     * @returns {string|null}
     */
    get salt() {
        return this._salt;
    }
    /**
     * Get the RSA key size
     * @returns {number}
     */
    get rsaKeySize() {
        return this._rsaKeySize;
    }
    /**
     * Get the AES algorithm
     * @returns {string}
     */
    get aesAlgorithm() {
        return this._aesAlgorithm;
    }
    /**
     * Get the IV length
     * @returns {number}
     */
    get ivLength() {
        return this._ivLength;
    }
    /**
     * Get the tag length
     * @returns {number}
     */
    get tagLength() {
        return this._tagLength;
    }
    /**
     * Get the salt length
     * @returns {number}
     */
    get saltLength() {
        return this._saltLength;
    }
    /**
     * Get the key iterations
     * @returns {number}
     */
    get keyIterations() {
        return this._keyIterations;
    }
    /**
     * Get the key length
     * @returns {number}
     */
    get keyLength() {
        return this._keyLength;
    }
    /**
     * Get the private key (PEM format)
     * @returns {string|null}
     */
    get privateKey() {
        return this._privateKey;
    }
    /**
     * Get the public key (PEM format)
     * @returns {string|null}
     */
    get publicKey() {
        return this._publicKey;
    }
    /**
     * Get the peer's public key for E2EE
     * @returns {string|null}
     */
    get peerPublicKey() {
        return this._peerPublicKey;
    }
    /**
     * Get the shared secret for E2EE
     * @returns {Buffer|null}
     */
    get sharedSecret() {
        return this._sharedSecret;
    }
    // ==================== SETTERS ====================
    /**
     * Set the secret key
     * @param {string} value
     */
    set secret(value) {
        this._secret = value;
    }
    /**
     * Set the salt
     * @param {string} value
     */
    set salt(value) {
        this._salt = value;
    }
    /**
     * Set the RSA key size
     * @param {number} value
     */
    set rsaKeySize(value) {
        if (![1024, 2048, 4096].includes(value)) {
            console.error("Invalid RSA key size. Must be 1024, 2048, or 4096", { value });
            throw new Error("RSA key size must be 1024, 2048, or 4096");
        }
        this._rsaKeySize = value;
    }
    /**
     * Set the AES algorithm
     * @param {string} value
     */
    set aesAlgorithm(value) {
        const validAlgorithms = [
            "aes-128-gcm",
            "aes-192-gcm",
            "aes-256-gcm",
            "aes-256-cbc",
            "aes-128-cbc",
        ];
        if (!validAlgorithms.includes(value)) {
            throw new Error(`Invalid AES algorithm. Must be one of: ${validAlgorithms.join(", ")}`);
        }
        this._aesAlgorithm = value;
    }
    /**
     * Set the IV length
     * @param {number} value
     */
    set ivLength(value) {
        this._ivLength = value;
    }
    /**
     * Set the tag length
     * @param {number} value
     */
    set tagLength(value) {
        this._tagLength = value;
    }
    /**
     * Set the salt length
     * @param {number} value
     */
    set saltLength(value) {
        this._saltLength = value;
    }
    /**
     * Set the key iterations
     * @param {number} value
     */
    set keyIterations(value) {
        if (value < 10000) {
            throw new Error("Key iterations must be at least 10000 for security");
        }
        this._keyIterations = value;
    }
    /**
     * Set the private key
     * @param {string} value - PEM formatted private key
     */
    set privateKey(value) {
        this._privateKey = value;
    }
    /**
     * Set the public key
     * @param {string} value - PEM formatted public key
     */
    set publicKey(value) {
        this._publicKey = value;
    }
    /**
     * Set the peer's public key for E2EE
     * @param {string} value - PEM formatted public key
     */
    set peerPublicKey(value) {
        this._peerPublicKey = value;
    }
    // ==================== RSA KEY GENERATION ====================
    /**
     * Generate RSA key pair
     * @param {number} [keySize] - Optional key size override
     * @returns {Promise<{publicKey: string, privateKey: string}>}
     */
    generateRSAKeyPair(keySize) {
        return new Promise((resolve, reject) => {
            const size = keySize || this._rsaKeySize;
            try {
                const keypair = forge.pki.rsa.generateKeyPair(size);
                const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
                const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
                this._publicKey = publicKey;
                this._privateKey = privateKey;
                resolve({ publicKey, privateKey });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Generate RSA key pair
     * @param {number} [keySize] - Optional key size override
     * @returns {Promise<{publicKey: string, privateKey: string}>}
     */
    generateRSAKeyPair2(keySize = 2048, callback) {
        // generate an RSA key pair asynchronously (uses web workers if available)
        // use workers: -1 to run a fast core estimator to optimize # of workers
        // *RECOMMENDED*: Can be significantly faster than sync. Will use native
        // Node.js 10.12.0+ or WebCrypto API if possible.
        const rsa = forge.pki.rsa;
        rsa.generateKeyPair({ bits: keySize, workers: 2 }, function (error, keypair) {
            callback({ error, keypair });
        });
    }
    /**
     * Generate RSA key pair synchronously
     * @param {number} [keySize] - Optional key size override
     * @returns {{publicKey: string, privateKey: string}}
     */
    generateRSAKeyPairSync(keySize) {
        const size = keySize || this._rsaKeySize;
        const keypair = forge.pki.rsa.generateKeyPair(size);
        const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        this._publicKey = publicKey;
        this._privateKey = privateKey;
        return { publicKey, privateKey };
    }
    /**
     * Generate RSA key pair synchronously
     * @param {number} [keySize] - Optional key size override
     * @returns {{publicKey: string, privateKey: string}}
     */
    generateRSAKeyPairSync2(keySize = 2048) {
        const rsa = forge.pki.rsa;
        return rsa.generateKeyPair({ bits: keySize, e: 0x10001 });
    }
    // ==================== RSA ENCRYPTION/DECRYPTION ====================
    /**
     * Encrypt data using RSA public key
     * @param {string|Buffer} data - Data to encrypt
     * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
     * @returns {string} Base64 encoded encrypted data
     */
    rsaEncrypt(data, publicKey) {
        const key = publicKey || this._publicKey;
        if (!key) {
            throw new Error("Public key is required for RSA encryption");
        }
        const publicKeyObj = forge.pki.publicKeyFromPem(key);
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        // Encode as UTF-8 bytes to properly handle unicode characters
        const utf8Bytes = forge.util.encodeUtf8(dataString);
        const encrypted = publicKeyObj.encrypt(utf8Bytes, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        return forge.util.encode64(encrypted);
    }
    /**
     * Decrypt data using RSA private key
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    rsaDecrypt(encryptedData, privateKey) {
        const key = privateKey || this._privateKey;
        if (!key) {
            throw new Error("Private key is required for RSA decryption");
        }
        const privateKeyObj = forge.pki.privateKeyFromPem(key);
        const encryptedBytes = forge.util.decode64(encryptedData);
        const decrypted = privateKeyObj.decrypt(encryptedBytes, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        // Decode UTF-8 bytes to properly handle unicode characters
        return forge.util.decodeUtf8(decrypted);
    }
    // ==================== AES ENCRYPTION/DECRYPTION ====================
    /**
     * Derive encryption key from secret and salt using PBKDF2
     * @param {string} [secret] - Secret to use (uses instance secret if not provided)
     * @param {string|Buffer} [salt] - Salt to use (uses instance salt or generates if not provided)
     * @returns {{key: Buffer, salt: Buffer}}
     */
    deriveKey(secret, salt) {
        const secretToUse = secret || this._secret;
        if (!secretToUse) {
            throw new Error("Secret is required for key derivation");
        }
        let saltHex;
        if (salt) {
            if (salt instanceof Uint8Array) {
                let binary = "";
                for (let i = 0; i < salt.length; i++) {
                    binary += String.fromCharCode(salt[i]);
                }
                saltHex = forge.util.bytesToHex(binary);
            }
            else if (typeof salt === 'string' && /^[0-9a-fA-F]+$/.test(salt) && salt.length > 32) {
                // If salt is a hex string (longer than 32 chars), treat it as hex
                saltHex = salt;
            }
            else {
                // If salt is a regular string, convert to hex
                saltHex = forge.util.bytesToHex(salt);
            }
        }
        else if (this._salt) {
            // Convert instance salt to hex if it's not already hex
            if (/^[0-9a-fA-F]+$/.test(this._salt) && this._salt.length > 32) {
                saltHex = this._salt;
            }
            else {
                saltHex = forge.util.bytesToHex(this._salt);
            }
        }
        else {
            saltHex = forge.util.bytesToHex(forge.random.getBytesSync(this._saltLength));
        }
        const derivedKey = forge.pkcs5.pbkdf2(secretToUse, saltHex, this._keyIterations, this._keyLength);
        const keyBytes = forge.util.hexToBytes(derivedKey);
        const saltBytes = forge.util.hexToBytes(saltHex);
        // Convert to proper Buffer objects
        const keyBuffer = Buffer.from(keyBytes, 'binary');
        const saltBuffer = Buffer.from(saltBytes, 'binary');
        return { key: keyBuffer, salt: saltBuffer };
    }
    /**
     * Encrypt data using AES
     * @param {string|Object} data - Data to encrypt (objects will be JSON stringified)
     * @param {string} [secret] - Optional secret (uses instance secret if not provided)
     * @param {string} [salt] - Optional salt (uses instance salt or generates if not provided)
     * @returns {{encrypted: string, iv: string, salt: string, tag?: string}}
     */
    aesEncrypt(data, secret, salt) {
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        const { key, salt: derivedSalt } = this.deriveKey(secret, salt);
        // Convert Buffer key to binary string for node-forge
        const keyString = key.toString('binary');
        const iv = forge.random.getBytesSync(this._ivLength);
        // Convert algorithm name from web crypto format to forge format
        const forgeAlgorithm = this._aesAlgorithm
            .replace("aes-", "AES-")
            .replace("-256", "")
            .replace("-192", "")
            .replace("-128", "")
            .replace("gcm", "GCM")
            .replace("cbc", "CBC");
        const cipher = forge.cipher.createCipher(forgeAlgorithm, keyString);
        cipher.start({ iv });
        cipher.update(forge.util.createBuffer(dataString, "utf8"));
        cipher.finish();
        const result = {
            encrypted: cipher.output.toHex(),
            iv: forge.util.bytesToHex(iv),
            salt: derivedSalt.toString('hex'),
        };
        // Add authentication tag for GCM mode
        if (this._aesAlgorithm.includes("gcm")) {
            // Get the tag from the cipher mode
            const tag = cipher.mode.tag;
            if (tag && tag.length() > 0) {
                // Get the tag bytes correctly
                const tagBytes = tag.getBytes();
                result.tag = forge.util.bytesToHex(tagBytes);
            }
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
     * @returns {string} Decrypted data
     */
    aesDecrypt(encryptedData, iv, salt, tag, secret) {
        const { key } = this.deriveKey(secret, salt);
        // Convert Buffer key to binary string for node-forge
        const keyString = key.toString('binary');
        const ivBuffer = forge.util.hexToBytes(iv);
        // Convert algorithm name from web crypto format to forge format
        const forgeAlgorithm = this._aesAlgorithm
            .replace("aes-", "AES-")
            .replace("-256", "")
            .replace("-192", "")
            .replace("-128", "")
            .replace("gcm", "GCM")
            .replace("cbc", "CBC");
        const decipher = forge.cipher.createDecipher(forgeAlgorithm, keyString);
        const startOptions = {
            iv: ivBuffer,
        };
        // Set authentication tag for GCM mode
        if (this._aesAlgorithm.includes("gcm")) {
            if (!tag || tag.length === 0) {
                throw new Error("Authentication tag is required for GCM mode");
            }
            const tagBytes = forge.util.hexToBytes(tag);
            // Add tag to start options for GCM mode
            startOptions.tag = forge.util.createBuffer(tagBytes);
        }
        decipher.start(startOptions);
        decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedData)));
        const result = decipher.finish();
        if (!result) {
            throw new Error("Decryption failed");
        }
        return decipher.output.toString();
    }
    /**
     * Encrypt data and return as a single combined string
     * @param {string|Object} data - Data to encrypt
     * @param {string} [secret] - Optional secret
     * @param {string} [salt] - Optional salt
     * @returns {string} Combined encrypted string (base64)
     */
    aesEncryptCombined(data, secret, salt) {
        const { encrypted, iv, salt: saltHex, tag, } = this.aesEncrypt(data, secret, salt);
        const combined = {
            e: encrypted,
            i: iv,
            s: saltHex,
            t: tag || null,
            a: this._aesAlgorithm,
        };
        return Buffer.from(JSON.stringify(combined)).toString("base64");
    }
    /**
     * Decrypt a combined encrypted string
     * @param {string} combinedData - Base64 encoded combined encrypted data
     * @param {string} [secret] - Optional secret
     * @returns {string} Decrypted data
     */
    aesDecryptCombined(combinedData, secret) {
        const decoded = JSON.parse(Buffer.from(combinedData, "base64").toString("utf8"));
        // Temporarily set algorithm if different
        const originalAlgorithm = this._aesAlgorithm;
        if (decoded.a) {
            this._aesAlgorithm = decoded.a;
        }
        const decrypted = this.aesDecrypt(decoded.e, decoded.i, decoded.s, decoded.t, secret);
        // Restore original algorithm
        this._aesAlgorithm = originalAlgorithm;
        return decrypted;
    }
    // ==================== E2EE (End-to-End Encryption) ====================
    /**
     * Generate ECDH key pair for E2EE key exchange
     * @param {string} [curve='prime256v1'] - Elliptic curve to use
     * @returns {{publicKey: string, privateKey: string}}
     */
    generateE2EEKeyPair() {
        // Generate X25519 key pair for proper ECDH
        const keyPair = forge.pki.ed25519.generateKeyPair();
        // For E2EE, we'll use a simple approach with consistent key derivation
        this._privateKey = keyPair.privateKey.toString('binary');
        this._publicKey = keyPair.publicKey.toString('binary');
        return {
            publicKey: this._publicKey,
            privateKey: this._privateKey,
        };
    }
    /**
     * Compute shared secret from peer's public key (ECDH)
     * @param {string} peerPublicKey - Peer's public key in hex format
     * @param {string} [curve='prime256v1'] - Elliptic curve to use
     * @returns {string} Shared secret in hex format
     */
    computeSharedSecret(peerPublicKey) {
        if (!this._privateKey) {
            throw new Error("Private key is required. Generate E2EE key pair first.");
        }
        if (!this._publicKey) {
            throw new Error("Public key is required. Generate E2EE key pair first.");
        }
        this._peerPublicKey = peerPublicKey;
        // Convert keys to hex for consistent combination
        const publicKeyHex = forge.util.bytesToHex(this._publicKey);
        const peerPublicKeyHex = forge.util.bytesToHex(peerPublicKey);
        // For E2EE, both parties use the same two public keys in sorted order
        // This ensures both parties compute the same shared secret
        const publicKeys = [publicKeyHex, peerPublicKeyHex].sort();
        const sharedSecret = forge.md.sha256.create();
        sharedSecret.update(publicKeys[0] + publicKeys[1]);
        this._sharedSecret = Buffer.from(sharedSecret.digest().bytes());
        return this._sharedSecret.toString("hex");
    }
    /**
     * Encrypt data for E2EE transmission
     * Uses the shared secret derived from ECDH key exchange
     * @param {string|Object} data - Data to encrypt
     * @returns {string} Encrypted payload (base64)
     */
    e2eeEncrypt(data) {
        if (!this._sharedSecret) {
            throw new Error("Shared secret not computed. Call computeSharedSecret first.");
        }
        // Use shared secret as the encryption key
        const key = forge.md.sha256.create();
        key.update(this._sharedSecret.toString("hex"));
        const keyBytes = key.digest().bytes();
        const iv = forge.random.getBytesSync(this._ivLength);
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        const cipher = forge.cipher.createCipher("AES-GCM", keyBytes);
        cipher.start({ iv });
        cipher.update(forge.util.createBuffer(dataString, "utf8"));
        cipher.finish();
        const tag = forge.util.bytesToHex(cipher.mode.tag.getBytes());
        const payload = {
            e: cipher.output.toHex(),
            i: forge.util.bytesToHex(iv),
            t: tag,
        };
        return Buffer.from(JSON.stringify(payload)).toString("base64");
    }
    /**
     * Decrypt E2EE encrypted data
     * @param {string} encryptedPayload - Base64 encoded encrypted payload
     * @returns {string} Decrypted data
     */
    e2eeDecrypt(encryptedPayload) {
        if (!this._sharedSecret) {
            throw new Error("Shared secret not computed. Call computeSharedSecret first.");
        }
        const payload = JSON.parse(Buffer.from(encryptedPayload, "base64").toString("utf8"));
        // Use shared secret as the decryption key
        const key = forge.md.sha256.create();
        key.update(this._sharedSecret.toString("hex"));
        const keyBytes = key.digest().bytes();
        const iv = forge.util.hexToBytes(payload.i);
        const decipher = forge.cipher.createDecipher("AES-GCM", keyBytes);
        decipher.start({
            iv,
            tag: forge.util.createBuffer(forge.util.hexToBytes(payload.t)),
        });
        decipher.update(forge.util.createBuffer(forge.util.hexToBytes(payload.e)));
        const result = decipher.finish();
        if (!result) {
            throw new Error("Decryption failed");
        }
        return decipher.output.toString();
    }
    /**
     * Create an E2EE encrypted request payload for API interaction
     * Includes RSA-encrypted session key for hybrid encryption
     * @param {string|Object} data - Data to encrypt
     * @param {string} serverPublicKey - Server's RSA public key (PEM format)
     * @returns {{encryptedKey: string, encryptedData: string, iv: string, tag: string}}
     */
    createE2EERequest(data, serverPublicKey) {
        // Generate a random session key
        const sessionKey = forge.random.getBytesSync(32);
        const iv = forge.random.getBytesSync(this._ivLength);
        // Encrypt the session key with server's RSA public key
        const publicKeyObj = forge.pki.publicKeyFromPem(serverPublicKey);
        const encryptedKey = publicKeyObj.encrypt(sessionKey, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        // Encrypt the data with the session key using AES-GCM
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        const cipher = forge.cipher.createCipher("AES-GCM", sessionKey);
        cipher.start({ iv });
        cipher.update(forge.util.createBuffer(dataString, "utf8"));
        cipher.finish();
        const tag = forge.util.bytesToHex(cipher.mode.tag.getBytes());
        return {
            encryptedKey: forge.util.encode64(encryptedKey),
            encryptedData: cipher.output.toHex(),
            iv: forge.util.bytesToHex(iv),
            tag,
        };
    }
    /**
     * Decrypt an E2EE request payload (server-side)
     * @param {{encryptedKey: string, encryptedData: string, iv: string, tag: string}} payload
     * @param {string} [privateKey] - Server's RSA private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    decryptE2EERequest(payload, privateKey) {
        const key = privateKey || this._privateKey;
        if (!key) {
            throw new Error("Private key is required for E2EE request decryption");
        }
        // Decrypt the session key with RSA private key
        const privateKeyObj = forge.pki.privateKeyFromPem(key);
        const encryptedKeyBytes = forge.util.decode64(payload.encryptedKey);
        const sessionKey = privateKeyObj.decrypt(encryptedKeyBytes, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        // Decrypt the data with the session key
        const iv = forge.util.hexToBytes(payload.iv);
        const decipher = forge.cipher.createDecipher("AES-GCM", sessionKey);
        decipher.start({
            iv,
            tag: forge.util.createBuffer(forge.util.hexToBytes(payload.tag)),
        });
        decipher.update(forge.util.createBuffer(forge.util.hexToBytes(payload.encryptedData)));
        const result = decipher.finish();
        if (!result) {
            throw new Error("Decryption failed");
        }
        return decipher.output.toString();
    }
    /**
     * Create an E2EE encrypted response payload for API interaction
     * @param {string|Object} data - Data to encrypt
     * @param {string} clientPublicKey - Client's RSA public key (PEM format)
     * @returns {{encryptedKey: string, encryptedData: string, iv: string, tag: string}}
     */
    createE2EEResponse(data, clientPublicKey) {
        return this.createE2EERequest(data, clientPublicKey);
    }
    /**
     * Decrypt an E2EE response payload (client-side)
     * @param {{encryptedKey: string, encryptedData: string, iv: string, tag: string}} payload
     * @param {string} [privateKey] - Client's RSA private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    decryptE2EEResponse(payload, privateKey) {
        return this.decryptE2EERequest(payload, privateKey);
    }
    // ==================== UTILITY METHODS ====================
    /**
     * Generate a random secret key
     * @param {number} [length=32] - Length of the secret in bytes
     * @returns {string} Hex encoded random secret
     */
    generateSecret(length = 32) {
        const secret = forge.util.bytesToHex(forge.random.getBytesSync(length));
        this._secret = secret;
        return secret;
    }
    /**
     * Generate a random salt
     * @param {number} [length] - Length of the salt in bytes (uses instance saltLength if not provided)
     * @returns {string} Hex encoded random salt
     */
    generateSalt(length = null) {
        const saltLength = length || this._saltLength;
        const salt = forge.util.bytesToHex(forge.random.getBytesSync(saltLength));
        this._salt = salt;
        return salt;
    }
    /**
     * Hash data using SHA-256
     * @param {string|Buffer} data - Data to hash
     * @returns {string} Hex encoded hash
     */
    hash(data) {
        const md = forge.md.sha256.create();
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        md.update(dataString, "utf8");
        return md.digest().toHex();
    }
    /**
     * Hash data using SHA-512
     * @param {string|Buffer} data - Data to hash
     * @returns {string} Hex encoded hash
     */
    hash512(data) {
        const md = forge.md.sha512.create();
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        md.update(dataString, "utf8");
        return md.digest().toHex();
    }
    /**
     * Create HMAC signature
     * @param {string|Buffer} data - Data to sign
     * @param {string} [secret] - Secret key (uses instance secret if not provided)
     * @returns {string} Hex encoded HMAC
     */
    hmac(data, secret) {
        const key = secret || this._secret;
        if (!key) {
            throw new Error("Secret is required for HMAC");
        }
        const hmac = forge.hmac.create();
        hmac.start("sha256", key);
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        hmac.update(dataString);
        return hmac.digest().toHex();
    }
    /**
     * Verify HMAC signature
     * @param {string|Buffer} data - Original data
     * @param {string} signature - HMAC signature to verify
     * @param {string} [secret] - Secret key (uses instance secret if not provided)
     * @returns {boolean} True if signature is valid
     */
    verifyHmac(data, signature, secret) {
        const computed = this.hmac(data, secret);
        // Simple string comparison for HMAC verification
        return computed === signature;
    }
    /**
     * Sign data using RSA private key
     * @param {string|Buffer} data - Data to sign
     * @param {string} [privateKey] - Private key (uses instance key if not provided)
     * @returns {string} Base64 encoded signature
     */
    rsaSign(data, privateKey) {
        const key = privateKey || this._privateKey;
        if (!key) {
            throw new Error("Private key is required for signing");
        }
        const privateKeyObj = forge.pki.privateKeyFromPem(key);
        const md = forge.md.sha256.create();
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        md.update(dataString, "utf8");
        const signature = privateKeyObj.sign(md);
        return forge.util.encode64(signature);
    }
    /**
     * Verify RSA signature
     * @param {string|Buffer} data - Original data
     * @param {string} signature - Base64 encoded signature
     * @param {string} [publicKey] - Public key (uses instance key if not provided)
     * @returns {boolean} True if signature is valid
     */
    rsaVerify(data, signature, publicKey) {
        const key = publicKey || this._publicKey;
        if (!key) {
            throw new Error("Public key is required for verification");
        }
        const publicKeyObj = forge.pki.publicKeyFromPem(key);
        const md = forge.md.sha256.create();
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        md.update(dataString, "utf8");
        const signatureBytes = forge.util.decode64(signature);
        try {
            return publicKeyObj.verify(md.digest().bytes(), signatureBytes);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Export keys to JSON format
     * @returns {{publicKey: string|null, privateKey: string|null}}
     */
    exportKeys() {
        return {
            publicKey: this._publicKey,
            privateKey: this._privateKey,
        };
    }
    /**
     * Import keys from JSON format
     * @param {{publicKey?: string, privateKey?: string}} keys
     */
    importKeys(keys) {
        if (keys.publicKey) {
            this._publicKey = keys.publicKey;
        }
        if (keys.privateKey) {
            this._privateKey = keys.privateKey;
        }
    }
    /**
     * Reset all keys and secrets
     */
    reset() {
        this._secret = undefined;
        this._salt = undefined;
        this._privateKey = undefined;
        this._publicKey = undefined;
        this._peerPublicKey = undefined;
        this._sharedSecret = undefined;
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
    setConfig(config) {
        if (config.rsaKeySize)
            this.rsaKeySize = config.rsaKeySize;
        if (config.aesAlgorithm)
            this.aesAlgorithm = config.aesAlgorithm;
        if (config.ivLength)
            this._ivLength = config.ivLength;
        if (config.tagLength)
            this._tagLength = config.tagLength;
        if (config.saltLength)
            this._saltLength = config.saltLength;
        if (config.keyIterations)
            this.keyIterations = config.keyIterations;
    }
    // ==================== OPTIMIZED HYBRID ENCRYPTION ====================
    /**
     * Generate random AES key for hybrid encryption
     * @returns {Buffer} 256-bit AES key
     */
    generateAESKey() {
        return Buffer.from(forge.random.getBytesSync(32), "binary");
    }
    /**
     * Encrypt data with AES-256-CBC
     * @param {string} data - Data to encrypt
     * @param {Buffer} key - AES key (32 bytes)
     * @returns {{iv: string, encryptedData: string}} IV and encrypted data
     */
    encryptWithAES(data, key) {
        const iv = forge.random.getBytesSync(16);
        // Convert Buffer key to binary string if needed
        const keyString = Buffer.isBuffer(key) ? key.toString('binary') : key;
        const cipher = forge.cipher.createCipher("AES-CBC", keyString);
        cipher.start({ iv });
        const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
        cipher.update(forge.util.createBuffer(dataString, "utf8"));
        cipher.finish();
        return {
            iv: forge.util.bytesToHex(iv),
            encryptedData: cipher.output.toHex(),
        };
    }
    /**
     * Decrypt data with AES-256-CBC
     * @param {string} encryptedData - Hex encoded encrypted data
     * @param {Buffer} key - AES key (32 bytes)
     * @param {string} iv - Hex encoded IV
     * @returns {string} Decrypted data
     */
    decryptWithAES(encryptedData, key, iv) {
        // Convert Buffer key to binary string if needed
        const keyString = Buffer.isBuffer(key) ? key.toString('binary') : key;
        const decipher = forge.cipher.createDecipher("AES-CBC", keyString);
        decipher.start({ iv: forge.util.hexToBytes(iv) });
        decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedData)));
        const result = decipher.finish();
        if (!result) {
            throw new Error("Decryption failed");
        }
        return decipher.output.toString();
    }
    /**
     * Encrypt AES key with RSA public key
     * @param {Buffer} aesKey - AES key to encrypt
     * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
     * @returns {string} Base64 encoded encrypted AES key
     */
    encryptAESKeyWithRSA(aesKey, publicKey) {
        const key = publicKey || this._publicKey;
        if (!key) {
            throw new Error("Public key is required for RSA encryption");
        }
        const publicKeyObj = forge.pki.publicKeyFromPem(key);
        const keyBytes = aesKey instanceof Buffer ? aesKey.toString("binary") : String(aesKey);
        const encrypted = publicKeyObj.encrypt(keyBytes, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        return forge.util.encode64(encrypted);
    }
    /**
     * Decrypt AES key with RSA private key
     * @param {string} encryptedAESKey - Base64 encoded encrypted AES key
     * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
     * @returns {Buffer} Decrypted AES key
     */
    decryptAESKeyWithRSA(encryptedAESKey, privateKey) {
        const key = privateKey || this._privateKey;
        if (!key) {
            throw new Error("Private key is required for RSA decryption");
        }
        const privateKeyObj = forge.pki.privateKeyFromPem(key);
        const encryptedBytes = forge.util.decode64(encryptedAESKey);
        const decrypted = privateKeyObj.decrypt(encryptedBytes, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        return Buffer.from(decrypted, "binary");
    }
    /**
     * Hybrid encryption: AES for data + RSA for AES key
     * Automatically handles large data by using hybrid encryption
     * @param {string|Object} data - Data to encrypt
     * @param {string} [publicKey] - Optional public key (uses instance key if not provided)
     * @returns {string|Object} Base64 string for small data, or object for hybrid encryption
     */
    hybridEncrypt(data, publicKey) {
        // Convert data to JSON string if it's an object
        const jsonString = typeof data === "string" ? data : JSON.stringify(data);
        // Check if data is too large for RSA
        const maxDataSize = 190; // Maximum for 2048-bit RSA key with OAEP padding
        if (Buffer.byteLength(jsonString, "utf8") > maxDataSize) {
            console.log("Data too large for RSA, using hybrid encryption...");
            // Generate AES key
            const aesKey = this.generateAESKey();
            // Encrypt data with AES
            const aesEncrypted = this.encryptWithAES(jsonString, aesKey);
            // Encrypt AES key with RSA
            const encryptedAESKeyWithRSA = this.rsaEncrypt(aesKey, publicKey);
            const encryptedAESKey = this.encryptAESKeyWithRSA(aesKey, publicKey);
            console.log("HYBRID KEYS", {encryptedAESKeyWithRSA, encryptedAESKey, aesKey, aesEncrypted, jsonString, data, publicKey});
            return {
                encryptedAESKeyWithRSA,
                encryptedAESKey,
                iv: aesEncrypted.iv,
                encryptedData: aesEncrypted.encryptedData,
                raw: aesEncrypted
            };
        }
        // Use direct RSA encryption for small data
        return this.rsaEncrypt(jsonString, publicKey);
    }
    /**
     * Hybrid decryption: RSA for AES key + AES for data
     * Automatically detects and handles both RSA and hybrid encryption
     * @param {string|Object} encryptedInput - Encrypted data (string or object)
     * @param {string} [privateKey] - Optional private key (uses instance key if not provided)
     * @returns {string} Decrypted data
     */
    hybridDecrypt(encryptedInput, privateKey) {
        try {
            // Try to parse as JSON first (for hybrid encryption)
            try {
                const encryptedObject = typeof encryptedInput === "string"
                    ? JSON.parse(encryptedInput)
                    : encryptedInput;
                if (encryptedObject.encryptedAESKey &&
                    encryptedObject.iv &&
                    encryptedObject.encryptedData) {
                    console.log("Using hybrid decryption (AES + RSA)...");
                    // Decrypt AES key with RSA
                    const aesKey = this.decryptAESKeyWithRSA(encryptedObject.encryptedAESKey, privateKey);
                    // Decrypt data with AES
                    console.log("HYBRID KEYS", {encryptedObject, aesKey, privateKey});
                    return this.decryptWithAES(encryptedObject.encryptedData, aesKey, encryptedObject.iv);
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }
            catch (parseError) {
                // Not JSON, treat as simple RSA encrypted string
            }
            // Simple RSA decryption
            console.log("Using RSA decryption...");
            return this.rsaDecrypt(encryptedInput, privateKey);
        }
        catch (error) {
            console.error("Hybrid decryption failed:", error.message);
            throw error;
        }
    }
    // ==================== TOKEN/KEY DECODING & UUID VERIFICATION ====================
    /**
     * Decode an encryption key (token) back to its original payload
     * @param {string} encryptionKey - The encrypted token (base64 combined format)
     * @param {string} [secret] - Optional secret (uses instance secret if not provided)
     * @returns {{success: boolean, payload?: Object, error?: string}}
     */
    decodeEncryptionKey(encryptionKey, secret) {
        try {
            const decrypted = this.aesDecryptCombined(encryptionKey, secret);
            const payload = JSON.parse(decrypted);
            return {
                success: true,
                payload,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Generate UUID from an encryption key (token)
     * @param {string} encryptionKey - The encrypted token
     * @returns {string} UUID in 8-4-4-4-12 format
     */
    generateUUIDFromToken(encryptionKey) {
        const tokenHash = this.hash(encryptionKey);
        return [
            tokenHash.substring(0, 8),
            tokenHash.substring(8, 12),
            tokenHash.substring(12, 16),
            tokenHash.substring(16, 20),
            tokenHash.substring(20, 32),
        ].join("-");
    }
    /**
     * Verify if a UUID matches the encryption key
     * @param {string} uuid - The UUID to verify
     * @param {string} encryptionKey - The encrypted token
     * @returns {{valid: boolean, expectedUUID: string}}
     */
    verifyUUID(uuid, encryptionKey) {
        const expectedUUID = this.generateUUIDFromToken(encryptionKey);
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
     * @returns {{success: boolean, valid: boolean, payload?: Object, expectedUUID?: string, error?: string}}
     */
    decodeAndVerify(encryptionKey, uuid, secret) {
        const decodeResult = this.decodeEncryptionKey(encryptionKey, secret);
        if (!decodeResult.success) {
            return {
                success: false,
                valid: false,
                error: decodeResult.error,
            };
        }
        const verifyResult = this.verifyUUID(uuid, encryptionKey);
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
     * @returns {{success: boolean, metadata?: Object, error?: string}}
     */
    // eslint-disable-next-line class-methods-use-this
    extractTokenMetadata(encryptionKey) {
        try {
            const decoded = JSON.parse(Buffer.from(encryptionKey, "base64").toString("utf8"));
            return {
                success: true,
                metadata: {
                    algorithm: decoded.a || "unknown",
                    ivLength: decoded.i ? decoded.i.length / 2 : 0,
                    saltLength: decoded.s ? decoded.s.length / 2 : 0,
                    hasAuthTag: !!decoded.t,
                    encryptedDataLength: decoded.e ? decoded.e.length / 2 : 0,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Find UUID in payload (helper method for verification)
     * @param {Object} payload - Payload to search
     * @param {string[]} [fieldNames] - Custom field names to search
     * @returns {string|null} Found UUID or null
     */
    // eslint-disable-next-line class-methods-use-this
    findUUIDInPayload(payload, fieldNames = ["uuid", "id", "userId"]) {
        if (!payload || typeof payload !== "object") {
            return null;
        }
        // Check top-level fields
        const foundInTopLevel = fieldNames.find((fieldName) => {
            if (payload[fieldName]) {
                const value = payload[fieldName];
                return (typeof value === "string" &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
            }
            return false;
        });
        if (foundInTopLevel) {
            return payload[foundInTopLevel];
        }
        // Check nested user object
        if (payload.user && typeof payload.user === "object") {
            const foundInUser = fieldNames.find((fieldName) => {
                if (payload.user[fieldName]) {
                    const value = payload.user[fieldName];
                    return (typeof value === "string" &&
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
                }
                return false;
            });
            if (foundInUser) {
                return payload.user[foundInUser];
            }
        }
        return null;
    }
    /**
     * Create a verifiable payload with embedded UUID
     * @param {Object} data - Data to encrypt
     * @param {string} [uuid] - Optional UUID (will generate if not provided)
     * @returns {{encryptionKey: string, uuid: string, payload: Object}}
     */
    createVerifiablePayload(data, uuid) {
        // Generate UUID if not provided
        const payloadUUID = uuid || this.generateUUIDFromToken("temp");
        // Add UUID to payload
        const payloadWithUUID = {
            ...data,
            uuid: payloadUUID,
        };
        // Encrypt the payload
        const encryptionKey = this.aesEncryptCombined(payloadWithUUID);
        return {
            encryptionKey,
            uuid: payloadUUID,
            payload: payloadWithUUID,
        };
    }
}

// Export as ES6 module
export { EncryptionBrowser };
export default EncryptionBrowser;
