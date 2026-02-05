/**
 * AuthenticatorApp class for handling TOTP (Time-based One-Time Password) generation
 * Compatible with Google Authenticator and other authenticator apps
 */
export class AuthenticatorApp {
  private static readonly PERIOD = 30; // 30-second time window
  private static readonly DIGITS = 6; // 6-digit codes
  private static readonly ALGORITHM = 'SHA1';

  /**
   * Generate a secret key for the authenticator app
   * @returns string - Base32 encoded secret key
   */
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const randomValues = new Uint8Array(16); // 128-bit secret
    
    // Generate random values
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomValues);
    } else {
      // Fallback for Node.js environment
      for (let i = 0; i < randomValues.length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }
    
    // Convert to base32
    for (let i = 0; i < randomValues.length; i++) {
      secret += chars[randomValues[i] % chars.length];
    }
    
    return secret;
  }

  /**
   * Generate a TOTP code for the given secret
   * @param secret - Base32 encoded secret key
   * @returns Promise<string> - 6-digit TOTP code
   */
  static async generateTOTP(secret: string): Promise<string> {
    const timeStep = Math.floor(Date.now() / 1000 / this.PERIOD);
    const counter = this.intToBuffer(timeStep);
    const key = this.base32ToBuffer(secret);
    
    // Generate HMAC-SHA1
    const hmac = await this.hmacSHA1(counter, key);
    
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0F;
    const code = 
      ((hmac[offset] & 0x7F) << 24) |
      ((hmac[offset + 1] & 0xFF) << 16) |
      ((hmac[offset + 2] & 0xFF) << 8) |
      (hmac[offset + 3] & 0xFF);
    
    return (code % Math.pow(10, this.DIGITS)).toString().padStart(this.DIGITS, '0');
  }

  /**
   * Verify a TOTP code against the secret
   * @param secret - Base32 encoded secret key
   * @param token - TOTP code to verify
   * @param window - Number of time windows to check (default: 1)
   * @returns Promise<boolean> - True if valid
   */
  static async verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
    const timeStep = Math.floor(Date.now() / 1000 / this.PERIOD);
    
    console.log('TOTP Verification Debug:', {
      currentTime: Date.now(),
      timeStep,
      secret: secret.substring(0, 4) + '...',
      token,
      window
    });
    
    for (let i = -window; i <= window; i++) {
      const counter = this.intToBuffer(timeStep + i);
      const key = this.base32ToBuffer(secret);
      const hmac = await this.hmacSHA1(counter, key);
      
      const offset = hmac[hmac.length - 1] & 0x0F;
      const code = 
        ((hmac[offset] & 0x7F) << 24) |
        ((hmac[offset + 1] & 0xFF) << 16) |
        ((hmac[offset + 2] & 0xFF) << 8) |
        (hmac[offset + 3] & 0xFF);
      
      const generatedCode = (code % Math.pow(10, this.DIGITS)).toString().padStart(this.DIGITS, '0');
      
      console.log(`Testing window ${i}: generated=${generatedCode}, input=${token}, match=${generatedCode === token}`);
      
      if (generatedCode === token) {
        console.log('✓ TOTP verification successful!');
        return true;
      }
    }
    
    console.log('✗ TOTP verification failed - no match found');
    return false;
  }

  /**
   * Generate QR code data for Google Authenticator
   * @param secret - Base32 encoded secret key
   * @param accountName - User's account name (email or identifier)
   * @param issuer - Application name
   * @returns string - QR code data URL
   */
  static generateQRCodeData(secret: string, accountName: string, issuer: string): string {
    const label = `${issuer}:${accountName}`;
    const params = new URLSearchParams({
      secret: secret,
      issuer: issuer,
      algorithm: this.ALGORITHM,
      digits: this.DIGITS.toString(),
      period: this.PERIOD.toString()
    });
    
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  /**
   * Get remaining time for current TOTP code
   * @returns number - Seconds remaining
   */
  static getRemainingTime(): number {
    return this.PERIOD - (Math.floor(Date.now() / 1000) % this.PERIOD);
  }

  /**
   * Convert base32 string to buffer
   * @param base32 - Base32 encoded string
   * @returns Uint8Array - Decoded bytes
   */
  private static base32ToBuffer(base32: string): Uint8Array {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    base32 = base32.toUpperCase().replace(/=+$/, ''); // Remove padding
    let bits = '';
    
    // Convert base32 to binary string
    for (let i = 0; i < base32.length; i++) {
      const val = base32chars.indexOf(base32.charAt(i));
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    // Convert binary string to bytes (8 bits at a time)
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    
    return new Uint8Array(bytes);
  }

  /**
   * Convert integer to buffer
   * @param num - Integer to convert
   * @returns Uint8Array - Buffer representation
   */
  private static intToBuffer(num: number): Uint8Array {
    const buffer = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      buffer[i] = num & 0xff;
      num = num >> 8;
    }
    return buffer;
  }

  /**
   * HMAC-SHA1 implementation using Web Crypto API
   * @param data - Data to hash
   * @param key - Secret key
   * @returns Promise<Uint8Array> - HMAC result
   */
  private static async hmacSHA1(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    // Create proper ArrayBuffer-backed Uint8Arrays
    const keyBuffer = new Uint8Array(key);
    const dataBuffer = new Uint8Array(data);
    
    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    // Sign the data
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    
    return new Uint8Array(signature);
  }

  /**
   * Generate backup codes
   * @param count - Number of backup codes to generate
   * @returns string[] - Array of backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        if (j === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      codes.push(code);
    }
    
    return codes;
  }
}

/**
 * QR Code generator for authenticator setup
 */
export class QRCodeGenerator {
  /**
   * Generate QR code image data URL
   * @param data - Data to encode in QR code
   * @param size - QR code size (default: 256)
   * @returns Promise<string> - Data URL of QR code image
   */
  static async generateQRCode(data: string, size: number = 256): Promise<string> {
    // In a real implementation, you would use a QR code library like qrcode.js
    // For now, we'll return a placeholder
    return new Promise((resolve) => {
      // Create a simple canvas-based QR code placeholder
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw placeholder QR code
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 10, size - 20, size - 20);
        
        // Draw some pattern to simulate QR code
        ctx.fillStyle = '#000';
        const moduleSize = 10;
        for (let i = 0; i < size / moduleSize; i++) {
          for (let j = 0; j < size / moduleSize; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
            }
          }
        }
      }
      
      resolve(canvas.toDataURL());
    });
  }
}
