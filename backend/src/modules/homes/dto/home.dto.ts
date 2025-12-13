import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, IsEmail } from 'class-validator';

export class CreateHomeDto {
  @ApiProperty({ example: 'My Smart Home' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address_line1?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address_line2?: string;

  @ApiProperty({ example: 'San Francisco', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'CA', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '94102', required: false })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ example: 'US', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'America/Los_Angeles', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 2000, required: false })
  @IsNumber()
  @IsOptional()
  square_footage?: number;

  @ApiProperty({ example: 'house', required: false })
  @IsString()
  @IsOptional()
  home_type?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateHomeDto extends PartialType(CreateHomeDto) {}

export class InviteMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'member', enum: ['owner', 'admin', 'member', 'guest'] })
  @IsString()
  role: string;
}
