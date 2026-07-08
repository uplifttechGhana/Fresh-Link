import { ChevronLeft, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeafDecoration } from '../ui/LeafDecoration';
import menuHarvestBg from '../../assets/menu-harvest-bg.png';

interface AdminSubHeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function AdminSubHeader({ title, onMenuClick }: AdminSubHeaderProps) {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden rounded-b-[2rem] flex-shrink-0 z-10">
      <img
        src={menuHarvestBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
      />
      <LeafDecoration variant="fern" opacity={70} className="-left-5 -top-4 w-20 -rotate-12" />
      <LeafDecoration variant="monstera" opacity={55} className="-right-6 -bottom-10 w-28 rotate-6" />

      <div className="relative z-10 px-6 pt-5 pb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-green/90 backdrop-blur-md border border-white/25 shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform flex-shrink-0"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 font-display font-bold text-lg text-white drop-shadow-sm truncate">
          {title}
        </h1>
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Menu"
            className="w-10 h-10 rounded-full bg-green/90 backdrop-blur-md border border-white/25 shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform flex-shrink-0"
          >
            <Menu size={20} />
          </button>
        )}
      </div>
    </section>
  );
}
