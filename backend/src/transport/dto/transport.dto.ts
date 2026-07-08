import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TransportJobStatus } from '@prisma/client';

export class UpdateJobStatusDto {
  @ApiProperty({ enum: TransportJobStatus })
  @IsEnum(TransportJobStatus)
  status: TransportJobStatus;
}
