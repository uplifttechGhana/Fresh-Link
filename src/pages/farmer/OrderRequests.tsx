import React, { useState } from 'react';
import { toast } from 'sonner';
import { Check, X, MapPin, Truck } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { BottomNav } from '../../components/ui/BottomNav';
import { ApiError } from '../../lib/api';
import { useUpdateOrderStatus, useFarmerOrders, Order } from '../../lib/hooks/useOrders';
import { transportKeys } from '../../lib/hooks/useTransport';
import { useQueryClient } from '@tanstack/react-query';

const TABS = ['Pending', 'Accepted', 'Completed'] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS: Record<Tab, string[]> = {
  Pending: ['pending'],
  Accepted: ['accepted', 'preparing', 'ready_for_pickup', 'in_transit'],
  Completed: ['delivered', 'cancelled'],
};

export function OrderRequests() {
  const [activeTab, setActiveTab] = useState<Tab>('Pending');
  const { data: orders = [], isLoading } = useFarmerOrders();

  const filteredOrders = orders.filter((o) =>
    TAB_STATUS[activeTab].includes(o.status),
  );

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Order Requests" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="font-medium">No {activeTab.toLowerCase()} orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <RequestCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function RequestCard({ order }: { order: Order }) {
  const qc = useQueryClient();
  const updateStatus = useUpdateOrderStatus();
  const isPending = order.status === 'pending';
  const awaitingDriver = ['ready_for_pickup', 'in_transit'].includes(order.status);
  const canPublishToDrivers =
    order.status === 'preparing' && Boolean(order.deliveryAddress?.trim());

  const changeStatus = (status: string) => {
    updateStatus.mutate(
      { id: order.id, status },
      {
        onSuccess: (result) => {
          if (status === 'ready_for_pickup') {
            if (result?.transportJob) {
              toast.success('Order published — drivers can now accept this delivery');
              qc.invalidateQueries({ queryKey: transportKeys.availableJobs() });
            } else {
              toast.error('Could not publish to drivers. Check the delivery address.');
            }
          }
        },
        onError: (err) => {
          const msg =
            err instanceof ApiError
              ? (err.body as { message?: string })?.message ?? err.message
              : 'Could not update order';
          toast.error(msg);
        },
      },
    );
  };

  const itemsSummary = order.items
    .map((i) => `${i.quantity}× ${i.produce.title}`)
    .join(', ');

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  const statusClass: Record<string, string> = {
    pending: 'bg-orange-soft text-orange',
    accepted: 'bg-blue-50 text-blue-600',
    preparing: 'bg-blue-50 text-blue-600',
    ready_for_pickup: 'bg-purple-50 text-purple-600',
    in_transit: 'bg-yellow-50 text-yellow-600',
    delivered: 'bg-green-50 text-green',
    cancelled: 'bg-red-50 text-red-500',
  };

  return (
    <Card className={`p-4 border-2 bg-white ${isPending ? 'border-orange-soft' : 'border-transparent'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-ink text-sm">Order #{order.id.slice(-6).toUpperCase()}</h4>
          <p className="text-xs text-muted mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-GH', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusClass[order.status] ?? 'bg-gray-100 text-muted'}`}>
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
            <Avatar name={order.buyer.name} src={order.buyer.avatarUrl} className="w-full h-full" textClassName="text-[10px]" />
          </div>
          <span className="font-medium text-ink">{order.buyer.name}</span>
          <span className="text-xs text-muted">{order.buyer.phone}</span>
        </div>
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 text-sm text-muted">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            <span className="leading-tight">{order.deliveryAddress}</span>
          </div>
        )}
        <div className="flex items-start gap-2 text-sm text-muted">
          <span className="text-lg leading-none mt-[-2px]">📦</span>
          <span className="leading-tight truncate">{itemsSummary}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 pt-3 border-t border-gray-100">
        <span className="text-sm text-muted font-medium">Total Payout</span>
        <span className="text-lg font-bold text-green">₵{order.total.toFixed(2)}</span>
      </div>

      {isPending && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => changeStatus('cancelled')}
            disabled={updateStatus.isPending}
          >
            <X size={18} className="mr-1" /> Reject
          </Button>
          <Button
            className="flex-1"
            onClick={() => changeStatus('accepted')}
            disabled={updateStatus.isPending}
          >
            <Check size={18} className="mr-1" /> Accept
          </Button>
        </div>
      )}

      {order.status === 'accepted' && (
        <Button
          className="w-full"
          onClick={() => changeStatus('preparing')}
          disabled={updateStatus.isPending}
        >
          Start Preparing
        </Button>
      )}

      {order.status === 'preparing' && (
        <>
          {!order.deliveryAddress?.trim() && (
            <p className="text-xs text-orange font-medium mb-3 text-center">
              No delivery address on this order — ask the buyer to re-order with an address.
            </p>
          )}
          <Button
            className="w-full"
            onClick={() => changeStatus('ready_for_pickup')}
            disabled={updateStatus.isPending || !canPublishToDrivers}
          >
            <Check size={18} className="mr-1" /> Ready for Pickup
          </Button>
        </>
      )}

      {awaitingDriver && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted">
          <Truck size={16} />
          Waiting for driver to complete delivery
        </div>
      )}
    </Card>
  );
}
