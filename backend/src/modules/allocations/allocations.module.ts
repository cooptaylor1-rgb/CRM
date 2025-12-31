import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';
import {
  TargetAssetAllocation,
  AllocationLineItem,
  FeeSchedule,
  FeeTier,
  FeeHistory,
} from './entities/allocation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TargetAssetAllocation,
      AllocationLineItem,
      FeeSchedule,
      FeeTier,
      FeeHistory,
    ]),
  ],
  controllers: [AllocationsController],
  providers: [AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}
