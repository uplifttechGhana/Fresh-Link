import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/States';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';
import { useFarmersList, FarmerSummary } from '../../lib/hooks/useProduce';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [5.635, -0.155];

export function MapView() {
  const navigate = useNavigate();
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerSummary | null>(null);

  const { data, isLoading } = useFarmersList({ limit: 100 });
  const farmers = (data?.items ?? []).filter(
    (f) => f.latitude != null && f.longitude != null,
  );

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

              <Button fullWidth onClick={() => navigate(`/buyer/farmer/${selectedFarmer.id}`)}>
                View Profile
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
