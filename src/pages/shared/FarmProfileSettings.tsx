import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Locate, Loader2, CheckCircle2 } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../lib/authStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function FarmProfileSettings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  const fp = user?.farmerProfile as any;

  const [farmName, setFarmName] = useState(fp?.farmName ?? '');
  const [location, setLocation] = useState(fp?.location ?? '');
  const [bio, setBio] = useState(fp?.bio ?? fp?.description ?? '');
  const [lat, setLat] = useState<number | null>(fp?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(fp?.longitude ?? null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (fp) {
      setFarmName(fp.farmName ?? '');
      setLocation(fp.location ?? '');
      setBio(fp.bio ?? fp.description ?? '');
      setLat(fp.latitude ?? null);
      setLng(fp.longitude ?? null);
    }
  }, [user]);

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        const address = await reverseGeocode(latitude, longitude);
        setLocation(address);
        setLocating(false);
        toast.success('Location detected');
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === 1
            ? 'Location permission denied. Enable it in your browser settings.'
            : 'Could not detect location. Try again.',
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleSave = async () => {
    if (!user || !accessToken) return;
    setSaving(true);
    try {
      const updatedProfile = await api.patch<any>('/users/me/farmer-profile', {
        farmName: farmName || undefined,
        location: location || undefined,
        description: bio || undefined,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
      });
      setAuth(
        { ...user, farmerProfile: { ...(user.farmerProfile as any), ...updatedProfile } },
        accessToken,
      );
      toast.success('Farm profile saved');
      navigate(-1);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Farm Profile" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-5">
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">
            Farm Name
          </label>
          <input
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            placeholder="e.g. Green Valley Farm"
            className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">
            Bio / Description
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell buyers about your farm…"
            className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block pl-1">
            Farm Location
          </label>

          {/* Detect button */}
          <button
            onClick={detectLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-green bg-green-50/40 text-green font-bold text-sm mb-3 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {locating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : lat ? (
              <CheckCircle2 size={18} />
            ) : (
              <Locate size={18} />
            )}
            {locating
              ? 'Detecting…'
              : lat
              ? 'Location detected — tap to update'
              : 'Use my current location'}
          </button>

          {/* Coordinates badge */}
          {lat !== null && lng !== null && (
            <div className="flex items-center gap-2 text-xs text-muted bg-white border border-gray-100 rounded-lg px-3 py-2 mb-3">
              <MapPin size={12} className="text-green flex-shrink-0" />
              <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </div>
          )}

          {/* Editable address label */}
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Or type your location manually"
            className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
          />
          <p className="text-[11px] text-muted mt-1.5 pl-1">
            This is shown to buyers browsing the map.
          </p>
        </div>
      </div>

      <div className="p-6 bg-cream/90 backdrop-blur-md">
        <Button size="lg" fullWidth onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Farm Profile'}
        </Button>
      </div>
    </div>
  );
}
