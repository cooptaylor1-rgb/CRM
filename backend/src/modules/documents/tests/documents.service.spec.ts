import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from '../documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document, DocumentType, DocumentStatus } from '../entities/document.entity';
import { AuditService } from '../../audit/audit.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockDocumentRepository: any;
  let mockAuditService: any;

  const mockDocument: Partial<Document> = {
    id: 'doc-uuid-123',
    title: 'Test Document',
    documentType: DocumentType.AGREEMENT,
    status: DocumentStatus.ACTIVE,
    version: 1,
    uploadedBy: 'user-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockDocumentRepository = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'doc-uuid-123' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...mockDocument, ...entity })),
      find: jest.fn().mockResolvedValue([mockDocument]),
      findOne: jest.fn().mockResolvedValue(mockDocument),
      softRemove: jest.fn().mockResolvedValue(mockDocument),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockDocument]),
      }),
    };

    mockAuditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockDocumentRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document and log audit event', async () => {
      const createDto = {
        title: 'New Document',
        documentType: DocumentType.AGREEMENT,
      };
      const userId = 'user-123';

      const result = await service.create(createDto as any, userId);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          uploadedBy: userId,
          version: 1,
        }),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          eventType: 'create',
          entityType: 'Document',
        }),
      );
    });
  });

  describe('WORM Controls - update', () => {
    it('should throw ForbiddenException when trying to update a document', async () => {
      await expect(
        service.update('doc-uuid-123', { title: 'Modified' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include SEC Rule 204-2 reference in error message', async () => {
      try {
        await service.update('doc-uuid-123', { title: 'Modified' } as any);
        fail('Expected ForbiddenException');
      } catch (error) {
        expect(error.message).toContain('SEC Rule 204-2');
        expect(error.message).toContain('createAmendment');
      }
    });
  });

  describe('WORM Controls - createAmendment', () => {
    it('should create a new version and supersede original', async () => {
      const createDto = {
        title: 'Amended Document',
        documentType: DocumentType.AGREEMENT,
      };
      const userId = 'user-123';
      const reason = 'Correcting client name spelling';

      await service.createAmendment('doc-uuid-123', createDto as any, reason, userId);

      // Original should be marked as superseded
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: DocumentStatus.SUPERSEDED }),
      );

      // New version should reference original
      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalDocumentId: 'doc-uuid-123',
          version: 2,
          supersessionReason: reason,
        }),
      );
    });

    it('should increment version number', async () => {
      const createDto = { title: 'V2', documentType: DocumentType.AGREEMENT };
      
      await service.createAmendment('doc-uuid-123', createDto as any, 'Update', 'user-123');

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2 }),
      );
    });
  });

  describe('WORM Controls - remove (soft delete)', () => {
    it('should require deletion reason for compliance', async () => {
      await expect(
        service.remove('doc-uuid-123', '', 'user-123'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.remove('doc-uuid-123', 'short', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should soft delete with valid reason', async () => {
      const reason = 'Document uploaded in error - duplicate of doc-456';
      const userId = 'user-123';

      await service.remove('doc-uuid-123', reason, userId);

      expect(mockDocumentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedBy: userId,
          deletionReason: reason,
        }),
      );
      expect(mockDocumentRepository.softRemove).toHaveBeenCalled();
    });

    it('should log audit event for deletion', async () => {
      const reason = 'Compliance review - superseded document';
      const userId = 'user-123';

      await service.remove('doc-uuid-123', reason, userId);

      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          eventType: 'delete',
          entityType: 'Document',
          action: expect.stringContaining('SEC compliant'),
        }),
      );
    });
  });

  describe('getVersionHistory', () => {
    it('should return document version chain including soft-deleted', async () => {
      await service.getVersionHistory('doc-uuid-123');

      const qb = mockDocumentRepository.createQueryBuilder();
      expect(qb.withDeleted).toHaveBeenCalled();
      expect(qb.orderBy).toHaveBeenCalledWith('doc.version', 'ASC');
    });
  });
});
