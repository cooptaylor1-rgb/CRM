import 'reflect-metadata';

export const ENCRYPTED_METADATA_KEY = 'encrypted:fields';

/**
 * Decorator to mark entity properties as encrypted PII.
 * The EncryptionSubscriber will automatically encrypt/decrypt these fields.
 * 
 * @example
 * @Column({ type: 'text' })
 * @Encrypted()
 * ssn: string;
 */
export function Encrypted(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingFields = Reflect.getMetadata(ENCRYPTED_METADATA_KEY, target.constructor) || [];
    existingFields.push(propertyKey);
    Reflect.defineMetadata(ENCRYPTED_METADATA_KEY, existingFields, target.constructor);
  };
}

/**
 * Get all encrypted fields for an entity class
 */
export function getEncryptedFields(entity: Function): string[] {
  return Reflect.getMetadata(ENCRYPTED_METADATA_KEY, entity) || [];
}
