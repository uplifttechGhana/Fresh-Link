import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { TrendingUp, Sprout, BadgeCheck, ChevronRight, PieChart, Loader2 } from 'lucide-react';
import {
  useFundingRequests,
  useMyInvestments,
  progressPct,
} from '../../lib/hooks/useInvestor';

export function InvestorDashboard() {
  const navigate = useNavigate();
  const { data: requests, isLoading: reqLoading } = useFundingRequests();
  const { data: investments, isLoading: invLoading } = useMyInvestments();

  const activeInvestments = investments?.filter((i) => i.status === 'active' || i.status === 'pending') ?? [];
  const totalInvested = activeInvestments.reduce((s, i) => s + i.amount, 0);
  const expectedReturns = totalInvested * 1.12; // 12% placeholder rate; replace when backend tracks returnRate

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar
        title="Investor Dashboard"
        rightAction="more"
        onRightAction={() => navigate('/settings')}
        showDarkToggle
      />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        {/* Portfolio Summary */}
        <Card className="p-5 bg-ink text-white mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-green" />
            <h3 className="text-sm font-bold text-gray-300">Portfolio Value</h3>
          </div>
          {invLoading ? (
            <div className="h-9 w-40 bg-white/20 rounded-lg mb-1 animate-pulse" />
          ) : (
            <h2 className="text-3xl font-display font-extrabold mb-1">
              ₵{expectedReturns.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h2>
          )}
          <p className="text-xs text-green font-bold flex items-center gap-1">
            <TrendingUp size={12} />
            +{totalInvested > 0 ? Math.round(((expectedReturns - totalInvested) / totalInvested) * 100) : 0}%
            Expected Return
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Total Invested</p>
              <p className="font-bold text-sm">
                ₵{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Active Projects</p>
              <p className="font-bold text-sm">{activeInvestments.length}</p>
            </div>
          </div>
        </Card>

        {/* Active Investments */}
        {(invLoading || activeInvestments.length > 0) && (
          <div className="mb-8">
            <h3 className="font-bold text-ink mb-3">Your Active Investments</h3>
            {invLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-green" />
              </div>
            ) : (
              <div className="space-y-3">
                {activeInvestments.map((inv) => (
                  <Card
                    key={inv.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/investor/invest/${inv.requestId}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={inv.request.farmer.name}
                          src={inv.request.farmer.avatarUrl}
                          className="w-8 h-8 rounded-full bg-gray-100"
                          textClassName="text-[10px]"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-ink">{inv.request.farmer.name}</h4>
                          <p className="text-[10px] text-muted truncate max-w-[150px]">
                            {inv.request.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] text-muted mb-0.5">Invested</p>
                        <p className="font-bold text-sm text-ink">
                          ₵{inv.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted mb-0.5">Progress</p>
                        <p className="font-bold text-sm text-green">
                          {progressPct(inv.request)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opportunities */}
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-ink">Investment Opportunities</h3>
        </div>

        {reqLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        ) : (requests?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted">
            <p className="text-sm">No funding requests available right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests!.map((req) => {
              const pct = progressPct(req);
              return (
                <Card
                  key={req.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-green/20"
                  onClick={() => navigate(`/investor/invest/${req.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                        <Avatar name={req.farmer.name} src={req.farmer.avatarUrl} className="w-full h-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold text-sm text-ink">{req.farmer.name}</h4>
                          <BadgeCheck size={14} className="text-green" />
                        </div>
                        <p className="text-xs text-muted">
                          {req.farmer.farmerProfile?.farmName ?? 'Farm'} •{' '}
                          {req.farmer.farmerProfile?.location ?? 'Ghana'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green text-xs font-bold px-2 py-1 rounded-lg">
                      Open
                    </div>
                  </div>

                  <p className="text-sm text-muted leading-snug mb-3 line-clamp-2">
                    {req.title}
                  </p>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-ink">₵{req.raised.toLocaleString()} raised</span>
                      <span className="text-muted">Goal: ₵{req.goal.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-muted font-medium">
                      <Sprout size={14} />
                      {req.deadline
                        ? `Deadline: ${new Date(req.deadline).toLocaleDateString()}`
                        : 'Open-ended'}
                    </div>
                    <div className="flex items-center gap-1 text-green font-bold text-xs">
                      Invest Now <ChevronRight size={14} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
