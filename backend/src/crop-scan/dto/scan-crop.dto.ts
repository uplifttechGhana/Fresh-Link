import { IsString, IsUrl, MaxLength } from 'class-validator';

export class ScanCropDto {
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  imageUrl: string;
}
