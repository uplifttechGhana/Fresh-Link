import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { getSocket, connectSocket } from '../socket';
import { useAuthStore } from '../authStore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ChatSender {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  readAt: string | null;
  createdAt: string;
  sender: ChatSender;
}

export interface SendMessagePayload {
  body?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
}

export function messagePreview(msg: ApiMessage) {
  if (msg.audioUrl) return 'Voice message';
  return msg.body;
}

export interface Conversation {
  id: string;
  buyerId: string;
  farmerId: string;
  orderId?: string | null;
  buyer: ChatSender;
  farmer: ChatSender;
  messages: ApiMessage[];
  unreadCount: number;
  createdAt: string;
}

// ── Query Keys ─────────────────────────────────────────────────────────────

export const chatKeys = {
  conversations: () => ['chat', 'conversations'] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  contact: (id: string) => ['chat', 'contact', id] as const,
};

export interface ConversationContact {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string;
  role: string;
  isFarmer: boolean;
  farmerUserId: string;
}

/** Resolve the other participant in a 1:1-style conversation thread. */
export function getConversationOther(conv: Conversation, userId: string): ChatSender {
  if (userId === conv.buyerId) return conv.farmer;
  if (userId === conv.farmerId) return conv.buyer;
  return conv.buyer;
}

/** Build contact info from cached conversation or messages when the API is unavailable. */
export function buildFallbackContact(
  conversation: Conversation | undefined,
  userId: string | undefined,
  messages: ApiMessage[] = [],
): ConversationContact | null {
  if (conversation && userId) {
    const other = getConversationOther(conversation, userId);
    const isFarmer = other.id === conversation.farmerId;
    return {
      id: other.id,
      name: other.name,
      avatarUrl: other.avatarUrl,
      phone: '',
      role: isFarmer ? 'farmer' : 'buyer',
      isFarmer,
      farmerUserId: conversation.farmerId,
    };
  }

  const other = messages.find((m) => m.senderId !== userId)?.sender;
  if (other && userId) {
    return {
      id: other.id,
      name: other.name,
      avatarUrl: other.avatarUrl,
      phone: '',
      role: 'buyer',
      isFarmer: false,
      farmerUserId: '',
    };
  }

  return null;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => api.get<Conversation[]>('/chat/conversations'),
    enabled,
  });
}

export function useConversation(conversationId: string | undefined) {
  const { data: conversations = [] } = useConversations();
  return conversations.find((c) => c.id === conversationId);
}

export function useConversationContact(conversationId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.contact(conversationId ?? ''),
    queryFn: () => api.get<ConversationContact>(`/chat/conversations/${conversationId}/contact`),
    enabled: !!conversationId,
    retry: 1,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    queryFn: async () => {
      const msgs = await api.get<ApiMessage[]>(`/chat/conversations/${conversationId}/messages`);
      return [...msgs].reverse();
    },
    enabled: !!conversationId,
  });
}

/** Append or replace a message in the oldest-first cache. */
export function upsertCachedMessage(
  qc: ReturnType<typeof useQueryClient>,
  conversationId: string,
  msg: ApiMessage,
) {
  qc.setQueryData<ApiMessage[]>(chatKeys.messages(conversationId), (old = []) => {
    const idx = old.findIndex((m) => m.id === msg.id);
    if (idx >= 0) {
      const next = [...old];
      next[idx] = { ...next[idx], ...msg };
      return next;
    }
    return [...old, msg];
  });
}

