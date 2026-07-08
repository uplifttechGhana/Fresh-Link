import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Navigation2, ExternalLink } from 'lucide-react';
import { TransportRouteMap } from '../../components/transport/TransportMap';
import { useMyJobs, useGpsTracking } from '../../lib/hooks/useTransport';

export function LiveNavigation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: jobs } = useMyJobs();
  const job = jobs?.find((j) => j.id === id);

  useGpsTracking(true, 5_000);

  const openInMaps = () => {
    if (!job) return;
    const dest = encodeURIComponent(job.dropoff);
    const origin = encodeURIComponent(job.pickup);
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`,
      '_blank',
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Live Navigation" showBack transparent />
      </div>

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
      </div>

      <div className="absolute bottom-0 inset-x-0 z-10 p-4">
        <Card className="p-4 shadow-float">
          <div className="flex items-center gap-4 mb-4">
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
