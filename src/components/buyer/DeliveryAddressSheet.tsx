import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, Loader2, MapPin, Search, Home, Briefcase } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import {
  reverseGeocode,
  searchAddresses,
  type AddressSearchResult,
} from '../LocationMapPicker';
import { loadSavedAddresses, type SavedAddress } from '../../lib/savedAddresses';

const DEFAULT_CENTER: [number, number] = [5.6037, -0.187];

const dropoffIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:6px;background:#EA580C;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export interface DeliverySelection {
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 15), { animate: true });
  }, [center, map]);
  return null;
}

function MapClick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

interface DeliveryAddressSheetProps {
  open: boolean;
  onClose: () => void;
  value: DeliverySelection | null;
  onConfirm: (selection: DeliverySelection) => void;
  defaultSaveLabel?: string;
}

export function DeliveryAddressSheet({
  open,
  onClose,
  value,
  onConfirm,
  defaultSaveLabel,
}: DeliveryAddressSheetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingPin, setResolvingPin] = useState(false);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [draft, setDraft] = useState<DeliverySelection | null>(value);
  const [coords, setCoords] = useState<[number, number] | null>(
    value?.lat != null && value?.lng != null ? [value.lat, value.lng] : null,
  );
  const [saveAs, setSaveAs] = useState('');

  useEffect(() => {
    if (!open) return;
    setSaved(loadSavedAddresses());
    setDraft(value);
    setCoords(
      value?.lat != null && value?.lng != null ? [value.lat, value.lng] : null,
    );
    setQuery(value?.address ?? '');
    setSaveAs(
      defaultSaveLabel ??
        (value?.label && value.label !== 'Delivery' ? value.label : ''),
    );
  }, [open, value, defaultSaveLabel]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const items = await searchAddresses(q, 5);
      setResults(items);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query, open]);

  const applySelection = (next: DeliverySelection, nextCoords?: [number, number] | null) => {
    setDraft(next);
    setQuery(next.address);
    if (nextCoords) setCoords(nextCoords);
    else if (next.lat != null && next.lng != null) setCoords([next.lat, next.lng]);
    setResults([]);
  };

  const pickOnMap = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setResolvingPin(true);
    reverseGeocode(lat, lng).then((address) => {
      applySelection({ label: saveAs.trim() || 'Delivery', address, lat, lng }, [lat, lng]);
      setResolvingPin(false);
    });
  };

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pickOnMap(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const confirm = () => {
    if (!draft?.address.trim()) return;
    const label = saveAs.trim() || draft.label || 'Delivery';
    const selection = { ...draft, label };
    onConfirm(selection);
    onClose();
  };

  const mapCenter = coords ?? DEFAULT_CENTER;

  return (
    <Sheet open={open} onClose={onClose} title="Where should we deliver?">
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
          <Search size={18} className="text-muted flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search street, area, or landmark"
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-muted"
            autoFocus
          />
          {searching && <Loader2 size={16} className="animate-spin text-green" />}
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-full bg-green text-white flex items-center justify-center">
            {locating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Use current location</p>
            <p className="text-xs text-muted">Detect your current GPS location</p>
          </div>
        </button>

        {saved.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Saved places</p>
            <div className="space-y-2">
              {saved.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() =>
                    applySelection(
                      {
                        label: place.label,
                        address: place.address,
                        lat: place.lat,
                        lng: place.lng,
                      },
                      place.lat != null && place.lng != null ? [place.lat, place.lng] : null,
                    )
                  }
                  className="w-full flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-100 text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-green flex-shrink-0">
                    {place.label.toLowerCase().includes('work') ? (
                      <Briefcase size={16} />
                    ) : (
                      <Home size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ink">{place.label}</p>
                    <p className="text-xs text-muted line-clamp-2">{place.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Search results</p>
            <div className="space-y-2">
              {results.map((item) => (
                <button
                  key={`${item.lat}-${item.lng}-${item.label}`}
                  type="button"
                  onClick={() =>
                    applySelection(
                      { label: 'Delivery', address: item.label, lat: item.lat, lng: item.lng },
                      [item.lat, item.lng],
                    )
                  }
                  className="w-full flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-100 text-left"
                >
                  <MapPin size={16} className="text-orange mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ink leading-snug">{item.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Pin on map</p>
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 220 }}>
            <MapContainer
              center={mapCenter}
              zoom={14}
              zoomControl={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />
              <MapRecenter center={mapCenter} />
              <MapClick onPick={pickOnMap} />
              {coords && (
                <Marker
                  position={coords}
                  icon={dropoffIcon}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      pickOnMap(lat, lng);
                    },
                  }}
                />
              )}
            </MapContainer>
            <div className="absolute top-2 inset-x-2 z-10 bg-white/95 rounded-xl px-3 py-1.5 text-xs text-center text-muted font-medium shadow-sm">
              Tap or drag the pin to set your delivery point
            </div>
          </div>
        </div>

        {draft?.address && (
          <div className="rounded-2xl border-2 border-green bg-green-50/40 p-4">
            <p className="text-xs text-muted mb-1">Selected address</p>
            <p className="text-sm font-bold text-ink leading-relaxed">{draft.address}</p>
            {resolvingPin && (
              <p className="text-xs text-green mt-2 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Updating address…
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Save as (optional)
          </label>
          <div className="flex gap-2 mb-2">
            {['Home', 'Work', 'Other'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setSaveAs(label)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  saveAs === label
                    ? 'bg-green text-white border-green'
                    : 'bg-white text-ink border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" onClick={confirm} disabled={!draft?.address.trim()}>
          Confirm delivery address
        </Button>
      </div>
    </Sheet>
  );
}
