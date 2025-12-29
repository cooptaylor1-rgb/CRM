import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY') {
                return 'test-encryption-key-for-testing';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'sensitive-data-123';
      
      const encrypted = service.encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
      
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      expect(service.encrypt('')).toBe('');
      expect(service.decrypt('')).toBe('');
    });

    it('should handle null values', () => {
      expect(service.encrypt(null as any)).toBe(null);
      expect(service.decrypt(null as any)).toBe(null);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'same-data';
      
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should encrypt/decrypt SSN correctly', () => {
      const ssn = '123-45-6789';
      
      const encrypted = service.encrypt(ssn);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(ssn);
    });

    it('should encrypt/decrypt email addresses', () => {
      const email = 'test@example.com';
      
      const encrypted = service.encrypt(email);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(email);
    });

    it('should encrypt/decrypt date strings', () => {
      const date = new Date('1990-05-15').toISOString();
      
      const encrypted = service.encrypt(date);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(date);
    });
  });

  describe('maskSSN', () => {
    it('should mask SSN showing only last 4 digits', () => {
      const ssn = '123-45-6789';
      const masked = service.maskSSN(ssn);
      
      expect(masked).toBe('XXX-XX-6789');
    });

    it('should work with encrypted SSN', () => {
      const ssn = '987-65-4321';
      const encrypted = service.encrypt(ssn);
      
      const masked = service.maskSSN(encrypted);
      
      expect(masked).toBe('XXX-XX-4321');
    });

    it('should handle SSN without dashes', () => {
      const ssn = '123456789';
      const masked = service.maskSSN(ssn);
      
      expect(masked).toBe('XXX-XX-6789');
    });

    it('should handle invalid SSN', () => {
      const invalid = '12345';
      const masked = service.maskSSN(invalid);
      
      expect(masked).toBe('XXX-XX-XXXX');
    });
  });

  describe('maskAccountNumber', () => {
    it('should mask account number showing only last 4 digits', () => {
      const accountNumber = '1234567890';
      const masked = service.maskAccountNumber(accountNumber);
      
      expect(masked).toBe('****7890');
    });

    it('should work with encrypted account number', () => {
      const accountNumber = '9876543210';
      const encrypted = service.encrypt(accountNumber);
      
      const masked = service.maskAccountNumber(encrypted);
      
      expect(masked).toBe('****3210');
    });

    it('should not mask short account numbers', () => {
      const shortAccount = '1234';
      const masked = service.maskAccountNumber(shortAccount);
      
      expect(masked).toBe('1234');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted data', () => {
      const encrypted = service.encrypt('test-data');
      
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(service.isEncrypted('plain-text')).toBe(false);
      expect(service.isEncrypted('123-45-6789')).toBe(false);
    });

    it('should return false for null/empty', () => {
      expect(service.isEncrypted(null as any)).toBe(false);
      expect(service.isEncrypted('')).toBe(false);
    });
  });

  describe('hash', () => {
    it('should produce consistent hash for same input', () => {
      const value = 'test-value';
      
      const hash1 = service.hash(value);
      const hash2 = service.hash(value);
      
      expect(hash1).toBe(hash2);
    });

    it('should be case insensitive', () => {
      const hash1 = service.hash('Test@Example.com');
      const hash2 = service.hash('test@example.com');
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different values', () => {
      const hash1 = service.hash('value1');
      const hash2 = service.hash('value2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
