import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

/**
 * TypeORM column transformer for encrypting/decrypting PII data.
 * Uses AES-256-GCM for authenticated encryption.
 * 
 * Usage:
 * @Column({ type: 'text', transformer: new EncryptedTransformer() })
 * ssn: string;
 */
export class EncryptedTransformer implements ValueTransformer {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      // Use development key - logs warning in main.ts
      this.key = crypto.scryptSync('dev-encryption-key-change-me', 'salt', this.keyLength);
    } else {
      this.key = crypto.scryptSync(encryptionKey, 'wealth-crm-salt', this.keyLength);
    }
  }

  /**
   * Encrypt value when writing to database
   */
  to(value: string | null | undefined): string | null {
    if (value === null || value === undefined || value === '') {
      return value as null;
    }

    // Handle Date objects
    const stringValue = value instanceof Date ? value.toISOString() : String(value);

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(stringValue, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt value when reading from database
   */
  from(value: string | null | undefined): string | null {
    if (value === null || value === undefined || value === '') {
      return value as null;
    }

    try {
      const combined = Buffer.from(value, 'base64');
      
      // Minimum length check
      if (combined.length < this.ivLength + this.authTagLength + 1) {
        // Value is not encrypted (probably legacy data)
        return value;
      }

      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(this.ivLength, this.ivLength + this.authTagLength);
      const ciphertext = combined.subarray(this.ivLength + this.authTagLength);
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(ciphertext.toString('base64'), 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Return original value if decryption fails (unencrypted legacy data)
      return value;
    }
  }
}

// Singleton instance for reuse
export const encryptedTransformer = new EncryptedTransformer();
