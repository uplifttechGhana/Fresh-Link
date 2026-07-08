import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { useConversations, useSocketInbox, messagePreview, type Conversation } from '../../lib/hooks/useChat';
import { useAuthStore } from '../../lib/authStore';
import { BottomNav } from '../../components/ui/BottomNav';

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0)
    return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-GH', { weekday: 'short' });
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
}

export function ChatInbox() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: conversations = [], isLoading } = useConversations();

  // Keep inbox updated in real-time via socket
  useSocketInbox();

  const chatRoute = (convId: string) => {
    if (user?.role === 'farmer') return `/farmer/chat/${convId}`;
    if (user?.role === 'transport') return `/transport/chat/${convId}`;
    return `/buyer/chat/${convId}`;
  };

  const showRoleNav =
    !user || user.role === 'buyer' || user.role === 'farmer' || user.role === 'transport';

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Chats" showBack={user?.role === 'farmer' || user?.role === 'transport'} />

      <div
        className={`flex-1 overflow-y-auto no-scrollbar px-6 pt-4 ${showRoleNav ? 'pb-24' : 'pb-6'}`}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <MessageCircle size={48} className="text-gray-200" />
            <p className="font-bold text-ink">No messages yet</p>
            <p className="text-sm text-muted">
              {user?.role === 'transport'
                ? 'Open a delivery and tap the chat icon to message your client.'
                : user?.role === 'farmer'
                  ? 'When buyers message you about orders, conversations appear here.'
                  : 'Message farmers from their profile, or chat about an order from Order History.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, idx) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                userId={user?.id ?? ''}
                idx={idx}
                onPress={() => navigate(chatRoute(conv.id))}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function ConversationRow({
  conv,
  userId,
  idx,
  onPress,
}: {
  conv: Conversation;
  userId: string;
  idx: number;
  onPress: () => void;
}) {
  const other = userId === conv.buyerId ? conv.farmer : conv.buyer;
  const lastMsg = conv.messages[0];
  const hasUnread = conv.unreadCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
    >
      <Card className="p-4 flex items-center gap-3" onClick={onPress}>
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <img
              src={other.avatarUrl ?? `https://i.pravatar.cc/150?u=${other.id}`}
              alt={other.name}
              className="w-full h-full object-cover"
            />
          </div>
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`text-sm truncate ${hasUnread ? 'font-extrabold text-ink' : 'font-bold text-ink'}`}>
              {other.name}
            </p>
            {lastMsg && (
              <span className="text-[10px] text-muted flex-shrink-0">
                {formatTime(lastMsg.createdAt)}
              </span>
            )}
          </div>
          <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'font-semibold text-ink' : 'text-muted'}`}>
            {lastMsg
              ? lastMsg.senderId === userId
                ? `You: ${messagePreview(lastMsg)}`
                : messagePreview(lastMsg)
              : 'No messages yet'}
          </p>
        </div>

        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
      </Card>
    </motion.div>
  );
}
