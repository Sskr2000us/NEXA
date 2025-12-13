import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsNumber, IsObject } from 'class-validator';

export enum DeviceType {
  LIGHT = 'light',
  SWITCH = 'switch',
  THERMOSTAT = 'thermostat',
  CAMERA = 'camera',
  LOCK = 'lock',
  SENSOR_MOTION = 'sensor_motion',
  SENSOR_CONTACT = 'sensor_contact',
  OTHER = 'other',
}

export class CreateDeviceDto {
  @ApiProperty()
  @IsUUID()
  home_id: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  room_id?: string;

  @ApiProperty({ example: 'Living Room Light' })
  @IsString()
  device_name: string;

  @ApiProperty({ enum: DeviceType })
  @IsEnum(DeviceType)
  device_type: DeviceType;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  brand_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  device_model_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  manufacturer_device_id?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  capabilities?: Record<string, any>;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_online?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  health_score?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  battery_level?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_favorite?: boolean;
}

export class DeviceFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  deviceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  roomId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  isFavorite?: boolean;
}

export class UpdateDeviceStateDto {
  @ApiProperty({ example: { power: true, brightness: 80 } })
  @IsObject()
  state: Record<string, any>;
}
