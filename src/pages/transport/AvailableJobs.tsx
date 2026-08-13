import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, Package, Clock, Loader2, Search, X } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { BottomNav } from '../../components/ui/BottomNav';
import { JobsOverviewMap } from '../../components/transport/TransportMap';
import { useAvailableJobs, useAcceptJob, useTransportProfile, type TransportJob } from '../../lib/hooks/useTransport';
import { filterTransportJobs, getJobContact } from '../../lib/transportUtils';

export function AvailableJobs() {
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useAvailableJobs();
  const { data: profile } = useTransportProfile();
  const isOnline = profile?.isAvailable ?? false;
  const [mapExpanded, setMapExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredJobs = useMemo(
    () => filterTransportJobs(jobs ?? [], query),
    [jobs, query],
  );

  const mapJobs = useMemo(
    () =>
      filteredJobs.map((job, index) => ({
        id: job.id,
        label: `Job ${index + 1}`,
        pickup: job.pickup,
      })),
    [filteredJobs],
  );

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar
        title="Available Jobs"
        showBack
        rightAction="search"
        onRightAction={() => setSearchOpen((v) => !v)}
      />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        {searchOpen && (
          <div className="mb-4 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
            <Search size={18} className="text-muted flex-shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pickup, drop-off, client, job ID…"
              className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-muted"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {!isOnline && (
          <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-soft/60 px-4 py-3 text-sm text-ink">
            You are <strong>offline</strong>. Go online on your dashboard before accepting a job.
          </div>
        )}

        {/* Live map of nearby pickup points */}
        <div
          className={`w-full bg-gray-200 rounded-3xl mb-6 relative overflow-hidden transition-all duration-300 ${mapExpanded ? 'h-64' : 'h-36'}`}
        >
          {!isLoading && mapJobs.length > 0 ? (
            <JobsOverviewMap jobs={mapJobs} className="h-full w-full" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted bg-gray-100">
              {isLoading ? 'Loading jobs…' : 'No jobs to show on map'}
            </div>
          )}

          <div className="absolute bottom-3 inset-x-0 flex justify-center z-[500] pointer-events-none">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMapExpanded((v) => !v)}
              className="pointer-events-auto bg-white text-ink hover:bg-gray-50 shadow-md"
            >
              <MapPin size={16} className="mr-2 text-green" />
              {mapExpanded ? 'Hide Map' : 'View on Map'}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-ink">Nearby Requests</h3>
          {!isLoading && (
            <span className="text-xs font-bold text-green bg-green-50 px-2 py-1 rounded-lg">
              {filteredJobs.length} {query ? 'Found' : 'New'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Finding jobs near you…</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">
            {query ? 'No jobs match your search.' : 'No available jobs right now.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                canAccept={isOnline}
                onAccepted={(id) => navigate(`/transport/delivery/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function JobCard({ job, onAccepted, canAccept }: { job: TransportJob; onAccepted: (id: string) => void; canAccept: boolean }) {
  const accept = useAcceptJob();
  const contact = getJobContact(job, 'pickup');

  const handleAccept = () => {
    accept.mutate(job.id, {
      onSuccess: () => onAccepted(job.id),
      onError: (err) => {
        const msg =
          err instanceof ApiError
            ? (err.body as { message?: string })?.message ?? err.message
            : 'Could not accept job';
        toast.error(msg);
      },
    });
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-ink text-sm">Job #{job.id.slice(0, 8)}</h4>
          <div className="flex items-center gap-1 text-xs text-orange font-medium mt-1">
            <Clock size={12} /> Pickup ASAP
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green">₵{job.fee.toFixed(2)}</div>
          {job.distance && (
            <div className="text-xs text-muted font-medium">{job.distance} km</div>
          )}
        </div>
      </div>

      <div className="relative pl-6 space-y-4 mb-5">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
        <div className="relative">
          <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 border-green bg-white"></div>
          <p className="text-xs text-muted mb-0.5">Pickup</p>
          <p className="text-sm font-bold text-ink">{job.pickup}</p>
        </div>
        <div className="relative">
          <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-orange"></div>
          <p className="text-xs text-muted mb-0.5">Drop-off</p>
          <p className="text-sm font-bold text-ink">{job.dropoff}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted mb-4 bg-gray-50 p-2 rounded-xl">
        {contact ? (
          <>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              <Avatar name={contact.name} src={contact.avatarUrl} className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <span className="font-medium text-ink block truncate">{contact.name}</span>
              <span className="text-xs text-muted">Pickup · {contact.role === 'farmer' ? 'Farmer' : 'Buyer'}</span>
            </div>
          </>
        ) : (
          <>
            <Package size={16} className="text-ink flex-shrink-0" />
            <span className="font-medium text-ink">Client</span>
          </>
        )}
      </div>

      <Button fullWidth onClick={handleAccept} disabled={accept.isPending || !canAccept}>
        {!canAccept ? 'Go Online to Accept' : accept.isPending ? 'Accepting…' : 'Accept Delivery'}
      </Button>
    </Card>
  );
}
