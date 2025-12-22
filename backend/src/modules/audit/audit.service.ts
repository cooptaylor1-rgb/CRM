import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent, AuditEventType } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private auditRepository: Repository<AuditEvent>,
  ) {}

  async logEvent(data: {
    userId: string;
    eventType: AuditEventType;
    entityType?: string;
    entityId?: string;
    action: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEvent> {
    const event = this.auditRepository.create(data);
    return this.auditRepository.save(event);
  }

  async findAll(limit = 100): Promise<AuditEvent[]> {
    return this.auditRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string): Promise<AuditEvent[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditEvent[]> {
    return this.auditRepository.find({
      where: { entityType, entityId },
      order: { timestamp: 'DESC' },
    });
  }
}
