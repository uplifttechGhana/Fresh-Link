import { useState } from 'react';
import { Search, MoreVertical, BadgeCheck, Clock, Loader2, RefreshCw } from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import { Card } from '../../components/ui/Card';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
  type AdminUser,
} from '../../lib/hooks/useAdmin';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const TABS = ['All', 'farmer', 'buyer', 'transport', 'investor', 'admin'] as const;
type Tab = (typeof TABS)[number];

const ROLE_BADGE: Record<string, string> = {
  farmer: 'bg-green-50 text-green',
  buyer: 'bg-orange-soft text-orange',
  transport: 'bg-blue-50 text-blue-600',
  investor: 'bg-purple-50 text-purple-600',
  admin: 'bg-red-50 text-red-600',
};

export function UserManagement() {
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<{
    user: AdminUser;
    top: number;
    right: number;
  } | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  const role = tab === 'All' ? undefined : tab;
  const { data, isLoading, refetch } = useAdminUsers(page, role, query || undefined);
  const suspend = useSuspendUser();
  const activate = useActivateUser();

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <>
    <AdminShell title="User Management">
        {/* Search */}
        <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-gray-100 mb-4 focus-within:ring-2 focus-within:ring-green-500">
          <Search size={20} className="text-muted" />
          <input
            type="text"
            className="flex-1 bg-transparent px-3 outline-none text-ink font-medium"
            placeholder="Search by name or phone…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted text-xs">✕</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors capitalize ${tab === t ? 'bg-green text-white' : 'bg-white text-muted border border-gray-200'}`}
            >
              {t === 'All' ? 'All' : t}
            </button>
          ))}
        </div>

        {/* User count */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-muted">{total} user{total !== 1 ? 's' : ''}</p>
          <button onClick={() => refetch()} className="text-muted">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* User list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="font-medium">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <Card key={u.id} className="p-4 flex items-center gap-3">
                <UserAvatar user={u} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-ink truncate">{u.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-muted'}`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{u.phone}</p>
                  <div className="mt-1.5">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green">
                        <BadgeCheck size={13} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500">
                        <Clock size={13} /> Suspended
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      if (actionMenu?.user.id === u.id) {
                        setActionMenu(null);
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuHeight = 108;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const openUp = spaceBelow < menuHeight + 12;
                      setActionMenu({
                        user: u,
                        top: openUp ? rect.top - menuHeight - 8 : rect.bottom + 8,
                        right: Math.max(12, window.innerWidth - rect.right),
                      });
                    }}
                    className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-muted"
                    aria-label={`Actions for ${u.name}`}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm font-bold text-green disabled:text-muted"
            >
              ← Prev
            </button>
            <span className="text-sm text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm font-bold text-green disabled:text-muted"
            >
              Next →
            </button>
          </div>
        )}
    </AdminShell>

      {actionMenu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setActionMenu(null)}
            aria-hidden
          />
          <div
            className="fixed z-[70] w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            style={{ top: actionMenu.top, right: actionMenu.right }}
            role="menu"
          >
            <button
              onClick={() => {
                setActionMenu(null);
                setDetailUser(actionMenu.user);
              }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-gray-50 border-b border-gray-50"
              role="menuitem"
            >
              View Details
            </button>
            {actionMenu.user.isActive ? (
              <button
                onClick={() => {
                  setActionMenu(null);
                  suspend.mutate(actionMenu.user.id);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-gray-50"
                role="menuitem"
              >
                Suspend User
              </button>
            ) : (
              <button
                onClick={() => {
                  setActionMenu(null);
                  activate.mutate(actionMenu.user.id);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-green hover:bg-gray-50"
                role="menuitem"
              >
                Reactivate User
              </button>
            )}
          </div>
        </>
      )}

      <Sheet
        open={detailUser !== null}
        onClose={() => setDetailUser(null)}
        title="User Details"
      >
        {detailUser && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <UserAvatar user={detailUser} size="lg" />
              <div>
                <h4 className="font-bold text-ink">{detailUser.name}</h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[detailUser.role] ?? 'bg-gray-100 text-muted'}`}
                >
                  {detailUser.role}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <DetailRow label="Phone" value={detailUser.phone} />
              {detailUser.email && <DetailRow label="Email" value={detailUser.email} />}
              <DetailRow label="Role" value={detailUser.role} />
              <DetailRow
                label="Status"
                value={detailUser.isActive ? 'Active' : 'Suspended'}
              />
              <DetailRow
                label="Joined"
                value={new Date(detailUser.createdAt).toLocaleDateString()}
              />
            </div>
            <div className="mt-6">
              {detailUser.isActive ? (
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    suspend.mutate(detailUser.id, { onSuccess: () => setDetailUser(null) });
                  }}
                  disabled={suspend.isPending}
                >
                  {suspend.isPending ? 'Suspending…' : 'Suspend User'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  onClick={() => {
                    activate.mutate(detailUser.id, { onSuccess: () => setDetailUser(null) });
                  }}
                  disabled={activate.isPending}
                >
                  {activate.isPending ? 'Reactivating…' : 'Reactivate User'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}

function UserAvatar({ user, size = 'md' }: { user: AdminUser; size?: 'md' | 'lg' }) {
  const url = resolveMediaUrl(user.avatarUrl);
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-base';
  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  if (url) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 flex-shrink-0`}>
        <img src={url} alt={user.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-green/15 text-green font-bold flex items-center justify-center flex-shrink-0`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
