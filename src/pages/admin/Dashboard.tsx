import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  AlertTriangle,
  FileText,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LeafDecoration } from '../../components/ui/LeafDecoration';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { DashboardHero, QUICK_ACTION_ICON_CLASS } from '../../components/ui/DashboardHero';
import { SettingsMenuSheet } from '../../components/ui/SettingsMenuSheet';
import { AvatarUploadSheet } from '../../components/ui/AvatarUploadSheet';
import { BottomNav } from '../../components/ui/BottomNav';
import { useAdminStats } from '../../lib/hooks/useAdmin';
import { useAuthStore } from '../../lib/authStore';
import { useNotifications } from '../../lib/hooks/useNotifications';

export function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;
  const { data: stats, isLoading } = useAdminStats();

  const volume = stats?.totalVolume ?? 0;

  const quickActions = [
    { icon: <Users size={20} className="text-green" />, label: 'Users', to: '/admin/users' },
    { icon: <Activity size={20} className="text-green" />, label: 'Monitor', to: '/admin/monitor' },
    { icon: <FileText size={20} className="text-green" />, label: 'Reports', to: '/admin/reports' },
    { icon: <CreditCard size={20} className="text-orange" />, label: 'Payments', to: '/admin/payments' },
    { icon: <AlertTriangle size={20} className="text-red-500" />, label: 'Support', to: '/admin/support' },
    { icon: <ShieldCheck size={20} className="text-blue-600" />, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <DashboardHero
        greeting={`Hello, ${user?.name?.split(' ')[0] ?? 'Admin'} 👋`}
        subtitle="FreshLink Platform Admin"
        user={user}
        unreadCount={unreadCount}
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card
            className="p-4 bg-green text-white relative cursor-pointer"
            leaves={false}
            onClick={() => navigate('/admin/reports')}
          >
            <LeafDecoration variant="single" className="-right-3 -bottom-4 w-20 rotate-12" />
            <LeafDecoration variant="fern" className="-left-4 -top-4 w-14 -rotate-45" />
            <div className="relative z-10">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <Activity size={16} />
              </div>
              <p className="text-xs text-green-100 mb-1">Total Volume</p>
              {isLoading ? (
                <div className="h-7 w-24 bg-white/20 rounded animate-pulse" />
              ) : (
                <h3 className="text-xl font-bold">
                  ₵{volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h3>
              )}
            </div>
          </Card>

          <Card
            className="p-4 bg-green text-white relative cursor-pointer"
            leaves={false}
            onClick={() => navigate('/admin/users')}
          >
            <LeafDecoration variant="fern" opacity={30} className="left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/2 rotate-6" />
            <div className="relative z-10">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <Users size={16} />
              </div>
              <p className="text-xs text-green-100 mb-1">Total Users</p>
              {isLoading ? (
                <div className="h-7 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                <h3 className="text-xl font-bold">{stats?.totalUsers ?? 0}</h3>
              )}
            </div>
          </Card>
        </div>

        {!isLoading && stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(stats.ordersByStatus ?? {}).map(([status, count]) => (
              <Card key={status} className="p-3 text-center bg-white">
                <p className="text-[10px] text-muted mb-1 capitalize">{status.replace(/_/g, ' ')}</p>
                <p className="font-bold text-green text-sm">{Number(count) || 0}</p>
              </Card>
            ))}
          </div>
        )}

        <div className="mb-8">
          <TypewriterText text="Management" className="font-display font-bold text-lg text-ink mb-4" />
          <div className="space-y-3">
            <AdminLink
              icon={<Users size={20} />}
              title="User Management"
              subtitle={isLoading ? 'Loading…' : `${stats?.totalUsers ?? 0} registered users`}
              onClick={() => navigate('/admin/users')}
            />
            <AdminLink
              icon={<Activity size={20} />}
              title="Marketplace Monitor"
              subtitle="Live orders & disputes"
              onClick={() => navigate('/admin/monitor')}
            />
            <AdminLink
              icon={<FileText size={20} />}
              title="Reports & Analytics"
              subtitle="Revenue, growth, trends"
              onClick={() => navigate('/admin/reports')}
            />
            <AdminLink
              icon={<AlertTriangle size={20} />}
              title="Support Queue"
              subtitle="User tickets & inquiries"
              onClick={() => navigate('/admin/support')}
            />
            <AdminLink
              icon={<CreditCard size={20} />}
              title="Payments Monitor"
              subtitle="Transactions & history"
              onClick={() => navigate('/admin/payments')}
            />
          </div>
        </div>

        {stats && (
          <div>
            <TypewriterText text="Users by Role" className="font-display font-bold text-lg text-ink mb-4" />
            <Card className="overflow-hidden">
              {Object.entries(stats.usersByRole ?? {}).map(([role, count], i, arr) => (
                <div
                  key={role}
                  onClick={() => navigate('/admin/users')}
                  className={`p-4 flex justify-between items-center cursor-pointer hover:bg-green-50 transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="text-sm text-muted capitalize">{role}</span>
                  <span className="font-bold text-sm text-green">{Number(count) || 0}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <BottomNav />
      <SettingsMenuSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AvatarUploadSheet open={avatarUploadOpen} onClose={() => setAvatarUploadOpen(false)} />
    </div>
  );
}

function AdminLink({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="p-4 flex items-center gap-4 hover:bg-green-50 transition-colors cursor-pointer border border-green/10"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full bg-green text-white flex items-center justify-center flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-ink">{title}</h4>
        <p className="text-xs text-muted truncate">{subtitle}</p>
      </div>
    </Card>
  );
}
