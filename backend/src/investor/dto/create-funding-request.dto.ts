import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateFundingRequestDto {
  @ApiProperty({ example: '2024 Tomato Season' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Seeds, fertilizer, and labour for the dry season.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  goal: number;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'YYYY-MM-DD from date picker' })
  @IsDateString()
  @IsOptional()
  deadline?: string;
}
