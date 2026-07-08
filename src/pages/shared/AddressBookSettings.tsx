import { useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Trash2, Home, Briefcase, Pencil } from 'lucide-react';
import {
  DeliveryAddressSheet,
  type DeliverySelection,
} from '../../components/buyer/DeliveryAddressSheet';
import {
  loadSavedAddresses,
  saveAddress,
  deleteAddress,
  type SavedAddress,
} from '../../lib/savedAddresses';

function labelIcon(label: string) {
  return label.toLowerCase().includes('work') ? (
    <Briefcase size={20} />
  ) : (
    <Home size={20} />
  );
}

export function AddressBookSettings() {
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => loadSavedAddresses());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);

  const refresh = () => setAddresses(loadSavedAddresses());

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (entry: SavedAddress) => {
    setEditing(entry);
    setSheetOpen(true);
  };

  const handleConfirm = (selection: DeliverySelection) => {
    saveAddress({
      id: editing?.id,
      label: selection.label,
      address: selection.address,
      lat: selection.lat,
      lng: selection.lng,
    });
    refresh();
    toast.success(editing ? 'Address updated' : 'Address saved');
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteAddress(id);
    refresh();
    toast.success('Address removed');
  };

  const sheetValue: DeliverySelection | null = editing
    ? {
        label: editing.label,
        address: editing.address,
        lat: editing.lat,
        lng: editing.lng,
      }
    : null;

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Address Book" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
        <p className="text-sm text-muted mb-6">
          Saved delivery addresses for checkout. Search, use GPS, or pin on the map when adding.
        </p>

        {addresses.length === 0 ? (
          <Card className="p-8 text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} />
            </div>
            <p className="font-bold text-ink mb-1">No saved addresses</p>
            <p className="text-sm text-muted mb-4">
              Add Home, Work, or any place you deliver to often.
            </p>
            <Button onClick={openAdd}>
              <Plus size={18} className="mr-1 inline" /> Add address
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {addresses.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-green-50 text-green flex items-center justify-center flex-shrink-0">
                    {labelIcon(entry.label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-ink">{entry.label}</h4>
                    <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-3">
                      {entry.address}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => openEdit(entry)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-green bg-green-50"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {addresses.length > 0 && (
          <Button fullWidth variant="outline" onClick={openAdd}>
            <Plus size={18} className="mr-1 inline" /> Add new address
          </Button>
        )}
      </div>

      <DeliveryAddressSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        value={sheetValue}
        onConfirm={handleConfirm}
        defaultSaveLabel={editing?.label}
      />
    </div>
  );
}
