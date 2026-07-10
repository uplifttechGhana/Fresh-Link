import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/States';
import { AppGoogleMap, MapMarker } from '../../components/ui/AppGoogleMap';
import { MapPin, X, Navigation } from 'lucide-react';
import { useFarmersList, FarmerSummary } from '../../lib/hooks/useProduce';

const DEFAULT_CENTER = { lat: 5.635, lng: -0.155 };

export function MapView() {
  const navigate = useNavigate();
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerSummary | null>(null);
  // Route: from user location → selected farm (shown on the map)
  const [routeTo, setRouteTo] = useState<string | undefined>();
  const [routeFrom, setRouteFrom] = useState<string | undefined>();

  const { data, isLoading } = useFarmersList({ limit: 100 });
  const farmers = (data?.items ?? []).filter(
    (f) => f.latitude != null && f.longitude != null,
  );

  const markers: MapMarker[] = farmers.map((f) => ({
    id: f.id,
    lat: f.latitude!,
    lng: f.longitude!,
    color: 'farm',
    title: f.farmName ?? f.user.name,
    label: f.farmName ?? f.user.name,
  }));

  const handleMarkerClick = (id: string) => {
    const farmer = farmers.find((f) => f.id === id);
    if (!farmer) return;
    setSelectedFarmer(farmer);
    // Draw in-app route from user's GPS to the farm
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setRouteFrom(`${coords.latitude},${coords.longitude}`);
    });
    setRouteTo(
      farmer.location ?? `${farmer.latitude},${farmer.longitude}`,
    );
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
          <AppGoogleMap
            height="100%"
            defaultCenter={DEFAULT_CENTER}
            markers={markers}
            routeFrom={routeFrom}
            routeTo={routeTo}
            onMarkerClick={handleMarkerClick}
            showTraffic
            showControls
          />
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
                onClick={() => {
                  setSelectedFarmer(null);
                  setRouteTo(undefined);
                  setRouteFrom(undefined);
                }}
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

              {/* Route already drawn on map — button just scrolls map into view */}
              {routeTo && (
                <p className="text-xs text-green font-medium mb-3 flex items-center gap-1">
                  <Navigation size={12} />
                  Route shown on map above
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
