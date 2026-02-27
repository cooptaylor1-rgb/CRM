/**
 * SchwabModule
 *
 * NestJS feature module that wires together all Schwab integration services,
 * controllers, and their dependencies.
 *
 * Import this module into the root AppModule (or IntegrationsModule) to
 * activate the Schwab integration.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { SchwabHttpClient } from './schwab-http.client';
import { SchwabAuthService } from './schwab-auth.service';
import { SchwabAccountService } from './schwab-account.service';
import { SchwabMarketDataService } from './schwab-market-data.service';
import { SchwabSyncService } from './schwab-sync.service';

// Controllers
import { SchwabAuthController } from './schwab-auth.controller';

// Entities
import { SchwabToken } from '../../../entities/schwab-token.entity';
import { CustodianAccount } from '../../../entities/custodian-account.entity';
import { CustodianSyncLog } from '../../../entities/custodian-sync-log.entity';
import { CustodianTransaction } from '../../../entities/custodian-transaction.entity';

@Module({
  imports: [
    /**
     * ConfigModule provides environment variables to all services via
     * ConfigService.getOrThrow(). Mark as global if not already global in
     * AppModule.
     */
    ConfigModule,

    /**
     * ScheduleModule enables the @Cron decorators in SchwabSyncService.
     * Should only be registered once (in AppModule) using forRoot();
     * here we use forRoot() safely because NestJS deduplicates dynamic
     * module registrations with identical tokens.
     */
    ScheduleModule.forRoot(),

    /**
     * TypeORM entity registrations scoped to this module.
     * These entities must also exist in the global TypeORM connection config.
     */
    TypeOrmModule.forFeature([
      SchwabToken,
      CustodianAccount,
      CustodianSyncLog,
      CustodianTransaction,
    ]),
  ],

  controllers: [
    /** OAuth endpoints: auth, callback, disconnect, status */
    SchwabAuthController,
  ],

  providers: [
    /**
     * Core HTTP client — instantiated once and shared across all services.
     * Encapsulates rate limiting, retry logic, and request logging.
     */
    SchwabHttpClient,

    /** OAuth lifecycle management */
    SchwabAuthService,

    /** Account number resolution and account syncing */
    SchwabAccountService,

    /** Real-time and historical market data */
    SchwabMarketDataService,

    /** Scheduled and on-demand sync orchestration */
    SchwabSyncService,
  ],

  exports: [
    /**
     * Export services so other modules (e.g. PortfolioModule, ReportsModule)
     * can inject them without re-importing the full module.
     */
    SchwabAuthService,
    SchwabAccountService,
    SchwabMarketDataService,
    SchwabSyncService,
    SchwabHttpClient,
  ],
})
export class SchwabModule {}
