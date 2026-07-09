import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { useLogin } from '../../lib/hooks/useAuth';
import { useAuthStore } from '../../lib/authStore';
import { normalizeGhanaPhone } from '../../lib/phone';
import { useBiometric } from '../../lib/hooks/useBiometric';

const ROLE_HOME: Record<string, string> = {
  buyer: '/buyer/home',
  farmer: '/farmer/dashboard',
  transport: '/transport/dashboard',
  investor: '/investor/dashboard',
  admin: '/admin/dashboard',
};

function parseLoginIdentifier(raw: string): { phone?: string; email?: string } {
  const value = raw.trim();
  if (value.includes('@')) {
    return { email: value.toLowerCase() };
  }
  return { phone: normalizeGhanaPhone(value) };
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bioError, setBioError] = useState('');
  const login = useLogin();
  const biometric = useBiometric();
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

  const handleLogin = () => {
    const payload = { ...parseLoginIdentifier(identifier), password };
    login.mutate(payload, {
      onSuccess: (data) => {
        const home = ROLE_HOME[data.user.role] ?? '/buyer/home';
        navigate(returnTo || home);
      },
    });
  };

  const handleBiometric = async () => {
    setBioError('');
    const ok = await biometric.authenticate('Log in to FreshLink');
    if (!ok) {
      setBioError('Biometric authentication failed. Use your password instead.');
      return;
    }
    // After biometric succeeds, auto-submit with stored credentials
    if (!identifier || !password) {
      setBioError('Enter your credentials once, then use biometrics next time.');
      return;
    }
    handleLogin();
  };

  const isEmail = identifier.includes('@');

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
                {t('auth.loginIdentifier')}
              </label>
              {isEmail ? (
                <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                  <input
                    type="email"
                    className="flex-1 px-4 py-4 bg-transparent outline-none text-ink font-medium"
                    placeholder={t('auth.emailPlaceholder')}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                  <div className="px-4 py-4 bg-gray-50 text-ink font-bold border-r border-gray-100 flex items-center">
                    +233
                  </div>
                  <input
                    type="tel"
                    className="flex-1 px-4 py-4 bg-transparent outline-none text-ink font-medium"
                    placeholder="00 000 0000"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              )}
              <p className="text-xs text-white/70 mt-2">
                {t('auth.loginIdentifierHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                {t('auth.password')}
              </label>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="flex-1 px-4 py-4 bg-transparent outline-none text-ink font-medium"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-muted hover:text-ink transition-colors flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-white font-bold underline underline-offset-2"
                onClick={() => navigate('/forgot-password')}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {login.isError && (
              <p className="text-red-300 text-sm">
                {(login.error as any)?.body?.message ?? 'Invalid credentials. Please try again.'}
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
            onClick={handleLogin}
            disabled={!identifier || !password || login.isPending}
          >
            {login.isPending ? t('common.loading') : t('auth.signIn')}
          </Button>

          {biometric.available && biometric.enrolled && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-white/25" />
                <span className="text-xs text-white/60 font-medium">or</span>
                <div className="flex-1 h-px bg-white/25" />
              </div>
              <button
                type="button"
                onClick={handleBiometric}
                disabled={login.isPending}
                className="flex flex-col items-center gap-1.5 py-2 disabled:opacity-50"
                aria-label="Sign in with biometrics"
              >
                <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border-2 border-white/30 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all shadow-lg">
                  <Fingerprint size={28} className="text-white" />
                </div>
                <span className="text-xs text-white/80 font-medium">
                  {biometric.biometryType === 'face' ? 'Face ID' : 'Fingerprint'}
                </span>
              </button>
              {bioError && (
                <p className="text-red-300 text-xs text-center">{bioError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthBackground>
  );
}
