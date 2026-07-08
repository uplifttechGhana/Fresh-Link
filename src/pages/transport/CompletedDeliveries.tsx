import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { MapPin, Loader2 } from 'lucide-react';
import { useMyJobs } from '../../lib/hooks/useTransport';

export function CompletedDeliveries() {
  const { data: jobs, isLoading } = useMyJobs('delivered');

  const deliveries = jobs ?? [];
  const totalDistance = deliveries.reduce((acc, d) => acc + (d.distance ?? 0), 0);
  const totalEarned = deliveries.reduce((acc, d) => acc + d.fee, 0);

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Completed Deliveries" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted mb-1">Trips</p>
            <p className="font-bold text-ink">{deliveries.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted mb-1">Distance</p>
            <p className="font-bold text-ink">{totalDistance.toFixed(1)} km</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted mb-1">Earned</p>
            <p className="font-bold text-green">₵{totalEarned.toFixed(2)}</p>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        ) : deliveries.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No completed deliveries yet.</p>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => {
              const contact =
                delivery.order?.buyer?.name ??
                delivery.request?.farmer?.user?.name ??
                'Client';
              return (
                <Card key={delivery.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-muted">
                        {delivery.deliveredAt
                          ? new Date(delivery.deliveredAt).toLocaleDateString()
                          : '—'}
                      </p>
                      <p className="text-sm font-bold text-ink">{contact}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green">₵{delivery.fee.toFixed(2)}</p>
                      {delivery.distance && (
                        <p className="text-xs text-muted">{delivery.distance} km</p>
                      )}
                    </div>
                  </div>
                  <div className="relative pl-6 space-y-3">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 border-green bg-white" />
                      <p className="text-xs font-medium text-ink truncate">{delivery.pickup}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-orange" />
                      <p className="text-xs font-medium text-ink truncate">{delivery.dropoff}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
