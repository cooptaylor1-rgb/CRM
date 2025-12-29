import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientPreference } from './entities/client-preference.entity';
import { ClientRelationship } from './entities/client-relationship.entity';
import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientPreference, ClientRelationship])],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}
