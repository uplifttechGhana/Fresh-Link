import { Check, CreditCard, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import type { PaymentMethod } from '../../lib/hooks/usePaymentMethods';

interface PaymentMethodSheetProps {
  open: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  selectedLabel: string;
  onSelect: (label: string) => void;
}

export function PaymentMethodSheet({
  open,
  onClose,
  methods,
  selectedLabel,
  onSelect,
}: PaymentMethodSheetProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onClose={onClose} title="Payment Method" panelZIndex="z-[60]" overlayClassName="z-[60]">
      <div className="space-y-3">
        {methods.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-3">
              <CreditCard size={24} />
            </div>
            <p className="text-sm text-muted mb-4">No saved payment methods yet.</p>
            <Button
              fullWidth
              onClick={() => {
                onClose();
                navigate('/settings/payments');
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Plus size={16} />
                Add payment method
              </span>
            </Button>
          </div>
        ) : (
          <>
            {methods.map((method) => {
              const isSelected = selectedLabel === method.label;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    onSelect(method.label);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors ${
                    isSelected
                      ? 'border-green bg-green-50/50'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-green-100 text-green' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ink">{method.provider}</p>
                    <p className="text-xs text-muted mt-0.5">{method.label}</p>
                  </div>
                  {isSelected && <Check size={18} className="text-green flex-shrink-0" />}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/settings/payments');
              }}
              className="w-full text-center text-sm font-bold text-green py-2"
            >
              Manage payment methods
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
