import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { useOrder, formatOrderStatus, useVerifyOrderPayment } from '../../lib/hooks/useOrders';
import { useOrderStatusSocket, useStartConversation } from '../../lib/hooks/useChat';
import { useQueryClient } from '@tanstack/react-query';
import { forwardGeocode, fetchDrivingRoute } from '../../components/LocationMapPicker';

// ─── Leaflet icon defaults ─────────────────────────────────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const pickupIcon  = dotIcon('#15803D');
const dropoffIcon = dotIcon('#EA580C');

// ─── Order status steps ────────────────────────────────────────────────────────

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

const ACCRA: [number, number] = [5.6037, -0.187];

// ─── Component ─────────────────────────────────────────────────────────────────

export function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const startConv = useStartConversation();
  const verifyPayment = useVerifyOrderPayment();
  const verifyAttempted = useRef(false);

  const { data: order, isLoading } = useOrder(id);

  // Route geometry between farmer location and delivery address
  const [pickupPos,  setPickupPos]  = useState<[number, number] | null>(null);
  const [dropoffPos, setDropoffPos] = useState<[number, number] | null>(null);
  const [routePath,  setRoutePath]  = useState<[number, number][]>([]);

  // Geocode and fetch route whenever the order loads
  useEffect(() => {
    if (!order) return;
    let cancelled = false;

    const farmerAddr   = order.farmer?.location ?? order.farmer?.farmName ?? '';
    const deliveryAddr = (order as any).deliveryAddress ?? '';

    if (!farmerAddr && !deliveryAddr) return;

    (async () => {
      const [pickup, dropoff] = await Promise.all([
        farmerAddr   ? forwardGeocode(farmerAddr)   : Promise.resolve(null),
        deliveryAddr ? forwardGeocode(deliveryAddr) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      if (pickup)  setPickupPos(pickup);
      if (dropoff) setDropoffPos(dropoff);

      if (pickup && dropoff) {
        const route = await fetchDrivingRoute(pickup, dropoff);
        if (!cancelled) setRoutePath(route?.path ?? [pickup, dropoff]);
      }
    })();

    return () => { cancelled = true; };
  }, [order?.id]);

  // Payment verification after Paystack redirect
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

  // Real-time order status
  useOrderStatusSocket(
    useCallback((payload) => {
      if (payload.orderId === id) {
        qc.invalidateQueries({ queryKey: ['orders', 'detail', id] });
      }
    }, [id, qc]),
  );

  const currentStepIdx = stepIndex(order?.status ?? 'pending');

  const driver      = order?.transportJob?.transporter;
  const driverName  = driver?.user?.name ?? 'Driver';
  const driverPhone = driver?.user?.phone ?? '';
  const driverAvatar = driver?.user?.avatarUrl ?? null;
  const vehicleLabel = driver
    ? `${driver.vehicleType} • ${driver.licensePlate ?? 'N/A'}`
    : 'Vehicle assigned on pickup';

  const farmerUserId = order?.farmer?.userId;

  const handleChat = async () => {
    if (!order) return;
    try {
      const conv = await startConv.mutateAsync({ farmerId: farmerUserId!, orderId: order.id });
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

  const eta = order?.status === 'in_transit'
    ? 'Arriving in ~15 mins'
    : formatOrderStatus(order?.status ?? '');

  const mapCenter = pickupPos ?? dropoffPos ?? ACCRA;

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Track Order" showBack transparent />
      </div>

      {/* In-app map with Voyager tiles + OSRM route */}
      <div className="h-[40%] w-full bg-gray-200 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          />

          {pickupPos && (
            <Marker position={pickupPos} icon={pickupIcon}>
              <Popup>Pickup — {order?.farmer?.location ?? 'Farm'}</Popup>
            </Marker>
          )}
          {dropoffPos && (
            <Marker position={dropoffPos} icon={dropoffIcon}>
              <Popup>Delivery address</Popup>
            </Marker>
          )}
          {routePath.length > 1 && (
            <Polyline positions={routePath} color="#15803D" weight={5} opacity={0.85} />
          )}
        </MapContainer>
      </div>

      <div className="flex-1 bg-cream rounded-t-[2rem] -mt-6 z-10 relative px-6 pt-6 pb-6 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-bold text-ink">{eta}</h2>
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
            <Avatar name={driverName} src={driverAvatar} className="w-full h-full" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-ink text-sm">{driverName}</h4>
            <p className="text-xs text-muted">{vehicleLabel}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleChat}
              aria-label="Message"
              className="w-10 h-10 rounded-full bg-green-50 text-green flex items-center justify-center"
            >
              <MessageCircle size={18} />
            </button>
            {driverPhone && (
              <button
                onClick={() => { window.location.href = `tel:${driverPhone}`; }}
                className="w-10 h-10 rounded-full bg-green text-white flex items-center justify-center shadow-sm"
              >
                <Phone size={18} />
              </button>
            )}
          </div>
        </Card>

        {/* Timeline */}
        <div>
          <h3 className="font-bold text-ink mb-4">Order Status</h3>
          <div className="space-y-6 relative pl-4">
            <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-gray-200" />

            {STATUS_STEPS.map((step, idx) => {
              const isDone   = idx <= currentStepIdx;
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
    </div>
  );
}
