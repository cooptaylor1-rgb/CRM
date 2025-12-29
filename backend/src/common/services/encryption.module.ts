import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { EncryptionSubscriber } from '../subscribers/encryption.subscriber';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    EncryptionService,
    EncryptionSubscriber,
  ],
  exports: [EncryptionService, EncryptionSubscriber],
})
export class EncryptionModule {}
