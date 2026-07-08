import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, MessageCircle, User } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import {
  useConversation,
  useConversationContact,
  useConversations,
  useMessages,
  buildFallbackContact,
} from '../../lib/hooks/useChat';
import { useAuthStore } from '../../lib/authStore';

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  farmer: 'Farmer',
  transport: 'Transporter',
  investor: 'Investor',
};

function chatRoute(role: string | undefined, conversationId: string) {
  if (role === 'farmer') return `/farmer/chat/${conversationId}`;
  if (role === 'transport') return `/transport/chat/${conversationId}`;
  return `/buyer/chat/${conversationId}`;
}

export function ChatContactProfile() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  useConversations();
  const conversation = useConversation(conversationId);
  const { data: messages = [] } = useMessages(conversationId);
  const { data: contact, isLoading } = useConversationContact(conversationId);

  const fallbackContact = useMemo(
    () => buildFallbackContact(conversation, user?.id, messages),
    [conversation, user?.id, messages],
  );
  const displayContact = contact ?? fallbackContact;

  if (isLoading && !displayContact) {
    return (
      <div className="w-full h-full bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!displayContact) {
    return (
      <div className="w-full h-full bg-cream flex flex-col items-center justify-center px-6">
        <p className="text-muted font-medium">Contact not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-green font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const avatar = displayContact.avatarUrl ?? `https://i.pravatar.cc/150?u=${displayContact.id}`;
  const roleLabel = ROLE_LABELS[displayContact.role] ?? 'User';

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Contact Info" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10">
        <div className="flex flex-col items-center pt-8 pb-10">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-md border-4 border-white mb-4">
            <img src={avatar} alt={displayContact.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-display font-extrabold text-ink text-center">{displayContact.name}</h1>
          <span className="mt-2 text-xs font-bold text-green bg-green-100 px-3 py-1 rounded-full">
            {roleLabel}
          </span>
        </div>

        <div className="space-y-3">
          {displayContact.phone && (
            <Card className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center text-green flex-shrink-0">
                <Phone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wide">Phone</p>
                <p className="text-sm font-bold text-ink truncate">{displayContact.phone}</p>
              </div>
              <button
                onClick={() => { window.location.href = `tel:${displayContact.phone}`; }}
                className="text-sm font-bold text-green px-3 py-1.5 rounded-full bg-green-50"
              >
                Call
              </button>
            </Card>
          )}

          <Card className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-muted flex-shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wide">About</p>
              <p className="text-sm text-ink">
                {displayContact.role === 'buyer'
                  ? 'FreshLink buyer'
                  : displayContact.role === 'transport'
                    ? 'Delivery partner on FreshLink'
                    : displayContact.role === 'farmer'
                      ? 'FreshLink farmer'
                      : 'FreshLink member'}
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-8 space-y-3">
          {conversationId && (
            <button
              onClick={() => navigate(chatRoute(user?.role, conversationId))}
              className="w-full h-12 rounded-2xl bg-green text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle size={18} />
              Message
            </button>
          )}

          {displayContact.isFarmer && displayContact.farmerUserId && (
            <button
              onClick={() => navigate(`/buyer/farmer/${displayContact.farmerUserId}`)}
              className="w-full h-12 rounded-2xl bg-white text-green font-bold text-sm flex items-center justify-center gap-2 shadow-sm border border-green-100"
            >
              View Farm Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
