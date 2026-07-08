import { useOnlineStatus } from '../../lib/hooks/useOnlineStatus';

/**
 * Displays a full-width banner at the top of the screen when the device
 * goes offline.  Drop this once inside the authenticated app shell.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#ef4444',
        color: '#fff',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    >
      ⚠️ You are offline — some features may not be available.
    </div>
  );
}
