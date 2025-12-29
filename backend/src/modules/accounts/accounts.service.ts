import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/entities/audit-event.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private auditService: AuditService,
  ) {}

  async create(createAccountDto: CreateAccountDto, userId: string): Promise<Account> {
    const account = this.accountsRepository.create(createAccountDto);
    const saved = await this.accountsRepository.save(account);
    
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.CREATE,
      entityType: 'Account',
      entityId: saved.id,
      action: 'Created account',
      changes: { accountNumber: saved.accountNumber, accountType: saved.accountType },
    });
    
    return saved;
  }

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find({
      relations: ['household', 'positions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id },
      relations: ['household', 'positions'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto, userId: string): Promise<Account> {
    const account = await this.findOne(id);
    const previousState = { ...account };
    
    Object.assign(account, updateAccountDto);
    const saved = await this.accountsRepository.save(account);
    
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.UPDATE,
      entityType: 'Account',
      entityId: id,
      action: 'Updated account',
      changes: {
        before: { status: previousState.status, currentValue: previousState.currentValue },
        after: { status: saved.status, currentValue: saved.currentValue },
      },
    });
    
    return saved;
  }

  /**
   * Soft delete for SEC compliance - account records must be retained.
   */
  async remove(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id);
    
    account.deletedBy = userId;
    await this.accountsRepository.save(account);
    await this.accountsRepository.softRemove(account);
    
    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.DELETE,
      entityType: 'Account',
      entityId: id,
      action: 'Soft deleted account',
      changes: { accountNumber: account.accountNumber },
    });
  }
}
