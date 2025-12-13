import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum DiagnosticType {
  CONNECTIVITY = 'connectivity',
  PERFORMANCE = 'performance',
  BATTERY = 'battery',
  FULL = 'full',
}

export class RunDiagnosticsDto {
  @ApiProperty({ enum: DiagnosticType, default: DiagnosticType.FULL })
  @IsEnum(DiagnosticType)
  diagnosticType: DiagnosticType;

  @ApiProperty({ required: false, example: 'manual' })
  @IsString()
  @IsOptional()
  triggeredBy?: string;
}

export class ResolveIssueDto {
  @ApiProperty({ example: 'Issue fixed by restarting device' })
  @IsString()
  resolution: string;
}
