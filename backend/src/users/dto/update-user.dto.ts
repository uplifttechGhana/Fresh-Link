import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.email !== '' && o.email != null)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateFarmerProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccount?: string;
}

export class UpdateTransportProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleCapacity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehiclePhotoUrl?: string;
}

export class UpdateInvestorProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;
}

export class RegisterDeviceTokenDto {
  @ApiPropertyOptional()
  @IsString()
  token: string;

  @ApiPropertyOptional()
  @IsString()
  platform: string;
}
