import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../../lib/hooks/useChat';
import { useAuthStore, UserRole } from '../../lib/authStore';

export function messagesPath(role: UserRole | undefined) {
  if (role === 'farmer') return '/farmer/messages';
  if (role === 'transport') return '/transport/messages';
  if (role === 'buyer') return '/buyer/messages';
  return null;
}

export function useUnreadMessageCount() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: conversations = [] } = useConversations(!!accessToken);
  return conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}

/** Compact icon button — for headers and toolbars. */
export function MessagesIconButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadMessageCount();

  if (!user || user.role === 'investor' || user.role === 'admin') return null;

  return (
    <button
      type="button"
      onClick={() => navigate(messagesPath(user.role))}
      aria-label="Messages"
      className={`w-10 h-10 rounded-full bg-green shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform relative ${className}`}
    >
      <MessageCircle size={20} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-cream">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

/** Full-width dashboard row — always visible entry to the inbox. */
export function MessagesEntryCard({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: conversations = [], isLoading } = useConversations();
  const unread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  if (!user || user.role === 'investor' || user.role === 'admin') return null;

  const preview =
    conversations.length > 0
      ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`
      : 'No conversations yet — tap to open inbox';

  return (
    <button
      type="button"
      onClick={() => navigate(messagesPath(user.role))}
      className={`w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform text-left ${className}`}
    >
      <div className="w-10 h-10 bg-green-50 text-green rounded-full flex items-center justify-center relative flex-shrink-0">
        <MessageCircle size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-ink">Messages</h4>
        <p className="text-xs text-muted truncate">
          {isLoading ? 'Loading…' : preview}
        </p>
      </div>
      <span className="text-xs font-bold text-green flex-shrink-0">Open</span>
    </button>
  );
}
