import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { SUPPORTED_LANGUAGES, type LangCode } from '../../lib/i18n';
import { useAuthStore } from '../../lib/authStore';
import { useStore } from '../../store';

export function LanguageSelect() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Keep both stores in sync
  const setAuthLanguage = useAuthStore((s) => s.setLanguage);
  const setStoreLanguage = useStore((s) => s.setLanguage);

  const currentLang = (i18n.language ?? 'en') as LangCode;

  const handleSelect = (code: LangCode) => {
    i18n.changeLanguage(code);
    // Persist to both stores (legacy store uses display name, authStore uses code)
    setAuthLanguage(code);
    setStoreLanguage(code);
  };

  return (
    <AuthBackground>
      <TopBar transparent />
      <div className="flex-1 px-6 pb-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pt-4"
        >
          <h1 className="text-3xl font-display font-extrabold text-white mb-3 leading-tight">
            {t('auth.chooseLanguage')}
          </h1>
          <p className="text-white/80">{t('auth.chooseLanguageDesc')}</p>
        </motion.div>

        <div className="mb-auto space-y-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-white border-green shadow-sm'
                    : 'bg-white/50 border-transparent hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={`font-bold text-lg ${isSelected ? 'text-green' : 'text-ink'}`}>
                    {lang.label}
                  </span>
                  {lang.label !== lang.native && (
                    <span className="text-sm text-muted">{lang.native}</span>
                  )}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-6">
          <Button size="lg" fullWidth className="auth-cta" onClick={() => navigate('/role-select')}>
            {t('common.continue')}
          </Button>
        </div>
      </div>
    </AuthBackground>
  );
}
