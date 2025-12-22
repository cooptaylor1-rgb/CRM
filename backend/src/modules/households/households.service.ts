import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from './entities/household.entity';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdsRepository: Repository<Household>,
  ) {}

  async create(createHouseholdDto: CreateHouseholdDto): Promise<Household> {
    const household = this.householdsRepository.create(createHouseholdDto);
    return this.householdsRepository.save(household);
  }

  async findAll(): Promise<Household[]> {
    return this.householdsRepository.find({
      relations: ['persons', 'accounts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Household> {
    const household = await this.householdsRepository.findOne({
      where: { id },
      relations: ['persons', 'accounts'],
    });

    if (!household) {
      throw new NotFoundException(`Household with ID ${id} not found`);
    }

    return household;
  }

  async update(
    id: string,
    updateHouseholdDto: UpdateHouseholdDto,
  ): Promise<Household> {
    const household = await this.findOne(id);
    Object.assign(household, updateHouseholdDto);
    return this.householdsRepository.save(household);
  }

  async remove(id: string): Promise<void> {
    const household = await this.findOne(id);
    await this.householdsRepository.remove(household);
  }

  async updateTotalAum(householdId: string): Promise<void> {
    const household = await this.householdsRepository.findOne({
      where: { id: householdId },
      relations: ['accounts'],
    });

    if (household) {
      const totalAum = household.accounts.reduce(
        (sum, account) => sum + Number(account.currentValue || 0),
        0,
      );
      household.totalAum = totalAum;
      await this.householdsRepository.save(household);
    }
  }
}
