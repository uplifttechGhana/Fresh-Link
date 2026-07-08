import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Loader2 } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [5.6037, -0.187];

function dotIcon(color: string, rounded: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;${rounded ? 'border-radius:50%' : 'border-radius:6px'};background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const pickupIcon = dotIcon('#15803D', true);
const dropoffIcon = dotIcon('#EA580C', false);

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    return data?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export async function forwardGeocode(query: string): Promise<[number, number] | null> {
  const results = await searchAddresses(query, 1);
  if (!results.length) return null;
  return [results[0].lat, results[0].lng];
}

export interface AddressSearchResult {
  label: string;
  lat: number;
  lng: number;
}

export async function searchAddresses(
  query: string,
  limit = 5,
): Promise<AddressSearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&countrycodes=gh`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
    return data.map((item) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

interface Route {
  path: [number, number][];
  distanceKm: number;
}

export async function fetchDrivingRoute(
  a: [number, number],
  b: [number, number],
): Promise<Route | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    const coords: [number, number][] | undefined = route?.geometry?.coordinates;
    if (!coords) return null;
    return {
      path: coords.map(([lng, lat]) => [lat, lng]),
      distanceKm: route.distance / 1000,
    };
  } catch {
    return null;
  }
}

async function fetchRoute(a: [number, number], b: [number, number]): Promise<Route | null> {
  return fetchDrivingRoute(a, b);
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

interface LocationMapPickerProps {
  pickup: [number, number] | null;
  dropoff: [number, number] | null;
  pickupLabel: string;
  dropoffLabel: string;
  active: 'pickup' | 'dropoff';
  onActiveChange: (active: 'pickup' | 'dropoff') => void;
  onPickupMove: (lat: number, lng: number) => void;
  onDropoffMove: (lat: number, lng: number) => void;
  onDistanceChange: (distanceKm: number | null) => void;
}

export function LocationMapPicker({
  pickup,
  dropoff,
  pickupLabel,
  dropoffLabel,
  active,
  onActiveChange,
  onPickupMove,
  onDropoffMove,
  onDistanceChange,
}: LocationMapPickerProps) {
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);

  useEffect(() => {
    if (!pickup || !dropoff) {
      setRoute(null);
      onDistanceChange(null);
      return;
    }
    let cancelled = false;
    fetchRoute(pickup, dropoff).then((result) => {
      if (cancelled) return;
      setRoute(result);
      onDistanceChange(result?.distanceKm ?? null);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, dropoff]);

  const handlePick = (lat: number, lng: number) => {
    if (active === 'pickup') {
      onPickupMove(lat, lng);
      onActiveChange('dropoff');
    } else {
      onDropoffMove(lat, lng);
    }
  };

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePick(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const center = pickup ?? dropoff ?? DEFAULT_CENTER;

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => onActiveChange('pickup')}
          className={`flex-1 flex items-center gap-2 justify-center py-2 rounded-xl text-sm font-bold transition-colors border-2 ${
            active === 'pickup'
              ? 'bg-green-50 text-green border-green'
              : 'bg-gray-50 text-muted border-transparent'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
          Pickup {pickup && '✓'}
        </button>
        <button
          type="button"
          onClick={() => onActiveChange('dropoff')}
          className={`flex-1 flex items-center gap-2 justify-center py-2 rounded-xl text-sm font-bold transition-colors border-2 ${
            active === 'dropoff'
              ? 'bg-orange-50 text-orange border-orange'
              : 'bg-gray-50 text-muted border-transparent'
          }`}
        >
          <span className="w-2 h-2 rounded-sm bg-orange flex-shrink-0" />
          Drop-off {dropoff && '✓'}
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden" style={{ height: 260 }}>
        <MapContainer
          center={center}
          zoom={14}
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <ClickHandler onPick={handlePick} />
          {pickup && dropoff && (
            <Polyline
              positions={route?.path ?? [pickup, dropoff]}
              color="#15803D"
              weight={4}
              opacity={0.7}
            />
          )}
          {pickup && (
            <Marker
              position={pickup}
              icon={pickupIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onPickupMove(lat, lng);
                },
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -14]} className="map-pin-tooltip">
                <span className="inline-block max-w-[180px] bg-white text-ink text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md border border-green-100 leading-snug">
                  {pickupLabel}
                </span>
              </Tooltip>
            </Marker>
          )}
          {dropoff && (
            <Marker
              position={dropoff}
              icon={dropoffIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onDropoffMove(lat, lng);
                },
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -14]} className="map-pin-tooltip">
                <span className="inline-block max-w-[180px] bg-white text-ink text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md border border-orange-100 leading-snug">
                  {dropoffLabel}
                </span>
              </Tooltip>
            </Marker>
          )}
        </MapContainer>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="absolute bottom-3 right-3 z-10 w-10 h-10 bg-white rounded-full shadow-float flex items-center justify-center text-green active:scale-95 transition-transform"
        >
          {locating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
        </button>

        <div className="absolute top-2 inset-x-2 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs text-center text-muted font-medium shadow-sm">
          Tap the map to set the {active === 'pickup' ? 'pickup' : 'drop-off'} point, or drag a pin
        </div>
      </div>
    </div>
  );
}
