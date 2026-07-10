import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Navigation2,
  ExternalLink,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Landmark,
  Waypoints,
  Ship,
} from 'lucide-react';
import { TransportRouteMap } from '../../components/transport/TransportMap';
import { useMyJobs, useGpsTracking } from '../../lib/hooks/useTransport';

type RouteOption = 'tolls' | 'highways' | 'ferries';

function buildMapsUrl(
  origin: string,
  destination: string,
  avoid: RouteOption[],
): string {
  const base = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams({
    origin,
    destination,
    travelmode: 'driving',
  });
  if (avoid.length) params.set('avoid', avoid.join('|'));
  return `${base}&${params.toString()}`;
}

export function LiveNavigation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: jobs } = useMyJobs();
  const job = jobs?.find((j) => j.id === id);

  useGpsTracking(true, 5_000);

  const [showOptions, setShowOptions] = useState(false);
  const [avoidOptions, setAvoidOptions] = useState<RouteOption[]>([]);
  const [is3D, setIs3D] = useState(false);

  const toggleAvoid = (opt: RouteOption) =>
    setAvoidOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    );

  const openInMaps = () => {
    if (!job) return;
    window.open(buildMapsUrl(job.pickup, job.dropoff, avoidOptions), '_blank');
  };

  const routeOpts: { key: RouteOption; label: string; icon: React.ReactNode }[] = [
    { key: 'tolls',    label: 'Avoid Tolls',     icon: <Landmark size={16} /> },
    { key: 'highways', label: 'Avoid Highways',  icon: <Waypoints size={16} /> },
    { key: 'ferries',  label: 'Avoid Ferries',   icon: <Ship size={16} /> },
  ];

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Live Navigation" showBack transparent />
      </div>

      {/* Map fills the screen */}
      <div className="flex-1 bg-gray-200 relative z-0">
        {job ? (
          <TransportRouteMap
            pickupAddress={job.pickup}
            dropoffAddress={job.dropoff}
            routeLeg="pickup-to-dropoff"
            className="h-full w-full"
            zoomControl
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted">
            Job not found
          </div>
        )}

        {/* 3D / tilt badge — visual indicator when 3D mode is on */}
        {is3D && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
            3D View — use two fingers to tilt in Google Maps
          </div>
        )}
      </div>

      {/* Route Options slide-up panel */}
      {showOptions && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-2xl p-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink text-base">Route Options</h3>
            <button onClick={() => setShowOptions(false)}>
              <X size={20} className="text-muted" />
            </button>
          </div>

          <p className="text-xs text-muted mb-4">
            These preferences are applied when you open in Google Maps.
          </p>

          <div className="space-y-3 mb-6">
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

          {/* Traffic avoidance tip */}
          <div className="flex items-start gap-3 bg-orange-50 rounded-2xl p-3 mb-4">
            <AlertTriangle size={16} className="text-orange mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange leading-relaxed">
              <span className="font-bold">Avoid traffic automatically:</span> Open Google Maps
              Settings → Navigation settings → "Avoid traffic jams" to let Maps silently
              reroute you around congestion.
            </p>
          </div>

          {/* 3D toggle */}
          <button
            onClick={() => { setIs3D(!is3D); setShowOptions(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors ${
              is3D ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-ink'
            }`}
          >
            <Navigation2 size={16} />
            <div className="text-left">
              <p className="font-medium text-sm">3D View reminder</p>
              <p className="text-xs text-muted">Swipe up with two fingers in Maps to tilt</p>
            </div>
            {is3D && <span className="ml-auto text-xs font-bold text-blue-600">ON</span>}
          </button>
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

          {/* Active avoid options chips */}
          {avoidOptions.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-3">
              {avoidOptions.map((o) => (
                <span key={o} className="text-[10px] font-bold bg-green-50 text-green px-2 py-0.5 rounded-full capitalize">
                  No {o}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted mb-3">
            Blue dot = you · Green = pickup · Orange = drop-off
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/transport/delivery/${id}`)}
            >
              Exit
            </Button>

            {/* Route options button */}
            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-ink rounded-xl text-sm font-bold active:scale-95 transition-transform"
            >
              <SlidersHorizontal size={15} />
            </button>

            {job && (
              <button
                type="button"
                onClick={openInMaps}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
              >
                <ExternalLink size={16} />
                Maps
              </button>
            )}

            <Button className="flex-1" onClick={() => navigate(`/transport/delivery/${id}`)}>
              Arrived
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
