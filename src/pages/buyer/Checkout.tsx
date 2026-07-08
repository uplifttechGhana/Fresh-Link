import React, { useEffect, useState } from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MapPin, CreditCard, Clock, Check, Loader2, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../lib/cartStore';
import { useCreateOrder, useInitOrderPayment, useOrderConfig } from '../../lib/hooks/useOrders';
import { usePaymentMethods } from '../../lib/hooks/usePaymentMethods';
import {
  DeliveryAddressSheet,
  type DeliverySelection,
} from '../../components/buyer/DeliveryAddressSheet';
import { PaymentMethodSheet } from '../../components/buyer/PaymentMethodSheet';
import { loadSavedAddresses, saveAddress } from '../../lib/savedAddresses';

const TIME_SLOTS = [
  'Today, 2:00 PM - 4:00 PM',
  'Today, 4:00 PM - 6:00 PM',
  'Tomorrow, 10:00 AM - 12:00 PM',
];

export function Checkout() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: config } = useOrderConfig();
  const { data: paymentMethods = [] } = usePaymentMethods();

  const deliveryFee = config?.deliveryFee ?? 15.0;

  const [delivery, setDelivery] = useState<DeliverySelection | null>(null);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(TIME_SLOTS[0]);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCreateOrder();
  const initPayment = useInitOrderPayment();

  useEffect(() => {
    const saved = loadSavedAddresses();
    if (saved.length === 0) return;
    const preferred = saved.find((a) => a.label === 'Home') ?? saved[0];
    setDelivery({
      label: preferred.label,
      address: preferred.address,
      lat: preferred.lat,
      lng: preferred.lng,
    });
  }, []);

  // Set default payment method once loaded
  useEffect(() => {
    if (!paymentMethod && paymentMethods.length > 0) {
      const def = paymentMethods.find((m) => m.isDefault) ?? paymentMethods[0];
      setPaymentMethod(def.label);
    }
  }, [paymentMethods, paymentMethod]);

  const subtotal = items.reduce((sum, item) => sum + item.pricePerUnit * item.qty, 0);
  const total = subtotal + deliveryFee;

  const isLoading = createOrder.isPending || initPayment.isPending;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!delivery?.address.trim()) {
      setError('Choose where we should deliver your order.');
      setAddressSheetOpen(true);
      return;
    }
    setError(null);

    try {
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ produceId: i.id, quantity: i.qty })),
        deliveryAddress: delivery.address,
        notes: `Delivery: ${deliveryTime} | Payment: ${paymentMethod} | Label: ${delivery.label}`,
      });

      const payment = await initPayment.mutateAsync(order.id);

      clearCart();
      window.location.href = payment.authorizationUrl;
    } catch (err: any) {
      const msg =
        err?.body?.message ?? err?.message ?? 'Failed to place order. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  return (
    <div className="relative w-full h-full bg-cream flex flex-col">
      <TopBar title="Checkout" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        {items.length > 0 && (
          <div className="mb-6 bg-white rounded-3xl p-4 shadow-sm space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink font-medium">{item.title} × {item.qty}</span>
                <span className="text-ink font-bold">₵{(item.pricePerUnit * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-bold text-ink mb-3">Delivery Address</h3>
          <button type="button" onClick={() => setAddressSheetOpen(true)} className="w-full text-left">
            <Card className="p-4 flex items-start gap-3 border-2 border-green bg-green-50/30 active:scale-[0.99] transition-transform">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-ink">
                  {delivery?.label ?? 'Choose address'}
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                  {delivery?.address ?? 'Search, use current location, or pin on map'}
                </p>
              </div>
              <ChevronRight size={18} className="text-green mt-1 flex-shrink-0" />
            </Card>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-ink mb-3">Delivery Time</h3>
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-soft flex items-center justify-center text-orange flex-shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-ink">{deliveryTime}</h4>
                <p className="text-xs text-muted mt-1">Standard Delivery</p>
              </div>
              <button
                onClick={() => setIsEditingTime(!isEditingTime)}
                className="text-green text-xs font-bold"
              >
                {isEditingTime ? 'Close' : 'Change'}
              </button>
            </div>

            {isEditingTime && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => { setDeliveryTime(time); setIsEditingTime(false); }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm ${deliveryTime === time ? 'bg-green-50 text-green font-bold' : 'text-ink hover:bg-gray-50'}`}
                  >
                    {time}
                    {deliveryTime === time && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-ink mb-3">Payment Method</h3>
          <Card className="p-4 flex items-center gap-3" leaves={false}>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <CreditCard size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-ink">
                {paymentMethods.find((m) => m.label === paymentMethod)?.provider ?? 'Mobile Money'}
              </h4>
              <p className="text-xs text-muted mt-1 truncate">
                {paymentMethod || 'Choose how you want to pay'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSheetOpen(true)}
              className="text-green text-xs font-bold flex-shrink-0"
            >
              Change
            </button>
          </Card>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
      </div>

      <DeliveryAddressSheet
        open={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
        value={delivery}
        onConfirm={(selection) => {
          setDelivery(selection);
          if (selection.label && selection.label !== 'Delivery') {
            saveAddress({
              label: selection.label,
              address: selection.address,
              lat: selection.lat,
              lng: selection.lng,
            });
          }
        }}
      />

      <PaymentMethodSheet
        open={paymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
        methods={paymentMethods}
        selectedLabel={paymentMethod}
        onSelect={setPaymentMethod}
      />

      <div className="absolute bottom-0 inset-x-0 p-6 bg-cream/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-muted font-medium">Total Payment</span>
          <span className="text-xl font-bold text-ink">₵{total.toFixed(2)}</span>
        </div>
        <Button
          size="lg"
          fullWidth
          onClick={handlePlaceOrder}
          disabled={items.length === 0 || isLoading || !delivery?.address.trim()}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </span>
          ) : (
            'Place Order & Pay'
          )}
        </Button>
      </div>
    </div>
  );
}