import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';

export function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <AuthBackground>
      <TopBar showBack transparent />
      <div className="flex-1 px-6 pb-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-extrabold text-white mb-3 leading-tight">
            Reset Password
          </h1>
          <p className="text-white/80">
            Password reset by email is coming soon. For now, contact support with your registered
            phone number and email.
          </p>
        </motion.div>

        <div className="mb-auto rounded-2xl bg-white/10 border border-white/20 p-5 space-y-4">
          <div className="flex items-center gap-3 text-white">
            <Mail size={22} />
            <div>
              <p className="font-bold">Email support</p>
              <a
                href="mailto:uplifttechgh@gmail.com?subject=FreshLink%20password%20reset"
                className="text-sm text-white/90 underline underline-offset-2"
              >
                uplifttechgh@gmail.com
              </a>
            </div>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Include your registered phone number and email address. We will verify your account and
            help you sign in again.
          </p>
        </div>

        <div className="pt-6">
          <Button size="lg" fullWidth className="auth-cta" onClick={() => navigate('/login')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    </AuthBackground>
  );
}
