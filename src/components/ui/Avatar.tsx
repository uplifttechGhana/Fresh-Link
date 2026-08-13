import { resolveMediaUrl } from '../../lib/mediaUrl';

/** First-letter-of-first-name + first-letter-of-last-name initials, e.g. "Ama Boateng" -> "AB". */
export function getInitials(name?: string | null) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

interface AvatarProps {
  /** Person or business name, used for initials fallback and alt text. */
  name?: string | null;
  /** Avatar image URL (absolute or relative /uploads path). */
  src?: string | null;
  /** Sizing/shape classes. When a parent already provides shape/border/overflow, pass "w-full h-full". */
  className?: string;
  /** Font-size class for the initials glyph. Defaults to a sensible size for common avatar sizes. */
  textClassName?: string;
}

/**
 * Renders a real avatar photo when available, otherwise a centered-initials
 * circle in the app's brand green. Never falls back to a fake stock/random face.
 */
export function Avatar({ name, src, className = 'w-10 h-10 rounded-full', textClassName }: AvatarProps) {
  const resolved = resolveMediaUrl(src);

  if (resolved) {
    return <img src={resolved} alt={name ?? 'Avatar'} className={`${className} object-cover`} />;
  }

  return (
    <div className={`${className} bg-green flex items-center justify-center`}>
      <span className={`font-display font-extrabold text-white ${textClassName ?? 'text-sm'}`}>
        {getInitials(name)}
      </span>
    </div>
  );
}
