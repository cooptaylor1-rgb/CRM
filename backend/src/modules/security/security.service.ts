import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In } from 'typeorm';
import { SecurityIncident, IncidentStatus, IncidentSeverity } from './entities/security-incident.entity';
import { KycVerification, SuspiciousActivityReport, KycStatus, RiskLevel } from './entities/kyc.entity';
import {
  CreateSecurityIncidentDto,
  UpdateSecurityIncidentDto,
  AddTimelineEntryDto,
  CreateKycVerificationDto,
  UpdateKycVerificationDto,
  CreateSarDto,
} from './dto/security.dto';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(SecurityIncident)
    private incidentRepository: Repository<SecurityIncident>,
    @InjectRepository(KycVerification)
    private kycRepository: Repository<KycVerification>,
    @InjectRepository(SuspiciousActivityReport)
    private sarRepository: Repository<SuspiciousActivityReport>,
  ) {}

  // ==================== Security Incidents ====================

  private async generateIncidentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.incidentRepository.count();
    return `INC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createIncident(dto: CreateSecurityIncidentDto, userId: string): Promise<SecurityIncident> {
    const incidentNumber = await this.generateIncidentNumber();

    const incident = this.incidentRepository.create({
      ...dto,
      incidentNumber,
      discoveredAt: new Date(dto.discoveredAt),
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      discoveredBy: userId,
      createdBy: userId,
      timeline: [{
        timestamp: new Date().toISOString(),
        action: 'Incident created',
        actor: userId,
      }],
    } as Partial<SecurityIncident>);

    return this.incidentRepository.save(incident);
  }

  async getAllIncidents(status?: IncidentStatus): Promise<SecurityIncident[]> {
    const where = status ? { status } : {};
    return this.incidentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getIncident(id: string): Promise<SecurityIncident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    return incident;
  }

  async updateIncident(id: string, dto: UpdateSecurityIncidentDto, userId: string): Promise<SecurityIncident> {
    const incident = await this.getIncident(id);
    const oldStatus = incident.status;

    Object.assign(incident, {
      ...dto,
      notificationDeadline: dto.notificationDeadline ? new Date(dto.notificationDeadline) : incident.notificationDeadline,
      updatedBy: userId,
    });

    // Handle status transitions
    if (dto.status && dto.status !== oldStatus) {
      const now = new Date();
      if (dto.status === IncidentStatus.CONTAINED) {
        incident.containedAt = now;
      } else if (dto.status === IncidentStatus.REMEDIATED) {
        incident.resolvedAt = now;
      } else if (dto.status === IncidentStatus.CLOSED) {
        incident.closedAt = now;
      }

      // Add to timeline
      incident.timeline = [
        ...(incident.timeline || []),
        {
          timestamp: now.toISOString(),
          action: `Status changed from ${oldStatus} to ${dto.status}`,
          actor: userId,
        },
      ];
    }

    return this.incidentRepository.save(incident);
  }

  async addTimelineEntry(id: string, dto: AddTimelineEntryDto, userId: string): Promise<SecurityIncident> {
    const incident = await this.getIncident(id);
    
    incident.timeline = [
      ...(incident.timeline || []),
      {
        timestamp: new Date().toISOString(),
        action: dto.action,
        actor: userId,
        notes: dto.notes,
      },
    ];

    return this.incidentRepository.save(incident);
  }

  async getIncidentStats(): Promise<{
    total: number;
    open: number;
    critical: number;
    requiresNotification: number;
    byType: Record<string, number>;
  }> {
    const incidents = await this.incidentRepository.find();

    const byType: Record<string, number> = {};
    for (const incident of incidents) {
      byType[incident.incidentType] = (byType[incident.incidentType] || 0) + 1;
    }

    return {
      total: incidents.length,
      open: incidents.filter(i => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.INVESTIGATING).length,
      critical: incidents.filter(i => i.severity === IncidentSeverity.CRITICAL && i.status !== IncidentStatus.CLOSED).length,
      requiresNotification: incidents.filter(i => i.requiresNotification && !i.clientsNotified).length,
      byType,
    };
  }

  // ==================== KYC Verification ====================

  async createKycVerification(dto: CreateKycVerificationDto, userId: string): Promise<KycVerification> {
    const kyc = this.kycRepository.create({
      ...dto,
      identityDocumentExpiry: dto.identityDocumentExpiry ? new Date(dto.identityDocumentExpiry) : undefined,
      createdBy: userId,
      verificationHistory: [{
        type: 'initial',
        date: new Date().toISOString(),
        result: 'Created',
        performedBy: userId,
      }],
    } as Partial<KycVerification>);

    return this.kycRepository.save(kyc);
  }

  async getKycByPerson(personId: string): Promise<KycVerification> {
    const kyc = await this.kycRepository.findOne({
      where: { personId },
      order: { createdAt: 'DESC' },
    });
    if (!kyc) {
      throw new NotFoundException(`KYC verification for person ${personId} not found`);
    }
    return kyc;
  }

  async updateKycVerification(id: string, dto: UpdateKycVerificationDto, userId: string): Promise<KycVerification> {
    const kyc = await this.kycRepository.findOne({ where: { id } });
    if (!kyc) {
      throw new NotFoundException(`KYC verification with ID ${id} not found`);
    }

    const oldStatus = kyc.status;
    Object.assign(kyc, dto);

    // Record verification history
    if (dto.identityVerified !== undefined || dto.addressVerified !== undefined || dto.status) {
      kyc.verificationHistory = [
        ...(kyc.verificationHistory || []),
        {
          type: dto.status ? 'status_change' : 'verification_update',
          date: new Date().toISOString(),
          result: dto.status || 'Updated',
          performedBy: userId,
          notes: `Status: ${oldStatus} -> ${dto.status || oldStatus}`,
        },
      ];
    }

    // Handle approval
    if (dto.status === KycStatus.APPROVED) {
      kyc.approvedBy = userId;
      kyc.approvedAt = new Date();
      kyc.nextReviewDate = new Date();
      kyc.nextReviewDate.setMonth(kyc.nextReviewDate.getMonth() + kyc.reviewFrequencyMonths);
    }

    return this.kycRepository.save(kyc);
  }

  async runSanctionsScreening(personId: string, userId: string): Promise<{
    passed: boolean;
    hits: any[];
    listsChecked: string[];
  }> {
    // In production, this would integrate with a sanctions screening provider
    // like World-Check, Dow Jones, or LexisNexis
    const sanctionsLists = ['OFAC SDN', 'EU Consolidated', 'UN Sanctions', 'UK HMT'];
    
    const kyc = await this.getKycByPerson(personId);
    
    kyc.sanctionsCheckDate = new Date();
    kyc.sanctionsListsChecked = sanctionsLists;
    kyc.sanctionsCheckPassed = true; // Simulated result
    kyc.sanctionsHits = [];

    kyc.verificationHistory = [
      ...(kyc.verificationHistory || []),
      {
        type: 'sanctions_screening',
        date: new Date().toISOString(),
        result: 'Passed',
        performedBy: userId,
      },
    ];

    await this.kycRepository.save(kyc);

    return {
      passed: true,
      hits: [],
      listsChecked: sanctionsLists,
    };
  }

  async runPepScreening(personId: string, userId: string): Promise<{
    isPep: boolean;
    details: any;
  }> {
    const kyc = await this.getKycByPerson(personId);
    
    kyc.pepCheckDate = new Date();
    // Simulated result - in production would use actual PEP database
    kyc.isPep = false;

    kyc.verificationHistory = [
      ...(kyc.verificationHistory || []),
      {
        type: 'pep_screening',
        date: new Date().toISOString(),
        result: kyc.isPep ? 'PEP Identified' : 'Not a PEP',
        performedBy: userId,
      },
    ];

    await this.kycRepository.save(kyc);

    return {
      isPep: kyc.isPep,
      details: null,
    };
  }

  async getKycDueForReview(): Promise<KycVerification[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.kycRepository.find({
      where: {
        nextReviewDate: LessThan(thirtyDaysFromNow),
        status: In([KycStatus.APPROVED, KycStatus.ENHANCED_DUE_DILIGENCE]),
      },
      order: { nextReviewDate: 'ASC' },
    });
  }

  async getHighRiskClients(): Promise<KycVerification[]> {
    return this.kycRepository.find({
      where: {
        riskLevel: In([RiskLevel.HIGH, RiskLevel.PROHIBITED]),
      },
      order: { riskLevel: 'DESC', createdAt: 'DESC' },
    });
  }

  async getKycStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byRiskLevel: Record<string, number>;
    pendingReview: number;
    expiringSoon: number;
  }> {
    const all = await this.kycRepository.find();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const byStatus: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};

    for (const kyc of all) {
      byStatus[kyc.status] = (byStatus[kyc.status] || 0) + 1;
      byRiskLevel[kyc.riskLevel] = (byRiskLevel[kyc.riskLevel] || 0) + 1;
    }

    return {
      total: all.length,
      byStatus,
      byRiskLevel,
      pendingReview: all.filter(k => k.status === KycStatus.PENDING_REVIEW).length,
      expiringSoon: all.filter(k => k.nextReviewDate && k.nextReviewDate <= thirtyDaysFromNow).length,
    };
  }

  // ==================== Suspicious Activity Reports ====================

  private async generateSarNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.sarRepository.count();
    return `SAR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createSar(dto: CreateSarDto, userId: string): Promise<SuspiciousActivityReport> {
    const reportNumber = await this.generateSarNumber();

    const sar = this.sarRepository.create({
      ...dto,
      reportNumber,
      activityDate: new Date(dto.activityDate),
      detectionDate: new Date(),
      createdBy: userId,
    });

    return this.sarRepository.save(sar);
  }

  async getAllSars(): Promise<SuspiciousActivityReport[]> {
    return this.sarRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getSar(id: string): Promise<SuspiciousActivityReport> {
    const sar = await this.sarRepository.findOne({ where: { id } });
    if (!sar) {
      throw new NotFoundException(`SAR with ID ${id} not found`);
    }
    return sar;
  }

  async updateSar(id: string, updates: Partial<SuspiciousActivityReport>): Promise<SuspiciousActivityReport> {
    const sar = await this.getSar(id);
    Object.assign(sar, updates);
    return this.sarRepository.save(sar);
  }
}
