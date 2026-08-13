import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { AvatarUploadSheet } from '../../components/ui/AvatarUploadSheet';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../lib/authStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function ProfileSettings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    setEmail(user?.email ?? '');
    setAvatar(user?.avatarUrl ?? null);
  }, [user]);

  const handleSave = async () => {
    if (!user || !accessToken) return;
    setSaving(true);
    try {
      const updated = await api.patch<typeof user>('/users/me', {
        name: name || undefined,
        email: email || undefined,
        avatarUrl: avatar ?? undefined,
      });
      setAuth({ ...user, ...updated }, accessToken);
      toast.success('Profile updated');
      navigate(-1);
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Personal Information" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-4">
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => setAvatarOpen(true)}
            aria-label="Change profile photo"
            className="relative active:scale-95 transition-transform"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm">
              <Avatar name={name || user?.name} src={avatar} className="w-full h-full" textClassName="text-2xl" />
            </div>
            <span className="absolute bottom-0 right-0 w-8 h-8 bg-green text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm text-sm">
              ✎
            </span>
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">Phone Number</label>
          <input
            type="tel"
            value={user?.phone ?? ''}
            disabled
            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-muted outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
          />
        </div>
      </div>

      <div className="p-6 bg-cream/90 backdrop-blur-md">
        <Button size="lg" fullWidth onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <AvatarUploadSheet
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        onSuccess={(url) => setAvatar(url)}
      />
    </div>
  );
}
