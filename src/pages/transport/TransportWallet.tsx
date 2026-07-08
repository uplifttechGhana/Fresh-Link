import React, { useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { BottomNav } from '../../components/ui/BottomNav';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Loader2 } from 'lucide-react';
import {
  useWallet,
  useWalletTransactions,
  usePayoutAccounts,
  useWithdraw,
  txSourceLabel,
} from '../../lib/hooks/useWallet';
import {
  AddPayoutAccountSheet,
  PayoutAccountCard,
  withdrawErrorMessage,
} from '../../components/wallet/PayoutSheets';

export function TransportWallet() {
  const { data: wallet, isLoading } = useWallet();
  const { data: payoutAccounts = [] } = usePayoutAccounts();
  const withdraw = useWithdraw();
  const { data: txData } = useWalletTransactions();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const balance = wallet?.balance ?? 0;
  const transactions = txData?.items ?? wallet?.transactions ?? [];
  const defaultAccount = payoutAccounts.find((a) => a.isDefault) ?? payoutAccounts[0];

  const handleWithdraw = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0 || value > balance) return;
    if (!defaultAccount) {
      toast.error('Add a payout account first.');
      return;
    }

    withdraw.mutate(
      { amount: value, payoutAccountId: defaultAccount.id },
      {
        onSuccess: (result) => {
          setIsWithdrawOpen(false);
          setAmount('');
          if (result.status === 'success') {
            toast.success(
              result.simulated
                ? 'Withdrawal simulated (Paystack test — no real transfer)'
                : 'Withdrawal successful',
            );
          } else if (result.status === 'processing') {
            toast.success('Withdrawal submitted — processing');
          } else {
            toast.error(result.failureReason ?? 'Withdrawal failed');
          }
        },
        onError: (err) => toast.error(withdrawErrorMessage(err)),
      },
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Wallet" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <Card className="p-6 bg-forest text-white mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10" />

          <p className="text-white/80 text-sm mb-1 relative z-10">Available Balance</p>
          {isLoading ? (
            <div className="h-10 w-36 bg-white/20 rounded-lg mb-6 animate-pulse relative z-10" />
          ) : (
            <h2 className="text-4xl font-display font-bold mb-6 relative z-10">
              ₵{balance.toFixed(2)}
            </h2>
          )}

          <div className="flex gap-3 relative z-10">
            <Button
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setIsWithdrawOpen(true)}
              disabled={!defaultAccount || balance < 1}
            >
              Withdraw
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setBankOpen(true)}
            >
              <CreditCard size={16} className="mr-1 inline" /> Add Payout
            </Button>
          </div>
        </Card>

        {defaultAccount ? (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Payout account</h3>
            <PayoutAccountCard account={defaultAccount} />
          </div>
        ) : (
          <p className="text-sm text-muted mb-6 text-center">
            Add a Mobile Money or bank account to withdraw earnings.
          </p>
        )}

        <h3 className="font-bold text-ink mb-4">Recent Transactions</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="p-4 flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-green-50 text-green' : 'bg-orange-soft text-orange'}`}
                >
                  {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-ink">
                    {tx.note ?? txSourceLabel(tx.source)}
                  </h4>
                  <p className="text-xs text-muted">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'credit' ? 'text-green' : 'text-ink'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₵{tx.amount.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Sheet open={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} title="Withdraw Funds">
        <div className="space-y-6 pt-2">
          {defaultAccount && <PayoutAccountCard account={defaultAccount} />}
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Amount (₵)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-ink font-medium text-lg"
            />
            <p className="text-xs text-muted mt-2">Available: ₵{balance.toFixed(2)}</p>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleWithdraw}
            disabled={
              withdraw.isPending ||
              !defaultAccount ||
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > balance
            }
          >
            {withdraw.isPending ? 'Processing…' : 'Confirm Withdrawal'}
          </Button>
        </div>
      </Sheet>

      <AddPayoutAccountSheet open={bankOpen} onClose={() => setBankOpen(false)} defaultType="mobile_money" />
      <BottomNav />
    </div>
  );
}
