import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, IsNotEmpty } from 'class-validator';
import { ProduceStatus } from '@prisma/client';

export class CreateProduceDto {
  @ApiProperty({ example: 'Fresh Tomatoes' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 12.50 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'vegetables' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  images?: string[];
}

export class UpdateProduceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ enum: ProduceStatus })
  @IsEnum(ProduceStatus)
  @IsOptional()
  status?: ProduceStatus;
}

export class ProduceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  farmerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;

  /** Sort order: 'recent' (default) | 'popular' (by order count) */
  @ApiPropertyOptional({ enum: ['recent', 'popular'] })
  @IsOptional()
  sort?: 'recent' | 'popular';
}
