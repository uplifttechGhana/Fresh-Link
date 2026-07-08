import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { Eye, EyeOff } from 'lucide-react';
import { useRegister } from '../../lib/hooks/useAuth';
import { useAuthStore } from '../../lib/authStore';

const ROLE_HOME: Record<string, string> = {
  buyer: '/buyer/home',
  farmer: '/farmer/dashboard',
  transport: '/transport/dashboard',
  investor: '/investor/dashboard',
  admin: '/admin/dashboard',
};

export function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const register = useRegister();
  const { user, accessToken, pendingRole, guestRole } = useAuthStore();
  const registerRole = pendingRole ?? guestRole ?? 'buyer';

  if (user && accessToken) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/buyer/home'} replace />;
  }

  return (
    <AuthBackground>
      <TopBar showBack transparent />
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-2 leading-tight">
              Create Account
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Join FreshLink to connect with farmers and buyers.
              {registerRole !== 'buyer' && (
                <span className="block mt-1 text-sm text-white/70 capitalize">
                  Registering as {registerRole}
                </span>
              )}
            </p>
          </motion.div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-sm font-bold text-white mb-1.5">
                Full Name
              </label>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <input
                  type="text"
                  className="flex-1 px-4 py-3.5 bg-transparent outline-none text-ink font-medium"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">
                Phone Number
              </label>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <div className="px-4 py-3.5 bg-gray-50 text-ink font-bold border-r border-gray-100 flex items-center">
                  +233
                </div>
                <input
                  type="tel"
                  className="flex-1 px-4 py-3.5 bg-transparent outline-none text-ink font-medium"
                  placeholder="00 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">
                Email Address
              </label>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <input
                  type="email"
                  className="flex-1 px-4 py-3.5 bg-transparent outline-none text-ink font-medium"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">
                Password
              </label>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="flex-1 px-4 py-3.5 bg-transparent outline-none text-ink font-medium"
                  placeholder="••••••••"
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

            <div className="flex items-start gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${agreeTerms ? 'bg-green border-green text-white' : 'border-gray-300 bg-white'}`}
              >
                {agreeTerms && (
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    className="w-3.5 h-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" />
                  </svg>
                )}
              </button>
              <p className="text-sm text-white/80 leading-tight">
                I agree to the{' '}
                <span className="text-white font-bold underline underline-offset-2">Terms of Service</span> and{' '}
                <span className="text-white font-bold underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/55 via-black/35 to-transparent">
          {register.isError && (() => {
            const status = (register.error as any)?.status;
            const msg = (register.error as any)?.body?.message;
            const text = Array.isArray(msg) ? msg[0] : (msg ?? 'Registration failed. Please try again.');
            const isConflict = status === 409;
            return (
              <div className="mb-3 text-center">
                <p className="text-red-300 text-sm">{text}</p>
                {isConflict && (
                  <button
                    className="text-white font-bold text-sm mt-1 underline underline-offset-2"
                    onClick={() => navigate('/login')}
                  >
                    Log in instead →
                  </button>
                )}
              </div>
            );
          })()}

          <p className="text-center text-sm text-white/90 mb-3">
            Already have an account?{' '}
            <button
              type="button"
              className="text-white font-bold underline underline-offset-2"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </p>

          <Button
            size="lg"
            fullWidth
            className="auth-cta"
            onClick={() => {
              const digits = phone.replace(/\s/g, '').replace(/^0/, '');
              const fullPhone = `+233${digits}`;
              register.mutate(
                {
                  name: fullName,
                  phone: fullPhone,
                  email,
                  password,
                  role: registerRole,
                },
                {
                  onSuccess: (data) => {
                    navigate(ROLE_HOME[data.user.role] ?? '/buyer/home');
                  },
                },
              );
            }}
            disabled={!phone || !password || !fullName || !email || !agreeTerms || register.isPending}
          >
            {register.isPending ? 'Creating account…' : 'Create Account'}
          </Button>
        </div>
      </div>
    </AuthBackground>
  );
}
