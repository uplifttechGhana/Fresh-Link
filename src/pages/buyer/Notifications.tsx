import React from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Package, Truck, TrendingDown, Users, Receipt } from 'lucide-react';
import { useNotifications, useMarkAllRead, type ApiNotification } from '../../lib/hooks/useNotifications';

function getIcon(type: string) {
  if (type === 'system') return <img src="/app-icon-192.png" alt="FreshLink" className="w-8 h-8 object-contain rounded-full" />;
  if (type.includes('order') || type.includes('Order')) return <Package size={20} className="text-green" />;
  if (type.includes('delivery') || type.includes('transit')) return <Truck size={20} className="text-orange" />;
  if (type.includes('price') || type.includes('drop')) return <TrendingDown size={20} className="text-blue-500" />;
  if (type.includes('follow') || type.includes('farmer')) return <Users size={20} className="text-purple-500" />;
  if (type.includes('payment') || type.includes('receipt')) return <Receipt size={20} className="text-green" />;
  return <Package size={20} className="text-green" />;
}

function getIconBg(type: string) {
  if (type === 'system') return 'bg-white border border-green-100';
  if (type.includes('payment') || type.includes('receipt') || type.includes('order'))
    return 'bg-green-50';
  if (type.includes('delivery') || type.includes('transit')) return 'bg-orange-soft';
  if (type.includes('price') || type.includes('drop')) return 'bg-blue-50';
  if (type.includes('follow') || type.includes('farmer')) return 'bg-purple-50';
  return 'bg-green-50';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function BuyerNotifications() {
  const { data, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  const notifications = data?.items ?? [];
  const now = Date.now();
  const DAY_MS = 86_400_000;

  const today = notifications.filter(
    (n) => now - new Date(n.createdAt).getTime() < DAY_MS
  );
  const earlier = notifications.filter(
    (n) => now - new Date(n.createdAt).getTime() >= DAY_MS
  );

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Notifications" showBack rightAction="none" />
      <div className="flex justify-end px-6 py-2">
        <button
          onClick={() => markAllRead.mutate()}
          className="text-sm font-bold text-green">
          
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">🔔</div>
            <h3 className="font-bold text-ink mb-1">All caught up!</h3>
            <p className="text-sm text-muted">No new notifications</p>
          </div>
        )}

        {today.length > 0 &&
        <div className="mb-6">
            <h3 className="text-sm font-bold text-ink mb-4">Today</h3>
            <div className="space-y-4">
              {today.map((notif, idx) =>
            <NotifRow key={notif.id} notif={notif} idx={idx} />
            )}
            </div>
          </div>
        }

        {earlier.length > 0 &&
        <div>
            <h3 className="text-sm font-bold text-ink mb-4">Earlier</h3>
            <div className="space-y-4">
              {earlier.map((notif, idx) =>
            <NotifRow key={notif.id} notif={notif} idx={idx} />
            )}
            </div>
          </div>
        }
      </div>
    </div>);

}

function NotifRow({ notif, idx }: { notif: ApiNotification; idx: number }) {
  const isRead = !!notif.readAt;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`relative overflow-hidden flex gap-4 p-4 rounded-2xl transition-colors ${isRead ? 'bg-card' : 'bg-card shadow-sm'}`}>
      {/* Logo watermark */}
      <img
        src="/freshlink-logo.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none select-none"
        style={{ opacity: 0.07 }}
      />
      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(notif.type)}`}>
        {getIcon(notif.type)}
      </div>
      <div className="relative flex-1 min-w-0 pt-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm font-bold truncate pr-2 ${isRead ? 'text-ink/80' : 'text-ink'}`}>
            {notif.title}
          </h4>
          <span className="text-xs text-muted whitespace-nowrap">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
        <p className={`text-sm leading-snug ${isRead ? 'text-muted' : 'text-ink/90 font-medium'}`}>
          {notif.body}
        </p>
      </div>
      {!isRead && <div className="relative w-2 h-2 rounded-full bg-green mt-2 flex-shrink-0" />}
    </motion.div>
  );
}
