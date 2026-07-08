import { useState } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { Card } from '../../components/ui/Card';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { Send, Loader2 } from 'lucide-react';
import { useNotifications, useMarkNotifRead } from '../../lib/hooks/useNotifications';

export function Support() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotifRead();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  // Use system notifications as a proxy for "support items" until a ticket system is added
  const notifications = data?.items ?? [];
  const unread = notifications.filter((n) => !n.readAt);
  const read = notifications.filter((n) => !!n.readAt);

  const selected = notifications.find((n) => n.id === selectedId);

  const handleResolve = () => {
    if (selectedId) {
      markRead.mutate(selectedId, { onSuccess: () => setSelectedId(null) });
    }
  };

  return (
    <>
    <AdminShell title="Support Queue">
        <div className="flex gap-4 mb-6">
          <Card className="flex-1 p-4 bg-orange-soft text-orange">
            <h4 className="text-xs font-bold mb-1">Unread</h4>
            <p className="text-2xl font-extrabold">{unread.length}</p>
          </Card>
          <Card className="flex-1 p-4 bg-green text-white">
            <h4 className="text-xs font-bold mb-1 text-green-100">Read</h4>
            <p className="text-2xl font-extrabold">{read.length}</p>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.readAt ? 'border-l-4 border-green' : ''}`}
                onClick={() => setSelectedId(n.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className={`text-sm ${!n.readAt ? 'font-bold text-ink' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-muted capitalize">{n.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!n.readAt ? 'bg-orange-soft text-orange' : 'bg-green-50 text-green'}`}
                    >
                      {!n.readAt ? 'Unread' : 'Read'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
    </AdminShell>

      <Sheet
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={selected?.title ?? 'Notification'}
      >
        {selected && (
          <div className="flex flex-col h-[60vh]">
            <div className="mb-4">
              <h4 className="font-bold text-ink">{selected.title}</h4>
              <p className="text-xs text-muted capitalize">
                {selected.type.replace(/_/g, ' ')} •{' '}
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm text-ink leading-relaxed">{selected.body}</p>
              </div>
            </div>

            {!selected.readAt && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1.5 pr-2 border border-gray-100">
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none px-3 text-sm text-ink font-medium"
                    placeholder="Type a reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${reply.trim() ? 'bg-green text-white shadow-sm' : 'bg-gray-200 text-gray-400'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <Button fullWidth variant="outline" onClick={handleResolve} disabled={markRead.isPending}>
                  {markRead.isPending ? 'Marking…' : 'Mark as Read'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
