import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { formatApiError } from '../api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (message: string) =>
      api.post<{ reply: string }>('/crops/chat', { message }),
  });

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const data = await mutation.mutateAsync(trimmed);
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          text: data.reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          text: `Sorry, I couldn't respond right now. ${formatApiError(err, 'Please try again.')}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [mutation],
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, send, busy: mutation.isPending, reset };
}
