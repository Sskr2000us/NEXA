import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsArray, IsObject } from 'class-validator';

export enum AutomationType {
  TIME_BASED = 'time_based',
  DEVICE_TRIGGERED = 'device_triggered',
  LOCATION_BASED = 'location_based',
  SCENE = 'scene',
}

export class CreateAutomationDto {
  @ApiProperty()
  @IsUUID()
  home_id: string;

  @ApiProperty({ example: 'Morning Routine' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AutomationType })
  @IsEnum(AutomationType)
  automation_type: AutomationType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: [
      { type: 'time', value: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
    ],
  })
  @IsArray()
  triggers: any[];

  @ApiProperty({ required: false, example: [] })
  @IsArray()
  @IsOptional()
  conditions?: any[];

  @ApiProperty({
    example: [
      { type: 'device_control', device_id: 'uuid', action: 'turn_on' },
    ],
  })
  @IsArray()
  actions: any[];

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateAutomationDto extends PartialType(CreateAutomationDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class ExecuteAutomationDto {
  @ApiProperty({ required: false, example: 'manual' })
  @IsString()
  @IsOptional()
  triggeredBy?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
