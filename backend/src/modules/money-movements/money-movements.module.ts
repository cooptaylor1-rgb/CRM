import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { MoneyMovementRequest } from './entities/money-movement.entity';
import { MoneyMovementsController } from './money-movements.controller';
import { MoneyMovementsService } from './money-movements.service';

@Module({
  imports: [TypeOrmModule.forFeature([MoneyMovementRequest]), AuditModule],
  controllers: [MoneyMovementsController],
  providers: [MoneyMovementsService],
  exports: [MoneyMovementsService],
})
export class MoneyMovementsModule {}
