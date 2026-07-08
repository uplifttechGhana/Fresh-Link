import React, { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  panelClassName?: string;
  overlayClassName?: string;
  panelZIndex?: string;
  titleClassName?: string;
  handleClassName?: string;
  backgroundImage?: string;
  backgroundOverlayClassName?: string;
  contentClassName?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  panelClassName = '',
  overlayClassName = 'z-50',
  panelZIndex = 'z-50',
  titleClassName = 'text-ink',
  handleClassName = 'bg-gray-200',
  backgroundImage,
  backgroundOverlayClassName,
  contentClassName = '',
}: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`absolute inset-0 bg-black/40 ${overlayClassName}`}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={twMerge(
              `absolute bottom-0 inset-x-0 ${panelZIndex} rounded-t-[2rem] max-h-[80%] flex flex-col overflow-hidden`,
              backgroundImage
                ? 'bg-transparent shadow-none'
                : 'bg-white shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.2)]',
              panelClassName,
            )}
            role="dialog"
            aria-modal="true"
          >
            {backgroundImage && (
              <>
                <img
                  src={backgroundImage}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                />
                {backgroundOverlayClassName && (
                  <div
                    className={twMerge('absolute inset-0 pointer-events-none', backgroundOverlayClassName)}
                  />
                )}
              </>
            )}
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex justify-center items-center pt-3 pb-2 flex-shrink-0 w-full cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className={twMerge('w-10 h-1.5 rounded-full', handleClassName)} />
              </button>
              {title && (
                <div className="px-6 pt-2 pb-3 flex-shrink-0">
                  <h3 className={twMerge('font-display font-bold text-lg', titleClassName)}>{title}</h3>
                </div>
              )}
              <div
                className={twMerge(
                  'px-6 pb-8 pt-1 overflow-y-auto no-scrollbar flex-1 min-h-0',
                  contentClassName,
                )}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
