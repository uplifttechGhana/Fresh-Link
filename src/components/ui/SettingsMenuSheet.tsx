import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Globe,
  Moon,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  MapPin,
  BookUser,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { AvatarUploadSheet } from './AvatarUploadSheet';
import { useStore } from '../../store';
import { useAuthStore } from '../../lib/authStore';
import { disconnectSocket } from '../../lib/socket';
import { SUPPORTED_LANGUAGES } from '../../lib/i18n';
import menuHarvestBg from '../../assets/menu-harvest-bg.png';

const THEMED_CARD =
  'overflow-hidden bg-green/90 backdrop-blur-md shadow-card border border-white/25';

function ProfileHeader({
  themed,
  user,
  onEdit,
  onAvatarClick,
}: {
  themed: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  onEdit: () => void;
  onAvatarClick?: () => void;
}) {
  const avatar = onAvatarClick ? (
    <button
      type="button"
      onClick={onAvatarClick}
      aria-label="Change profile photo"
      className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm flex-shrink-0 active:scale-95 transition-transform ${themed ? 'border-yellow' : 'border-white'}`}
    >
      <img
        src={user?.avatarUrl ?? `https://i.pravatar.cc/150?u=${user?.id ?? 'default'}`}
        alt="User"
        className="w-full h-full object-cover"
      />
    </button>
  ) : (
    <div
      className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm flex-shrink-0 ${themed ? 'border-yellow' : 'border-white'}`}
    >
      <img
        src={user?.avatarUrl ?? `https://i.pravatar.cc/150?u=${user?.id ?? 'default'}`}
        alt="User"
        className="w-full h-full object-cover"
      />
    </div>
  );

  const content = (
    <>
      {avatar}
      <div className="min-w-0">
        <h2
          className={`text-lg font-display font-bold ${themed ? 'text-white drop-shadow-sm' : 'text-ink'}`}
        >
          {user?.name ?? '—'}
        </h2>
        <p className={`text-sm ${themed ? 'text-yellow-light' : 'text-muted'}`}>
          {user?.phone ?? ''}
        </p>
      </div>
      <button
        onClick={onEdit}
        className={
          themed
            ? 'ml-auto flex-shrink-0 text-green font-bold text-sm bg-yellow px-3 py-1.5 rounded-lg shadow-sm'
            : 'ml-auto flex-shrink-0 text-green font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg'
        }
      >
        Edit
      </button>
    </>
  );

  if (themed) {
    return (
      <Card className={`${THEMED_CARD} flex items-center gap-4 p-4 mb-6`}>
        {content}
      </Card>
    );
  }

  return <div className="flex items-center gap-4 mb-6">{content}</div>;
}

function SettingsRow({
  icon,
  title,
  value,
  border = true,
  titleClass = 'text-ink',
  themed = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  border?: boolean;
  titleClass?: string;
  themed?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={
        themed
          ? `flex items-center justify-between p-4 bg-transparent hover:bg-white/10 transition-colors cursor-pointer ${border ? 'border-b border-white/15' : ''}`
          : `flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer ${border ? 'border-b border-gray-100' : ''}`
      }
    >
      <div className="flex items-center gap-3">
        <div className={themed ? 'text-yellow' : 'text-muted'}>{icon}</div>
        <span
          className={`font-medium text-sm ${themed && titleClass === 'text-ink' ? 'text-white' : titleClass}`}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className={`text-xs font-medium ${themed ? 'text-yellow-light' : 'text-muted'}`}>
            {value}
          </span>
        )}
        <ChevronRight size={16} className={themed ? 'text-yellow/70' : 'text-gray-300'} />
      </div>
    </div>
  );
}

export function LogoutConfirmSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    disconnectSocket();
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log Out"
      overlayClassName="z-[60]"
      panelZIndex="z-[60]"
    >
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
          <LogOut size={24} />
        </div>
        <h3 className="text-lg font-display font-bold text-ink mb-2">
          Are you sure you want to log out?
        </h3>
        <p className="text-sm text-muted mb-8">
          You will need to enter your phone number and OTP to log back in.
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-sm hover:bg-red-600 transition-colors"
          >
            Log Out
          </button>
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

