import { useState, type ReactNode } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { SettingsMenuSheet } from '../ui/SettingsMenuSheet';
import { AdminSubHeader } from './AdminSubHeader';

interface AdminShellProps {
  title: string;
  children: ReactNode;
  showBottomNav?: boolean;
}

/** Shared green header + optional bottom nav for admin sub-pages. */
export function AdminShell({ title, children, showBottomNav = true }: AdminShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <AdminSubHeader title={title} onMenuClick={() => setSettingsOpen(true)} />
      <div className={`flex-1 overflow-y-auto no-scrollbar px-6 pt-4 ${showBottomNav ? 'pb-24' : 'pb-8'}`}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
      <SettingsMenuSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
