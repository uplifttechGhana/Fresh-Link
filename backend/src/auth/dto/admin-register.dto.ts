import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength } from 'class-validator';

export class AdminRegisterDto {
  @ApiProperty({ example: 'FreshLink Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+233200000001' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'admin@freshlink.local' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: 'Secret setup code from ADMIN_SETUP_CODE env var' })
  @IsString()
  @IsNotEmpty()
  setupCode: string;
}
