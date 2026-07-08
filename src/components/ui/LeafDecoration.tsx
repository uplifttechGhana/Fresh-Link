import monstera from '../../assets/leaves/monstera.png';
import fern from '../../assets/leaves/fern.png';
import singleLeaf from '../../assets/leaves/single-leaf.png';

const leafImages = { monstera, fern, single: singleLeaf };

interface LeafDecorationProps {
  variant?: keyof typeof leafImages;
  className?: string;
  opacity?: number;
}

/**
 * Decorative real-photo leaf cutout that sits behind card content. The PNG's own
 * alpha channel (transparent around the leaf shape) is what makes it blend into the
 * card — the leaf itself renders at near-full opacity so it actually reads as a leaf,
 * and the card underneath stays fully solid. Relies on the parent having `isolate`
 * (own stacking context) so `-z-10` keeps it behind in-flow content without needing
 * a z-10 wrapper around that content.
 */
export function LeafDecoration({ variant = 'monstera', className = '', opacity = 90 }: LeafDecorationProps) {
  return (
    <img
      src={leafImages[variant]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`absolute -z-10 pointer-events-none select-none ${className}`}
      style={{ opacity: opacity / 100 }}
    />
  );
}
