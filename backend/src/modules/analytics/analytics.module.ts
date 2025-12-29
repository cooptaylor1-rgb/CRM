import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  ClientProfitability,
  AdvisorMetrics,
  FirmMetrics,
  ActivitySnapshot,
} from './entities/analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientProfitability,
      AdvisorMetrics,
      FirmMetrics,
      ActivitySnapshot,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
