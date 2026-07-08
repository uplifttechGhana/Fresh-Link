import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { useVerifyOtp, useSendOtp } from '../../lib/hooks/useAuth';
import { useOtpSession } from '../../lib/otpSessionStore';
import { useAuthStore } from '../../lib/authStore';
import { api } from '../../lib/api';

// ⚠️ DEV ONLY — remove before production
async function fetchDevOtp(phone: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(phone);
    const res = await api.get<{ otp: string }>(`/auth/dev/otp/${encoded}`);
    return res.otp ?? null;
  } catch {
    return null;
  }
}

const ROLE_HOME: Record<string, string> = {
  buyer: '/buyer/home',
  farmer: '/farmer/dashboard',
  transport: '/transport/dashboard',
  investor: '/investor/dashboard',
  admin: '/admin/dashboard',
};

export function OtpVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useTranslation();
  const verifyOtp = useVerifyOtp();
  const sendOtp = useSendOtp();
  const { phone, purpose, clear: clearSession } = useOtpSession();
  const setGuestRole = useAuthStore((s) => s.setGuestRole);

  // ⚠️ DEV ONLY — auto-fill OTP from dev endpoint. REMOVE BEFORE PRODUCTION.
  const autoFillOtp = async () => {
    if (!import.meta.env.DEV || !phone) return;
    const code = await fetchDevOtp(phone);
    if (code && code.length === 6) {
      setOtp(code.split(''));
    }
  };

  useEffect(() => {
    autoFillOtp();
  }, [phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? '';
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) return;
    verifyOtp.mutate(
      { phone, code, purpose },
      {
        onSuccess: (data) => {
          clearSession();
          setGuestRole(null);
          const returnTo = searchParams.get('returnTo');
          navigate(returnTo ?? ROLE_HOME[data.user.role] ?? '/buyer/home', { replace: true });
        },
      },
    );
  };

  const handleResend = () => {
    sendOtp.mutate({ phone, purpose }, {
      onSuccess: () => {
        // ⚠️ DEV ONLY — refetch after resend. REMOVE BEFORE PRODUCTION.
        setTimeout(autoFillOtp, 800); // slight delay for backend to persist new OTP
      },
    });
  };

  const displayPhone = phone
    ? phone.replace('+233', '+233 ').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')
    : '+233 __ ___ ____';

  return (
    <AuthBackground>
      <TopBar showBack transparent />
      <div className="flex-1 px-6 pb-10 flex flex-col">
        <motion.div
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="mb-8">

          <h1 className="text-3xl font-display font-extrabold text-white mb-3 leading-tight">
            {t('auth.otpTitle')}
          </h1>
          <p className="text-white/80">
            {t('auth.otpDesc')}{' '}
            <span className="font-bold text-white">{displayPhone}</span>
          </p>
        </motion.div>

        <div className="mb-auto flex justify-center gap-2 mt-4" onPaste={handlePaste}>
          {otp.map((digit, i) =>
          <input
            key={i}
            ref={(el) => inputRefs.current[i] = el}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`PIN digit ${i + 1}`}
            className="w-12 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 text-center text-2xl font-display font-bold text-ink focus:ring-2 focus:ring-green-500 outline-none"
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }} />
          )}
        </div>
        {verifyOtp.isError && (
          <p className="text-red-300 text-sm text-center mt-2">
            {(verifyOtp.error as any)?.body?.message ?? 'Invalid or expired code. Please try again.'}
          </p>
        )}

        <div className="pt-6">
          <Button
            size="lg"
            fullWidth
            className="auth-cta"
            onClick={handleVerify}
            disabled={otp.join('').length < 6 || verifyOtp.isPending}>
            {verifyOtp.isPending ? t('common.loading') : t('auth.otpVerify')}
          </Button>
          <p className="text-center text-sm text-white/80 mt-6">
            {t('auth.otpResend')}?{' '}
            <button
              className="text-white font-bold underline underline-offset-2"
              onClick={handleResend}
              disabled={sendOtp.isPending}>
              {sendOtp.isPending ? t('common.loading') : t('auth.otpResend')}
            </button>
          </p>
        </div>
      </div>
    </AuthBackground>);

}