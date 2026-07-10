import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/States';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, LocateFixed, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
import { useFarmersList, FarmerSummary } from '../../lib/hooks/useProduce';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [5.635, -0.155];

// ─── Map control helpers ─────────────────────────────────────────────────────

function MapControls({
  onLocate,
  locating,
}: {
  onLocate: () => void;
  locating: boolean;
}) {
  const map = useMap();

  return (
    <div className="absolute bottom-48 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom In */}
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-ink active:scale-95 transition-transform"
        aria-label="Zoom in"
      >
        <ZoomIn size={18} />
      </button>

      {/* Zoom Out */}
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-ink active:scale-95 transition-transform"
        aria-label="Zoom out"
      >
        <ZoomOut size={18} />
      </button>

      {/* Locate Me */}
      <button
        onClick={onLocate}
        className={`w-10 h-10 shadow-md rounded-xl flex items-center justify-center active:scale-95 transition-transform ${
          locating ? 'bg-green text-white animate-pulse' : 'bg-white text-ink'
        }`}
        aria-label="Locate me"
      >
        <LocateFixed size={18} />
      </button>
    </div>
  );
}

function LocateController({
  trigger,
  onLocated,
}: {
  trigger: number;
  onLocated: (pos: [number, number]) => void;
}) {
  const map = useMap();
  const lastTrigger = useRef(0);

  React.useEffect(() => {
    if (trigger === 0 || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    map.locate({ setView: true, maxZoom: 15 });
    map.once('locationfound', (e) => onLocated([e.latlng.lat, e.latlng.lng]));
  }, [trigger, map, onLocated]);

  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MapView() {
  const navigate = useNavigate();
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerSummary | null>(null);
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  const { data, isLoading } = useFarmersList({ limit: 100 });
  const farmers = (data?.items ?? []).filter(
    (f) => f.latitude != null && f.longitude != null,
  );

  const handleLocate = () => {
    setLocating(true);
    setLocateTrigger((n) => n + 1);
  };

  const handleLocated = (pos: [number, number]) => {
    setUserPos(pos);
    setLocating(false);
  };

  const openDirectionsToFarmer = (farmer: FarmerSummary) => {
    const dest = encodeURIComponent(
      farmer.location ?? `${farmer.latitude},${farmer.longitude}`,
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
      '_blank',
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Nearby Farmers" showBack transparent />
      </div>

      <div className="flex-1 relative z-10">
        {isLoading ? (
          <div className="w-full h-full p-6 pt-24 flex flex-col gap-4">
            <Skeleton className="w-full h-full rounded-2xl" />
          </div>
        ) : (
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
            />

            {farmers.map((farmer) => (
              <Marker
                key={farmer.id}
                position={[farmer.latitude!, farmer.longitude!]}
                eventHandlers={{ click: () => setSelectedFarmer(farmer) }}
              />
            ))}

            {/* User's detected location */}
            {userPos && (
              <Marker
                position={userPos}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="width:14px;height:14px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                })}
              />
            )}

            <MapControls onLocate={handleLocate} locating={locating} />
            <LocateController trigger={locateTrigger} onLocated={handleLocated} />
          </MapContainer>
        )}
      </div>

      <AnimatePresence>
        {selectedFarmer && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 inset-x-0 z-30 p-6 pb-10"
          >
            <Card className="p-4 relative shadow-float">
              <button
                onClick={() => setSelectedFarmer(null)}
                className="absolute top-4 right-4 text-muted hover:text-ink"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green flex-shrink-0">
                  {selectedFarmer.user.avatarUrl ? (
                    <img
                      src={selectedFarmer.user.avatarUrl}
                      alt={selectedFarmer.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <MapPin size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ink">
                    {selectedFarmer.farmName ?? selectedFarmer.user.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {selectedFarmer.location && (
                      <span className="text-sm text-muted">{selectedFarmer.location}</span>
                    )}
                    {selectedFarmer.location && (
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-orange text-xs">★</span>
                      <span className="text-sm font-bold text-ink">
                        {selectedFarmer.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => openDirectionsToFarmer(selectedFarmer)}
                  className="flex items-center justify-center gap-2"
                >
                  <Navigation size={16} />
                  Directions
                </Button>
                <Button fullWidth onClick={() => navigate(`/buyer/farmer/${selectedFarmer.id}`)}>
                  View Farm
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
