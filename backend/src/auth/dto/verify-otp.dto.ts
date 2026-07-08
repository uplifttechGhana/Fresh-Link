import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches, IsEnum, IsOptional } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({ example: '+233241234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ enum: OtpPurpose, example: 'login' })
  @IsEnum(OtpPurpose)
  @IsOptional()
  purpose?: OtpPurpose;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+233241234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit PIN' })
  code: string;

  @ApiPropertyOptional({ enum: OtpPurpose, example: 'login' })
  @IsEnum(OtpPurpose)
  @IsOptional()
  purpose?: OtpPurpose;
}
