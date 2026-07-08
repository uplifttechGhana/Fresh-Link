import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional, ValidateIf } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: '+233241234567' })
  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({ example: 'kwame@example.com' })
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
