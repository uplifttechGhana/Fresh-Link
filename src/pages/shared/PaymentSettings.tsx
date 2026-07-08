import React, { useState } from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { CreditCard, Plus, Loader2, Trash2, Star } from 'lucide-react';
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
} from '../../lib/hooks/usePaymentMethods';

const PROVIDERS = ['Mobile Money (MTN)', 'Vodafone Cash', 'AirtelTigo Money', 'Visa Card'];

export function PaymentSettings() {
  const { data: paymentMethods = [], isLoading } = usePaymentMethods();
  const addMethod = useAddPaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();
  const removeMethod = useRemovePaymentMethod();

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [accountNumber, setAccountNumber] = useState('');

  const submit = () => {
    if (!accountNumber.trim()) return;
    addMethod.mutate(
      { provider, accountNumber: accountNumber.trim() },
      { onSuccess: () => { setAccountNumber(''); setProvider(PROVIDERS[0]); setOpen(false); } },
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Payment Methods" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 pl-1">
          Saved Methods
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        ) : paymentMethods.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No payment methods saved yet.</p>
        ) : (
          <div className="space-y-3 mb-8">
            {paymentMethods.map((m) => (
              <Card
                key={m.id}
                className={`p-4 flex items-center gap-4 ${m.isDefault ? 'border-2 border-green bg-green-50/30' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${m.isDefault ? 'bg-white text-green' : 'bg-gray-50 text-gray-400'}`}
                >
                  <CreditCard size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-ink">{m.provider}</h4>
                  <p className="text-xs text-muted mt-0.5">{m.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.isDefault ? (
                    <div className="text-xs font-bold text-green bg-green-100 px-2 py-1 rounded">
                      Default
                    </div>
                  ) : (
                    <button
                      onClick={() => setDefault.mutate(m.id)}
                      disabled={setDefault.isPending}
                      className="text-muted hover:text-green transition-colors"
                      title="Set as default"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => removeMethod.mutate(m.id)}
                    disabled={removeMethod.isPending}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          fullWidth
          onClick={() => setOpen(true)}
          className="border-dashed border-2 border-gray-300 text-ink hover:bg-gray-50"
        >
          <Plus size={20} className="mr-2" /> Add New Method
        </Button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add Payment Method">
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
          Provider
        </label>
        <div className="space-y-2 mb-4">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium border transition-colors ${provider === p ? 'border-green bg-green-50/50 text-green font-bold' : 'border-gray-100 bg-white text-ink'}`}
            >
              {p}
              {provider === p && <span>✓</span>}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">
          Account / Card Number
        </label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="e.g. 024 123 4567"
          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
        />
        <Button
          size="lg"
          fullWidth
          onClick={submit}
          disabled={!accountNumber.trim() || addMethod.isPending}
          className="mt-5"
        >
          {addMethod.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Saving…
            </span>
          ) : (
            'Save Method'
          )}
        </Button>
      </Sheet>
    </div>
  );
}
