import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpPurpose, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AfricasTalkingSmsService } from '../sms/africas-talking-sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sms: AfricasTalkingSmsService,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role,
        language: dto.language ?? 'en',
      },
    });

    // Create role-specific profile
    await this.createRoleProfile(user);

    // Create wallet for farmer, transport, investor
    if (['farmer', 'transport', 'investor'].includes(user.role)) {
      await this.prisma.wallet.create({ data: { userId: user.id } });
    }

    // Send OTP for phone verification
    await this.sendOtp(user.id, user.phone, OtpPurpose.registration);

    return { message: 'Registration successful. OTP sent to your phone.' };
  }

  // ── Admin registration ────────────────────────────────────────────────────

  async registerAdmin(dto: RegisterDto & { setupCode: string }) {
    const expected = process.env.ADMIN_SETUP_CODE;
    if (!expected || dto.setupCode !== expected) {
      throw new UnauthorizedException('Invalid admin setup code');
    }

    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      // Phone already registered — just promote to admin and return tokens
      const promoted =
        existing.role !== 'admin'
          ? await this.prisma.user.update({
              where: { id: existing.id },
              data: { role: 'admin' },
            })
          : existing;
      return { ...this.generateTokens(promoted), user: await this.fullUser(promoted.id) };
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: 'admin',
        language: dto.language ?? 'en',
        isVerified: true,
      },
    });

    return { ...this.generateTokens(user), user: await this.fullUser(user.id) };
  }

  private async createRoleProfile(user: User) {
    switch (user.role) {
      case 'farmer':
        await this.prisma.farmerProfile.create({ data: { userId: user.id } });
        break;
      case 'transport':
        await this.prisma.transportProfile.create({ data: { userId: user.id } });
        break;
      case 'investor':
        await this.prisma.investorProfile.create({ data: { userId: user.id } });
        break;
    }
  }

  /** Backfill missing role profiles for older accounts */
  private async ensureRoleProfile(user: User) {
    switch (user.role) {
      case 'farmer':
        await this.prisma.farmerProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        if (!(await this.prisma.wallet.findUnique({ where: { userId: user.id } }))) {
          await this.prisma.wallet.create({ data: { userId: user.id } });
        }
        break;
      case 'transport':
        await this.prisma.transportProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        if (!(await this.prisma.wallet.findUnique({ where: { userId: user.id } }))) {
          await this.prisma.wallet.create({ data: { userId: user.id } });
        }
        break;
      case 'investor':
        await this.prisma.investorProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        if (!(await this.prisma.wallet.findUnique({ where: { userId: user.id } }))) {
          await this.prisma.wallet.create({ data: { userId: user.id } });
        }
        break;
    }
  }

  // ── OTP ───────────────────────────────────────────────────────────────────

  async sendOtp(userId: string, phone: string, purpose: OtpPurpose) {
    // Invalidate existing unused OTPs for this user + purpose
    await this.prisma.otp.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({ data: { userId, code, purpose, expiresAt } });

    const mode = await this.sms.send(phone, `Your FreshLink PIN is ${code}. Valid for 10 minutes.`);
    this.logger.log(`OTP ${mode === 'stubbed' ? 'stubbed' : 'sent'} to ${phone} for purpose=${purpose}`);

    return {
      message: mode === 'stubbed' ? 'OTP generated (SMS stub — see server logs or /auth/dev/otp)' : 'OTP sent',
    };
  }

  async sendOtpByPhone(phone: string, purpose: OtpPurpose) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('No account found with this phone number');
    return this.sendOtp(user.id, user.phone, purpose);
  }

  async verifyOtp(dto: VerifyOtpDto, purpose: OtpPurpose) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new BadRequestException('No account found with this phone number');

    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    if (purpose === OtpPurpose.registration) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const tokens = this.generateTokens(user);
    // Ensure role profile exists BEFORE re-fetching so it's included in the response
    await this.ensureRoleProfile(user);
    return { ...tokens, user: await this.fullUser(user.id) };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is suspended');

    await this.ensureRoleProfile(user);

    const tokens = this.generateTokens(user);
    return { ...tokens, user: await this.fullUser(user.id) };
  }

  // ── Password reset ────────────────────────────────────────────────────────

  async forgotPassword(phone: string) {
    return this.sendOtpByPhone(phone, OtpPurpose.password_reset);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new BadRequestException('No account found with this phone number');

    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: dto.otpCode,
        purpose: OtpPurpose.password_reset,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await this.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    return { message: 'Password reset successful' };
  }

  // ── Refresh token ─────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateTokens(user: User) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    });
    return { accessToken, refreshToken };
  }

  /** Re-fetch user from DB with all role profiles included and strip passwordHash. */
  async fullUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        transportProfile: true,
        investorProfile: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
