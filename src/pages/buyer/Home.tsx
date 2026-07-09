import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  MapPin,
  Plus,
  Bell,
  ImageOff,
  UserCircle2,
  Loader2,
} from 'lucide-react';
import { compareIcon, mapIcon, ordersIcon, favoriteIcon, favoriteFilledIcon } from '../../assets/icons';
import { BottomNav } from '../../components/ui/BottomNav';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/authStore';
import {
  useProduceList,
  useProduceCategories,
  useFarmersList,
  useFavoriteIds,
  useToggleFavorite,
  type ProduceListing,
} from '../../lib/hooks/useProduce';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { useCartStore } from '../../lib/cartStore';
import { useTypewriter } from '../../lib/hooks/useTypewriter';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { SettingsMenuSheet } from '../../components/ui/SettingsMenuSheet';
import { AvatarUploadSheet } from '../../components/ui/AvatarUploadSheet';
import { LeafDecoration } from '../../components/ui/LeafDecoration';
import { DarkModeToggle } from '../../components/ui/DarkModeToggle';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import menuHarvestBg from '../../assets/menu-harvest-bg.png';

const QUICK_ACTION_CLASS =
  'w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center';

const CATEGORY_EMOJI: Record<string, string> = {
  Vegetables: '🥬', Fruits: '🍎', Dairy: '🥛', Grains: '🌾',
  Herbs: '🌿', Legumes: '🫘', Tubers: '🥔', Poultry: '🐔',
  Fish: '🐟', Spices: '🌶️', Nuts: '🥜', Oils: '🫙',
};

async function reverseGeocodeCity(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? 'Ghana';
  } catch {
    return 'Ghana';
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}


