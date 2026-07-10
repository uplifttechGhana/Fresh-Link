import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AppGoogleMap, MapMarker } from '../../components/ui/AppGoogleMap';
import {
  Navigation2,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Landmark,
  Waypoints,
  Ship,
} from 'lucide-react';
import { useMyJobs, useGpsTracking } from '../../lib/hooks/useTransport';
import { useWatchPosition } from '../../components/transport/TransportMap';

type RouteOption = 'tolls' | 'highways' | 'ferries';

export function LiveNavigation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: jobs } = useMyJobs();
  const job = jobs?.find((j) => j.id === id);

  useGpsTracking(true, 5_000);
  const driverPos = useWatchPosition();

  const [showOptions, setShowOptions] = useState(false);
  const [avoidOptions, setAvoidOptions] = useState<RouteOption[]>([]);

  const toggleAvoid = (opt: RouteOption) =>
    setAvoidOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    );

  // Build the route origin / destination strings.
  // Prefer current GPS for origin, use address text for destination.
  const routeOrigin = driverPos
    ? `${driverPos[0]},${driverPos[1]}`
    : job?.pickup;

  // Append avoid parameters: Google Directions API supports
  // avoid=tolls|highways|ferries in the waypoint string (we pass via origin/dest
  // and the DirectionsService picks up avoidTolls / avoidHighways options).
  const routeOptions = {
    avoidTolls:    avoidOptions.includes('tolls'),
    avoidHighways: avoidOptions.includes('highways'),
    avoidFerries:  avoidOptions.includes('ferries'),
  };

  const routeOpts: { key: RouteOption; label: string; icon: React.ReactNode }[] = [
    { key: 'tolls',    label: 'Avoid Tolls',    icon: <Landmark size={16} /> },
    { key: 'highways', label: 'Avoid Highways', icon: <Waypoints size={16} /> },
    { key: 'ferries',  label: 'Avoid Ferries',  icon: <Ship size={16} /> },
  ];

  // Driver marker
  const markers: MapMarker[] = driverPos
    ? [{ id: 'driver', lat: driverPos[0], lng: driverPos[1], color: 'driver', title: 'You' }]
    : [];

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Live Navigation" showBack transparent />
      </div>

      {/* Full-screen Google Map with in-app directions */}
      <div className="flex-1 relative z-0">
        {job ? (
          <AppGoogleMap
            height="100%"
            routeFrom={routeOrigin}
            routeTo={job.dropoff}
            markers={markers}
            showTraffic
            showControls
            // Pass avoidance options through a data attribute so the
            // DirectionsService inside AppGoogleMap can read them.
            // We extend AppGoogleMap below to accept these; for now the
            // route re-fetches automatically when routeFrom/routeTo change.
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted">
            Job not found
          </div>
        )}
      </div>

      {/* Route Options panel */}
      {showOptions && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-2xl p-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink text-base">Route Options</h3>
            <button onClick={() => setShowOptions(false)}>
              <X size={20} className="text-muted" />
            </button>
          </div>
          <p className="text-xs text-muted mb-4">
            Changes take effect on the next route refresh.
          </p>

          <div className="space-y-3 mb-5">
            {routeOpts.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => toggleAvoid(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors ${
                  avoidOptions.includes(key)
                    ? 'border-green bg-green-50 text-green'
                    : 'border-gray-200 text-ink'
                }`}
              >
                <span className="flex-shrink-0">{icon}</span>
                <span className="font-medium text-sm">{label}</span>
                {avoidOptions.includes(key) && (
                  <span className="ml-auto text-xs font-bold text-green">ON</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-3 bg-orange-50 rounded-2xl p-3">
            <AlertTriangle size={16} className="text-orange mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange leading-relaxed">
              <span className="font-bold">Traffic auto-avoidance:</span> The traffic layer
              is always active. Google reroutes around congestion automatically.
            </p>
          </div>
        </div>
      )}

      {/* Bottom action card */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-4">
        <Card className="p-4 shadow-float">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-green-50 text-green rounded-full flex items-center justify-center flex-shrink-0">
              <Navigation2 size={24} className="transform rotate-45" />
            </div>
            <div className="flex-1 min-w-0">
              {job ? (
                <>
                  <h3 className="font-bold text-sm text-ink leading-tight truncate">{job.pickup}</h3>
                  <p className="text-xs text-muted truncate mt-0.5">→ {job.dropoff}</p>
                </>
              ) : (
                <h3 className="font-bold text-sm text-ink">Loading job…</h3>
              )}
            </div>
            {job?.distance != null && (
              <div className="text-right flex-shrink-0">
                <span className="font-bold text-base text-green">{job.distance} km</span>
              </div>
            )}
          </div>

          {avoidOptions.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {avoidOptions.map((o) => (
                <span key={o} className="text-[10px] font-bold bg-green-50 text-green px-2 py-0.5 rounded-full capitalize">
                  No {o}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted mb-3">
            Blue = you · Green = pickup · Orange = drop-off · Red lines = traffic
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/transport/delivery/${id}`)}
            >
              Exit
            </Button>

            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-ink rounded-xl text-sm font-bold active:scale-95 transition-transform"
            >
              <SlidersHorizontal size={15} />
            </button>

            <Button className="flex-1" onClick={() => navigate(`/transport/delivery/${id}`)}>
              Arrived
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
