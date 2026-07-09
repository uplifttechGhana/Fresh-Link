import React from 'react';
import { useStore } from '../../store';

export function DarkModeToggle({ light = false }: { light?: boolean }) {
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);

  return (
    <>
      <style>{`
        .fl-switch { display: inline-block; }
        .fl-switch input { display: none; }

        .fl-slider {
          box-sizing: border-box;
          width: 46px; height: 24px;
          background: rgba(131,131,131,0.7);
          border-radius: 999px;
          display: flex; align-items: center;
          position: relative; cursor: pointer;
          transition: background 0.2s cubic-bezier(0.27,0.2,0.25,1.51);
        }
        .fl-slider::before {
          content: "";
          position: absolute;
          width: 9px; height: 3.5px;
          left: calc(3px + 4.5px);
          background: #fff;
          border-radius: 1px;
          transition: left 0.2s ease-in-out;
        }
        .fl-circle {
          width: 18px; height: 18px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 1px 1px 2px rgba(146,146,146,0.45);
          display: flex; align-items: center; justify-content: center;
          position: absolute; left: 3px; z-index: 1;
          transition: left 0.2s cubic-bezier(0.27,0.2,0.25,1.51),
                      box-shadow 0.2s cubic-bezier(0.27,0.2,0.25,1.51);
        }
        .fl-cross  { color: rgba(131,131,131,0.8); transition: transform 0.2s cubic-bezier(0.27,0.2,0.25,1.51); }
        .fl-check  { color: rgb(0,218,80); transform: scale(0); transition: transform 0.2s cubic-bezier(0.27,0.2,0.25,1.51); position: absolute; }

        /* checked state */
        .fl-switch input:checked + .fl-slider { background: rgb(0,218,80); }
        .fl-switch input:checked + .fl-slider .fl-check  { transform: scale(1); }
        .fl-switch input:checked + .fl-slider .fl-cross  { transform: scale(0); }
        .fl-switch input:checked + .fl-slider .fl-circle {
          left: calc(46px - 18px - 3px);
          box-shadow: -1px 1px 2px rgba(163,163,163,0.45);
        }
        .fl-switch input:checked + .fl-slider::before {
          left: calc(100% - 9px - 4.5px - 3px);
        }
      `}</style>

      <label className="fl-switch" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
        <div className="fl-slider">
          <div className="fl-circle">
            {/* Cross — visible when OFF */}
            <svg className="fl-cross" viewBox="0 0 365.696 365.696" width="6" height="6" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0" />
            </svg>
            {/* Checkmark — visible when ON */}
            <svg className="fl-check" viewBox="0 0 24 24" width="10" height="10" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
          </div>
        </div>
      </label>
    </>
  );
}
