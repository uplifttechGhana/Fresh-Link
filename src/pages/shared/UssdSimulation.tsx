import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Signal, Battery, WifiOff, RefreshCw } from 'lucide-react';
import { useUssd } from '../../lib/hooks/useUssd';
import { useAuthStore } from '../../lib/authStore';
import { getUssdShortcode } from '../../lib/ussdConfig';
import {
  formatUssdPhoneInput,
  isValidUssdPhone,
  loadUssdPhone,
  saveUssdPhone,
} from '../../lib/ussdPhone';
import { Button } from '../../components/ui/Button';

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

export function UssdSimulation() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  const [phone, setPhone] = useState(() => authUser?.phone || loadUssdPhone());
  const [phoneDraft, setPhoneDraft] = useState(phone.replace('+233', '0'));
  const [phoneReady, setPhoneReady] = useState(() => isValidUssdPhone(authUser?.phone || loadUssdPhone()));
  const [shortcode, setShortcode] = useState(getUssdShortcode());

  const { screen, isActive, loading, error, dial, send, reset } = useUssd(phone);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialedRef = useRef(false);

  useEffect(() => {
    if (authUser?.phone) {
      setPhone(authUser.phone);
      setPhoneDraft(authUser.phone.replace('+233', '0'));
      setPhoneReady(true);
      saveUssdPhone(authUser.phone);
    }
  }, [authUser?.phone]);

  useEffect(() => {
    import('../../lib/api').then(({ api }) =>
      api
        .get<{ shortcode: string }>('/ussd/config')
        .then((cfg) => setShortcode(cfg.shortcode || getUssdShortcode()))
        .catch(() => undefined),
    );
  }, []);

  useEffect(() => {
    if (phoneReady && !dialedRef.current) {
      dialedRef.current = true;
      dial();
    }
  }, [phoneReady, dial]);

  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [screen, isActive]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !isActive || loading) return;
    const val = input;
    setInput('');
    await send(val);
  }, [input, isActive, loading, send]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleKeypad = (key: string) => {
    if (!isActive || loading) return;
    if (key === '#') {
      void handleSend();
      return;
    }
    setInput((prev) => `${prev}${key}`);
  };

  const handleRedial = () => {
    reset();
    setInput('');
    dialedRef.current = false;
    if (phoneReady) {
      dialedRef.current = true;
      dial();
    }
  };

  const confirmPhone = () => {
    const digits = phoneDraft.replace(/\D/g, '');
    const local = digits.startsWith('0') ? digits : `0${digits}`;
    const formatted = formatUssdPhoneInput(local);
    if (!isValidUssdPhone(formatted)) return;
    saveUssdPhone(formatted);
    setPhone(formatted);
    setPhoneReady(true);
    dialedRef.current = false;
  };

  if (!phoneReady) {
    return (
      <div className="w-full h-full bg-cream flex flex-col">
        <div className="px-6 pt-12 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="text-sm text-muted mb-6">
            ← {t('common.back')}
          </button>
          <h1 className="text-2xl font-display font-bold text-ink mb-2">{t('ussd.title')}</h1>
          <p className="text-sm text-muted leading-relaxed">{t('ussd.phonePrompt')}</p>
        </div>

        <div className="flex-1 px-6">
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
            {t('auth.phone')}
          </label>
          <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
            <span className="px-4 py-4 text-ink font-bold border-r border-gray-100 bg-gray-50">+233</span>
            <input
              type="tel"
              value={phoneDraft.replace(/^\+?233/, '').replace(/^0/, '')}
              onChange={(e) => setPhoneDraft(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder={t('auth.phonePlaceholder')}
              className="flex-1 px-4 py-4 outline-none text-ink"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted mt-3">{t('ussd.phoneHint')}</p>
        </div>

        <div className="p-6">
          <Button
            fullWidth
            size="lg"
            onClick={confirmPhone}
            disabled={!isValidUssdPhone(formatUssdPhoneInput(phoneDraft))}
          >
            {t('ussd.startSession')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">
      <div className="h-8 w-full bg-black text-green-500 flex justify-between items-center px-4 text-xs font-mono border-b border-green-900/30">
        <div className="flex items-center gap-1">
          <Signal size={12} />
          <span>MTN</span>
        </div>
        <div className="flex items-center gap-2">
          <WifiOff size={12} className="text-gray-600" />
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <Battery size={14} />
        </div>
      </div>

      <div className="bg-gray-950 text-green-600 text-xs font-mono px-4 py-1 flex items-center gap-2 border-b border-green-900/20">
        <Phone size={11} />
        <span>{phone}</span>
        <span className="ml-auto text-gray-600">{shortcode}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative min-h-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.07)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-10">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-gray-300 text-sm font-medium">{t('ussd.sessionTitle')}</h3>
            {!isActive && screen && (
              <span className="text-xs text-red-400 font-mono">{t('ussd.sessionEnded')}</span>
            )}
            {loading && <span className="text-xs text-yellow-400 font-mono animate-pulse">...</span>}
            {isActive && <span className="text-xs text-green-400 font-mono">● {t('ussd.active')}</span>}
          </div>

          <div className="p-4 bg-gray-900 min-h-[140px] max-h-[220px] overflow-y-auto">
            {error ? (
              <div>
                <p className="text-red-400 font-mono text-sm mb-3">{error}</p>
                <button
                  type="button"
                  onClick={handleRedial}
                  className="text-green-400 text-xs font-bold flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  {t('common.retry')}
                </button>
              </div>
            ) : (
              <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {screen || (loading ? t('ussd.connecting') : t('ussd.dialling', { code: shortcode }))}
              </pre>
            )}
          </div>

          {isActive && (
            <div className="px-4 pb-3 flex gap-2">
              <input
                ref={inputRef}
                type="tel"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 bg-black border border-green-900/50 rounded px-3 py-2 text-green-400 font-mono text-sm outline-none focus:border-green-500 disabled:opacity-50"
                placeholder={t('ussd.inputPlaceholder')}
                autoFocus
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={loading || !input.trim()}
                className="bg-gray-700 text-green-400 px-4 py-2 rounded font-medium hover:bg-gray-600 transition-colors disabled:opacity-40"
              >
                {t('common.send')}
              </button>
            </div>
          )}

          <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-t border-gray-700">
            <button
              type="button"
              onClick={handleRedial}
              className="text-green-500 text-sm flex items-center gap-1 hover:text-green-300 transition-colors"
            >
              <RefreshCw size={12} />
              {t('ussd.redial')}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>

      <div className="h-44 bg-gray-900 border-t border-gray-800 grid grid-cols-3 gap-1 p-4 flex-shrink-0">
        {KEYPAD.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeypad(key)}
            disabled={!isActive || loading}
            className="flex items-center justify-center text-green-500 font-mono text-xl bg-black rounded-lg border border-gray-800 active:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
