import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalEntity } from './entities/entity.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(LegalEntity)
    private entitiesRepository: Repository<LegalEntity>,
  ) {}

  async create(createEntityDto: CreateEntityDto): Promise<LegalEntity> {
    const entity = this.entitiesRepository.create(createEntityDto);
    return this.entitiesRepository.save(entity);
  }

  async findAll(): Promise<LegalEntity[]> {
    return this.entitiesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LegalEntity> {
    const entity = await this.entitiesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateEntityDto: UpdateEntityDto): Promise<LegalEntity> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateEntityDto);
    return this.entitiesRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.entitiesRepository.remove(entity);
  }
}
