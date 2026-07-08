import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Length } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: '+233241234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+233241234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otpCode: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
