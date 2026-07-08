import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSeedService } from './admin-seed.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminSeedService],
})
export class AdminModule {}
