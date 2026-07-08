import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { BadgeCheck, ShieldCheck, MapPin, Sprout, Loader2 } from 'lucide-react';
import {
  useFundingRequest,
  useCreateInvestment,
  progressPct,
} from '../../lib/hooks/useInvestor';

export function Invest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading } = useFundingRequest(id!);
  const invest = useCreateInvestment();

  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <Loader2 size={28} className="animate-spin text-green" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full h-full bg-cream flex flex-col">
        <TopBar showBack />
        <div className="flex-1 flex items-center justify-center p-6 text-center text-muted">
          Opportunity not found.
        </div>
      </div>
    );
  }

  const pct = progressPct(request);
  const remaining = request.goal - request.raised;
  const numAmount = Number(amount);
  const expectedReturn = numAmount > 0 ? numAmount * 1.12 : 0; // 12% placeholder

  const handleInvest = () => {
    if (!numAmount || numAmount <= 0 || numAmount > remaining) return;
    invest.mutate(
      { requestId: request.id, amount: numAmount },
      {
        onSuccess: () => {
          setShowConfirm(false);
          navigate('/investor/dashboard');
        },
      },
    );
  };

  const farmerProfile = request.farmer.farmerProfile;

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Investment Details" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        {/* Farmer Profile Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm mb-3">
            <img
              src={
                request.farmer.avatarUrl ??
                `https://i.pravatar.cc/150?u=${request.farmer.name}`
              }
              alt={request.farmer.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1 justify-center mb-1">
            <h2 className="text-xl font-display font-bold text-ink">{request.farmer.name}</h2>
            <BadgeCheck size={20} className="text-green" />
          </div>
          {farmerProfile?.location && (
            <p className="text-sm text-muted flex items-center justify-center gap-1">
              <MapPin size={14} /> {farmerProfile.location}
            </p>
          )}
          {farmerProfile?.farmName && (
            <p className="text-xs text-muted mt-1">{farmerProfile.farmName}</p>
          )}
        </div>

        {/* Key Stats */}
        <Card className="p-5 mb-6 border-2 border-green/20 bg-green-50/30">
          <h3 className="font-bold text-ink text-sm mb-3">{request.title}</h3>

          <div className="mb-3">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-ink">₵{request.raised.toLocaleString()} raised</span>
              <span className="text-muted">Goal: ₵{request.goal.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Sprout size={12} />
              {request.deadline
                ? `Deadline: ${new Date(request.deadline).toLocaleDateString()}`
                : 'Open-ended'}
            </span>
            <span className="font-bold text-green">₵{remaining.toLocaleString()} remaining</span>
          </div>
        </Card>

        {/* Project Details */}
        <h3 className="font-bold text-ink mb-3">Project Details</h3>
        <Card className="p-4 mb-6">
          <p className="text-sm text-muted leading-relaxed mb-4">
            {request.description ??
              `Seeking funding for upcoming harvest season. Funds will be used for high-yield seeds, organic fertilizers, and labor.`}
          </p>
          {farmerProfile?.rating > 0 && (
            <p className="text-xs font-medium text-ink mb-3">
              ⭐ {farmerProfile.rating.toFixed(1)} farmer rating
            </p>
          )}
          <div className="flex items-center gap-2 bg-blue-50 text-blue-800 p-3 rounded-xl text-xs font-medium">
            <ShieldCheck size={18} className="text-blue-600 flex-shrink-0" />
            FreshLink Verified Farm. Historical yield data confirms repayment capacity.
          </div>
        </Card>

        {/* Investment Amount */}
        <h3 className="font-bold text-ink mb-3">Make an Investment</h3>
        <Card className="p-4">
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
            Investment Amount (₵)
          </label>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              max={remaining}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-4 text-lg font-bold text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
            />
            <button
              onClick={() => setAmount(remaining.toString())}
              className="px-4 py-4 bg-green-50 text-green font-bold rounded-xl text-sm"
            >
              Max
            </button>
          </div>

          {numAmount > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted mb-0.5">Expected Return (~12%)</p>
                <p className="font-bold text-green text-lg">
                  ₵{expectedReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted mb-0.5">Profit</p>
                <p className="font-bold text-ink text-sm">
                  +₵
                  {(expectedReturn - numAmount).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6 bg-cream/90 backdrop-blur-md z-30">
        <Button
          size="lg"
          fullWidth
          onClick={() => setShowConfirm(true)}
          disabled={!amount || numAmount <= 0 || numAmount > remaining}
        >
          Review Investment
        </Button>
      </div>

      <Sheet open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Investment">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <SummaryRow label="Farmer" value={request.farmer.name} />
            <SummaryRow label="Project" value={request.title} />
            <SummaryRow
              label="Principal Amount"
              value={`₵${numAmount.toLocaleString()}`}
            />
            {request.deadline && (
              <SummaryRow
                label="Deadline"
                value={new Date(request.deadline).toLocaleDateString()}
              />
            )}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-ink">Expected Payout</span>
              <span className="font-bold text-green text-lg">
                ₵{expectedReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed text-center px-4">
            By confirming, the funds will be transferred from your wallet to the farmer's escrow
            account.
          </p>

          <Button size="lg" fullWidth onClick={handleInvest} disabled={invest.isPending}>
            {invest.isPending ? 'Processing…' : 'Confirm & Invest'}
          </Button>

          {invest.isError && (
            <p className="text-xs text-red-500 text-center">
              {(invest.error as any)?.body?.message ?? 'Investment failed. Please try again.'}
            </p>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
