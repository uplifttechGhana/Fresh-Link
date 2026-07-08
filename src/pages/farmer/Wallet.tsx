import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, CreditCard } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { BottomNav } from '../../components/ui/BottomNav';
import {
  useWallet,
  useWalletTransactions,
  usePayoutAccounts,
  useWithdraw,
  txSourceLabel,
  type WalletTransaction,
} from '../../lib/hooks/useWallet';
import {
  AddPayoutAccountSheet,
  PayoutAccountCard,
  withdrawErrorMessage,
} from '../../components/wallet/PayoutSheets';

export function Wallet() {
  const { data: wallet, isLoading } = useWallet();
  const { data: payoutAccounts = [] } = usePayoutAccounts();
  const withdraw = useWithdraw();
  const [page, setPage] = useState(1);
  const { data: txPage } = useWalletTransactions(page);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const balance = wallet?.balance ?? 0;
  const transactions = txPage?.items ?? wallet?.transactions ?? [];
  const totalTx = txPage?.total ?? transactions.length;
  const defaultAccount = payoutAccounts.find((a) => a.isDefault) ?? payoutAccounts[0];

  const submitWithdraw = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setAmountError('Enter a valid amount.');
      return;
    }
    if (value > balance) {
      setAmountError('Insufficient funds.');
      return;
    }
    if (!defaultAccount) {
      toast.error('Add a payout account first.');
      return;
    }

    withdraw.mutate(
      { amount: value, payoutAccountId: defaultAccount.id },
      {
        onSuccess: (result) => {
          setWithdrawOpen(false);
          setAmount('');
          setAmountError('');
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

  if (isLoading) {
    return (
      <div className="w-full h-full bg-cream flex flex-col">
        <TopBar title="Wallet" showBack />
        <div className="flex-1 p-6 space-y-4">
          <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Wallet" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <div className="bg-forest rounded-3xl p-6 text-white shadow-float mb-6 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-green-600/30 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-green-100 mb-2">
              <WalletIcon size={16} />
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            <h2 className="text-4xl font-display font-extrabold mb-6">
              ₵{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWithdrawOpen(true)}
                disabled={!defaultAccount || balance < 1}
                className="flex-1 bg-white text-forest hover:bg-gray-50"
              >
                <ArrowUpRight size={16} className="mr-1" /> Withdraw
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankOpen(true)}
                className="flex-1 border-white/30 text-white hover:bg-white/10"
              >
                <CreditCard size={16} className="mr-1" /> Add Payout
              </Button>
            </div>
          </div>
        </div>

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

        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-ink">Recent Transactions</h3>
            <span className="text-xs text-muted">{totalTx} total</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <p className="font-medium">No transactions yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <TxItem key={tx.id} tx={tx} />
                ))}
              </div>
              {txPage && page < Math.ceil(txPage.total / txPage.limit) && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="mt-4 w-full py-3 text-green text-sm font-bold"
                >
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet
        open={withdrawOpen}
        onClose={() => { setWithdrawOpen(false); setAmountError(''); }}
        title="Withdraw Funds"
      >
        <p className="text-sm text-muted mb-4">
          Available balance:{' '}
          <span className="font-bold text-ink">₵{balance.toFixed(2)}</span>
        </p>
        {defaultAccount && (
          <div className="mb-4">
            <PayoutAccountCard account={defaultAccount} />
          </div>
        )}
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Amount (₵)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
          placeholder="0.00"
          autoFocus
          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-lg font-bold text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
        />
        <div className="flex gap-2 mt-3">
          {[100, 250, 500].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setAmount(String(Math.min(v, balance))); setAmountError(''); }}
              className="flex-1 py-2 rounded-lg bg-green-50 text-green text-sm font-bold"
            >
              ₵{v}
            </button>
          ))}
        </div>
        {amountError && <p className="text-xs font-medium text-red-500 mt-3">{amountError}</p>}
        <Button
          size="lg"
          fullWidth
          onClick={submitWithdraw}
          disabled={withdraw.isPending || !defaultAccount}
          className="mt-5"
        >
          {withdraw.isPending ? 'Processing…' : 'Confirm Withdrawal'}
        </Button>
      </Sheet>

      <AddPayoutAccountSheet open={bankOpen} onClose={() => setBankOpen(false)} />
      <BottomNav />
    </div>
  );
}

function TxItem({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'credit';
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-50 text-green' : 'bg-red-50 text-red-500'}`}>
        {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-ink leading-tight mb-1">
          {tx.note ?? txSourceLabel(tx.source)}
        </h4>
        <p className="text-xs text-muted">
          {new Date(tx.createdAt).toLocaleDateString('en-GH', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>
      <div className={`font-bold text-sm ${isCredit ? 'text-green' : 'text-ink'}`}>
        {isCredit ? '+' : '-'}₵{tx.amount.toFixed(2)}
      </div>
    </Card>
  );
}
