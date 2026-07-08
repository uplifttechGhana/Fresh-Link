import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Package, Truck } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { LocationMapPicker, forwardGeocode, reverseGeocode } from '../../components/LocationMapPicker';
import { LeafDecoration } from '../../components/ui/LeafDecoration';
import { useCreateTransportRequest } from '../../lib/hooks/useTransport';
import { useAuthStore } from '../../lib/authStore';

export function RequestTransport() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const createRequest = useCreateTransportRequest();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [activePin, setActivePin] = useState<'pickup' | 'dropoff'>('pickup');
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);
  const [locatingPickup, setLocatingPickup] = useState(false);
  const [locatingDropoff, setLocatingDropoff] = useState(false);
  const [cargoDescription, setCargoDescription] = useState('Mixed Vegetables');
  const [cargoWeight, setCargoWeight] = useState('50');
  const [showSuccess, setShowSuccess] = useState(false);

  const canSubmit = pickup.trim() !== '' && dropoff.trim() !== '';

  const searchPickup = async () => {
    if (!pickup.trim() || searchingPickup) return;
    setSearchingPickup(true);
    const coords = await forwardGeocode(pickup.trim());
    setSearchingPickup(false);
    if (coords) {
      setPickupCoords(coords);
      setActivePin('dropoff');
    }
  };

  const searchDropoff = async () => {
    if (!dropoff.trim() || searchingDropoff) return;
    setSearchingDropoff(true);
    const coords = await forwardGeocode(dropoff.trim());
    setSearchingDropoff(false);
    if (coords) {
      setDropoffCoords(coords);
    }
  };

  const handlePickupMove = (lat: number, lng: number) => {
    setPickupCoords([lat, lng]);
    setLocatingPickup(true);
    reverseGeocode(lat, lng).then((address) => {
      setPickup(address);
      setLocatingPickup(false);
    });
  };

  const handleDropoffMove = (lat: number, lng: number) => {
    setDropoffCoords([lat, lng]);
    setLocatingDropoff(true);
    reverseGeocode(lat, lng).then((address) => {
      setDropoff(address);
      setLocatingDropoff(false);
    });
  };

  const handleRequest = () => {
    if (!canSubmit) return;
    createRequest.mutate(
      {
        pickup: pickup.trim(),
        dropoff: dropoff.trim(),
        notes: cargoDescription.trim() || undefined,
        weight: cargoWeight ? parseFloat(cargoWeight) : undefined,
        distance: roadDistanceKm ?? undefined,
      },
      {
        onSuccess: () => setShowSuccess(true),
      },
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Request Transport" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 space-y-6">
        {/* Location Form */}
        <Card className="p-4 bg-green relative" leaves={false}>
          <LeafDecoration variant="monstera" className="-right-6 -top-6 w-32 rotate-12" />
          <LeafDecoration variant="fern" className="-left-5 -top-8 w-20 -rotate-12" />
          <div className="relative z-10 space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green" />
            <input
              type="text"
              value={pickup}
              onFocus={() => setActivePin('pickup')}
              onChange={(e) => setPickup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchPickup();
              }}
              placeholder="Pickup Location"
              className="w-full bg-gray-50 rounded-xl pl-10 pr-10 py-3 text-sm font-medium text-ink outline-none border border-transparent focus:border-green-500 focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={searchPickup}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-green transition-colors"
            >
              {searchingPickup ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-orange" />
            <input
              type="text"
              value={dropoff}
              onFocus={() => setActivePin('dropoff')}
              onChange={(e) => setDropoff(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchDropoff();
              }}
              placeholder="Drop-off Location"
              className="w-full bg-gray-50 rounded-xl pl-10 pr-10 py-3 text-sm font-medium text-ink outline-none border border-transparent focus:border-green-500 focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={searchDropoff}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-green transition-colors"
            >
              {searchingDropoff ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>

          <LocationMapPicker
            pickup={pickupCoords}
            dropoff={dropoffCoords}
            pickupLabel={locatingPickup ? 'Locating address…' : pickup || 'Pickup point'}
            dropoffLabel={locatingDropoff ? 'Locating address…' : dropoff || 'Drop-off point'}
            active={activePin}
            onActiveChange={setActivePin}
            onPickupMove={handlePickupMove}
            onDropoffMove={handleDropoffMove}
            onDistanceChange={(km) => setRoadDistanceKm(km !== null ? Math.round(km * 10) / 10 : null)}
          />
          </div>
        </Card>

        {/* Cargo Details */}
        <div>
          <h3 className="font-bold text-ink mb-3">Cargo Details</h3>
          <Card className="p-4 bg-green relative" leaves={false}>
            <LeafDecoration variant="fern" className="-right-5 -bottom-6 w-28 -rotate-6" />
            <LeafDecoration variant="single" className="-left-3 -top-3 w-14 rotate-12" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={cargoDescription}
                    onChange={(e) => setCargoDescription(e.target.value)}
                    placeholder="Describe your cargo"
                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-ink outline-none focus:bg-white border border-transparent focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/80 font-medium w-16">Weight (kg)</span>
                <input
                  type="number"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-ink outline-none focus:bg-white border border-transparent focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </Card>
        </div>

        {createRequest.isError && (
          <p className="text-center text-red-500 text-sm">
            {(createRequest.error as any)?.body?.message ?? 'Failed to submit. Try again.'}
          </p>
        )}

        <Button
          size="lg"
          fullWidth
          onClick={handleRequest}
          disabled={!canSubmit || createRequest.isPending}
        >
          {createRequest.isPending ? 'Submitting…' : 'Request Transport'}
        </Button>

        <p className="text-xs text-center text-muted">
          Available transport providers will be notified and will contact you shortly.
        </p>
      </div>

      <Sheet open={showSuccess} onClose={() => setShowSuccess(false)}>
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <Truck size={40} className="text-green" />
          </div>
          <h2 className="text-2xl font-display font-bold text-ink mb-2">Request Sent!</h2>
          <p className="text-muted mb-8 max-w-[240px]">
            Your transport request has been submitted. Available drivers will be notified.
          </p>
          <Button
            size="lg"
            fullWidth
            onClick={() => { setShowSuccess(false); navigate('/farmer/dashboard'); }}
          >
            Back to Dashboard
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
