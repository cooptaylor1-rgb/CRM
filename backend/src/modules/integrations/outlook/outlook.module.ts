import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OutlookController } from './outlook.controller';
import { OutlookService } from './outlook.service';
import {
  OutlookConnection,
  OutlookEmail,
  OutlookEvent,
  OutlookMatchingRule,
  OutlookContact,
} from './outlook.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      OutlookConnection,
      OutlookEmail,
      OutlookEvent,
      OutlookMatchingRule,
      OutlookContact,
    ]),
  ],
  controllers: [OutlookController],
  providers: [OutlookService],
  exports: [OutlookService],
})
export class OutlookModule {}
