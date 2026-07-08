import { useState } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { Card } from '../../components/ui/Card';
import { Sheet } from '../../components/ui/Sheet';
import { AlertTriangle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useAdminOrders, useAdminDisputes, useResolveDispute } from '../../lib/hooks/useAdmin';

const STATUS_COLOR: Record<string, string> = {
  delivered: 'bg-green-50 text-green',
  in_transit: 'bg-blue-50 text-blue-500',
  pending: 'bg-orange-soft text-orange',
  confirmed: 'bg-orange-soft text-orange',
  cancelled: 'bg-red-50 text-red-500',
};

export function MarketplaceMonitor() {
  const [tab, setTab] = useState<'Live' | 'Disputes'>('Live');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders(1);
  const { data: disputesData, isLoading: disputesLoading } = useAdminDisputes(1);
  const resolveDispute = useResolveDispute();

  const orders = ordersData?.items ?? [];
  const disputes = disputesData?.items ?? [];
  const openDisputes = disputes.filter((d) => d.status !== 'resolved');
  const selectedDispute = disputes.find((d) => d.id === selectedId) ?? null;

  const handleResolve = (id: string) => {
    resolveDispute.mutate(id, { onSuccess: () => setSelectedId(null) });
  };

  return (
    <>
    <AdminShell title="Marketplace Monitor">
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('Live')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'Live' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            Live Orders
          </button>
          <button
            onClick={() => setTab('Disputes')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'Disputes' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            Disputes
            {openDisputes.length > 0 && (
              <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                {openDisputes.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'Live' ? (
          ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-green" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const colorClass = STATUS_COLOR[order.status] ?? 'bg-gray-100 text-muted';
                const isDelivered = order.status === 'delivered';
                return (
                  <Card key={order.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                        {isDelivered ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-ink">#{order.id.slice(0, 8)}</h4>
                        <p className="text-xs text-muted mt-0.5 capitalize">
                          {order.status.replace(/_/g, ' ')} • {order.buyer?.name ?? 'Buyer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-ink">
                        ₵{Number(order.total).toFixed(2)}
                      </span>
                      <p className="text-[10px] text-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          disputesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-green" />
            </div>
          ) : openDisputes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green" />
              <p className="font-medium">All disputes resolved</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openDisputes.map((d) => (
                <Card key={d.id} className="p-4 border-2 border-red-100 bg-red-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <h4 className="font-bold text-sm text-ink">Order #{d.orderId.slice(0, 8)}</h4>
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-ink mb-1 font-medium">{d.reason}</p>
                  {d.description && (
                    <p className="text-xs text-muted mb-3">{d.description}</p>
                  )}
                  <p className="text-[10px] text-muted mb-3">Reported by: {d.reporter.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedId(d.id)}
                      className="flex-1 bg-white border border-gray-200 text-ink text-xs font-bold py-2 rounded-lg"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleResolve(d.id)}
                      disabled={resolveDispute.isPending}
                      className="flex-1 bg-red-500 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-60"
                    >
                      {resolveDispute.isPending ? 'Resolving…' : 'Resolve'}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
    </AdminShell>

      <Sheet
        open={selectedDispute !== null}
        onClose={() => setSelectedId(null)}
        title={selectedDispute ? `Dispute • Order #${selectedDispute.orderId.slice(0, 8)}` : undefined}
      >
        {selectedDispute && (
          <div>
            <p className="text-xs text-muted mb-1">
              Reported {new Date(selectedDispute.createdAt).toLocaleDateString()} by {selectedDispute.reporter.name}
            </p>
            <p className="text-sm font-bold text-ink mt-3 mb-1">{selectedDispute.reason}</p>
            {selectedDispute.description && (
              <p className="text-sm text-muted leading-relaxed mb-2">{selectedDispute.description}</p>
            )}
            <div className="bg-gray-50 rounded-xl p-3 mb-6 text-xs text-muted space-y-1">
              <p>Order total: <span className="font-bold text-ink">₵{Number(selectedDispute.order.total).toFixed(2)}</span></p>
              <p>Order status: <span className="font-bold text-ink capitalize">{selectedDispute.order.status}</span></p>
            </div>
            <button
              onClick={() => handleResolve(selectedDispute.id)}
              disabled={resolveDispute.isPending}
              className="w-full bg-green text-white font-bold py-3 rounded-xl disabled:opacity-60"
            >
              {resolveDispute.isPending ? 'Resolving…' : 'Mark Resolved'}
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
