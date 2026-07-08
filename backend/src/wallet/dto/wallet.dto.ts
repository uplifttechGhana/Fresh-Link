import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum PayoutTypeDto {
  mobile_money = 'mobile_money',
  bank = 'bank',
}

export class CreatePayoutAccountDto {
  @ApiProperty({ enum: PayoutTypeDto })
  @IsEnum(PayoutTypeDto)
  type: PayoutTypeDto;

  @ApiProperty({ description: 'Display name e.g. MTN Mobile Money or GCB Bank' })
  @IsString()
  @MinLength(2)
  provider: string;

  @ApiProperty({ description: 'Paystack bank_code for the provider' })
  @IsString()
  @MinLength(2)
  bankCode: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  accountNumber: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  accountName: string;

  @ApiPropertyOptional()
  @IsOptional()
  setDefault?: boolean;
}

export class WithdrawDto {
  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payoutAccountId?: string;
}
