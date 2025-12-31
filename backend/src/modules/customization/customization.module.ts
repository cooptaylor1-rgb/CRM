import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import {
  CustomFieldDefinition,
  CustomFieldValue,
  Tag,
  EntityTag,
  SavedView,
  UserPreference,
} from './entities/customization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomFieldDefinition,
      CustomFieldValue,
      Tag,
      EntityTag,
      SavedView,
      UserPreference,
    ]),
  ],
  controllers: [CustomizationController],
  providers: [CustomizationService],
  exports: [CustomizationService],
})
export class CustomizationModule {}
