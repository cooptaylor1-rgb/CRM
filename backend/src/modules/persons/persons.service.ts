import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/entities/audit-event.entity';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(Person)
    private personsRepository: Repository<Person>,
    private auditService: AuditService,
  ) {}

  async create(createPersonDto: CreatePersonDto, userId: string): Promise<Person> {
    const person = this.personsRepository.create(createPersonDto);
    const saved = await this.personsRepository.save(person);
    
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.CREATE,
      entityType: 'Person',
      entityId: saved.id,
      action: 'Created person',
      changes: { lastName: saved.lastName, isPrimaryContact: saved.isPrimaryContact },
    });
    
    return saved;
  }

  async findAll(): Promise<Person[]> {
    return this.personsRepository.find({
      relations: ['household'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.personsRepository.findOne({
      where: { id },
      relations: ['household'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return person;
  }

  async update(id: string, updatePersonDto: UpdatePersonDto, userId: string): Promise<Person> {
    const person = await this.findOne(id);
    const previousState = { ...person };
    
    Object.assign(person, updatePersonDto);
    const saved = await this.personsRepository.save(person);
    
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'Person',
      entityId: id,
      action: 'Updated person',
      changes: {
        before: { kycStatus: previousState.kycStatus },
        after: { kycStatus: saved.kycStatus },
      },
    });
    
    return saved;
  }

  /**
   * Soft delete for SEC compliance - person records must be retained.
   */
  async remove(id: string, userId: string): Promise<void> {
    const person = await this.findOne(id);
    
    person.deletedBy = userId;
    await this.personsRepository.save(person);
    await this.personsRepository.softRemove(person);
    
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.DELETE,
      entityType: 'Person',
      entityId: id,
      action: 'Soft deleted person',
      changes: { lastName: person.lastName },
    });
  }
}
