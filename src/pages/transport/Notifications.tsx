import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Package, DollarSign, Star, Calendar, Bell, Loader2 } from 'lucide-react';
import {
  useNotifications,
  useMarkAllRead,
  useMarkNotifRead,
} from '../../lib/hooks/useNotifications';

export function TransportNotifications() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkNotifRead();

  const notifications = data?.items ?? [];

  const now = new Date();
  const today = notifications.filter((n) => {
    const d = new Date(n.createdAt);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });
  const earlier = notifications.filter((n) => !today.includes(n));

  const getIcon = (type: string) => {
    if (type === 'system') return <img src="/app-icon-192.png" alt="FreshLink" className="w-8 h-8 object-contain rounded-full" />;
    if (type.includes('job') || type.includes('delivery') || type.includes('order'))
      return <Package size={20} className="text-green" />;
    if (type.includes('payment') || type.includes('wallet'))
      return <DollarSign size={20} className="text-green" />;
    if (type.includes('rating') || type.includes('review'))
      return <Star size={20} className="text-orange" />;
    if (type.includes('schedule') || type.includes('reminder'))
      return <Calendar size={20} className="text-purple-600" />;
    return <Bell size={20} className="text-gray-600" />;
  };

  const getIconBg = (type: string) => {
    if (type === 'system') return 'bg-white border border-green-100';
    if (type.includes('job') || type.includes('delivery') || type.includes('order'))
      return 'bg-green-50';
    if (type.includes('payment') || type.includes('wallet')) return 'bg-green-50';
    if (type.includes('rating') || type.includes('review')) return 'bg-orange-soft';
    if (type.includes('schedule') || type.includes('reminder')) return 'bg-purple-50';
    return 'bg-gray-50';
  };

  const renderNotification = (n: any) => (
    <Card
      key={n.id}
      className={`p-4 flex gap-4 cursor-pointer ${!n.readAt ? 'bg-white' : 'bg-gray-50/50'}`}
      onClick={() => !n.readAt && markOne.mutate(n.id)}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(n.type)}`}
      >
        {getIcon(n.type)}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm ${!n.readAt ? 'font-bold text-ink' : 'font-medium text-gray-700'}`}>
            {n.title}
          </h4>
          {!n.readAt && <div className="w-2 h-2 rounded-full bg-green mt-1.5" />}
        </div>
        <p className="text-xs text-muted mb-2 leading-relaxed">{n.body}</p>
        <span className="text-[10px] font-medium text-gray-400">
          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </Card>
  );

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar
        title="Notifications"
        showBack
        rightAction="skip"
        onRightAction={() => markAll.mutate()}
      />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-green" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">No notifications yet.</div>
        ) : (
          <>
            {today.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-ink mb-3">Today</h3>
                <div className="space-y-3">{today.map(renderNotification)}</div>
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <h3 className="font-bold text-ink mb-3">Earlier</h3>
                <div className="space-y-3">{earlier.map(renderNotification)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
