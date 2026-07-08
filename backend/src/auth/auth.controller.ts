import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OtpPurpose } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /**
   * Create or promote an admin account.
   * Requires the ADMIN_SETUP_CODE from the server's .env file.
   * Share that code only with trusted staff — they visit /admin/register in the app.
   */
  @Public()
  @Post('admin/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register (or promote) an admin account using the setup code' })
  adminRegister(@Body() dto: AdminRegisterDto) {
    return this.auth.registerAdmin(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone or email + password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP PIN for phone verification or login' })
  async sendOtp(@Body() dto: SendOtpDto) {
    if (dto.purpose) {
      return this.auth.sendOtpByPhone(dto.phone, dto.purpose);
    }
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    const purpose = user?.isVerified ? OtpPurpose.login : OtpPurpose.registration;
    return this.auth.sendOtpByPhone(dto.phone, purpose);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP PIN and receive JWT tokens' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    if (dto.purpose) {
      return this.auth.verifyOtp(dto, dto.purpose);
    }
    try {
      return await this.auth.verifyOtp(dto, OtpPurpose.login);
    } catch {
      return this.auth.verifyOtp(dto, OtpPurpose.registration);
    }
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.phone);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refreshToken(refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user (full profile)' })
  async me(@CurrentUser() user: any) {
    // JwtStrategy.validate returns DB user with .id (not .sub from raw payload)
    return this.auth.fullUser(user.id);
  }

  /** Dev-only: retrieve the latest unused OTP for a phone number. Remove before production. */
  @Public()
  @Get('dev/otp/:phone(*)')
  @ApiOperation({ summary: '[DEV ONLY] Get latest OTP for a phone number' })
  async devGetOtp(@Param('phone') phone: string) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Not available in production' };
    }
    // Normalise: restore + sign if it was stripped or space-encoded
    const normalised = phone.startsWith('233')
      ? `+${phone}`
      : phone.startsWith(' 233')
        ? `+${phone.trim()}`
        : phone;

    const user = await this.prisma.user.findUnique({ where: { phone: normalised } });
    if (!user) {
      // Try finding by partial match as a fallback
      const users = await this.prisma.user.findMany({
        where: { phone: { endsWith: phone.replace(/^\+?233/, '') } },
        take: 1,
      });
      if (!users.length) return { error: `User not found for phone: ${normalised}` };
      const otp = await this.prisma.otp.findFirst({
        where: { userId: users[0].id, usedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      return { phone: users[0].phone, otp: otp?.code ?? null, expiresAt: otp?.expiresAt ?? null };
    }
    const otp = await this.prisma.otp.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return { phone: user.phone, otp: otp?.code ?? null, expiresAt: otp?.expiresAt ?? null };
  }
}
