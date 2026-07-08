import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { SettingsMenuContent } from '../../components/ui/SettingsMenuSheet';

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Settings" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        <SettingsMenuContent onNavigate={(path) => navigate(path)} />
      </div>
    </div>
  );
}
