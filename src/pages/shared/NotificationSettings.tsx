import { useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getPushPermissionStatus,
  registerPushNotifications,
} from '../../lib/push/registerPush';
import { isNative } from '../../lib/native';

export function NotificationSettings() {
  const [orders, setOrders] = useState(true);
  const [promos, setPromos] = useState(false);
  const [messages, setMessages] = useState(true);
  const [system, setSystem] = useState(true);
  const [pushStatus, setPushStatus] = useState(getPushPermissionStatus);
  const [enabling, setEnabling] = useState(false);

  const handleEnablePush = async () => {
    setEnabling(true);
    try {
      const result = await registerPushNotifications();
      setPushStatus(getPushPermissionStatus());
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setEnabling(false);
    }
  };

  const pushEnabled = pushStatus === 'granted';
  const pushBlocked = pushStatus === 'denied';

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Notifications" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-4">
        <Card className="p-4">
          <h4 className="font-medium text-sm text-ink">Push Notifications</h4>
          <p className="text-xs text-muted mt-1 mb-4">
            {pushEnabled
              ? 'Push notifications are enabled on this device.'
              : pushBlocked
                ? isNative
                  ? 'Notifications are blocked. Open Android Settings → Apps → FreshLink → Notifications and turn them on.'
                  : 'Notifications are blocked in your browser. Reset permission for this site in browser settings.'
                : 'Tap the button below to allow order alerts and updates on this device.'}
          </p>
          {!pushEnabled && (
            <Button
              onClick={handleEnablePush}
              disabled={enabling || pushBlocked}
              className="w-full"
            >
              {enabling ? 'Enabling…' : 'Enable Push Notifications'}
            </Button>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h4 className="font-medium text-sm text-ink">Order Updates</h4>
              <p className="text-xs text-muted mt-0.5">Status changes and tracking</p>
            </div>
            <Toggle checked={orders} onChange={() => setOrders(!orders)} />
          </div>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h4 className="font-medium text-sm text-ink">Messages</h4>
              <p className="text-xs text-muted mt-0.5">Chats from farmers or drivers</p>
            </div>
            <Toggle checked={messages} onChange={() => setMessages(!messages)} />
          </div>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h4 className="font-medium text-sm text-ink">Promotions</h4>
              <p className="text-xs text-muted mt-0.5">Discounts and special offers</p>
            </div>
            <Toggle checked={promos} onChange={() => setPromos(!promos)} />
          </div>
          <div className="p-4 flex justify-between items-center">
            <div>
              <h4 className="font-medium text-sm text-ink">System Alerts</h4>
              <p className="text-xs text-muted mt-0.5">App updates and security</p>
            </div>
            <Toggle checked={system} onChange={() => setSystem(!system)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-green' : 'bg-gray-200'}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-0.5'}`}
      />
    </button>
  );
}
