import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '../../lib/cartStore';
import { BottomNav } from '../../components/ui/BottomNav';

const DELIVERY_FEE = 15.0;

export function Cart() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = items.reduce(
    (sum, item) => sum + item.pricePerUnit * item.qty,
    0
  );
  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="My Cart" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        {items.length === 0 ?
        <div className="flex flex-col items-center justify-center h-full text-center pt-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl mx-auto">
              🛒
            </div>
            <h3 className="font-bold text-ink mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted mb-6">
              Add some fresh produce to get started
            </p>
            <Button onClick={() => navigate('/buyer/home')}>
              Browse Products
            </Button>
          </div> :

        <>
            <div className="space-y-4">
              {items.map((item) =>
            <CartItem
              key={item.id}
              {...item}
              onUpdateQty={(delta: number) => updateQty(item.id, delta)}
              onRemove={() => removeItem(item.id)} />

            )}
            </div>

            <div className="mt-8 bg-white p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-ink mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="text-ink font-medium">
                    ₵{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery Fee</span>
                  <span className="text-ink font-medium">
                    ₵{DELIVERY_FEE.toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-gray-100 my-2"></div>
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-ink">Total</span>
                  <span className="text-green">₵{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        }
      </div>

      <div className="absolute bottom-20 inset-x-0 p-6 bg-cream/90 backdrop-blur-md z-30">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/buyer/checkout')}
          disabled={items.length === 0}>
          Proceed to Checkout
        </Button>
      </div>
      <BottomNav />
    </div>);

}

function CartItem({
  title,
  farmer,
  pricePerUnit,
  qty,
  image,
  onUpdateQty,
  onRemove,
}: {
  title: string; farmer: string; pricePerUnit: number;
  qty: number; image: string;
  onUpdateQty: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <Card className="p-3 flex gap-4 items-center">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover mix-blend-multiply" />
        
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-ink leading-tight mb-1">
          {title}
        </h4>
        <p className="text-xs text-muted mb-2">By {farmer}</p>
        <p className="font-bold text-ink text-sm">
          ₵{(pricePerUnit * qty).toFixed(2)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-3">
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 p-1">
          
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1">
          <button
            onClick={() => onUpdateQty(-1)}
            className="w-6 h-6 flex items-center justify-center text-ink bg-white rounded-full shadow-sm">
            
            <Minus size={12} />
          </button>
          <span className="text-xs font-bold w-4 text-center">{qty}</span>
          <button
            onClick={() => onUpdateQty(1)}
            className="w-6 h-6 flex items-center justify-center text-white bg-green rounded-full shadow-sm">
            
            <Plus size={12} />
          </button>
        </div>
      </div>
    </Card>);

}
