import { useState, type ReactNode } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { Card } from '../../components/ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { useAdminStats, useAdminRevenue } from '../../lib/hooks/useAdmin';

export function Reports() {
  const [range, setRange] = useState<'this_week' | 'last_week'>('this_week');
  const { data: stats } = useAdminStats();
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue(range);

  return (
    <AdminShell title="Reports & Analytics">
        {/* Live stats from backend */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            icon={<TrendingUp size={16} />}
            variant="green"
            label="Total Volume"
            value={
              stats
                ? `₵${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : '—'
            }
            sub="All time"
          />
          <StatCard
            icon={<Users size={16} />}
            label="Total Users"
            value={stats ? String(stats.totalUsers) : '—'}
            sub="Registered"
          />
          <StatCard
            icon={<Package size={16} />}
            label="Active Listings"
            value={stats ? String(stats.activeProduce) : '—'}
            sub="Produce"
          />
          <StatCard
            icon={<ShoppingCart size={16} />}
            label="Total Orders"
            value={stats ? String(stats.totalOrders) : '—'}
            sub="All time"
          />
        </div>

        {/* Revenue Trend */}
        <Card className="p-5 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-ink">Revenue Trend</h3>
            <select
              value={range}
              className="bg-gray-50 border-none text-xs font-bold text-ink rounded-lg px-2 py-1 outline-none cursor-pointer"
              onChange={(e) => setRange(e.target.value as 'this_week' | 'last_week')}
            >
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
            </select>
          </div>
          {revenueLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-green" />
            </div>
          ) : (
            <>
          <p className="text-2xl font-bold text-ink mb-1">
            ₵{revenue ? revenue.total.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
          </p>
          {revenue?.delta && (
            <p className="text-xs text-green font-bold mb-4">{revenue.delta}</p>
          )}

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue?.data ?? []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E4D2C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0E4D2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8A8A8E' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8A8A8E' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0E4D2C', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0E4D2C"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
            </>
          )}
        </Card>

        {/* User breakdown */}
        {stats?.usersByRole && (
          <>
            <h3 className="font-bold text-ink mb-3">Users by Role</h3>
            <div className="space-y-3 mb-6">
              {Object.entries(stats.usersByRole).map(([role, count]) => {
                const pct = stats.totalUsers > 0 ? Math.round(((count as number) / stats.totalUsers) * 100) : 0;
                return (
                  <div key={role} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-ink capitalize">{role}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-10 text-right text-xs font-bold text-muted">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Order breakdown */}
        {stats?.ordersByStatus && (
          <>
            <h3 className="font-bold text-ink mb-3">Orders by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                const pct =
                  stats.totalOrders > 0
                    ? Math.round(((count as number) / stats.totalOrders) * 100)
                    : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-ink capitalize">
                      {status.replace(/_/g, ' ')}
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-10 text-right text-xs font-bold text-muted">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
    </AdminShell>
  );
}

function StatCard({
  icon,
  variant = 'white',
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  variant?: 'white' | 'green';
  label: string;
  value: string;
  sub: string;
}) {
  const isGreen = variant === 'green';
  return (
    <Card className={`p-4 ${isGreen ? 'bg-green text-white' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isGreen ? 'bg-white/20 text-white' : 'bg-green-50 text-green'}`}>
        {icon}
      </div>
      <p className={`text-xs mb-1 ${isGreen ? 'text-green-100' : 'text-muted'}`}>{label}</p>
      <h3 className={`font-bold text-lg ${isGreen ? 'text-white' : 'text-ink'}`}>{value}</h3>
      <p className={`text-[10px] mt-1 ${isGreen ? 'text-green-100' : 'text-muted'}`}>{sub}</p>
    </Card>
  );
}
