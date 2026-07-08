import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { useSendOtp } from '../../lib/hooks/useAuth';
import { useOtpSession } from '../../lib/otpSessionStore';
import { useAuthStore } from '../../lib/authStore';

const ROLE_HOME: Record<string, string> = {
  buyer: '/buyer/home',
  farmer: '/farmer/dashboard',
  transport: '/transport/dashboard',
  investor: '/investor/dashboard',
  admin: '/admin/dashboard',
};

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const sendOtp = useSendOtp();
  const setOtpSession = useOtpSession((s) => s.set);
  const { user, accessToken, guestRole, pendingRole } = useAuthStore();
  const setPendingRole = useAuthStore((s) => s.setPendingRole);

  if (user && accessToken) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/buyer/home'} replace />;
  }

  const returnTo = searchParams.get('returnTo') ?? '';

  const handleSignUp = () => {
    const role = guestRole ?? pendingRole;
    if (role) {
      setPendingRole(role);
      navigate('/register');
      return;
    }
    navigate('/role-select');
  };

  const handleSendOtp = () => {
    const digits = phone.replace(/\s/g, '').replace(/^0/, '');
    const fullPhone = `+233${digits}`;
    sendOtp.mutate({ phone: fullPhone, purpose: 'login' }, {
      onSuccess: () => {
        setOtpSession(fullPhone, 'login');
        navigate(`/otp${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
      },
    });
  };

  return (
    <AuthBackground>
      <TopBar showBack transparent />
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-display font-extrabold text-white mb-3 leading-tight">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-white/80">{t('auth.loginDesc')}</p>
          </motion.div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                {t('auth.phone')}
              </label>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <div className="px-4 py-4 bg-gray-50 text-ink font-bold border-r border-gray-100 flex items-center">
                  +233
                </div>
                <input
                  type="tel"
                  className="flex-1 px-4 py-4 bg-transparent outline-none text-ink font-medium"
                  placeholder="00 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {sendOtp.isError && (
              <p className="text-red-300 text-sm">
                {(sendOtp.error as any)?.body?.message ?? 'Failed to send OTP. Please try again.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/55 via-black/35 to-transparent">
          <p className="text-center text-sm text-white/90 mb-3">
            {t('auth.noAccount')}{' '}
            <button
              type="button"
              className="text-white font-bold underline underline-offset-2"
              onClick={handleSignUp}
            >
              {t('auth.signUp')}
            </button>
          </p>

          <Button
            size="lg"
            fullWidth
            className="auth-cta"
            onClick={handleSendOtp}
            disabled={!phone || sendOtp.isPending}
          >
            {sendOtp.isPending ? t('common.loading') : 'Send PIN'}
          </Button>
        </div>
      </div>
    </AuthBackground>
  );
}
