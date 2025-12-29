import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/entities/audit-event.entity';

/**
 * SEC Rule 204-2 compliant document service.
 * Implements WORM (Write Once Read Many) controls.
 * Documents cannot be modified after creation - amendments create new versions.
 */
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private auditService: AuditService,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, userId: string): Promise<Document> {
    const document = this.documentsRepository.create({
      ...createDocumentDto,
      uploadedBy: userId,
      version: 1,
    });
    const saved = await this.documentsRepository.save(document);

    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.CREATE,
      entityType: 'Document',
      entityId: saved.id,
      action: 'Created document',
      changes: { title: saved.title, documentType: saved.documentType },
    });

    return saved;
  }

  async findAll(): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { status: DocumentStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  /**
   * Documents are immutable per SEC 204-2.
   * Instead of updating, create an amendment that references the original.
   */
  async createAmendment(
    originalId: string,
    createDocumentDto: CreateDocumentDto,
    supersessionReason: string,
    userId: string,
  ): Promise<Document> {
    const original = await this.findOne(originalId);

    // Mark original as superseded
    original.status = DocumentStatus.SUPERSEDED;
    await this.documentsRepository.save(original);

    // Create new version
    const amendment = this.documentsRepository.create({
      ...createDocumentDto,
      uploadedBy: userId,
      originalDocumentId: original.id,
      version: original.version + 1,
      supersessionReason,
    });
    const saved = await this.documentsRepository.save(amendment);

    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.CREATE,
      entityType: 'Document',
      entityId: saved.id,
      action: 'Created document amendment',
      changes: {
        title: saved.title,
        originalDocumentId: original.id,
        version: saved.version,
        supersessionReason,
      },
    });

    return saved;
  }

  /**
   * WORM Control: Direct updates are forbidden.
   * Throws ForbiddenException to enforce SEC compliance.
   */
  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    throw new ForbiddenException(
      'Documents cannot be modified after creation per SEC Rule 204-2. ' +
      'Use createAmendment() to create a new version that supersedes the original.',
    );
  }

  /**
   * WORM Control: Hard deletes are forbidden.
   * Only soft delete with reason is allowed for compliance.
   */
  async remove(id: string, deletionReason: string, userId: string): Promise<void> {
    const document = await this.findOne(id);

    if (!deletionReason || deletionReason.trim().length < 10) {
      throw new ForbiddenException(
        'A detailed deletion reason (minimum 10 characters) is required for SEC compliance.',
      );
    }

    document.deletedBy = userId;
    document.deletionReason = deletionReason;
    await this.documentsRepository.save(document);
    await this.documentsRepository.softRemove(document);

    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.DELETE,
      entityType: 'Document',
      entityId: id,
      action: 'Soft deleted document (SEC compliant)',
      changes: { title: document.title, deletionReason },
    });
  }

  /**
   * Get document version history (audit trail for examiners)
   */
  async getVersionHistory(documentId: string): Promise<Document[]> {
    const document = await this.findOne(documentId);
    
    // Find the root document
    let rootId = document.originalDocumentId || document.id;
    
    // Get all versions in the chain
    return this.documentsRepository
      .createQueryBuilder('doc')
      .where('doc.id = :rootId OR doc.originalDocumentId = :rootId', { rootId })
      .orderBy('doc.version', 'ASC')
      .withDeleted() // Include soft-deleted for audit trail
      .getMany();
  }
}
