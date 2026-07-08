import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { useOrder, formatOrderStatus, useVerifyOrderPayment } from '../../lib/hooks/useOrders';
import { useOrderStatusSocket, useStartConversation } from '../../lib/hooks/useChat';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Accepted',  sub: 'Waiting for farmer to confirm' },
  { key: 'accepted',  label: 'Order Accepted',   sub: 'Farmer confirmed your order' },
  { key: 'packed',    label: 'Order Packed',      sub: 'Ready for pickup' },
  { key: 'in_transit',label: 'In Transit',        sub: 'Driver picked up order' },
  { key: 'delivered', label: 'Delivered',         sub: 'Order delivered to you' },
];

function stepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const startConv = useStartConversation();
  const verifyPayment = useVerifyOrderPayment();
  const verifyAttempted = useRef(false);

  const { data: order, isLoading } = useOrder(id);

  // After Paystack redirect, verify payment and credit the farmer wallet.
  useEffect(() => {
    if (!id || !order || verifyAttempted.current) return;
    if (order.paymentStatus === 'success') return;
    if (!order.paystackRef && !searchParams.get('reference') && !searchParams.get('trxref')) return;

    verifyAttempted.current = true;
    verifyPayment.mutate(id, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['orders', 'detail', id] });
      },
    });
  }, [id, order, searchParams, verifyPayment, qc]);

  // Listen for real-time order status pushes
  useOrderStatusSocket(
    useCallback((payload) => {
      if (payload.orderId === id) {
        qc.invalidateQueries({ queryKey: ['orders', 'detail', id] });
      }
    }, [id, qc]),
  );

  const accraPosition: [number, number] = [5.6037, -0.187];
  const currentStepIdx = stepIndex(order?.status ?? 'pending');

  const driver = order?.transportJob?.transporter;
  const driverName = driver?.user?.name ?? 'Driver';
  const driverPhone = driver?.user?.phone ?? '';
  const driverAvatar = driver?.user?.avatarUrl
    ?? `https://i.pravatar.cc/150?u=${order?.transportJob?.transporterId ?? 'driver'}`;
  const vehicleLabel = driver
    ? `${driver.vehicleType} • ${driver.licensePlate ?? 'N/A'}`
    : 'Vehicle assigned on pickup';

  const farmerUserId = order?.farmer?.userId;

  const handleChat = async () => {
    if (!order) return;
    try {
      const conv = await startConv.mutateAsync({
        farmerId: farmerUserId!,
        orderId: order.id,
      });
      navigate(`/buyer/chat/${conv.id}`);
    } catch {
      navigate(`/buyer/chat/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const eta = order?.status === 'in_transit' ? 'Arriving in ~15 mins' : formatOrderStatus(order?.status ?? '');

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Track Order" showBack transparent />
      </div>

      {/* Map */}
      <div className="h-[40%] w-full bg-gray-200 relative z-0">
        <MapContainer
          center={accraPosition}
          zoom={13}
          style={{
            height: '100%',
            width: '100%'
          }}
          zoomControl={false}>
          
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          
          <Marker position={accraPosition}>
            <Popup>
              {order?.status === 'in_transit' ? 'Driver Location' : 'Delivery Zone'}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="flex-1 bg-cream rounded-t-[2rem] -mt-6 z-10 relative px-6 pt-6 pb-6 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-bold text-ink">
              {eta}
            </h2>
            <p className="text-sm text-muted">Order #{order?.id?.slice(0, 8) ?? id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            order?.status === 'delivered' ? 'bg-green-50 text-green' :
            order?.status === 'in_transit' ? 'bg-orange-soft text-orange' :
            'bg-gray-100 text-muted'
          }`}>
            {formatOrderStatus(order?.status ?? 'pending')}
          </div>
        </div>

        {/* Driver Card */}
        <Card className="p-4 flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <img
              src={driverAvatar}
              alt={driverName}
              className="w-full h-full object-cover" />
            
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-ink text-sm">{driverName}</h4>
            <p className="text-xs text-muted">{vehicleLabel}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleChat}
              aria-label="Message"
              className="w-10 h-10 rounded-full bg-green-50 text-green flex items-center justify-center">
              
              <MessageCircle size={18} />
            </button>
            {driverPhone && (
              <button
                onClick={() => window.location.href = `tel:${driverPhone}`}
                className="w-10 h-10 rounded-full bg-green text-white flex items-center justify-center shadow-sm">
                
                <Phone size={18} />
              </button>
            )}
          </div>
        </Card>

        {/* Timeline */}
        <div>
          <h3 className="font-bold text-ink mb-4">Order Status</h3>
          <div className="space-y-6 relative pl-4">
            <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-gray-200"></div>

            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <div key={step.key} className="relative flex gap-4">
                  {isDone ? (
                    <div className="w-6 h-6 rounded-full bg-green text-white flex items-center justify-center z-10 shadow-sm">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-4 border-green bg-white z-10 shadow-sm" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 z-10" />
                  )}
                  <div>
                    <h4 className={`font-bold text-sm ${isDone || isActive ? 'text-ink' : 'text-gray-400'}`}>
                      {step.label}
                    </h4>
                    <p className={`text-xs ${isDone || isActive ? 'text-muted' : 'text-gray-400'}`}>
                      {step.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>);

}
