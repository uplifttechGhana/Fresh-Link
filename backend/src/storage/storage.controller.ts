import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IsString, IsNotEmpty } from 'class-validator';
import { StorageService } from './storage.service';
import { Public } from '../common/decorators/public.decorator';

class PresignedUrlDto {
  @IsString() @IsNotEmpty() folder: string;
  @IsString() @IsNotEmpty() extension: string;
  @IsString() @IsNotEmpty() contentType: string;
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (multipart/form-data). Returns { url }.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'produce' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const folder = ((req.body?.folder as string) ?? (req.query?.folder as string) ?? 'produce').toLowerCase();
        const isImage = file.mimetype.startsWith('image/');
        const isAudio =
          file.mimetype.startsWith('audio/') ||
          /\.(webm|m4a|mp4|ogg|wav)$/i.test(file.originalname ?? '');
        if (folder === 'chat' && (isImage || isAudio)) {
          return cb(null, true);
        }
        if (isImage) return cb(null, true);
        return cb(new BadRequestException('Only image files are allowed (audio allowed in chat folder)'), false);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder = 'produce',
    @Query('folder') folderQuery?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const resolvedFolder = folderQuery ?? folder;

    try {
      const url = await this.storage.save(
        file.buffer,
        file.originalname,
        resolvedFolder,
        file.mimetype,
      );
      return { url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      throw new BadRequestException(msg);
    }
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check storage configuration' })
  status() {
    return {
      provider: this.storage.activeProvider,
      cloudConfigured: this.storage.isCloudConfigured,
      s3Configured: this.storage.isS3Configured,
    };
  }

  @Post('presign')
  @ApiOperation({ summary: 'Get a presigned upload URL for direct S3/R2 upload' })
  async presign(@Body() dto: PresignedUrlDto) {
    if (!this.storage.isS3Configured) {
      return { uploadUrl: '', objectUrl: '', key: '', useDirectUpload: true };
    }
    return this.storage.getPresignedUploadUrl(dto.folder, dto.extension, dto.contentType);
  }
}
