import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AuthBackground } from '../../components/ui/AuthBackground';
import { useAuthStore, UserRole } from '../../lib/authStore';

type RoleId = 'farmer' | 'buyer' | 'transport' | 'investor';

const ROLES: {
  id: RoleId;
  title: string;
  desc: string;
  icon: string;
  highlights: string[];
}[] = [
  {
    id: 'farmer',
    title: "I'm A Farmer",
    desc: 'For those who grow the goodness.',
    icon: '🌾',
    highlights: ['List produce & set prices', 'Receive orders from buyers', 'Request farm transport'],
  },
  {
    id: 'buyer',
    title: "I'm A Buyer",
    desc: 'For those who savor the goodness.',
    icon: '🛒',
    highlights: ['Browse fresh farm produce', 'Compare prices across farms', 'Order & track deliveries'],
  },
  {
    id: 'transport',
    title: "I'm A Transporter",
    desc: 'For those who deliver the goodness.',
    icon: '🚚',
    highlights: ['Pick up delivery jobs nearby', 'Earn per trip with live nav', 'Build your driver rating'],
  },
  {
    id: 'investor',
    title: "I'm An Investor",
    desc: 'For those who fund the future.',
    icon: '📈',
    highlights: ['Fund farmer harvest cycles', 'Track returns & impact', 'Support local agriculture'],
  },
];

export function RoleSelect() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setPendingRole = useAuthStore((s) => s.setPendingRole);
  const setGuestRole = useAuthStore((s) => s.setGuestRole);
  const [index, setIndex] = useState(0);
  const [hasExplored, setHasExplored] = useState(false);

  const current = ROLES[index];
  const selectedRole = current.id;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(ROLES.length - 1, next));
    setIndex(clamped);
    if (clamped !== 0) setHasExplored(true);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 48;
    if (info.offset.x < -threshold) goTo(index + 1);
    else if (info.offset.x > threshold) goTo(index - 1);
    if (Math.abs(info.offset.x) > threshold) setHasExplored(true);
  };

  const handleContinue = () => {
    if (selectedRole === 'buyer') {
      setGuestRole('buyer');
      setPendingRole('buyer');
      navigate('/buyer/home');
    } else {
      setPendingRole(selectedRole as UserRole);
      navigate('/register');
    }
  };

  return (
    <AuthBackground>
      <TopBar showBack transparent />

      <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-3xl font-display font-extrabold text-white mb-3 leading-tight">
            Let's Get Started On Your Journey
          </h1>
          <p className="text-white/80">
            Tell us who you are, so we can tailor your FreshLink experience.
          </p>
        </motion.div>

        {/* Carousel — one full-width card at a time */}
        <div className="relative flex-1 min-h-[260px] max-h-[340px] mb-4">
          {/* Peek of next card on the right */}
          {index < ROLES.length - 1 && (
            <div
              className="absolute right-0 top-4 bottom-4 w-4 rounded-l-2xl bg-white/25 border border-white/20 pointer-events-none z-0"
              aria-hidden="true"
            />
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 72 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -72 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 z-10 touch-pan-y cursor-grab active:cursor-grabbing"
            >
              <RoleCarouselCard role={current} />
            </motion.div>
          </AnimatePresence>

          {/* Swipe hint — first card only, until user explores */}
          {!hasExplored && index === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-1 right-0 flex items-center gap-1 text-white/80 text-xs font-semibold pointer-events-none z-20"
            >
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                className="flex items-center gap-0.5"
              >
                Swipe for more
                <ChevronRight size={14} strokeWidth={3} />
              </motion.span>
            </motion.div>
          )}
        </div>

        {/* Arrows + dots */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous role"
            className="w-11 h-11 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-ink disabled:opacity-30 disabled:pointer-events-none hover:bg-white transition-colors"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Roles">
            {ROLES.map((role, i) => (
              <button
                key={role.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={role.title}
                onClick={() => {
                  goTo(i);
                  if (i !== 0) setHasExplored(true);
                }}
                className={`rounded-full transition-all ${
                  i === index
                    ? 'w-7 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              goTo(index + 1);
              setHasExplored(true);
            }}
            disabled={index === ROLES.length - 1}
            aria-label="Next role"
            className={`w-11 h-11 rounded-full shadow-sm flex items-center justify-center transition-colors ${
              index === 0 && !hasExplored
                ? 'bg-white text-ink ring-2 ring-white/50 animate-pulse'
                : 'bg-white/90 text-ink hover:bg-white disabled:opacity-30 disabled:pointer-events-none'
            }`}
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-center text-white/60 text-xs mb-4">
          {index + 1} of {ROLES.length} · drag or use arrows to browse
        </p>

        <div className="mt-auto pt-2">
          <Button size="lg" fullWidth className="auth-cta" onClick={handleContinue}>
            Continue as {current.title.replace("I'm A ", '').replace("I'm An ", '')}
          </Button>

          <button
            type="button"
            onClick={() => navigate('/ussd')}
            className="w-full mt-6 py-3 border-2 border-dashed border-white/40 rounded-2xl text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            {t('auth.ussdMode')}
          </button>
        </div>
      </div>
    </AuthBackground>
  );
}

function RoleCarouselCard({ role }: { role: (typeof ROLES)[number] }) {
  return (
    <Card
      leaves
      leafOpacity={95}
      className="h-full p-6 flex flex-col bg-forest border-2 border-white/25 shadow-float"
    >
      <div className="relative z-0 flex items-start gap-5">
        <div className="w-[4.5rem] h-[4.5rem] rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center text-4xl shadow-sm flex-shrink-0">
          {role.icon}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="font-display font-bold text-xl text-white mb-1.5 leading-tight">
            {role.title}
          </h3>
          <p className="text-sm text-white/75 leading-relaxed">{role.desc}</p>
        </div>
      </div>

      <ul className="relative z-0 mt-5 pt-5 border-t border-white/20 space-y-2.5 flex-1">
        {role.highlights.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-orange flex-shrink-0" />
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
