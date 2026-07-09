import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import {
  Package, DollarSign, Truck, TrendingUp, CloudRain,
  Calendar, AlertTriangle, CheckCircle2, Bell,
} from 'lucide-react';
import {
  useNotifications,
  useMarkAllRead,
  useMarkNotifRead,
  ApiNotification,
} from '../../lib/hooks/useNotifications';

function getIcon(type: string) {
  switch (type) {
    case 'new_order': return <Package size={18} className="text-blue-600" />;
    case 'payment': return <DollarSign size={18} className="text-green" />;
    case 'delivery': return <Truck size={18} className="text-orange" />;
    case 'price_alert': return <TrendingUp size={18} className="text-purple-600" />;
    case 'weather': return <CloudRain size={18} className="text-cyan-600" />;
    case 'reminder': return <Calendar size={18} className="text-pink-600" />;
    case 'warning': return <AlertTriangle size={18} className="text-red-500" />;
    case 'system': return <img src="/app-icon-192.png" alt="FreshLink" className="w-8 h-8 object-contain rounded-full" />;
    default: return <Bell size={18} className="text-muted" />;
  }
}

function getBg(type: string) {
  switch (type) {
    case 'new_order': return 'bg-blue-50';
    case 'payment': return 'bg-green-50';
    case 'delivery': return 'bg-orange-soft';
    case 'price_alert': return 'bg-purple-50';
    case 'weather': return 'bg-cyan-50';
    case 'reminder': return 'bg-pink-50';
    case 'warning': return 'bg-red-50';
    case 'system': return 'bg-white border border-green-100';
    default: return 'bg-gray-50';
  }
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Notifications() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkNotifRead();

  const notifications = data?.items ?? [];
  const todayNotifs = notifications.filter((n) => isToday(n.createdAt));
  const earlierNotifs = notifications.filter((n) => !isToday(n.createdAt));

  const NotifGroup = ({ title, items }: { title: string; items: ApiNotification[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="font-bold text-ink mb-3 px-1">{title}</h3>
        <div className="space-y-3">
          {items.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 flex gap-4 cursor-pointer ${!notif.readAt ? 'border-l-4 border-l-green' : ''}`}
              onClick={() => { if (!notif.readAt) markOne.mutate(notif.id); }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getBg(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm ${!notif.readAt ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-muted whitespace-nowrap ml-2">
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{notif.body}</p>
              </div>
              {!notif.readAt && (
                <div className="w-2 h-2 rounded-full bg-green mt-1.5 flex-shrink-0" />
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Notifications" showBack rightAction="none" />
      <div className="px-6 py-2 flex justify-between items-center">
        {data?.unreadCount ? (
          <span className="text-xs text-muted">{data.unreadCount} unread</span>
        ) : <span />}
        <button
          onClick={() => markAll.mutate()}
          className="text-xs font-bold text-green"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <Bell size={48} className="mb-3 opacity-30" />
            <p className="font-medium">No notifications yet</p>
          </div>
        ) : (
          <>
            <NotifGroup title="Today" items={todayNotifs} />
            <NotifGroup title="Earlier" items={earlierNotifs} />
          </>
        )}
      </div>
    </div>
  );
}
