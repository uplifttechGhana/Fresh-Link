import React from 'react';
import { ChevronLeft, MoreHorizontal, Search, Bookmark, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DarkModeToggle } from './DarkModeToggle';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  rightAction?: 'search' | 'more' | 'bookmark' | 'skip' | 'messages' | 'none';
  onRightAction?: () => void;
  transparent?: boolean;
  /** White text/icons for use on photo backgrounds */
  light?: boolean;
  /** Show dark mode toggle in the right side (use on top-level/dashboard pages) */
  showDarkToggle?: boolean;
}

export function TopBar({
  title,
  showBack = false,
  rightAction = 'none',
  onRightAction,
  transparent = false,
  light = false,
  showDarkToggle = false,
}: TopBarProps) {
  const navigate = useNavigate();

  const titleClass = light ? 'text-white drop-shadow-sm' : 'text-ink';
  const backClass = light
    ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
    : 'bg-card shadow-sm text-ink hover:opacity-80';
  const actionClass = light
    ? 'bg-white/20 backdrop-blur-sm text-white'
    : 'bg-card shadow-sm text-ink';

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-between px-4 py-3 ${
        transparent ? 'bg-transparent' : 'bg-cream/90 backdrop-blur-md dark:bg-[#0F1C14]/90'
      } z-30 relative`}
    >
      {/* Left — back button */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${backClass}`}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Centre — title */}
      {title && (
        <h1 className={`font-display font-bold text-lg truncate max-w-[180px] ${titleClass}`}>
          {title}
        </h1>
      )}

      {/* Right — toggle + action */}
      <div className="flex items-center gap-1">
        {showDarkToggle && <DarkModeToggle />}
        {/* Optional right action */}
        {rightAction === 'search' && (
          <button onClick={onRightAction} className={`w-9 h-9 flex items-center justify-center rounded-full ${actionClass}`}>
            <Search size={20} />
          </button>
        )}
        {rightAction === 'more' && (
          <button onClick={onRightAction} className={`w-9 h-9 flex items-center justify-center rounded-full ${actionClass}`}>
            <MoreHorizontal size={20} />
          </button>
        )}
        {rightAction === 'bookmark' && (
          <button onClick={onRightAction} className={`w-9 h-9 flex items-center justify-center rounded-full ${actionClass}`}>
            <Bookmark size={20} />
          </button>
        )}
        {rightAction === 'messages' && (
          <button onClick={onRightAction} className={`w-9 h-9 flex items-center justify-center rounded-full ${actionClass}`}>
            <MessageCircle size={20} />
          </button>
        )}
        {rightAction === 'skip' && (
          <button
            onClick={onRightAction}
            className={light ? 'text-white font-bold text-sm drop-shadow-sm' : 'text-green font-bold text-sm'}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
