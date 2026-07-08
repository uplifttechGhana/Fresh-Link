import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, MinLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  produceId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty()
  @IsString()
  @MinLength(5)
  deliveryAddress: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateReviewDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  rating: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
