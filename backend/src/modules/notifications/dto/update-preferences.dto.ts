import {
  IsBoolean,
  IsOptional,
  IsObject,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, NotificationChannel } from '../entities/notification.entity';

class ChannelSettingsDto {
  @IsOptional()
  @IsBoolean()
  in_app?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;
}

class TypeSettingDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  channels: NotificationChannel[];
}

class QuietHoursDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  start: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  end: string;

  @IsString()
  timezone: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek?: number[];
}

class DigestSettingsDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  frequency: 'daily' | 'weekly';

  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  time: string;

  @IsString()
  timezone: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelSettingsDto)
  channelSettings?: ChannelSettingsDto;

  @IsOptional()
  @IsObject()
  typeSettings?: Record<NotificationType, TypeSettingDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DigestSettingsDto)
  digestSettings?: DigestSettingsDto;

  @IsOptional()
  @IsString()
  pushToken?: string;
}
