import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Runs once at application startup.
 *
 * Any phone numbers listed in the ADMIN_PHONES environment variable
 * (comma-separated, e.g. "+233244000001,+233244000002") are automatically
 * promoted to the `admin` role if they exist in the database.
 *
 * This is the safe, production-ready alternative to a dev-only HTTP endpoint.
 * Set the env var in your deployment environment (Railway, Render, etc.) and
 * the specified users will be admins on next boot.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const raw = process.env.ADMIN_PHONES ?? '';
    if (!raw.trim()) return;

    const phones = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    for (const phone of phones) {
      try {
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user) {
          this.logger.warn(`[AdminSeed] No user found for phone ${phone} — skipping`);
          continue;
        }
        if (user.role === 'admin') {
          this.logger.log(`[AdminSeed] ${phone} is already admin`);
          continue;
        }
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' },
        });
        this.logger.log(`[AdminSeed] ✅ Promoted ${phone} (${user.name}) to admin`);
      } catch (err) {
        this.logger.error(`[AdminSeed] Failed to promote ${phone}`, err);
      }
    }
  }
}
