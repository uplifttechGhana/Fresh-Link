import React from 'react';
import { Truck, Banknote, MapPin, Star, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { useWallet, useWalletTransactions, txSourceLabel } from '../../lib/hooks/useWallet';
import { useMyJobs } from '../../lib/hooks/useTransport';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { BottomNav } from '../../components/ui/BottomNav';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Earnings() {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: txData } = useWalletTransactions();
  const { data: jobs } = useMyJobs();

  const completedJobs = jobs?.filter((j) => j.status === 'delivered') ?? [];
  const totalDistance = completedJobs.reduce((acc, j) => acc + (j.distance ?? 0), 0);
  const totalIncome = completedJobs.reduce((acc, j) => acc + j.fee, 0);

  // Build weekly earnings from transport_fee transactions
  const transportTx = txData?.items?.filter((t) => t.source === 'transport_fee') ?? [];
  const weekly = DAYS.map((day, i) => {
    const amount = transportTx
      .filter((t) => new Date(t.createdAt).getDay() === i)
      .reduce((acc, t) => acc + t.amount, 0);
    return { day: day.slice(0, 3), amount };
  });
  const weeklyTotal = weekly.reduce((s, d) => s + d.amount, 0);
  const maxAmount = Math.max(...weekly.map((d) => d.amount), 1);

  const recentTrips = transportTx.slice(0, 5);

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Earnings" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        {/* Balance hero */}
        <Card className="p-5 bg-forest text-white mb-6">
          <p className="text-sm text-green-100 mb-1">Available Balance</p>
          {walletLoading ? (
            <div className="h-9 w-32 bg-white/20 rounded-lg mb-4 animate-pulse" />
          ) : (
            <h2 className="text-3xl font-display font-extrabold mb-4">
              ₵{(wallet?.balance ?? 0).toFixed(2)}
            </h2>
          )}
        </Card>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatTile icon={<Truck size={16} />} label="Completed Trips" value={String(completedJobs.length)} />
          <StatTile icon={<Banknote size={16} />} label="Total Income" value={`₵${totalIncome.toFixed(0)}`} />
          <StatTile
            icon={<MapPin size={16} />}
            label="Distance Covered"
            value={`${totalDistance.toFixed(1)} km`}
          />
          <StatTile icon={<Star size={16} />} label="Avg Rating" value="—" />
        </div>

        {/* Weekly chart */}
        <Card className="p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <TypewriterText text="This Week" className="font-bold text-ink" />
            <span className="text-sm font-bold text-green">₵{weeklyTotal.toFixed(2)}</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} barCategoryGap="30%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7770' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 6, 6]}>
                  {weekly.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.amount === maxAmount && entry.amount > 0 ? '#15803D' : '#E7F0EA'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent trips */}
        <h3 className="font-bold text-ink mb-3">Recent Trips</h3>
        {recentTrips.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No transport earnings yet.</p>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((tx) => (
              <Card key={tx.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green flex items-center justify-center flex-shrink-0">
                  <Truck size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-ink">
                    {tx.note ?? txSourceLabel(tx.source)}
                  </h4>
                  <p className="text-xs text-muted">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-bold text-green text-sm">+₵{tx.amount.toFixed(2)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="w-8 h-8 bg-green-50 text-green rounded-full flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-xs text-muted mb-1">{label}</p>
      <h3 className="text-xl font-bold text-ink">{value}</h3>
    </Card>
  );
}
