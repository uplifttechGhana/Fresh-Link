import React, { useEffect, useState } from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { AvatarUploadSheet } from '../../components/ui/AvatarUploadSheet';
import { Avatar } from '../../components/ui/Avatar';
import { ShieldCheck, Edit2, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';

interface TransportProfileData {
  vehicleType: string | null;
  vehiclePlate: string | null;
  vehicleCapacity: string | null;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
}

interface MeData {
  name: string;
  avatarUrl?: string | null;
  transportProfile: TransportProfileData | null;
}

function useMe() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['users', 'me', userId],
    queryFn: () => api.get<MeData>('/users/me'),
    enabled: !!userId,
  });
}

function useUpdateTransportProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<Pick<TransportProfileData, 'vehicleType' | 'vehiclePlate' | 'vehicleCapacity'>>) =>
      api.patch('/users/me/transport-profile', dto),
    onSuccess: () => {
      const userId = useAuthStore.getState().user?.id;
      qc.invalidateQueries({ queryKey: ['users', 'me', userId] });
    },
  });
}

export function VehicleProfile() {
  const { data: me, isLoading } = useMe();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateTransportProfile();

  const profile = me?.transportProfile;
  const displayName = user?.name ?? me?.name ?? 'Driver';
  const avatarUrl = user?.avatarUrl ?? me?.avatarUrl ?? null;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState('Van');
  const [makeModel, setMakeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [capacity, setCapacity] = useState('');

  // Sync form with loaded data
  useEffect(() => {
    if (profile) {
      setVehicleType(profile.vehicleType ?? 'Van');
      setPlateNumber(profile.vehiclePlate ?? '');
      setCapacity(profile.vehicleCapacity ?? '');
    }
  }, [profile]);

  const handleSave = () => {
    update.mutate(
      { vehicleType, vehiclePlate: plateNumber, vehicleCapacity: capacity },
      { onSuccess: () => setIsEditOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <Loader2 size={28} className="animate-spin text-green" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Vehicle Profile" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={() => setAvatarUploadOpen(true)}
            aria-label="Change profile photo"
            className="relative active:scale-95 transition-transform"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3 border-4 border-white shadow-sm">
              <Avatar name={displayName} src={avatarUrl} className="w-full h-full" textClassName="text-2xl" />
            </div>
          </button>
          <h2 className="text-xl font-display font-bold text-ink">{displayName}</h2>
          <div className="flex items-center gap-1 text-green text-sm font-medium mt-1 bg-green-50 px-3 py-1 rounded-full">
            <ShieldCheck size={16} />
            Verified Driver
          </div>
          {profile && (
            <p className="text-xs text-muted mt-1">
              ⭐ {profile.rating.toFixed(1)} · {profile.totalReviews} reviews
            </p>
          )}
        </div>

        <Card className="p-5 relative">
          <button
            onClick={() => setIsEditOpen(true)}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-muted hover:text-ink transition-colors"
          >
            <Edit2 size={16} />
          </button>

          <h3 className="font-bold text-ink mb-4 text-lg">Vehicle Details</h3>

          <div className="space-y-4">
            <DetailRow label="Vehicle Type" value={vehicleType || '—'} />
            <DetailRow label="Make & Model" value={makeModel || '—'} />
            <DetailRow label="License Plate" value={plateNumber || '—'} />
            <DetailRow label="Cargo Capacity" value={capacity || '—'} />
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">Insurance Status</p>
                <span className="text-xs font-bold text-green bg-green-50 px-2 py-1 rounded-lg">
                  Active
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Sheet open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Vehicle Details">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-ink font-medium"
            >
              <option value="Motorbike">Motorbike</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Make & Model</label>
            <input
              type="text"
              value={makeModel}
              onChange={(e) => setMakeModel(e.target.value)}
              placeholder="e.g. Toyota Hiace 2018"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-ink font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-2">License Plate</label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="e.g. GR-1234-20"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-ink font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Capacity</label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 1.5 Tons"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-ink font-medium"
            />
          </div>
          <div className="pt-4">
            <Button fullWidth onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Sheet>

      <AvatarUploadSheet open={avatarUploadOpen} onClose={() => setAvatarUploadOpen(false)} />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}
