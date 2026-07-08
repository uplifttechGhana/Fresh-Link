import type { TransportJob } from './hooks/useTransport';

export interface JobContact {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  role: 'buyer' | 'farmer';
}

/** Pickup leg = farmer; drop-off leg = buyer (for marketplace orders). */
export function jobContactLeg(status: string): 'pickup' | 'dropoff' {
  return status === 'accepted' ? 'pickup' : 'dropoff';
}

/** Resolve the client contact for a transport job based on delivery stage. */
export function getJobContact(job: TransportJob, leg?: 'pickup' | 'dropoff'): JobContact | null {
  const activeLeg = leg ?? jobContactLeg(job.status);

  if (job.order) {
    if (activeLeg === 'pickup' && job.order.farmer?.user) {
      const user = job.order.farmer.user;
      return { id: user.id, name: user.name, phone: user.phone, avatarUrl: user.avatarUrl, role: 'farmer' };
    }
    if (job.order.buyer) {
      const buyer = job.order.buyer;
      return {
        id: buyer.id,
        name: buyer.name,
        phone: buyer.phone,
        avatarUrl: buyer.avatarUrl,
        role: 'buyer',
      };
    }
  }

  if (job.request?.farmer?.user) {
    const user = job.request.farmer.user;
    return { id: user.id, name: user.name, phone: user.phone, avatarUrl: user.avatarUrl, role: 'farmer' };
  }

  return null;
}

export function contactAvatarUrl(contact: Pick<JobContact, 'id' | 'avatarUrl'>) {
  return contact.avatarUrl ?? `https://i.pravatar.cc/150?u=${contact.id}`;
}

export function contactRoleLabel(contact: JobContact, leg?: 'pickup' | 'dropoff') {
  if (contact.role === 'farmer') return leg === 'pickup' ? 'Farmer · Pickup' : 'Farmer';
  return leg === 'dropoff' ? 'Buyer · Drop-off' : 'Buyer';
}

export function normalizePhone(phone: string) {
  return phone.replace(/\s/g, '');
}

export function openPhoneCall(phone: string) {
  window.location.href = `tel:${normalizePhone(phone)}`;
}

export function filterTransportJobs(jobs: TransportJob[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return jobs;

  return jobs.filter((job) => {
    const pickupContact = getJobContact(job, 'pickup');
    const dropoffContact = getJobContact(job, 'dropoff');
    return (
      job.pickup.toLowerCase().includes(q) ||
      job.dropoff.toLowerCase().includes(q) ||
      job.id.toLowerCase().includes(q) ||
      pickupContact?.name.toLowerCase().includes(q) ||
      dropoffContact?.name.toLowerCase().includes(q)
    );
  });
}
