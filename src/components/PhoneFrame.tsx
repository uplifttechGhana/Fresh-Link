import React, { ReactNode } from 'react';
export function PhoneFrame({ children }: {children: ReactNode;}) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-screen p-4 sm:p-8">
      <div className="relative w-full max-w-[400px] h-[850px] max-h-[90vh] bg-black rounded-[3rem] p-3 shadow-2xl overflow-hidden ring-1 ring-white/20">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50 pointer-events-none">
          <div className="w-32 h-6 bg-black rounded-b-3xl"></div>
        </div>

        {/* Screen Content */}
        <div className="relative w-full h-full bg-cream rounded-[2.25rem] overflow-hidden flex flex-col">
          {/* Status Bar Space */}
          <div className="h-12 w-full flex-shrink-0 flex justify-between items-center px-6 pt-2 text-xs font-medium text-ink z-40 bg-transparent pointer-events-none">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21L15.6 16.2C14.6 15.4 13.4 15 12 15C10.6 15 9.4 15.4 8.4 16.2L12 21ZM12 3C7.95 3 4.21 4.34 1.2 6.6L3 9C5.5 7.12 8.62 6 12 6C15.38 6 18.5 7.12 21 9L22.8 6.6C19.79 4.34 16.05 3 12 3ZM12 9C9.3 9 6.81 9.89 4.8 11.4L6.6 13.8C8.1 12.67 9.97 12 12 12C14.03 12 15.9 12.67 17.4 13.8L19.2 11.4C17.19 9.89 14.7 9 12 9Z" />
              </svg>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.67 4H14V2H10V4H8.33C7.6 4 7 4.6 7 5.33V20.67C7 21.4 7.6 22 8.33 22H15.67C16.4 22 17 21.4 17 20.67V5.33C17 4.6 16.4 4 15.67 4Z" />
              </svg>
            </div>
          </div>

          {/* App Area */}
          <div className="flex-1 overflow-hidden relative">{children}</div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-50">
            <div className="w-32 h-1.5 bg-ink/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>);

}