export function SettingsMenuContent({
  onNavigate,
  onLogoutClick,
  onAvatarClick,
  themed = false,
}: {
  onNavigate: (path: string) => void;
  onLogoutClick?: () => void;
  onAvatarClick?: () => void;
  themed?: boolean;
}) {
  const darkMode = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const language = useStore((state) => state.language);
  const { t, i18n } = useTranslation();
  const currentLangLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.label ?? language;
  const offlineSync = useStore((state) => state.offlineSync);
  const toggleOfflineSync = useStore((state) => state.toggleOfflineSync);
  const user = useAuthStore((s) => s.user);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  const go = (path: string) => onNavigate(path);
  const requestLogout = () => {
    if (onLogoutClick) {
      onLogoutClick();
      return;
    }
    setShowLogoutSheet(true);
  };

  return (
    <>
      <ProfileHeader
        themed={themed}
        user={user}
        onEdit={() => go('/settings/profile')}
        onAvatarClick={onAvatarClick}
      />

      <div className="space-y-6">
        <div>
          <h3
            className={`text-xs font-bold uppercase tracking-wider mb-3 pl-2 ${themed ? 'text-yellow drop-shadow-sm' : 'text-muted'}`}
          >
            Account
          </h3>
          <Card className={themed ? THEMED_CARD : 'overflow-hidden'}>
            <SettingsRow
              themed={themed}
              icon={<User size={20} />}
              title="Personal Information"
              onClick={() => go('/settings/profile')}
            />
            <SettingsRow
              themed={themed}
              icon={<CreditCard size={20} />}
              title="Payment Methods"
              onClick={() => go('/settings/payments')}
            />
            {user?.role === 'buyer' && (
              <SettingsRow
                themed={themed}
                icon={<BookUser size={20} />}
                title="Address Book"
                onClick={() => go('/settings/addresses')}
              />
            )}
            {user?.role === 'farmer' && (
              <SettingsRow
                themed={themed}
                icon={<MapPin size={20} />}
                title="Farm Profile"
                onClick={() => go('/settings/farm-profile')}
              />
            )}
            <SettingsRow
              themed={themed}
              icon={<Shield size={20} />}
              title="Security & Privacy"
              border={false}
              onClick={() => go('/settings/security')}
            />
          </Card>
        </div>

        <div>
          <h3
            className={`text-xs font-bold uppercase tracking-wider mb-3 pl-2 ${themed ? 'text-yellow drop-shadow-sm' : 'text-muted'}`}
          >
            Preferences
          </h3>
          <Card className={themed ? THEMED_CARD : 'overflow-hidden'}>
            <SettingsRow
              themed={themed}
              icon={<Bell size={20} />}
              title="Notifications"
              onClick={() => go('/settings/notifications')}
            />
            <SettingsRow
              themed={themed}
              icon={<Globe size={20} />}
              title={t('settings.language')}
              value={currentLangLabel}
              onClick={() => go('/language')}
            />
            <SettingsRow
              themed={themed}
              icon={<Moon size={20} />}
              title="Dark Mode"
              value={darkMode ? 'On' : 'Off'}
              onClick={toggleDarkMode}
            />
            <div
              className={
                themed
                  ? 'flex items-center justify-between p-4 bg-transparent hover:bg-white/10 transition-colors cursor-pointer'
                  : 'flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer'
              }
            >
              <div className="flex items-center gap-3">
                <div className={themed ? 'text-yellow' : 'text-muted'}>
                  <Globe size={20} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium text-sm ${themed ? 'text-white' : 'text-ink'}`}>
                    Offline Sync
                  </span>
                  <span className={`text-[10px] ${themed ? 'text-yellow-light/80' : 'text-muted'}`}>
                    Data available without internet
                  </span>
                </div>
              </div>
              <button
                onClick={toggleOfflineSync}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${offlineSync ? (themed ? 'bg-yellow' : 'bg-green') : themed ? 'bg-white/20' : 'bg-gray-200'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${offlineSync ? 'translate-x-4' : 'translate-x-0'} ${themed ? 'bg-green' : 'bg-white'}`}
                />
              </button>
            </div>
          </Card>
        </div>

        <div>
          <h3
            className={`text-xs font-bold uppercase tracking-wider mb-3 pl-2 ${themed ? 'text-yellow drop-shadow-sm' : 'text-muted'}`}
          >
            Support & About
          </h3>
          <Card className={themed ? THEMED_CARD : 'overflow-hidden'}>
            <SettingsRow
              themed={themed}
              icon={<Smartphone size={20} />}
              title={t('ussd.settingsTitle')}
              value={t('ussd.settingsDesc')}
              onClick={() => go('/ussd')}
            />
            <SettingsRow
              themed={themed}
              icon={<HelpCircle size={20} />}
              title="Help Center"
              onClick={() => go('/settings/help')}
            />
            <SettingsRow
              themed={themed}
              icon={<Globe size={20} />}
              title="About FreshLink"
              onClick={() => go('/settings/about')}
            />
            <SettingsRow
              themed={themed}
              icon={<Shield size={20} />}
              title="Terms of Service"
              onClick={() => go('/settings/terms')}
            />
            <SettingsRow
              themed={themed}
              icon={<Shield size={20} />}
              title="Privacy Policy"
              onClick={() => go('/settings/privacy')}
            />
            <SettingsRow
              themed={themed}
              icon={<LogOut size={20} className="text-red-400" />}
              title="Log Out"
              titleClass="text-red-400"
              border={false}
              onClick={requestLogout}
            />
          </Card>
        </div>
      </div>

      {!onLogoutClick && (
        <LogoutConfirmSheet open={showLogoutSheet} onClose={() => setShowLogoutSheet(false)} />
      )}
    </>
  );
}

export function SettingsMenuSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Menu"
        backgroundImage={menuHarvestBg}
        panelClassName="max-h-[92%]"
        titleClassName="text-white drop-shadow-md"
        handleClassName="bg-green"
      >
        <SettingsMenuContent
          themed
          onNavigate={handleNavigate}
          onLogoutClick={() => setLogoutOpen(true)}
          onAvatarClick={() => setAvatarUploadOpen(true)}
        />
      </Sheet>
      <LogoutConfirmSheet open={logoutOpen} onClose={() => setLogoutOpen(false)} />
      <AvatarUploadSheet open={avatarUploadOpen} onClose={() => setAvatarUploadOpen(false)} />
    </>
  );
}
