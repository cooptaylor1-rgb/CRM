import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesService } from './entities.service';
import { EntitiesController } from './entities.controller';
import { LegalEntity } from './entities/entity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LegalEntity])],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
