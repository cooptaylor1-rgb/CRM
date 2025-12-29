import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ClientPreference } from './entities/client-preference.entity';
import { ClientRelationship, RelationshipType, RelationshipStatus } from './entities/client-relationship.entity';
import {
  CreateClientPreferenceDto,
  UpdateClientPreferenceDto,
  CreateClientRelationshipDto,
  UpdateClientRelationshipDto,
} from './dto/preference.dto';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(ClientPreference)
    private preferenceRepository: Repository<ClientPreference>,
    @InjectRepository(ClientRelationship)
    private relationshipRepository: Repository<ClientRelationship>,
  ) {}

  // Client Preferences
  async createPreference(dto: CreateClientPreferenceDto, userId: string): Promise<ClientPreference> {
    // Check if preferences already exist for this household
    const existing = await this.preferenceRepository.findOne({
      where: { householdId: dto.householdId },
    });
    if (existing) {
      throw new ConflictException('Preferences already exist for this household');
    }

    const preference = this.preferenceRepository.create({
      ...dto,
      weddingAnniversary: dto.weddingAnniversary ? new Date(dto.weddingAnniversary) : undefined,
      retirementDate: dto.retirementDate ? new Date(dto.retirementDate) : undefined,
      updatedBy: userId,
    });
    return this.preferenceRepository.save(preference);
  }

  async getPreferenceByHousehold(householdId: string): Promise<ClientPreference> {
    const preference = await this.preferenceRepository.findOne({
      where: { householdId },
    });
    if (!preference) {
      throw new NotFoundException(`Preferences for household ${householdId} not found`);
    }
    return preference;
  }

  async updatePreference(householdId: string, dto: UpdateClientPreferenceDto, userId: string): Promise<ClientPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { householdId },
    });

    if (!preference) {
      // Create new if doesn't exist
      preference = this.preferenceRepository.create({ householdId });
    }

    Object.assign(preference, {
      ...dto,
      weddingAnniversary: dto.weddingAnniversary ? new Date(dto.weddingAnniversary) : preference.weddingAnniversary,
      retirementDate: dto.retirementDate ? new Date(dto.retirementDate) : preference.retirementDate,
      updatedBy: userId,
    });

    return this.preferenceRepository.save(preference);
  }

  async getUpcomingImportantDates(days: number = 30): Promise<{ householdId: string; date: string; description: string }[]> {
    const preferences = await this.preferenceRepository.find();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingDates: { householdId: string; date: string; description: string }[] = [];

    for (const pref of preferences) {
      // Check wedding anniversary
      if (pref.weddingAnniversary) {
        const thisYearAnniversary = new Date(pref.weddingAnniversary);
        thisYearAnniversary.setFullYear(today.getFullYear());
        if (thisYearAnniversary >= today && thisYearAnniversary <= futureDate) {
          upcomingDates.push({
            householdId: pref.householdId,
            date: thisYearAnniversary.toISOString().split('T')[0],
            description: 'Wedding Anniversary',
          });
        }
      }

      // Check custom important dates
      if (pref.importantDates) {
        for (const dateInfo of pref.importantDates) {
          const date = new Date(dateInfo.date);
          if (dateInfo.recurring) {
            date.setFullYear(today.getFullYear());
          }
          if (date >= today && date <= futureDate) {
            upcomingDates.push({
              householdId: pref.householdId,
              date: date.toISOString().split('T')[0],
              description: dateInfo.description,
            });
          }
        }
      }

      // Check children birthdays
      if (pref.childrenInfo) {
        for (const child of pref.childrenInfo) {
          if (child.birthdate) {
            const birthday = new Date(child.birthdate);
            birthday.setFullYear(today.getFullYear());
            if (birthday >= today && birthday <= futureDate) {
              upcomingDates.push({
                householdId: pref.householdId,
                date: birthday.toISOString().split('T')[0],
                description: `${child.name}'s Birthday`,
              });
            }
          }
        }
      }
    }

    return upcomingDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Client Relationships
  async createRelationship(dto: CreateClientRelationshipDto, userId: string): Promise<ClientRelationship> {
    const relationship = this.relationshipRepository.create({
      ...dto,
      relationshipSince: dto.relationshipSince ? new Date(dto.relationshipSince) : undefined,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      releaseExpiration: dto.releaseExpiration ? new Date(dto.releaseExpiration) : undefined,
      createdBy: userId,
    });
    return this.relationshipRepository.save(relationship);
  }

  async getRelationshipsByHousehold(householdId: string): Promise<ClientRelationship[]> {
    return this.relationshipRepository.find({
      where: { householdId },
      order: { relationshipType: 'ASC', contactName: 'ASC' },
    });
  }

  async getRelationship(id: string): Promise<ClientRelationship> {
    const relationship = await this.relationshipRepository.findOne({ where: { id } });
    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }
    return relationship;
  }

  async updateRelationship(id: string, dto: UpdateClientRelationshipDto): Promise<ClientRelationship> {
    const relationship = await this.getRelationship(id);
    Object.assign(relationship, {
      ...dto,
      lastContactDate: dto.lastContactDate ? new Date(dto.lastContactDate) : relationship.lastContactDate,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : relationship.releaseDate,
      releaseExpiration: dto.releaseExpiration ? new Date(dto.releaseExpiration) : relationship.releaseExpiration,
    });
    return this.relationshipRepository.save(relationship);
  }

  async deleteRelationship(id: string): Promise<void> {
    const relationship = await this.getRelationship(id);
    await this.relationshipRepository.softRemove(relationship);
  }

  async getRelationshipsByType(type: RelationshipType): Promise<ClientRelationship[]> {
    return this.relationshipRepository.find({
      where: { relationshipType: type, status: RelationshipStatus.ACTIVE },
      order: { contactName: 'ASC' },
    });
  }

  async getExpiringReleases(days: number = 30): Promise<ClientRelationship[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.relationshipRepository.find({
      where: {
        hasReleaseOnFile: true,
        releaseExpiration: LessThan(futureDate),
        status: RelationshipStatus.ACTIVE,
      },
      order: { releaseExpiration: 'ASC' },
    });
  }

  async getRelationshipMap(householdId: string): Promise<{
    professionalAdvisors: ClientRelationship[];
    familyAndPersonal: ClientRelationship[];
    referralSources: ClientRelationship[];
  }> {
    const relationships = await this.getRelationshipsByHousehold(householdId);

    const professionalTypes = [
      RelationshipType.CPA,
      RelationshipType.TAX_ATTORNEY,
      RelationshipType.ESTATE_ATTORNEY,
      RelationshipType.BUSINESS_ATTORNEY,
      RelationshipType.INSURANCE_AGENT,
      RelationshipType.MORTGAGE_BROKER,
      RelationshipType.REAL_ESTATE_AGENT,
      RelationshipType.BANKER,
      RelationshipType.OTHER_FINANCIAL_ADVISOR,
      RelationshipType.TRUSTEE,
      RelationshipType.EXECUTOR,
    ];

    const referralTypes = [
      RelationshipType.CENTER_OF_INFLUENCE,
      RelationshipType.REFERRAL_SOURCE,
    ];

    return {
      professionalAdvisors: relationships.filter(r => professionalTypes.includes(r.relationshipType)),
      familyAndPersonal: relationships.filter(r => 
        r.relationshipType === RelationshipType.FAMILY_MEMBER ||
        r.relationshipType === RelationshipType.BUSINESS_PARTNER ||
        r.relationshipType === RelationshipType.EMPLOYER ||
        r.relationshipType === RelationshipType.OTHER
      ),
      referralSources: relationships.filter(r => referralTypes.includes(r.relationshipType)),
    };
  }
}
