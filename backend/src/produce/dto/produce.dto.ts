import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, IsNotEmpty, ArrayMinSize } from 'class-validator';
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

  @ApiProperty({ type: [String], description: 'At least one real photo of the produce is required.' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one photo of your produce before listing it.' })
  images: string[];

  @ApiPropertyOptional({ description: 'Optional short video showcasing the produce.' })
  @IsString()
  @IsOptional()
  video?: string;
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

  @ApiPropertyOptional({ type: [String], description: 'If provided, must include at least one photo — listings can never be saved with zero photos.' })
  @IsArray()
  @ArrayMinSize(1, { message: 'A listing needs at least one photo — add one before removing the last.' })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ enum: ProduceStatus })
  @IsEnum(ProduceStatus)
  @IsOptional()
  status?: ProduceStatus;

  @ApiPropertyOptional({ description: 'Optional short video showcasing the produce. Send an empty string to remove it.' })
  @IsString()
  @IsOptional()
  video?: string;
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
