import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustodianController } from './custodian.controller';
import { CustodianService } from './custodian.service';
import { SchwabAdapter } from './schwab.adapter';
import {
  CustodianConnection,
  CustodianAccountLink,
  CustodianSyncLog,
} from './custodian.entity';
import { Account } from '../../accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustodianConnection,
      CustodianAccountLink,
      CustodianSyncLog,
      Account,
    ]),
    ConfigModule,
  ],
  controllers: [CustodianController],
  providers: [CustodianService, SchwabAdapter],
  exports: [CustodianService],
})
export class CustodianModule {}
