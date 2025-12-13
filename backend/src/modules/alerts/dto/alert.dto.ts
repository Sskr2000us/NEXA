import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum AlertType {
  DEVICE_OFFLINE = 'device_offline',
  DEVICE_ERROR = 'device_error',
  LOW_BATTERY = 'low_battery',
  SECURITY_BREACH = 'security_breach',
  MAINTENANCE_NEEDED = 'maintenance_needed',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class CreateAlertDto {
  @ApiProperty()
  @IsUUID()
  home_id: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  device_id?: string;

  @ApiProperty({ enum: AlertType })
  @IsEnum(AlertType)
  alert_type: AlertType;

  @ApiProperty({ enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ example: 'Device has gone offline' })
  @IsString()
  alert_message: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  alert_details?: string;
}

export class UpdateAlertDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  alert_message?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  alert_details?: string;
}

export class ResolveAlertDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