/** Swap a temp optimistic message for the confirmed server message in-place. */
export function replaceOptimisticMessage(
  qc: ReturnType<typeof useQueryClient>,
  conversationId: string,
  optimisticId: string,
  confirmed: ApiMessage,
) {
  qc.setQueryData<ApiMessage[]>(chatKeys.messages(conversationId), (old = []) => {
    const mapped = old.map((m) => (m.id === optimisticId ? confirmed : m));
    return mapped.filter(
      (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i,
    );
  });
}

export function useDeliveryConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      api.post<Conversation>('/chat/conversations/delivery', { jobId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { farmerId: string; orderId?: string }) =>
      api.post<Conversation>('/chat/conversations', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
}

/**
 * Sends a message over WebSocket with REST fallback.
 */
export function useSendMessage(conversationId: string | undefined) {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: string | SendMessagePayload) => {
      if (!conversationId) throw new Error('No conversation');

      const dto: SendMessagePayload =
        typeof payload === 'string' ? { body: payload } : payload;

      const socket = getSocket();
      if (!socket.connected && accessToken) connectSocket(accessToken);

      return new Promise<ApiMessage>((resolve, reject) => {
        const timer = setTimeout(() => {
          api
            .post<ApiMessage>(`/chat/conversations/${conversationId}/messages`, dto)
            .then(resolve)
            .catch(reject);
        }, 5_000);

        socket.emit(
          'send:message',
          { conversationId, ...dto },
          (ack: ApiMessage | { error: string }) => {
            clearTimeout(timer);
            if ('error' in ack) reject(new Error(ack.error));
            else resolve(ack);
          },
        );
      });
    },
    onSuccess: (msg) => {
      if (!conversationId) return;
      upsertCachedMessage(qc, conversationId, msg);
    },
    onError: () => {},
  });
}

/**
 * Subscribe to incoming socket messages for a single conversation.
 */
export function useSocketMessages(
  conversationId: string | undefined,
  onNewMessage?: (msg: ApiMessage) => void,
) {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!conversationId || !accessToken) return;

    const socket = connectSocket(accessToken);

    const join = () => socket.emit('join:conversation', conversationId);

    // Join immediately and re-join on every reconnect —
    // Socket.IO rooms are in-memory on the server and are lost on disconnect.
    join();
    socket.on('connect', join);

    const handler = (msg: ApiMessage) => {
      if (msg.conversationId !== conversationId) return;
      upsertCachedMessage(qc, conversationId, msg);
      onNewMessage?.(msg);
    };

    socket.on('new:message', handler);
    return () => {
      socket.off('connect', join);
      socket.off('new:message', handler);
    };
  }, [conversationId, accessToken, qc, onNewMessage]);
}

/**
 * Keep the conversations inbox up-to-date in real-time via `inbox:update` events
 * emitted to the user's personal socket room by the gateway.
 */
export function useSocketInbox() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);

    const handler = ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ApiMessage;
    }) => {
      qc.setQueryData<Conversation[]>(chatKeys.conversations(), (old = []) => {
        const updated = old.map((conv) =>
          conv.id === conversationId
            ? { ...conv, messages: [message], unreadCount: conv.unreadCount + 1 }
            : conv,
        );
        return [...updated].sort((a, b) => {
          const at = new Date(a.messages[0]?.createdAt ?? a.createdAt).getTime();
          const bt = new Date(b.messages[0]?.createdAt ?? b.createdAt).getTime();
          return bt - at;
        });
      });
    };

    socket.on('inbox:update', handler);
    return () => { socket.off('inbox:update', handler); };
  }, [accessToken, qc]);
}

/**
 * Emits typing:start on each keystroke and typing:stop after 1.5 s of silence.
 */
export function useTyping(conversationId: string | undefined) {
  const { accessToken } = useAuthStore();
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();

  const emitTyping = useCallback(() => {
    if (!conversationId || !accessToken) return;
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit('typing:start', conversationId);
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      socket.emit('typing:stop', conversationId);
    }, 1500);
  }, [conversationId, accessToken]);

  useEffect(() => () => clearTimeout(stopTimer.current), []);

  return emitTyping;
}

/**
 * Subscribe to order status updates pushed by the server via socket.
 */
export function useOrderStatusSocket(
  onUpdate: (payload: { orderId: string; status: string }) => void,
) {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);

    const handler = (payload: { orderId: string; status: string }) => {
      qc.invalidateQueries({ queryKey: ['orders', 'detail', payload.orderId] });
      onUpdate(payload);
    };

    socket.on('order:update', handler);
    return () => { socket.off('order:update', handler); };
  }, [accessToken, qc, onUpdate]);
}
