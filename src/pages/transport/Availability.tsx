import { useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSetAvailability, useTransportProfile } from '../../lib/hooks/useTransport';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ZONES = ['Accra Central', 'East Legon', 'Madina', 'Osu', 'Tema', 'Kasoa'];

export function Availability() {
  const { data: profile } = useTransportProfile();
  const setAvailability = useSetAvailability();

  const isOnline = profile?.isAvailable ?? false;
  const [schedule, setSchedule] = useState<Record<string, boolean>>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: day !== 'Sun' }), {}),
  );
  const [selectedZones, setSelectedZones] = useState<string[]>(['Accra Central', 'East Legon']);
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: string) =>
    setSchedule((prev) => ({ ...prev, [day]: !prev[day] }));

  const toggleZone = (zone: string) =>
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone],
    );

  const handleToggleAvailability = () => {
    const next = !isOnline;
    setAvailability.mutate(next, {
      onError: () => toast.error('Could not update availability. Please try again.'),
    });
  };

  const handleSave = () => {
    setAvailability.mutate(isOnline, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: () => toast.error('Could not save availability. Please try again.'),
    });
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Availability" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        {/* Current Status */}
        <Card className="p-4 mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-ink">Current Status</h3>
            <p className="text-xs text-muted">
              {isOnline ? 'You are receiving job requests' : 'You are currently hidden'}
            </p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={setAvailability.isPending}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${isOnline ? 'bg-green' : 'bg-gray-300'}`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </Card>

        {/* Weekly Schedule */}
        <h3 className="font-bold text-ink mb-3">Weekly Schedule</h3>
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center justify-between">
                <span className="font-medium text-ink w-10">{day}</span>
                <div className="flex-1 px-4">
                  {schedule[day] ? (
                    <span className="text-sm text-ink">08:00 AM - 06:00 PM</span>
                  ) : (
                    <span className="text-sm text-muted">Unavailable</span>
                  )}
                </div>
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${schedule[day] ? 'bg-green' : 'bg-gray-300'}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${schedule[day] ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Preferred Zones */}
        <h3 className="font-bold text-ink mb-3">Preferred Zones</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {ZONES.map((zone) => {
            const isSelected = selectedZones.includes(zone);
            return (
              <button
                key={zone}
                onClick={() => toggleZone(zone)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-green text-white shadow-sm' : 'bg-white text-ink border border-gray-200'}`}
              >
                {zone}
              </button>
            );
          })}
        </div>

        <Button fullWidth onClick={handleSave} disabled={setAvailability.isPending}>
          {saved ? 'Saved!' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
