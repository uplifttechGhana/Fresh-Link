import {
  MessageCircle,
  Package,
  Wallet,
  Truck,
  DollarSign,
  Users,
  Activity,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { homeIcon, searchIcon, farmerIcon, cartIcon, ordersIcon } from '../../assets/icons';
import { useAuthStore } from '../../lib/authStore';
import { navConfigForRole, type NavTab as NavTabConfig } from '../../lib/navTabs';
import { messagesPath, useUnreadMessageCount } from './MessagesShortcut';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

type NavTab = NavTabConfig & {
  png?: string;
  Icon?: LucideIcon;
};

const TAB_ICONS: Record<string, { png?: string; Icon?: LucideIcon }> = {
  home: { png: homeIcon },
  explore: { png: searchIcon },
  farmers: { png: farmerIcon },
  cart: { png: cartIcon },
  produce: { Icon: Package },
  orders: { png: ordersIcon },
  wallet: { Icon: Wallet },
  jobs: { Icon: Truck },
  earnings: { Icon: DollarSign },
  users: { Icon: Users },
  monitor: { Icon: Activity },
  reports: { Icon: FileText },
};

function tabsWithIcons(config: ReturnType<typeof navConfigForRole>): NavTab[] {
  if (!config) return [];
  return config.tabs.map((tab) => ({
    ...tab,
    ...TAB_ICONS[tab.id],
  }));
}

function TabIcon({
  tab,
  isActive,
}: {
  tab: NavTab;
  isActive: boolean;
}) {
  if (tab.png) {
    return (
      <img
        src={tab.png}
        alt=""
        aria-hidden
        className="w-6 h-6 object-contain"
      />
    );
  }

  const Icon = tab.Icon;
  if (!Icon) return null;

  return (
    <Icon
      size={22}
      strokeWidth={2.25}
      className={isActive ? 'text-green' : 'text-white'}
    />
  );
}

export function BottomNav(_props: BottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const unreadMessages = useUnreadMessageCount();

  const config = navConfigForRole(user?.role);
  if (!config) return null;

  const tabs = tabsWithIcons(config);
  const activeTab = config.getActiveTab(pathname);
  const showMessagesFab = !config.isMessagesScreen(pathname);
  const inboxPath = messagesPath(user?.role);

  return (
    <div className="absolute bottom-0 inset-x-0 z-40 pointer-events-none">
      {showMessagesFab && inboxPath && (
        <button
          type="button"
          onClick={() => navigate(inboxPath)}
          aria-label={t('nav.chats')}
          className="pointer-events-auto absolute bottom-24 right-6 w-14 h-14 rounded-full bg-earth text-yellow border-2 border-green shadow-fab flex items-center justify-center active:scale-95 transition-all z-50 hover:opacity-90"
        >
          <MessageCircle size={26} strokeWidth={2} />
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-cream">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      )}

      <div className="pointer-events-auto h-20 bg-green rounded-t-[2rem] shadow-[0_-8px_24px_-8px_rgba(14,77,44,0.25)] flex items-center justify-around px-3 pb-4 pt-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.route)}
              aria-current={isActive ? 'page' : undefined}
              className={twMerge(
                'flex flex-1 flex-col items-center justify-center gap-1 min-h-[52px] rounded-2xl px-2 py-1.5 transition-all focus:outline-none',
                isActive
                  ? 'bg-white text-green shadow-sm'
                  : 'text-white hover:bg-white/10',
              )}
            >
              <TabIcon tab={tab} isActive={isActive} />
              <span
                className={twMerge(
                  'text-[10px] font-medium leading-none',
                  isActive ? 'font-bold text-green' : 'text-white',
                )}
              >
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
