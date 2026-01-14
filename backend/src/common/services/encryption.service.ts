import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * SEC-compliant encryption service for PII data.
 * Uses AES-256-GCM for authenticated encryption.
 * 
 * Fields to encrypt:
 * - SSN (Social Security Number)
 * - Date of Birth
 * - Email addresses
 * - Phone numbers
 * - Physical addresses
 * - Account numbers
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly key: Buffer;
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    this.isDevelopment = nodeEnv !== 'production';

    // Fail fast in production if no encryption key
    if (nodeEnv === 'production' && !encryptionKey) {
      throw new Error('CRITICAL: ENCRYPTION_KEY must be set in production environment. PII data cannot be secured without it.');
    }

    if (!encryptionKey) {
      // Generate a random development key (prevents predictable encryption, but data won't persist across restarts)
      const devKey = crypto.randomBytes(32).toString('hex');
      console.warn('⚠️  ENCRYPTION_KEY not set - using auto-generated development key.');
      console.warn('⚠️  Encrypted data will NOT be recoverable after restart. Set ENCRYPTION_KEY for persistence.');
      this.key = crypto.scryptSync(devKey, 'dev-salt', this.keyLength);
    } else {
      // Derive key from the provided secret with unique salt
      this.key = crypto.scryptSync(encryptionKey, 'wealth-crm-salt-v1', this.keyLength);
    }
  }

  /**
   * Encrypt sensitive data (PII)
   * @param plaintext The data to encrypt
   * @returns Base64 encoded string containing IV + AuthTag + Ciphertext
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt sensitive data (PII)
   * @param encryptedData Base64 encoded string from encrypt()
   * @returns Decrypted plaintext
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;
    
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(this.ivLength, this.ivLength + this.authTagLength);
      const ciphertext = combined.subarray(this.ivLength + this.authTagLength);
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(ciphertext.toString('base64'), 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Return original value if decryption fails (might not be encrypted)
      return encryptedData;
    }
  }

  /**
   * Mask SSN for display (show only last 4 digits)
   * @param ssn Full SSN (encrypted or plain)
   * @returns Masked SSN like XXX-XX-1234
   */
  maskSSN(ssn: string): string {
    if (!ssn) return ssn;
    
    // Decrypt if encrypted
    const plainSSN = this.isEncrypted(ssn) ? this.decrypt(ssn) : ssn;
    
    // Remove any formatting
    const digitsOnly = plainSSN.replace(/\D/g, '');
    
    if (digitsOnly.length !== 9) return 'XXX-XX-XXXX';
    
    return `XXX-XX-${digitsOnly.slice(-4)}`;
  }

  /**
   * Mask account number for display (show only last 4 digits)
   */
  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) return accountNumber;
    
    const plain = this.isEncrypted(accountNumber) ? this.decrypt(accountNumber) : accountNumber;
    
    if (plain.length <= 4) return plain;
    
    return `****${plain.slice(-4)}`;
  }

  /**
   * Check if a value appears to be encrypted
   * (Base64 encoded and of sufficient length)
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;
    
    // Minimum length: IV (16) + AuthTag (16) + at least 1 byte ciphertext = 33 bytes
    // Base64 encoding increases size by ~33%
    const minBase64Length = Math.ceil(33 * 4 / 3);
    
    if (value.length < minBase64Length) return false;
    
    // Check if valid Base64
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(value);
  }

  /**
   * Hash a value for indexing (one-way, for searching without decryption)
   */
  hash(value: string): string {
    if (!value) return value;
    return crypto.createHmac('sha256', this.key).update(value.toLowerCase()).digest('hex');
  }
}
