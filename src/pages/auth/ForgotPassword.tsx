import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { useForgotPassword } from '../../lib/hooks/useAuth';
import { useOtpSession } from '../../lib/otpSessionStore';
export function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const forgotPassword = useForgotPassword();
  const setOtpSession = useOtpSession((s) => s.set);
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
            Reset Password
          </h1>
          <p className="text-white/80">
            Enter your phone number and we'll send you a code to reset your
            password.
          </p>
        </motion.div>

        <div className="mb-auto space-y-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Phone Number
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
                onChange={(e) => setPhone(e.target.value)} />
              
            </div>
          </div>
        </div>

        <div className="pt-6">
          {forgotPassword.isError && (
            <p className="text-red-300 text-sm mb-3 text-center">
              {(forgotPassword.error as any)?.body?.message ?? 'No account found with this number.'}
            </p>
          )}
          <Button
            size="lg"
            fullWidth
            className="auth-cta"
            onClick={() => {
              const fullPhone = `+233${phone.replace(/\s/g, '')}`;
              forgotPassword.mutate(fullPhone, {
                onSuccess: () => {
                  setOtpSession(fullPhone, 'password_reset');
                  navigate('/otp');
                },
              });
            }}
            disabled={!phone || forgotPassword.isPending}>
            
            {forgotPassword.isPending ? 'Sending…' : 'Send Reset Code'}
          </Button>
          <p className="text-center text-sm text-white/80 mt-6">
            Remember your password?{' '}
            <button
              className="text-white font-bold underline underline-offset-2"
              onClick={() => navigate('/login')}>
              
              Login
            </button>
          </p>
        </div>
      </div>
    </AuthBackground>);

}