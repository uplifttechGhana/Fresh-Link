import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGeminiChat } from '../../lib/hooks/useGeminiChat';
import cropScanFieldBg from '../../assets/photos/crop-scan-field.png';

interface GeminiChatSheetProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'How do I treat maize rust?',
  'Best time to plant tomatoes in Ghana?',
  'How to store cassava after harvest?',
];

export function GeminiChatSheet({ open, onClose }: GeminiChatSheetProps) {
  const { messages, send, busy, reset } = useGeminiChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="absolute bottom-0 inset-x-0 z-50 rounded-t-[2rem] max-h-[88%] flex flex-col overflow-hidden shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.4)]"
            role="dialog"
            aria-modal="true"
          >
            {/* Background image + overlays */}
            <img
              src={cropScanFieldBg}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            />
            {/* gradient: dark at top for header, fades to deep green-black for content */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-green-950/80 to-black/90 pointer-events-none" />

            {/* Drag handle */}
            <div className="relative z-10 flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-white/40" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-5 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-base leading-tight drop-shadow">Gemini AI</p>
                  <p className="text-[11px] text-green-200 leading-tight">Agriculture assistant · Fresh-Link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close chat"
                className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Divider */}
            <div className="relative z-10 mx-5 border-t border-white/15 flex-shrink-0" />

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles size={30} className="text-green-300" />
                  </div>
                  <p className="font-bold text-white text-lg mb-1 drop-shadow">Ask me anything</p>
                  <p className="text-sm text-green-200 max-w-[230px] mx-auto mb-5">
                    Expert crop advice, pest control, planting seasons — for Ghanaian farmers.
                  </p>
                  <div className="space-y-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => void send(q)}
                        disabled={busy}
                        className="w-full text-left text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl px-4 py-3 hover:bg-white/20 active:bg-white/25 transition-colors font-medium disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat bubbles */}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 mb-0.5">
                        <Sparkles size={13} className="text-green-300" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-green-500 text-white shadow-md rounded-br-sm'
                          : 'bg-white/90 backdrop-blur-md text-gray-800 shadow-md rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {busy && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 justify-start"
                >
                  <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                    <Sparkles size={13} className="text-green-300" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-black/40 backdrop-blur-lg border-t border-white/15 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about crops, pests, planting…"
                disabled={busy}
                className="flex-1 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-5 py-3 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-green-400/60 focus:border-transparent disabled:opacity-50 min-w-0"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:bg-green-400 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                {busy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
