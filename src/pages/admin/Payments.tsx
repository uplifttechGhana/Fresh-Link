import { AdminShell } from '../../components/admin/AdminShell';
import { Card } from '../../components/ui/Card';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAdminStats, useAdminTransactions } from '../../lib/hooks/useAdmin';
import { txSourceLabel } from '../../lib/hooks/useWallet';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Payments() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: txData, isLoading: txLoading } = useAdminTransactions();

  const transactions = txData?.items ?? [];

  // Build a simple daily volume chart from transactions
  const volumeByDay = DAYS.map((day, i) => ({
    name: day.slice(0, 3),
    volume: transactions
      .filter((t) => new Date(t.createdAt).getDay() === i && t.type === 'credit')
      .reduce((s, t) => s + t.amount, 0),
  }));

  const totalCredit = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <AdminShell title="Payments Monitor">
        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-3 bg-green text-white">
            <p className="text-[10px] text-green-100 mb-1">Total Volume</p>
            {statsLoading ? (
              <div className="h-7 w-20 bg-white/20 rounded animate-pulse" />
            ) : (
              <h3 className="text-lg font-bold">
                ₵{(stats?.totalVolume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
            )}
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted mb-1">Total Credits</p>
            <h3 className="text-lg font-bold text-green">
              ₵{totalCredit.toFixed(0)}
            </h3>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted mb-1">Total Debits</p>
            <h3 className="text-lg font-bold text-ink">₵{totalDebit.toFixed(0)}</h3>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted mb-1">Transactions</p>
            <h3 className="text-lg font-bold text-ink">{txData?.total ?? 0}</h3>
          </Card>
        </div>

        {/* Volume chart */}
        <Card className="p-4 mb-6 h-48">
          <h3 className="font-bold text-ink mb-2 text-sm">Daily Credit Volume</h3>
          <div className="h-32 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeByDay}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803D" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#15803D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7770' }}
                  dy={5}
                />
                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontSize: '10px', color: '#6B7770' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#16201A' }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#15803D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVol)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Transaction list */}
        <h3 className="font-bold text-ink mb-3">Recent Transactions</h3>
        {txLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-green" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-ink">
                      {tx.wallet?.user?.name ?? 'User'}
                    </h4>
                    <p className="text-xs text-muted">
                      {txSourceLabel(tx.source)} •{' '}
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${tx.type === 'credit' ? 'text-green' : 'text-ink'}`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₵{tx.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft size={12} className="text-green" />
                      ) : (
                        <ArrowUpRight size={12} className="text-orange" />
                      )}
                      <span className="text-[10px] font-bold text-muted capitalize">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                </div>
                {tx.note && (
                  <p className="text-xs text-muted mt-1">{tx.note}</p>
                )}
              </Card>
            ))}
          </div>
        )}
    </AdminShell>
  );
}
