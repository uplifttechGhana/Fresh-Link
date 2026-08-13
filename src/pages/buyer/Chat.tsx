import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, CheckCheck, ChevronLeft, Mic, X, Loader2, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  useMessages,
  useSendMessage,
  useSocketMessages,
  useTyping,
  useConversation,
  getConversationOther,
  useConversationContact,
  useConversations,
  upsertCachedMessage,
  replaceOptimisticMessage,
  type ApiMessage,
} from '../../lib/hooks/useChat';
import { useAuthStore } from '../../lib/authStore';
import { getSocket, connectSocket } from '../../lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '../../lib/hooks/useChat';
import { useVoiceRecorder } from '../../lib/hooks/useVoiceRecorder';
import { uploadFile } from '../../lib/hooks/useStorage';
import { VoiceMessage } from '../../components/chat/VoiceMessage';
import { Avatar } from '../../components/ui/Avatar';

function formatRecordTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function MessageMeta({
  time,
  isMe,
  readAt,
}: {
  time: string;
  isMe: boolean;
  readAt: string | null;
}) {
  if (!isMe) {
    return <span className="text-[10px] text-muted">{time}</span>;
  }
  return (
    <>
      <span className="text-[10px] text-green-100">{time}</span>
      <CheckCheck size={13} className={readAt ? 'text-blue-300' : 'text-green-200'} />
    </>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();

  const [message, setMessage] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data: allMessages = [] } = useMessages(conversationId);
  useConversations();
  const conversation = useConversation(conversationId);
  const { data: contactInfo } = useConversationContact(conversationId);

  useSocketMessages(conversationId);

  useEffect(() => {
    if (!conversationId || !accessToken) return;
    const socket = connectSocket(accessToken);
    socket.emit('mark:read', conversationId);
    qc.setQueryData(chatKeys.conversations(), (old: any[] = []) =>
      old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [conversationId, accessToken, qc]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);

    const handler = ({ userId, isTyping }: { userId: string; isTyping: boolean; conversationId: string }) => {
      if (userId === user?.id) return;
      setOtherTyping(isTyping);
      if (isTyping) {
        clearTimeout(typingClearTimer.current);
        typingClearTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      } else {
        clearTimeout(typingClearTimer.current);
      }
    };

    socket.on('user:typing', handler);
    return () => {
      socket.off('user:typing', handler);
      clearTimeout(typingClearTimer.current);
    };
  }, [accessToken, user?.id]);

  useEffect(() => {
    if (!accessToken || !conversationId) return;
    const socket = getSocket();
    const handler = ({ conversationId: cid, userId }: { conversationId: string; userId: string }) => {
      if (cid !== conversationId || userId === user?.id) return;
      qc.setQueryData<ApiMessage[]>(chatKeys.messages(conversationId), (old = []) =>
        old.map((m) =>
          m.senderId === user?.id && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m,
        ),
      );
    };
    socket.on('messages:read', handler);
    return () => { socket.off('messages:read', handler); };
  }, [accessToken, conversationId, qc, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [allMessages, otherTyping]);

  const sendMsg = useSendMessage(conversationId);
  const emitTyping = useTyping(conversationId);
  const voice = useVoiceRecorder();

  const addOptimistic = (partial: Partial<ApiMessage> & { id: string }) => {
    if (!conversationId) return null;
    const optimistic: ApiMessage = {
      id: partial.id,
      conversationId,
      senderId: user?.id ?? '',
      body: partial.body ?? '',
      imageUrl: partial.imageUrl ?? null,
      audioUrl: partial.audioUrl ?? null,
      audioDuration: partial.audioDuration ?? null,
      readAt: null,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id ?? '', name: user?.name ?? 'You', avatarUrl: user?.avatarUrl ?? null },
    };
    upsertCachedMessage(qc, conversationId, optimistic);
    return optimistic;
  };

  const send = async () => {
    const text = message.trim();
    if (!text || !conversationId) return;
    setMessage('');

    const optimistic = addOptimistic({ id: `opt-${Date.now()}`, body: text });
    if (!optimistic) return;

    try {
      const confirmed = await sendMsg.mutateAsync(text);
      replaceOptimisticMessage(qc, conversationId, optimistic.id, confirmed);
    } catch {
      // optimistic stays without read tick
    }
  };

  const startVoice = async () => {
    const ok = await voice.start();
    if (!ok && voice.error) toast.error(voice.error);
  };

  const cancelVoice = () => {
    voice.cancel();
  };

  const sendVoice = async () => {
    if (!conversationId) return;
    const recording = await voice.stop();
    if (!recording || recording.duration < 1) {
      toast.error('Recording too short');
      return;
    }

    setSendingVoice(true);
    const ext = recording.mimeType.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([recording.blob], `voice-${Date.now()}.${ext}`, {
      type: recording.mimeType,
    });
    const blobUrl = URL.createObjectURL(recording.blob);

    const optimistic = addOptimistic({
      id: `opt-voice-${Date.now()}`,
      body: 'Voice message',
      audioUrl: blobUrl,
      audioDuration: recording.duration,
    });
    if (!optimistic) return;

    try {
      const audioUrl = await uploadFile(file, 'chat');
      const confirmed = await sendMsg.mutateAsync({
        audioUrl,
        audioDuration: Math.max(1, Math.round(recording.duration)),
      });
      replaceOptimisticMessage(qc, conversationId, optimistic.id, {
        ...confirmed,
        audioUrl: confirmed.audioUrl ?? audioUrl,
        audioDuration: confirmed.audioDuration ?? recording.duration,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send voice note';
      toast.error(msg.includes('Upload') || msg.includes('audio') ? msg : 'Could not send voice note');
      if (conversationId) {
        qc.setQueryData<ApiMessage[]>(chatKeys.messages(conversationId), (old = []) =>
          old.filter((m) => m.id !== optimistic.id),
        );
      }
      URL.revokeObjectURL(blobUrl);
    } finally {
      setSendingVoice(false);
    }
  };

  const otherFromConv =
    conversation && user?.id ? getConversationOther(conversation, user.id) : null;
  const otherParty =
    otherFromConv ?? allMessages.find((m) => m.senderId !== user?.id)?.sender;
  const otherName = otherParty?.name ?? 'Contact';
  const otherAvatar = otherParty?.avatarUrl ?? null;

  const openContactProfile = () => {
    if (!conversationId || !user?.id) return;
    const chatBase =
      user.role === 'farmer' ? '/farmer' : user.role === 'transport' ? '/transport' : '/buyer';

    const farmerUserId =
      contactInfo?.farmerUserId ??
      conversation?.farmerId ??
      (user.role === 'buyer' && otherParty ? otherParty.id : null);
    const isFarmer =
      contactInfo?.isFarmer ??
      (conversation
        ? getConversationOther(conversation, user.id).id === conversation.farmerId
        : user.role === 'buyer' && !!otherParty);

    if (isFarmer && farmerUserId) {
      navigate(`/buyer/farmer/${farmerUserId}`);
      return;
    }
    navigate(`${chatBase}/chat/${conversationId}/contact`);
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <div className="bg-white shadow-sm z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 text-ink"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={openContactProfile}
            className="flex items-center gap-3 text-left rounded-xl pr-2 -mr-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label={`View ${otherName} profile`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                <Avatar name={otherName} src={otherAvatar} className="w-full h-full" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="font-bold text-ink text-sm leading-tight">{otherName}</h2>
              <p className="text-[10px] font-medium text-green">
                {otherTyping
                  ? 'typing…'
                  : voice.sessionActive
                    ? voice.isPaused
                      ? 'recording paused'
                      : 'recording voice…'
                    : 'Online'}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-3 no-scrollbar">
        <div className="flex justify-center mb-4">
          <span className="bg-gray-200/60 text-muted text-[10px] font-bold px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {allMessages.map((m) => {
          const isMe = m.senderId === user?.id;
          const isOptimistic = m.id.startsWith('opt-');
          return isMe ? (
            <div key={m.id} className="flex justify-end">
              <div
                className={`max-w-[78%] rounded-2xl rounded-br-sm shadow-sm text-sm bg-green text-white px-2.5 py-2 ${
                  isOptimistic ? 'opacity-70' : ''
                }`}
              >
                <div className="relative min-h-[28px] flex items-center">
                  {m.audioUrl ? (
                    <div className="w-full pr-14 pb-3">
                      <VoiceMessage audioUrl={m.audioUrl} duration={m.audioDuration} isMe />
                    </div>
                  ) : (
                    <p className="leading-relaxed w-full pr-14 pb-3">{m.body}</p>
                  )}
                  <div className="absolute bottom-0 right-0 flex items-center gap-1">
                    <MessageMeta time={formatMsgTime(m.createdAt)} isMe readAt={m.readAt} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2 items-end">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Avatar name={otherName} src={otherAvatar} className="w-full h-full" />
              </div>
              <div className="max-w-[78%] bg-white rounded-2xl rounded-bl-sm shadow-sm text-sm text-ink px-2.5 py-2">
                <div className="relative min-h-[28px] flex items-center">
                  {m.audioUrl ? (
                    <div className="w-full pr-10 pb-3">
                      <VoiceMessage audioUrl={m.audioUrl} duration={m.audioDuration} isMe={false} />
                    </div>
                  ) : (
                    <p className="leading-relaxed w-full pr-10 pb-3">{m.body}</p>
                  )}
                  <div className="absolute bottom-0 right-0">
                    <MessageMeta time={formatMsgTime(m.createdAt)} isMe={false} readAt={null} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {otherTyping && (
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Avatar name={otherName} src={otherAvatar} className="w-full h-full" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
              {[0, 0.2, 0.4].map((delay) => (
                <motion.div
                  key={delay}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] z-20">
        {voice.sessionActive ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelVoice}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-muted flex-shrink-0"
              aria-label="Cancel recording"
            >
              <X size={18} />
            </button>
            <div
              className={`flex-1 flex items-center gap-3 rounded-full px-4 h-11 border ${
                voice.isPaused
                  ? 'bg-amber-50 border-amber-100'
                  : 'bg-red-50 border-red-100'
              }`}
            >
              {voice.isPaused ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
              ) : (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"
                />
              )}
              <span
                className={`text-sm font-bold ${
                  voice.isPaused ? 'text-amber-700' : 'text-red-600'
                }`}
              >
                {voice.isPaused ? 'Paused' : 'Recording'} {formatRecordTime(voice.duration)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => (voice.isPaused ? voice.resume() : voice.pause())}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-ink flex-shrink-0"
              aria-label={voice.isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {voice.isPaused ? <Mic size={18} /> : <Pause size={18} />}
            </button>
            <button
              type="button"
              onClick={sendVoice}
              disabled={sendingVoice || voice.duration < 1}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-green text-white shadow-sm disabled:opacity-40 flex-shrink-0"
              aria-label="Send voice note"
            >
              {sendingVoice ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startVoice}
              disabled={sendingVoice}
              aria-label="Record voice note"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-50 text-green border border-gray-100 disabled:opacity-40"
            >
              <Mic size={18} />
            </button>
            <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 h-11 border border-gray-100 focus-within:border-green-400 transition-colors">
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-sm text-ink font-medium"
                placeholder="Type a message…"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  emitTyping();
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
            </div>
            {message.trim() && (
              <button
                onClick={send}
                aria-label="Send"
                className="w-11 h-11 flex items-center justify-center rounded-full bg-green text-white shadow-sm active:scale-95 transition-transform"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
