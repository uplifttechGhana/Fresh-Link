import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import {
  TrendingUp, Package, Plus, Wallet, CloudSun, MessageSquare, Truck,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useWallet } from '../../lib/hooks/useWallet';
import { useFarmerOrders } from '../../lib/hooks/useOrders';
import { useMyListings, usePriceTrends } from '../../lib/hooks/useProduce';
import { useConversations } from '../../lib/hooks/useChat';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { useAuthStore } from '../../lib/authStore';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { LeafDecoration } from '../../components/ui/LeafDecoration';
import { MessagesEntryCard } from '../../components/ui/MessagesShortcut';
import { DashboardHero, QUICK_ACTION_ICON_CLASS } from '../../components/ui/DashboardHero';
import { SettingsMenuSheet } from '../../components/ui/SettingsMenuSheet';
import { AvatarUploadSheet } from '../../components/ui/AvatarUploadSheet';
import { BottomNav } from '../../components/ui/BottomNav';

export function FarmerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;
  const { data: wallet } = useWallet();
  const { data: orders = [] } = useFarmerOrders();
  const { data: produce = [] } = useMyListings();
  const { data: conversations = [] } = useConversations();
  const { data: priceData = [] } = usePriceTrends();

  const balance = wallet?.balance ?? 0;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const activeListings = produce.filter((p) => p.status === 'active').length;
  const recentOrders = orders.slice(0, 3);

  const quickActions = [
    { icon: <MessageSquare size={20} className="text-green" />, label: 'Messages', to: '/farmer/messages' },
    { icon: <Plus size={20} className="text-green" />, label: 'Add\nProduce', to: '/farmer/produce/add' },
    { icon: <Package size={20} className="text-blue-600" />, label: 'Inventory', to: '/farmer/produce' },
    { icon: <Truck size={20} className="text-orange" />, label: 'Book\nTransport', to: '/farmer/transport/request' },
    {
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: 'Learn',
      to: '/farmer/knowledge',
    },
  ];

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <DashboardHero
        greeting={`Hello, ${user?.name?.split(' ')[0] ?? 'Farmer'} 👋`}
        subtitle="FreshLink Farmer"
        user={user}
        unreadCount={unreadCount}
        notificationsPath="/farmer/notifications"
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
                <span className="text-[10px] font-bold text-yellow drop-shadow-sm text-center whitespace-pre-line">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-24">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-green text-white relative" leaves={false}>
            <LeafDecoration variant="single" className="-right-3 -bottom-4 w-20 rotate-12" />
            <LeafDecoration variant="fern" className="-left-4 -top-4 w-14 -rotate-45" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Package size={16} />
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {pendingOrders} pending
                </span>
              </div>
              <p className="text-xs text-green-100 mb-1">Active Listings</p>
              <h3 className="text-xl font-bold">{activeListings}</h3>
            </div>
          </Card>

          <Card className="p-4 bg-green text-white relative" onClick={() => navigate('/farmer/wallet')} leaves={false}>
            <LeafDecoration
              variant="fern"
              opacity={30}
              className="left-1/2 top-1/2 w-24 -translate-x-1/2 -translate-y-1/2 rotate-6"
            />
            <LeafDecoration variant="single" className="-left-3 -top-3 w-12 rotate-45" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet size={16} />
                </div>
              </div>
              <p className="text-xs text-green-100 mb-1">Wallet Balance</p>
              <h3 className="text-xl font-bold">
                ₵{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>
        </div>

        {/* Insights & Funding */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-green border-none cursor-pointer flex items-center justify-between relative"
              onClick={() => navigate('/farmer/insights')}
              leaves={false}
            >
              <LeafDecoration variant="single" className="-right-2 -bottom-3 w-14 rotate-6" />
              <LeafDecoration variant="monstera" className="-left-2 -top-2 w-10 -rotate-12" />
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green shadow-sm">
                  <TrendingUp size={16} />
                </div>
                <h4 className="font-bold text-xs text-white">Insights</h4>
              </div>
            </Card>
            <Card className="p-3 bg-green border-none cursor-pointer flex items-center justify-between relative"
              onClick={() => navigate('/farmer/funding')}
              leaves={false}
            >
              <LeafDecoration variant="single" className="-right-2 -bottom-3 w-14 -rotate-12" />
              <LeafDecoration variant="fern" className="-left-2 -top-2 w-10 rotate-12" />
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <Wallet size={16} />
                </div>
                <h4 className="font-bold text-xs text-white">Funding</h4>
              </div>
            </Card>
          </div>
        </div>

        <MessagesEntryCard className="mb-8" />

        {/* Weather Widget (static — no weather API yet) */}
        <Card className="p-4 mb-8 bg-green border-none relative" leaves={false}>
          <LeafDecoration variant="monstera" className="-right-6 -bottom-8 w-36 rotate-6" />
          <LeafDecoration variant="fern" className="-left-5 -top-5 w-24 -rotate-12" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CloudSun size={24} className="text-blue-100" />
                <div>
                  <h4 className="font-bold text-white text-sm">Accra, Ghana</h4>
                  <p className="text-[10px] text-green-100">Partly Cloudy • 28°C</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-green-100">Humidity: 65%</p>
                <p className="text-[10px] text-green-100">Rain: 10%</p>
              </div>
            </div>
            <div className="bg-white/90 rounded-xl p-3 text-xs text-ink leading-relaxed">
              <span className="font-bold">Tip:</span> Good conditions for harvesting tomatoes today. Avoid watering in the afternoon.
            </div>
          </div>
        </Card>

        {/* Market Price Trends */}
        {priceData.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <TypewriterText text="Market Price Trends" className="font-bold text-ink" />
            <span className="text-xs text-muted">Your Produce (₵/kg avg)</span>
          </div>
          <Card className="p-4 h-48">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-xl text-ink">
                ₵{priceData.length > 0 ? priceData[priceData.length - 1].price.toFixed(2) : '—'}
              </h4>
              {priceData.length >= 2 && (() => {
                const first = priceData[0].price;
                const last = priceData[priceData.length - 1].price;
                const pct = first > 0 ? ((last - first) / first) * 100 : 0;
                return (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${pct >= 0 ? 'text-green bg-green-50' : 'text-red-500 bg-red-50'}`}>
                    <TrendingUp size={10} /> {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                );
              })()}
            </div>
            <div className="h-28 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803D" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#15803D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7770' }} dy={5} />
                  <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontSize: '10px', color: '#6B7770' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#16201A' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#15803D" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <TypewriterText text="Recent Orders" className="font-bold text-ink" />
              <button onClick={() => navigate('/farmer/orders')} className="text-green text-xs font-bold">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Card
                  key={order.id}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate('/farmer/orders')}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                    <Avatar name={order.buyer.name} src={order.buyer.avatarUrl} className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-ink">
                      {order.buyer.name}
                    </h4>
                    <p className="text-xs text-muted truncate max-w-[120px]">
                      {order.items.map((i) => i.produce.title).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-ink">₵{order.total.toFixed(2)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'pending' ? 'text-orange bg-orange-soft'
                      : order.status === 'delivered' ? 'text-green bg-green-50'
                      : 'text-blue-600 bg-blue-50'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        <div className="mb-4">
          <div className="flex justify-between items-end mb-4">
            <TypewriterText text="Recent Messages" className="font-bold text-ink" />
            <button onClick={() => navigate('/farmer/messages')} className="text-green text-xs font-bold">
              View all
            </button>
          </div>
          {conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.slice(0, 2).map((conv) => {
                const other = user?.id === conv.buyerId ? conv.farmer : conv.buyer;
                // API returns newest-first, so index 0 is the latest
                const lastMsg = conv.messages[0];
                return (
                  <Card
                    key={conv.id}
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/farmer/chat/${conv.id}`)}
                  >
                    <Avatar name={other.name} src={other.avatarUrl} className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold text-sm text-ink truncate">{other.name}</h4>
                        {lastMsg && (
                          <span className="text-[10px] text-muted flex-shrink-0 ml-2">
                            {new Date(lastMsg.createdAt).toLocaleTimeString('en-GH', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">
                        {lastMsg?.body ?? 'No messages yet'}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted">No messages yet. Buyers can message you from your profile or orders.</p>
            </Card>
          )}
        </div>
      </div>

      <SettingsMenuSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AvatarUploadSheet open={avatarUploadOpen} onClose={() => setAvatarUploadOpen(false)} />
      <BottomNav />
    </div>
  );
}
