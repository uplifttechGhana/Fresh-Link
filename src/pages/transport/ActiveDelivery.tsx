import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, MessageCircle, MapPin, CheckCircle2, Package, Loader2 } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { TransportRouteMap } from '../../components/transport/TransportMap';
import {
  useMyJobs,
  useUpdateJobStatus,
  useGpsTracking,
  advanceLabel,
  nextJobStatus,
} from '../../lib/hooks/useTransport';
import { useDeliveryConversation } from '../../lib/hooks/useChat';
import { getJobContact, openPhoneCall, contactRoleLabel, jobContactLeg } from '../../lib/transportUtils';
import { TypewriterText } from '../../components/ui/TypewriterText';

const STAGE_LABELS = ['Heading to pickup', 'Picked up', 'In transit', 'Delivered'];

function statusToStage(status: string): number {
  const map: Record<string, number> = {
    accepted: 0,
    picked_up: 1,
    in_transit: 2,
    delivered: 3,
  };
  return map[status] ?? 0;
}

export function ActiveDelivery() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: jobs, isLoading } = useMyJobs();
  const updateStatus = useUpdateJobStatus();
  const openDeliveryChat = useDeliveryConversation();

  const job = jobs?.find((j) => j.id === id);

  useGpsTracking(true);

  const stage = job ? statusToStage(job.status) : 0;
  const contactLeg = job ? jobContactLeg(job.status) : 'pickup';
  const contact = job ? getJobContact(job, contactLeg) : null;
  const routeLeg =
    job?.status === 'accepted' ? 'driver-to-pickup' : 'pickup-to-dropoff';

  const handleOpenChat = () => {
    if (!job) return;
    openDeliveryChat.mutate(job.id, {
      onSuccess: (conv) => navigate(`/transport/chat/${conv.id}`),
    });
  };

  const advance = () => {
    if (!job) return;
    const next = nextJobStatus(job.status);
    if (next) {
      updateStatus.mutate(
        { id: job.id, status: next },
        {
          onSuccess: (updated: { status: string }) => {
            if (updated.status === 'delivered') {
              toast.success('Delivery completed');
              navigate('/transport/dashboard');
            }
          },
          onError: (err) => {
            const msg =
              err instanceof ApiError
                ? (err.body as { message?: string })?.message ?? err.message
                : 'Could not update delivery status';
            toast.error(msg);
          },
        },
      );
    } else {
      navigate('/transport/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <Loader2 size={28} className="animate-spin text-green" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-cream gap-4 px-6">
        <p className="text-muted text-sm text-center">Job not found or already completed.</p>
        <Button onClick={() => navigate('/transport/jobs')}>Browse Jobs</Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar title="Active Delivery" showBack transparent />
      </div>

      <div className="h-[34%] w-full bg-gray-200 relative z-0">
        <TransportRouteMap
          pickupAddress={job.pickup}
          dropoffAddress={job.dropoff}
          routeLeg={routeLeg}
          className="h-full w-full"
        />
        <div className="absolute bottom-3 left-3 z-[500] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
          {routeLeg === 'driver-to-pickup' ? 'Route to pickup' : 'Pickup → drop-off'}
        </div>
      </div>

      <div className="flex-1 bg-cream rounded-t-[2rem] -mt-6 z-10 relative px-6 pt-6 pb-28 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-display font-bold text-ink">
              Job #{job.id.slice(0, 8)}
            </h2>
            {job.distance && (
              <p className="text-sm text-muted">{job.distance} km route</p>
            )}
          </div>
          <div className="bg-green text-white px-3 py-1 rounded-full text-sm font-bold">
            ₵{job.fee.toFixed(2)}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green flex items-center justify-center flex-shrink-0">
              <Package size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted mb-0.5">Pickup</p>
              <h4 className="font-bold text-sm text-ink">{job.pickup}</h4>
            </div>
          </Card>
          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-soft text-orange flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted mb-0.5">Drop-off</p>
              <h4 className="font-bold text-sm text-ink">{job.dropoff}</h4>
            </div>
          </Card>
        </div>

        {contact ? (
          <Card className="p-4 flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              <Avatar name={contact.name} src={contact.avatarUrl} className="w-full h-full" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-ink text-sm">{contact.name}</h4>
              <p className="text-xs text-muted">{contactRoleLabel(contact, contactLeg)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={openDeliveryChat.isPending}
                className="w-10 h-10 rounded-full bg-green-50 text-green flex items-center justify-center disabled:opacity-40"
                aria-label="Message client"
              >
                <MessageCircle size={18} />
              </button>
              <button
                type="button"
                onClick={() => contact.phone && openPhoneCall(contact.phone)}
                disabled={!contact.phone}
                className="w-10 h-10 rounded-full bg-green text-white flex items-center justify-center shadow-sm disabled:opacity-40"
                aria-label="Call client"
              >
                <Phone size={18} />
              </button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h4 className="font-bold text-ink text-sm">Delivery contact</h4>
              <p className="text-xs text-muted">Message buyer or farmer about this job</p>
            </div>
            <button
              type="button"
              onClick={handleOpenChat}
              disabled={openDeliveryChat.isPending}
              className="px-4 h-10 rounded-full bg-green text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <MessageCircle size={18} />
              Chat
            </button>
          </Card>
        )}

        <div className="mb-6">
          <Button
            fullWidth
            variant="outline"
            onClick={() => navigate(`/transport/navigation/${job.id}`)}
            className="flex items-center justify-center gap-2"
          >
            <MapPin size={18} />
            Open Live Navigation
          </Button>
        </div>

        <TypewriterText text="Delivery Progress" className="font-bold text-ink mb-4" />
        <div className="space-y-6 relative pl-4">
          <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-gray-200"></div>
          {STAGE_LABELS.map((label, i) => {
            const done = i < stage;
            const current = i === stage;
            return (
              <div key={label} className="relative flex gap-4">
                <div
                  className={`w-6 h-6 rounded-full z-10 flex items-center justify-center shadow-sm ${done ? 'bg-green text-white' : current ? 'border-4 border-green bg-white' : 'bg-gray-200'}`}
                >
                  {done && <CheckCircle2 size={14} />}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${done || current ? 'text-ink' : 'text-gray-400'}`}>
                    {label}
                  </h4>
                  <p className={`text-xs ${current ? 'text-green font-medium' : 'text-muted'}`}>
                    {done ? 'Completed' : current ? 'In progress' : 'Pending'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6 bg-cream/90 backdrop-blur-md z-30">
        <Button size="lg" fullWidth onClick={advance} disabled={updateStatus.isPending}>
          {updateStatus.isPending ? 'Updating…' : advanceLabel(job.status)}
        </Button>
      </div>
    </div>
  );
}
