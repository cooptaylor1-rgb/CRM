import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentType {
  AGREEMENT = 'agreement',
  FORM_ADV = 'form_adv',
  DISCLOSURE = 'disclosure',
  CORRESPONDENCE = 'correspondence',
  STATEMENT = 'statement',
  TAX_DOC = 'tax_doc',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_id', nullable: true })
  householdId: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    name: 'document_type',
  })
  documentType: DocumentType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ name: 'retention_date', nullable: true })
  retentionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
