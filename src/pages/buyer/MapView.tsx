import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/States';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, LocateFixed, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
import { useFarmersList, FarmerSummary } from '../../lib/hooks/useProduce';
import { fetchDrivingRoute, forwardGeocode } from '../../components/LocationMapPicker';

// ─── Leaflet icon defaults ────────────────────────────────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const farmIcon = dotIcon('#15803D');
const meIcon   = dotIcon('#2563EB');

const DEFAULT_CENTER: [number, number] = [5.635, -0.155];

// ─── Map child controls ───────────────────────────────────────────────────────

function ZoomAndLocate({
  onLocated,
  locating,
  setLocating,
}: {
  onLocated: (pos: [number, number]) => void;
  locating: boolean;
  setLocating: (v: boolean) => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos: [number, number] = [coords.latitude, coords.longitude];
        map.setView(pos, 15);
        onLocated(pos);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="absolute bottom-48 right-3 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-ink active:scale-95"
        aria-label="Zoom in"
      >
        <ZoomIn size={18} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-ink active:scale-95"
        aria-label="Zoom out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        onClick={handleLocate}
        className={`w-10 h-10 shadow-md rounded-xl flex items-center justify-center transition-colors ${
          locating ? 'bg-green text-white animate-pulse' : 'bg-white text-ink'
        }`}
        aria-label="Locate me"
      >
        <LocateFixed size={18} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MapView() {
  const navigate = useNavigate();
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerSummary | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const { data, isLoading } = useFarmersList({ limit: 100 });
  const farmers = (data?.items ?? []).filter(
    (f) => f.latitude != null && f.longitude != null,
  );

  const drawRoute = useCallback(
    async (farmer: FarmerSummary) => {
      setRoutePath([]);
      setRouteLoading(true);
      const dest: [number, number] = [farmer.latitude!, farmer.longitude!];

      let origin: [number, number] | null = null;
      if (userPos) {
        origin = userPos;
      } else {
        await new Promise<void>((res) => {
          navigator.geolocation?.getCurrentPosition(
            ({ coords }) => {
              origin = [coords.latitude, coords.longitude];
              res();
            },
            () => res(),
            { enableHighAccuracy: true, timeout: 8_000 },
          );
        });
      }

      if (origin) {
        const route = await fetchDrivingRoute(origin, dest);
        setRoutePath(route?.path ?? [origin, dest]);
      } else {
        // Fallback: straight line if GPS unavailable
        setRoutePath([DEFAULT_CENTER, dest]);
      }
      setRouteLoading(false);
    },
    [userPos],
  );

  const handleMarkerClick = (farmer: FarmerSummary) => {
    setSelectedFarmer(farmer);
    drawRoute(farmer);
  };

  const clearSelection = () => {
    setSelectedFarmer(null);
    setRoutePath([]);
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Nearby Farms" showBack transparent />
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
            {/* Voyager tiles — colored roads, green parks, blue water; free */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Farm markers */}
            {farmers.map((farmer) => (
              <Marker
                key={farmer.id}
                position={[farmer.latitude!, farmer.longitude!]}
                icon={farmIcon}
                eventHandlers={{ click: () => handleMarkerClick(farmer) }}
              />
            ))}

            {/* User location */}
            {userPos && <Marker position={userPos} icon={meIcon} />}

            {/* Driving route polyline */}
            {routePath.length > 1 && (
              <Polyline positions={routePath} color="#15803D" weight={5} opacity={0.85} />
            )}

            {/* Controls rendered inside the map */}
            <ZoomAndLocate
              onLocated={setUserPos}
              locating={locating}
              setLocating={setLocating}
            />
          </MapContainer>
        )}

        {/* Route loading spinner */}
        {routeLoading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-md text-xs font-bold text-ink">
            <span className="w-4 h-4 border-2 border-green border-t-transparent rounded-full animate-spin" />
            Calculating route…
          </div>
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
                onClick={clearSelection}
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

              {routePath.length > 0 && (
                <p className="text-xs text-green font-medium mb-3 flex items-center gap-1">
                  <Navigation size={12} />
                  Route shown on the map
                </p>
              )}

              <Button fullWidth onClick={() => navigate(`/buyer/farmer/${selectedFarmer.id}`)}>
                View Farm
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
