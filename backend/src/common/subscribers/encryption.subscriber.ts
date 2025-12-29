import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  LoadEvent,
} from 'typeorm';
import { getEncryptedFields } from '../decorators/encrypted.decorator';
import { EncryptionService } from '../services/encryption.service';
import { Injectable } from '@nestjs/common';

/**
 * TypeORM subscriber that automatically encrypts PII fields on save
 * and decrypts them on load.
 * 
 * Fields marked with @Encrypted() decorator are automatically processed.
 */
@Injectable()
@EventSubscriber()
export class EncryptionSubscriber implements EntitySubscriberInterface {
  private encryptionService: EncryptionService;

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Encrypt PII fields before insert
   */
  beforeInsert(event: InsertEvent<any>): void {
    if (!event.entity) return;
    this.encryptFields(event.entity);
  }

  /**
   * Encrypt PII fields before update
   */
  beforeUpdate(event: UpdateEvent<any>): void {
    if (!event.entity) return;
    this.encryptFields(event.entity);
  }

  /**
   * Decrypt PII fields after loading from database
   */
  afterLoad(entity: any, event?: LoadEvent<any>): void {
    if (!entity) return;
    this.decryptFields(entity);
  }

  /**
   * Encrypt all fields marked with @Encrypted()
   */
  private encryptFields(entity: any): void {
    const constructor = entity.constructor;
    const encryptedFields = getEncryptedFields(constructor);

    for (const field of encryptedFields) {
      const value = entity[field];
      if (value !== null && value !== undefined) {
        // Handle Date objects
        if (value instanceof Date) {
          entity[field] = this.encryptionService.encrypt(value.toISOString());
        } else if (typeof value === 'string') {
          // Only encrypt if not already encrypted
          if (!this.encryptionService.isEncrypted(value)) {
            entity[field] = this.encryptionService.encrypt(value);
          }
        }
      }
    }
  }

  /**
   * Decrypt all fields marked with @Encrypted()
   */
  private decryptFields(entity: any): void {
    const constructor = entity.constructor;
    const encryptedFields = getEncryptedFields(constructor);

    for (const field of encryptedFields) {
      const value = entity[field];
      if (value !== null && value !== undefined && typeof value === 'string') {
        if (this.encryptionService.isEncrypted(value)) {
          const decrypted = this.encryptionService.decrypt(value);
          
          // If the field is a Date, convert back
          if (field.toLowerCase().includes('date') || field.toLowerCase().includes('dob')) {
            const parsedDate = new Date(decrypted);
            if (!isNaN(parsedDate.getTime())) {
              entity[field] = parsedDate;
            } else {
              entity[field] = decrypted;
            }
          } else {
            entity[field] = decrypted;
          }
        }
      }
    }
  }
}