export function BuyerHome() {
  const [activeCategory, setActiveCategory] = useState('Vegetables');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  const greetingText = user ? `${greeting()}, ${user.name.split(' ')[0]}` : greeting();
  const { displayed: greetingDisplayed, typing: greetingTyping } = useTypewriter(greetingText);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setDetectedLocation('Ghana');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
        setDetectedLocation(city);
      },
      () => setDetectedLocation('Ghana'),
      { timeout: 8_000 },
    );
  }, []);

  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  // Produce sections
  const { data: categoriesData = [] } = useProduceCategories();
  // Always show the core browse tabs; append any extra DB categories not already listed
  const CORE_CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Grains'];
  const dbCategories = categoriesData.map((c) => c.name);
  const extraCategories = dbCategories.filter((c) => !CORE_CATEGORIES.includes(c));
  const categories = [...CORE_CATEGORIES, ...extraCategories];

  const resolvedCategory = activeCategory;

  const { data: recentData, isPending: recentPending, isError: recentError, refetch: refetchRecent } = useProduceList({ limit: 6 });
  const { data: categoryData, isPending: categoryPending, isError: categoryError, refetch: refetchCategory } = useProduceList({
    category: resolvedCategory,
    limit: 6,
  });
  const { data: popularData, isPending: popularPending, isError: popularError, refetch: refetchPopular } = useProduceList({ limit: 6, sort: 'popular' });
  const { data: farmersData } = useFarmersList({ limit: 200 });

  const recent = recentData?.items ?? [];
  const categoryItems = categoryData?.items ?? [];
  const popular = popularData?.items ?? [];
  const farmers = farmersData?.items ?? [];
  const apiUnreachable = recentError && categoryError && popularError;

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      {apiUnreachable && (
        <div className="mx-6 mt-3 rounded-2xl bg-orange-soft border border-orange/30 px-4 py-3 text-sm text-ink z-20">
          <p className="font-semibold">Can&apos;t reach the server</p>
          <p className="text-muted mt-1">Make sure the backend is running on your Mac, then tap retry.</p>
          <button
            type="button"
            onClick={() => {
              void refetchRecent();
              void refetchCategory();
              void refetchPopular();
            }}
            className="mt-2 font-bold text-green text-sm"
          >
            Retry
          </button>
        </div>
      )}
      {/* Hero: greeting, location, actions */}
      <section className="relative isolate overflow-hidden rounded-b-[2rem] flex-shrink-0 z-10">
        <img
          src={menuHarvestBg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
        />
        <LeafDecoration variant="fern" opacity={70} className="-left-5 -top-4 w-24 -rotate-12" />
        <LeafDecoration variant="monstera" opacity={65} className="-right-8 -bottom-12 w-36 rotate-6" />
        <LeafDecoration variant="single" opacity={35} className="left-1/3 top-6 w-14 rotate-12" />

        <div className="relative z-10 px-6 pt-6 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  setAvatarUploadOpen(true);
                }}
                aria-label="Change profile photo"
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow shadow-sm bg-white/20 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 size={30} className="text-white/80" />
                )}
              </button>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white tracking-tight drop-shadow-sm truncate">
                  {greetingDisplayed}
                  {greetingTyping && (
                    <span className="inline-block w-[2px] h-[12px] bg-white ml-[1px] align-middle animate-pulse" />
                  )}
                </h2>
                <div className="flex items-center text-xs text-yellow-light mt-0.5 gap-1 drop-shadow-sm min-w-0">
                  {detectedLocation === null ? (
                    <Loader2 size={12} className="animate-spin text-yellow flex-shrink-0" />
                  ) : (
                    <MapPin size={12} className="text-yellow flex-shrink-0" />
                  )}
                  <span
                    className="truncate transition-all duration-500"
                    style={{ opacity: detectedLocation === null ? 0.4 : 1 }}
                  >
                    {detectedLocation ?? 'Detecting…'}
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <DarkModeToggle light />
                <button
                  onClick={() => navigate('/buyer/notifications')}
                  aria-label="Notifications"
                  className="w-10 h-10 rounded-full bg-green/90 backdrop-blur-md border border-white/25 shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange rounded-full border border-green" />
                  )}
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Menu"
                  className="w-10 h-10 rounded-full bg-green/90 backdrop-blur-md border border-white/25 shadow-sm flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Menu size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex-shrink-0 whitespace-nowrap px-4 py-2 bg-yellow text-green text-sm font-bold rounded-full shadow-sm active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          <Card className="mt-5 overflow-hidden bg-green/90 backdrop-blur-md shadow-card border border-white/25">
            <div className="grid grid-cols-4 gap-3 p-4">
              <button
                onClick={() => navigate('/buyer/favorites')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={QUICK_ACTION_CLASS}>
                  <img src={favoriteIcon} alt="Favorites" className="w-7 h-7 object-contain" />
                </div>
                <span className="text-[10px] font-bold text-yellow drop-shadow-sm">Favorites</span>
              </button>
              <button
                onClick={() => navigate('/buyer/map')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={QUICK_ACTION_CLASS}>
                  <img src={mapIcon} alt="Map View" className="w-7 h-7 object-contain" />
                </div>
                <span className="text-[10px] font-bold text-yellow drop-shadow-sm">Map View</span>
              </button>
              <button
                onClick={() => navigate('/buyer/compare')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={QUICK_ACTION_CLASS}>
                  <img src={compareIcon} alt="Compare" className="w-7 h-7 object-contain" />
                </div>
                <span className="text-[10px] font-bold text-yellow drop-shadow-sm">Compare</span>
              </button>
              <button
                onClick={() => navigate('/buyer/orders')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={QUICK_ACTION_CLASS}>
                  <img src={ordersIcon} alt="Orders" className="w-7 h-7 object-contain" />
                </div>
                <span className="text-[10px] font-bold text-yellow drop-shadow-sm">Orders</span>
              </button>
            </div>
          </Card>
        </div>
      </section>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {categories.length > 0 && (
          <div className="px-6 pt-6 mb-8">
            <TypewriterText text="Shop By Categories" className="font-display font-bold text-lg text-ink mb-4" />
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2
                    ${resolvedCategory === cat ? 'bg-green text-white' : 'bg-white text-ink hover:bg-gray-50'}`}
                >
                  {CATEGORY_EMOJI[cat] && <span>{CATEGORY_EMOJI[cat]}</span>}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Items */}
        {resolvedCategory && (
          <div className="mb-8">
            <div className="px-6 flex justify-between items-end mb-4">
              <TypewriterText text={resolvedCategory} className="font-display font-bold text-lg text-ink" />
              <button
                onClick={() => navigate(`/buyer/search?category=${resolvedCategory}`)}
                className="text-green text-sm font-bold">
                View all
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {categoryPending ? (
                <ProduceSkeleton count={3} />
              ) : categoryItems.length > 0 ? (
                categoryItems.map((p) => <ProductCard key={p.id} produce={p} />)
              ) : (
                <div className="px-6 py-6 text-sm text-muted">
                  No produce listed under <span className="font-bold text-ink">{resolvedCategory}</span> yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recently Listed */}
        <div className="mb-8">
          <div className="px-6 flex justify-between items-end mb-4">
            <TypewriterText text="Recently Listed" className="font-display font-bold text-lg text-ink" />
            <button
              onClick={() => navigate('/buyer/search')}
              className="text-green text-sm font-bold">
              View all
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            {recentPending ? (
              <ProduceSkeleton count={3} />
            ) : recent.length > 0 ? (
              recent.map((p) => <ProductCard key={p.id} produce={p} />)
            ) : recentError ? (
              <p className="px-2 text-sm text-muted">Could not load recent listings.</p>
            ) : (
              <p className="px-2 text-sm text-muted">No listings yet.</p>
            )}
          </div>
        </div>

        {/* Best Farmers */}
        {farmers.length > 0 && (
          <div className="mb-8">
            <div className="px-6 flex justify-between items-end mb-4">
              <TypewriterText text="Best Farmers" className="font-display font-bold text-lg text-ink" />
              <button
                onClick={() => navigate('/buyer/farmers')}
                className="text-green text-sm font-bold">
                View all
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {farmers.map((f) =>
                <FarmerAvatar
                  key={f.userId}
                  id={f.userId}
                  name={f.user.name}
                  rating={f.rating.toFixed(1)}
                  img={f.user.avatarUrl ?? `https://i.pravatar.cc/150?u=${f.userId}`}
                />
              )}
            </div>
          </div>
        )}

        {/* Popular near you */}
        <div className="mb-6">
          <div className="px-6 flex justify-between items-end mb-4">
            <TypewriterText text="Popular near you" className="font-display font-bold text-lg text-ink" />
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            {popularPending ? (
              <ProduceSkeleton count={3} />
            ) : popular.length > 0 ? (
              popular.map((p) => <ProductCard key={p.id} produce={p} />)
            ) : popularError ? (
              <p className="px-2 text-sm text-muted">Could not load popular items.</p>
            ) : (
              <p className="px-2 text-sm text-muted">No popular items yet.</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
      <SettingsMenuSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AvatarUploadSheet open={avatarUploadOpen} onClose={() => setAvatarUploadOpen(false)} />
    </div>);

}

function ProductCard({ produce }: { produce: ProduceListing }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!useAuthStore((s) => s.accessToken);
  const addItem = useCartStore((s) => s.addItem);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();

  const farmerName = produce.farmer?.user?.name ?? 'Farmer';
  const farmerId = produce.farmer?.userId ?? '';
  const image = resolveMediaUrl(produce.images[0]);
  const isFav = favIds.includes(produce.id);

  function handleFavClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggleFav.mutate({ produceId: produce.id, isFav }, { onError: () => {} });
  }

  return (
    <Card
      className="min-w-[160px] w-[160px] p-3 flex flex-col bg-green border-none"
      onClick={() => navigate(`/buyer/product/${produce.id}`)}
    >
      <div className="w-full h-28 bg-white/20 rounded-2xl mb-3 overflow-hidden relative flex items-center justify-center">
        {image ? (
          <img src={image} alt={produce.title} className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={28} className="text-gray-300" />
        )}
        <button
          onClick={handleFavClick}
          className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <img
            src={isFav ? favoriteFilledIcon : favoriteIcon}
            alt="Favourite"
            className="w-4 h-4 object-contain"
          />
        </button>
      </div>
      <h4 className="font-bold text-sm text-white leading-tight mb-2 flex-1">{produce.title}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">₵{produce.price.toFixed(2)}</span>
          <span className="text-[10px] text-green-100">/ {produce.unit}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem({
              id: produce.id,
              title: produce.title,
              pricePerUnit: produce.price,
              farmer: farmerName,
              farmerId,
              image: image ?? '',
              unit: produce.unit,
            });
            navigate('/buyer/cart');
          }}
          className="w-8 h-8 bg-white text-green rounded-xl flex items-center justify-center shadow-sm hover:bg-green-50"
        >
          <Plus size={18} />
        </button>
      </div>
    </Card>
  );
}

function FarmerAvatar({ id, name, rating, img }: { id: string; name: string; rating: string; img: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/buyer/farmer/${id}`)}
      className="flex flex-col items-center gap-2 min-w-[72px]">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
        <img src={img} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-ink truncate w-16">{name}</p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className="text-orange text-[10px]">★</span>
          <span className="text-[10px] text-muted font-medium">{rating}</span>
        </div>
      </div>
    </button>);

}

function ProduceSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-[160px] w-[160px] bg-white rounded-3xl p-3 animate-pulse">
          <div className="w-full h-28 bg-gray-100 rounded-2xl mb-3" />
          <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </>
  );
}
