import type { ReactNode } from 'react';
import { Bell, Menu, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { LeafDecoration } from './LeafDecoration';
import { DarkModeToggle } from './DarkModeToggle';
import menuHarvestBg from '../../assets/menu-harvest-bg.png';

export const QUICK_ACTION_ICON_CLASS =
  'w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center';

interface DashboardHeroProps {
  greeting: ReactNode;
  subtitle?: ReactNode;
  user?: { name: string; avatarUrl?: string | null } | null;
  unreadCount?: number;
  notificationsPath?: string;
  onAvatarClick: () => void;
  onMenuClick: () => void;
  actions?: ReactNode;
}

export function DashboardHero({
  greeting,
  subtitle,
  user,
  unreadCount = 0,
  notificationsPath,
  onAvatarClick,
  onMenuClick,
  actions,
}: DashboardHeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden rounded-b-[2rem] flex-shrink-0 z-10">
      <img
        src={menuHarvestBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
      />
      <LeafDecoration variant="fern" opacity={70} className="-left-5 -top-4 w-24 -rotate-12" />
      <LeafDecoration variant="monstera" opacity={65} className="-right-8 -bottom-12 w-36 rotate-6" />
      <LeafDecoration variant="single" opacity={35} className="left-1/3 top-6 w-14 rotate-12" />

      <div className="relative z-10 px-6 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onAvatarClick}
              aria-label="Change profile photo"
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow shadow-sm bg-white/20 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 size={30} className="text-white/80" />
              )}
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight drop-shadow-sm truncate">
                {greeting}
              </h2>
              {subtitle && (
                <div className="text-xs text-yellow-light mt-0.5 drop-shadow-sm truncate">{subtitle}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Dark mode toggle */}
            <DarkModeToggle light />

            {notificationsPath && (
              <button
                type="button"
                onClick={() => navigate(notificationsPath)}
                aria-label="Notifications"
                className="w-10 h-10 rounded-full bg-green/90 backdrop-blur-md border border-white/25 shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-orange rounded-full border border-green" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Menu"
              className="w-10 h-10 rounded-full bg-green/90 backdrop-blur-md border border-white/25 shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {actions && (
          <Card className="mt-5 overflow-hidden bg-green/90 backdrop-blur-md shadow-card border border-white/25">
            {actions}
          </Card>
        )}
      </div>
    </section>
  );
}
