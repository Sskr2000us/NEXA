import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsObject, IsOptional, IsString } from 'class-validator';

export class LogTelemetryDto {
  @ApiProperty()
  @IsUUID()
  device_id: string;

  @ApiProperty({ example: { temperature: 22.5, humidity: 45 } })
  @IsObject()
  sensor_data: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  timestamp?: string;
}
