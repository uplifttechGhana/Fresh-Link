import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { TopBar } from '../../components/ui/TopBar';
import freshLinkLogo from '../../assets/fresh-link-logo.png';
import menuHarvestBg from '../../assets/menu-harvest-bg.png';
import onboardingPanelBg from '../../assets/onboarding-panel-bg.png';
import onboardingLogoBadge from '../../assets/onboarding-logo-badge.png';

const PANEL_BACKGROUNDS = [
  {
    id: 'harvest',
    label: 'Show harvest background',
    src: menuHarvestBg,
    className: 'object-cover object-top',
  },
  {
    id: 'logo',
    label: 'Show full logo background',
    src: onboardingPanelBg,
    className: 'object-contain object-top px-4 pt-1 pb-0 mix-blend-multiply',
  },
  {
    id: 'badge',
    label: 'Show Fresh Link badge',
    src: onboardingLogoBadge,
    className: 'object-contain object-center px-2 py-1 mix-blend-multiply scale-[1.45]',
  },
] as const;

const BG_INTERVAL_MS = 8000;

export function Onboarding() {
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((current) => (current + 1) % PANEL_BACKGROUNDS.length);
    }, BG_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <img
          src={freshLinkLogo}
          alt=""
          className="absolute left-0 right-0 top-0 w-full h-[140%] object-cover object-top origin-top -translate-y-[28%] sm:-translate-y-[22%]"
        />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="[&_button]:text-white [&_button]:drop-shadow-md">
          <TopBar
            rightAction="skip"
            onRightAction={() => navigate('/role-select')}
            transparent
          />
        </div>

        <div className="flex-1 min-h-0" />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="relative mt-14 flex-shrink-0 max-h-[46vh] flex flex-col rounded-t-[2rem] overflow-hidden shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.25)] bg-cream"
        >
          <div className="relative h-36 sm:h-40 flex-shrink-0 overflow-hidden isolate bg-cream">
            {PANEL_BACKGROUNDS.map((bg, index) => (
              <img
                key={bg.id}
                src={bg.src}
                alt=""
                aria-hidden
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-[1200ms] ease-in-out ${bg.className} ${
                  index === bgIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>

          <div className="relative z-10 px-6 pb-8 pt-2 flex-shrink-0 bg-cream">
            <div className="flex justify-center pb-4 pt-1">
              <div className="w-10 h-1.5 rounded-full bg-green shadow-sm" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-extrabold text-ink mb-3 leading-tight">
                Fresh produce,
                <br />
                direct from farms.
              </h2>
              <p className="text-sm text-muted px-2">
                Connect directly with local farmers for the freshest vegetables
                and fruits in Ghana.
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {PANEL_BACKGROUNDS.map((bg, index) => (
                <button
                  key={bg.id}
                  type="button"
                  aria-label={bg.label}
                  onClick={() => setBgIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === bgIndex
                      ? 'w-8 bg-green shadow-sm'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button size="lg" fullWidth onClick={() => navigate('/role-select')}>
              Get Started
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
