import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import {
  usePayoutProviders,
  useAddPayoutAccount,
  type PayoutAccount,
} from '../../lib/hooks/useWallet';
import { ApiError } from '../../lib/api';

type PayoutType = 'mobile_money' | 'bank';

export function PayoutAccountCard({ account }: { account: PayoutAccount }) {
  return (
    <div className="rounded-2xl border-2 border-green bg-green-50/40 p-4">
      <p className="font-bold text-sm text-ink">{account.provider}</p>
      <p className="text-xs text-muted mt-0.5">{account.accountName}</p>
      <p className="text-xs font-mono text-muted mt-1">{account.maskedAccountNumber}</p>
      {account.isDefault && (
        <span className="inline-block mt-2 text-[10px] font-bold text-green bg-green-100 px-2 py-0.5 rounded-full">
          Default payout
        </span>
      )}
    </div>
  );
}

export function AddPayoutAccountSheet({
  open,
  onClose,
  defaultType = 'mobile_money',
}: {
  open: boolean;
  onClose: () => void;
  defaultType?: PayoutType;
}) {
  const [type, setType] = useState<PayoutType>(defaultType);
  const [providerCode, setProviderCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const { data: providers = [], isLoading: providersLoading } = usePayoutProviders(type);
  const addAccount = useAddPayoutAccount();

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setProviderCode('');
    setAccountNumber('');
    setAccountName('');
  }, [open, defaultType]);

  useEffect(() => {
    setProviderCode('');
  }, [type]);

  const selected = providers.find((p) => p.code === providerCode);

  const submit = () => {
    if (!selected || !accountNumber.trim() || !accountName.trim()) return;
    addAccount.mutate(
      {
        type,
        provider: selected.name,
        bankCode: selected.code,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Payout account saved');
          onClose();
        },
        onError: (err) => {
          const msg =
            err instanceof ApiError
              ? (err.body as { message?: string })?.message ?? err.message
              : 'Could not save payout account';
          toast.error(msg);
        },
      },
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Payout Account">
      <p className="text-sm text-muted mb-4">
        Uses Paystack test mode — transfers are simulated and always succeed.
      </p>

      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {(['mobile_money', 'bank'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              type === t ? 'bg-white text-ink shadow-sm' : 'text-muted'
            }`}
          >
            {t === 'mobile_money' ? 'Mobile Money' : 'Bank'}
          </button>
        ))}
      </div>

      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">
        Provider
      </label>
      {providersLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-green" />
        </div>
      ) : (
        <select
          value={providerCode}
          onChange={(e) => setProviderCode(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green mb-4"
        >
          <option value="">Select {type === 'mobile_money' ? 'MoMo network' : 'bank'}…</option>
          {providers.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">
        Account holder name
      </label>
      <input
        type="text"
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
        placeholder="Name on account"
        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green mb-4"
      />

      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">
        {type === 'mobile_money' ? 'Mobile number' : 'Account number'}
      </label>
      <input
        type="text"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        placeholder={type === 'mobile_money' ? '024 123 4567' : '0123456789'}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green"
      />

      <Button
        size="lg"
        fullWidth
        onClick={submit}
        disabled={!providerCode || !accountNumber.trim() || !accountName.trim() || addAccount.isPending}
        className="mt-5"
      >
        {addAccount.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Saving…
          </span>
        ) : (
          'Save Account'
        )}
      </Button>
    </Sheet>
  );
}

export function withdrawErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string | string[] };
    if (Array.isArray(body?.message)) return body.message.join(', ');
    return body?.message ?? err.message;
  }
  return 'Withdrawal failed. Please try again.';
}
