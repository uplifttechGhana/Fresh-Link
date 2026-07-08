import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore, AuthUser } from '../../lib/authStore';

interface AdminRegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Admin registration page — accessible at /#/admin/register.
 * Requires the ADMIN_SETUP_CODE from the server's .env to proceed.
 * Share this code only with trusted staff; there is no link to this page
 * anywhere in the regular app UI.
 */
export function AdminRegister() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalisePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
    if (digits.startsWith('233')) return `+${digits}`;
    return raw.startsWith('+') ? raw : `+${digits}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !password || !setupCode.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<AdminRegisterResponse>('/auth/admin/register', {
        name: name.trim(),
        phone: normalisePhone(phone.trim()),
        password,
        setupCode: setupCode.trim(),
        role: 'admin',
        language: 'en',
      });

      // Store tokens and hydrate auth state exactly like a normal login
      localStorage.setItem('access_token', res.accessToken);
      localStorage.setItem('refresh_token', res.refreshToken);
      setAuth(res.user, res.accessToken, res.refreshToken);

      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const msg: string =
        err?.body?.message ?? err?.message ?? 'Registration failed. Check your setup code.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-ink rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-extrabold text-ink">Admin Setup</h1>
          <p className="text-sm text-muted text-center mt-1">
            Create or promote an account to platform admin.
            <br />
            Requires the secret setup code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emmanuel Asante"
              autoComplete="name"
              className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 24 000 0000"
              autoComplete="tel"
              className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className="w-full bg-white rounded-xl px-4 py-3 pr-12 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Setup Code */}
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">
              <span className="flex items-center gap-1.5">
                <KeyRound size={14} /> Admin Setup Code
              </span>
            </label>
            <input
              type="password"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              placeholder="Enter the secret setup code"
              autoComplete="off"
              className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-muted mt-1">
              Get this code from your server's <code className="bg-gray-100 px-1 rounded">ADMIN_SETUP_CODE</code> environment variable.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-ink text-white rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Setting up…</>
            ) : (
              <><ShieldCheck size={20} /> Create Admin Account</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          Already have an admin account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-green font-bold"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
