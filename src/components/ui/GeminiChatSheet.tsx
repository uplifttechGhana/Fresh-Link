import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sheet } from './Sheet';
import { useGeminiChat } from '../../lib/hooks/useGeminiChat';

interface GeminiChatSheetProps {
  open: boolean;
  onClose: () => void;
}

export function GeminiChatSheet({ open, onClose }: GeminiChatSheetProps) {
  const { messages, send, busy, reset } = useGeminiChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, busy]);

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    await send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      panelClassName="max-h-[85%]"
      contentClassName="flex flex-col gap-0 px-0 pb-0 pt-0"
      overlayClassName="z-50"
      panelZIndex="z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-green-900 text-sm leading-tight">Gemini AI</p>
            <p className="text-[10px] text-green-600 leading-tight">Agriculture assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Close chat"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-green-900 text-base mb-1">Ask me anything</p>
            <p className="text-sm text-gray-500 max-w-[220px] mx-auto">
              Get expert advice on crops, diseases, planting seasons, and more.
            </p>
            <div className="mt-4 space-y-2">
              {[
                'How do I treat maize rust?',
                'Best time to plant tomatoes in Ghana?',
                'How to store cassava after harvest?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  disabled={busy}
                  className="w-full text-left text-sm bg-green-50 border border-green-100 text-green-800 rounded-xl px-4 py-2.5 hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-end gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about crops, pests, planting…"
          disabled={busy}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={busy || !input.trim()}
          className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white shadow-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
          aria-label="Send"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </Sheet>
  );
}
