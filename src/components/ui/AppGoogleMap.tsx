/**
 * AppGoogleMap — shared Google Maps wrapper for Fresh-Link.
 *
 * Renders an in-app Google Map with:
 *   • Real Google Maps tiles (satellite / road)
 *   • Live traffic layer
 *   • Optional Directions route (turn-by-turn polyline)
 *   • Optional tilt (3D bird's-eye) toggle
 *   • Locate-Me button
 *   • Custom marker helpers
 *
 * Requires VITE_GOOGLE_MAPS_KEY in the project's .env file.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  TrafficLayer,
  DirectionsRenderer,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Loader2, LocateFixed, Layers, Navigation2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** HTML content rendered inside the marker div */
  color?: string;
  label?: string;
  title?: string;
}

export interface AppGoogleMapProps {
  /** CSS height for the map container (default 100%) */
  height?: string;
  className?: string;

  /** Default center when no markers or route */
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;

  /** Markers to place on the map */
  markers?: MapMarker[];

  /** If provided, the map will draw a driving route between these addresses */
  routeFrom?: string;
  routeTo?: string;

  /** Called when a marker is clicked */
  onMarkerClick?: (id: string) => void;

  /** Show traffic layer (default true) */
  showTraffic?: boolean;

  /** Show the Locate-Me / tilt controls (default true) */
  showControls?: boolean;

  /** Slot rendered below the map (e.g. a bottom card) */
  children?: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCRA: google.maps.LatLngLiteral = { lat: 5.6037, lng: -0.187 };

const GOOGLE_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,        // we render our own controls
  clickableIcons: false,
  gestureHandling: 'greedy',
  mapTypeId: 'roadmap',
};

function makeIcon(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 3,
    scale: 10,
  };
}

const MARKER_COLORS: Record<string, string> = {
  driver:  '#2563EB',
  pickup:  '#15803D',
  dropoff: '#EA580C',
  farm:    '#15803D',
  me:      '#2563EB',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AppGoogleMap({
  height = '100%',
  className = '',
  defaultCenter = ACCRA,
  defaultZoom = 13,
  markers = [],
  routeFrom,
  routeTo,
  onMarkerClick,
  showTraffic = true,
  showControls = true,
  children,
}: AppGoogleMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: ['places'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeError, setRouteError] = useState(false);
  const [tilt, setTilt] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // ── Route ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded || !routeFrom || !routeTo) return;
    setRouteError(false);
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: routeFrom,
        destination: routeTo,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setRouteError(true);
        }
      },
    );
  }, [isLoaded, routeFrom, routeTo]);

  // ── 3D / tilt ─────────────────────────────────────────────────────────────

  const toggleTilt = useCallback(() => {
    if (!mapRef.current) return;
    const next = tilt ? 0 : 45;
    mapRef.current.setTilt(next);
    setTilt(!tilt);
  }, [tilt]);

  // ── Locate Me ─────────────────────────────────────────────────────────────

  const locateMe = useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
        mapRef.current?.setZoom(16);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!apiKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 bg-gray-100 text-center p-6 ${className}`}
        style={{ height }}
      >
        <Navigation2 size={32} className="text-muted" />
        <p className="text-sm font-bold text-ink">Google Maps key not set</p>
        <p className="text-xs text-muted max-w-xs">
          Add <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_MAPS_KEY=your_key</code> to{' '}
          <code className="bg-gray-200 px-1 rounded">.env</code> and rebuild the app.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-sm text-muted ${className}`}
        style={{ height }}
      >
        Failed to load map
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <Loader2 size={28} className="animate-spin text-green" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={defaultCenter}
        zoom={defaultZoom}
        options={GOOGLE_MAP_OPTIONS}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {/* Traffic layer — silently reroutes around congestion */}
        {showTraffic && <TrafficLayer />}

        {/* Directions route (turn-by-turn polyline) */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,          // we draw our own markers
              polylineOptions: {
                strokeColor: '#15803D',
                strokeWeight: 6,
                strokeOpacity: 0.85,
              },
            }}
          />
        )}

        {/* Custom markers */}
        {markers.map((m) => (
          <MarkerF
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            icon={makeIcon(MARKER_COLORS[m.color ?? ''] ?? m.color ?? '#15803D')}
            title={m.title}
            onClick={() => {
              setSelectedMarkerId(m.id === selectedMarkerId ? null : m.id);
              onMarkerClick?.(m.id);
            }}
          >
            {selectedMarkerId === m.id && m.label && (
              <InfoWindowF
                position={{ lat: m.lat, lng: m.lng }}
                onCloseClick={() => setSelectedMarkerId(null)}
              >
                <p className="text-xs font-bold text-ink pr-2">{m.label}</p>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}

        {/* Route error fallback notice */}
        {routeError && routeFrom && routeTo && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
            Couldn't load route — check your connection
          </div>
        )}
      </GoogleMap>

      {/* Custom control buttons */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          {/* 3D / tilt */}
          <button
            onClick={toggleTilt}
            className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-xs font-bold transition-colors ${
              tilt ? 'bg-green text-white' : 'bg-white text-ink'
            }`}
            title="Toggle 3D view"
          >
            3D
          </button>

          {/* Locate Me */}
          <button
            onClick={locateMe}
            className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-colors ${
              locating ? 'bg-green text-white animate-pulse' : 'bg-white text-ink'
            }`}
            title="Locate me"
          >
            <LocateFixed size={18} />
          </button>

          {/* Map type toggle */}
          <button
            onClick={() => {
              if (!mapRef.current) return;
              const cur = mapRef.current.getMapTypeId();
              mapRef.current.setMapTypeId(
                cur === 'roadmap' ? 'hybrid' : 'roadmap',
              );
            }}
            className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-ink"
            title="Toggle satellite view"
          >
            <Layers size={18} />
          </button>
        </div>
      )}

      {children}
    </div>
  );
}
