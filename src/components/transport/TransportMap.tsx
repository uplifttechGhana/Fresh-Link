import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Loader2 } from 'lucide-react';
import { forwardGeocode, fetchDrivingRoute } from '../LocationMapPicker';

export const DEFAULT_MAP_CENTER: [number, number] = [5.6037, -0.187];

export function useWatchPosition(enabled = true) {
  const [position, setPosition] = useState<[number, number]>(DEFAULT_MAP_CENTER);

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      undefined,
      { enableHighAccuracy: true, timeout: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return position;
}

function dotIcon(color: string, rounded: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;${rounded ? 'border-radius:50%' : 'border-radius:6px'};background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function numberedIcon(n: number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#15803D;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const driverIcon = dotIcon('#2563EB', true);
const pickupIcon = dotIcon('#15803D', true);
const dropoffIcon = dotIcon('#EA580C', false);

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [36, 36] });
  }, [map, positions]);
  return null;
}

export type RouteLeg = 'driver-to-pickup' | 'pickup-to-dropoff';

interface TransportRouteMapProps {
  pickupAddress: string;
  dropoffAddress?: string;
  routeLeg: RouteLeg;
  className?: string;
  zoomControl?: boolean;
}

/** Single-job map with an OSRM driving route between two points. */
export function TransportRouteMap({
  pickupAddress,
  dropoffAddress,
  routeLeg,
  className = 'h-full w-full',
  zoomControl = false,
}: TransportRouteMapProps) {
  const driverPosition = useWatchPosition();
  const driverRef = useRef(driverPosition);
  driverRef.current = driverPosition;

  const [pickupPosition, setPickupPosition] = useState<[number, number] | null>(null);
  const [dropoffPosition, setDropoffPosition] = useState<[number, number] | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [geoLoading, setGeoLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGeoLoading(true);

    (async () => {
      const [pickup, dropoff] = await Promise.all([
        pickupAddress ? forwardGeocode(pickupAddress) : Promise.resolve(null),
        dropoffAddress ? forwardGeocode(dropoffAddress) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setPickupPosition(pickup);
      setDropoffPosition(dropoff);
      setGeoLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pickupAddress, dropoffAddress]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      const driver = driverRef.current;
      const origin = routeLeg === 'driver-to-pickup' ? driver : pickupPosition;
      const destination = routeLeg === 'driver-to-pickup' ? pickupPosition : dropoffPosition;
      if (!origin || !destination) {
        setRoutePath([]);
        return;
      }

      setRouteLoading(true);
      const route = await fetchDrivingRoute(origin, destination);
      if (cancelled) return;
      setRoutePath(route?.path ?? [origin, destination]);
      setRouteLoading(false);
    };

    loadRoute();

    if (routeLeg !== 'driver-to-pickup') return undefined;

    const interval = window.setInterval(loadRoute, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pickupPosition, dropoffPosition, routeLeg]);

  const loading = geoLoading || routeLoading;

  const boundsPoints: [number, number][] = [driverPosition];
  if (pickupPosition) boundsPoints.push(pickupPosition);
  if (dropoffPosition) boundsPoints.push(dropoffPosition);
  if (routePath.length) boundsPoints.push(...routePath);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <Loader2 size={22} className="animate-spin text-green" />
        </div>
      )}
      <MapContainer
        center={driverPosition}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={zoomControl}
        scrollWheelZoom={zoomControl}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds positions={boundsPoints} />

        <Marker position={driverPosition} icon={driverIcon}>
          <Popup>Your location</Popup>
        </Marker>

        {pickupPosition && (
          <Marker position={pickupPosition} icon={pickupIcon}>
            <Popup>{pickupAddress}</Popup>
          </Marker>
        )}

        {dropoffPosition && routeLeg === 'pickup-to-dropoff' && (
          <Marker position={dropoffPosition} icon={dropoffIcon}>
            <Popup>{dropoffAddress}</Popup>
          </Marker>
        )}

        {routePath.length > 1 && (
          <Polyline positions={routePath} color="#15803D" weight={5} opacity={0.85} />
        )}
      </MapContainer>
    </div>
  );
}

interface JobMarker {
  id: string;
  label: string;
  pickup: string;
}

interface JobsOverviewMapProps {
  jobs: JobMarker[];
  className?: string;
}

/** Map of all available job pickup points + driver location. */
export function JobsOverviewMap({ jobs, className = 'h-full w-full' }: JobsOverviewMapProps) {
  const driverPosition = useWatchPosition();
  const [markers, setMarkers] = useState<Array<{ id: string; label: string; pos: [number, number] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const resolved = await Promise.all(
        jobs.map(async (job, index) => {
          const pos = await forwardGeocode(job.pickup);
          if (!pos) return null;
          return { id: job.id, label: job.label || `Job ${index + 1}`, pos };
        }),
      );
      if (!cancelled) {
        setMarkers(resolved.filter(Boolean) as Array<{ id: string; label: string; pos: [number, number] }>);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobs]);

  const boundsPoints: [number, number][] = [driverPosition, ...markers.map((m) => m.pos)];

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
          <Loader2 size={20} className="animate-spin text-green" />
        </div>
      )}
      <MapContainer
        center={driverPosition}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds positions={boundsPoints} />

        <Marker position={driverPosition} icon={driverIcon}>
          <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
            You
          </Tooltip>
        </Marker>

        {markers.map((marker, index) => (
          <Marker key={marker.id} position={marker.pos} icon={numberedIcon(index + 1)}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              {marker.label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
