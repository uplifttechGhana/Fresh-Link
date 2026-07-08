import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import {
  MapPin,
  Navigation,
  DollarSign,
  Package,
  CheckCircle,
  Truck,
  Calendar,
  Wallet,
  Star,
  Bell,
  MessageCircle,
} from 'lucide-react';
import { useSetAvailability, useMyJobs, useAvailableJobs, useTransportProfile } from '../../lib/hooks/useTransport';
import { useWallet } from '../../lib/hooks/useWallet';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { useAuthStore } from '../../lib/authStore';
import { MessagesEntryCard } from '../../components/ui/MessagesShortcut';
import { DashboardHero, QUICK_ACTION_ICON_CLASS } from '../../components/ui/DashboardHero';
import { SettingsMenuSheet } from '../../components/ui/SettingsMenuSheet';
import { AvatarUploadSheet } from '../../components/ui/AvatarUploadSheet';
import { BottomNav } from '../../components/ui/BottomNav';

export function TransportDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const { data: availableJobs } = useAvailableJobs();
  const { data: myJobs } = useMyJobs();
  const { data: wallet } = useWallet();
  const { data: profile } = useTransportProfile();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;
  const setAvailability = useSetAvailability();

  const isOnline = profile?.isAvailable ?? false;
  const toggle = (next: boolean) => {
    if (next === isOnline || setAvailability.isPending) return;
    setAvailability.mutate(next, {
      onError: (err) => {
        toast.error(
          err instanceof ApiError && err.status === 404
            ? 'Could not update status. Restart the backend and try again.'
            : 'Could not update availability. Please try again.',
        );
      },
    });
  };

  const activeJob = myJobs?.find(
    (j) => j.status === 'accepted' || j.status === 'picked_up' || j.status === 'in_transit',
  );

  const completedToday = myJobs?.filter((j) => {
    if (j.status !== 'delivered' || !j.deliveredAt) return false;
    const d = new Date(j.deliveredAt);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const quickActions = [
    { label: 'Messages', icon: <MessageCircle size={20} className="text-green" />, to: '/transport/messages' },
    { label: 'History', icon: <CheckCircle size={20} className="text-green" />, to: '/transport/completed' },
    { label: 'Wallet', icon: <Wallet size={20} className="text-orange" />, to: '/transport/wallet' },
    { label: 'Vehicle', icon: <Truck size={20} className="text-blue-600" />, to: '/transport/vehicle' },
    { label: 'Schedule', icon: <Calendar size={20} className="text-purple-600" />, to: '/transport/availability' },
    { label: 'Ratings', icon: <Star size={20} className="text-yellow-600" />, to: '/transport/ratings' },
    { label: 'Alerts', icon: <Bell size={20} className="text-gray-600" />, to: '/transport/notifications' },
  ];

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <DashboardHero
        greeting={`Hello, ${user?.name?.split(' ')[0] ?? 'Driver'} 👋`}
        subtitle={isOnline ? 'Online · Accepting jobs' : 'Offline · Not accepting jobs'}
        user={user}
        unreadCount={unreadCount}
        notificationsPath="/transport/notifications"
        onAvatarClick={() => setAvatarUploadOpen(true)}
        onMenuClick={() => setSettingsOpen(true)}
        actions={
          <div className="grid grid-cols-4 gap-3 p-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={QUICK_ACTION_ICON_CLASS}>{action.icon}</div>
                <span className="text-[10px] font-bold text-yellow drop-shadow-sm text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-24">
        {/* Online = ready to accept jobs. Offline = browsing only. */}
        <Card className="p-1 flex mb-2 bg-gray-100">
          <button
            onClick={() => toggle(true)}
            disabled={setAvailability.isPending}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${isOnline ? 'bg-white shadow-sm text-ink' : 'text-muted'}`}
          >
            Online
          </button>
          <button
            onClick={() => toggle(false)}
            disabled={setAvailability.isPending}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${!isOnline ? 'bg-white shadow-sm text-ink' : 'text-muted'}`}
          >
            Offline
          </button>
        </Card>
        <p className="text-xs text-muted mb-6 px-1">
          {isOnline
            ? 'You can accept new delivery jobs. Farmers and buyers see you as available.'
            : 'You are not accepting jobs. Go online when you are ready to drive.'}
        </p>

        {/* Available Jobs entry */}
        <button
          onClick={() => navigate('/transport/jobs')}
          className="w-full mb-6 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-orange-soft text-orange rounded-full flex items-center justify-center">
            <Package size={20} />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-sm text-ink">Available Jobs</h4>
            <p className="text-xs text-muted">
              {availableJobs?.length ?? 0} delivery request
              {(availableJobs?.length ?? 0) !== 1 ? 's' : ''} nearby
            </p>
          </div>
          {(availableJobs?.length ?? 0) > 0 && (
            <span className="text-xs font-bold text-green bg-green-50 px-2 py-1 rounded-lg">
              {availableJobs!.length}
            </span>
          )}
        </button>

        <MessagesEntryCard className="mb-6" />

        {/* Active Job */}
        {activeJob ? (
          <div className="mb-8">
            <h3 className="font-bold text-ink mb-3">Active Delivery</h3>
            <Card className="p-4 border-2 border-green bg-green-50/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-ink">Job #{activeJob.id.slice(0, 8)}</h4>
                  <p className="text-xs text-muted">
                    {activeJob.distance ? `${activeJob.distance} km` : 'Distance TBD'}
                  </p>
                </div>
                <div className="bg-green text-white text-xs font-bold px-2 py-1 rounded-lg">
                  ₵{activeJob.fee.toFixed(2)}
                </div>
              </div>

              <div className="relative pl-6 space-y-4 mb-4">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-300"></div>
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 border-green bg-white"></div>
                  <p className="text-xs text-muted mb-0.5">Pickup</p>
                  <p className="text-sm font-bold text-ink">{activeJob.pickup}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-orange"></div>
                  <p className="text-xs text-muted mb-0.5">Drop-off</p>
                  <p className="text-sm font-bold text-ink">{activeJob.dropoff}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/transport/delivery/${activeJob.id}`)}
                className="w-full py-3 bg-green text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Navigation size={18} />
                Continue Delivery
              </button>
            </Card>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 rounded-2xl text-center text-sm text-muted border border-dashed border-gray-200">
            No active delivery. Accept a job to get started.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-4" onClick={() => navigate('/transport/earnings')}>
            <div className="w-8 h-8 bg-green-50 text-green rounded-full flex items-center justify-center mb-2">
              <DollarSign size={16} />
            </div>
            <p className="text-xs text-muted mb-1">Wallet Balance</p>
            <h3 className="text-xl font-bold text-ink">
              ₵{(wallet?.balance ?? 0).toFixed(2)}
            </h3>
          </Card>
          <Card
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/transport/completed')}
          >
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <MapPin size={16} />
            </div>
            <p className="text-xs text-muted mb-1">Today's Trips</p>
            <h3 className="text-xl font-bold text-ink">{completedToday ?? 0}</h3>
          </Card>
        </div>

        {/* Quick Actions moved to hero */}

      </div>

      <SettingsMenuSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AvatarUploadSheet open={avatarUploadOpen} onClose={() => setAvatarUploadOpen(false)} />
      <BottomNav />
    </div>
  );
}
