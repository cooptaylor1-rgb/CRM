import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityIncident } from './entities/security-incident.entity';
import { KycVerification, SuspiciousActivityReport } from './entities/kyc.entity';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecurityIncident, KycVerification, SuspiciousActivityReport]),
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
