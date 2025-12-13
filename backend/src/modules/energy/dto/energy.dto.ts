import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';

export class LogEnergyUsageDto {
  @ApiProperty()
  @IsUUID()
  device_id: string;

  @ApiProperty()
  @IsUUID()
  home_id: string;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  energy_kwh: number;

  @ApiProperty({ required: false, example: 120 })
  @IsNumber()
  @IsOptional()
  power_watts?: number;

  @ApiProperty({ required: false, example: 220 })
  @IsNumber()
  @IsOptional()
  voltage?: number;

  @ApiProperty({ required: false, example: 0.55 })
  @IsNumber()
  @IsOptional()
  current_amps?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  timestamp?: string;
}
