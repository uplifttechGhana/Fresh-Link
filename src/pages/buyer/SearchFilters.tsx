import React, { useState, useDeferredValue, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, Clock, Trash2, Users, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProduceList, useProduceCategories } from '../../lib/hooks/useProduce';
import { BottomNav } from '../../components/ui/BottomNav';
import { useCartStore } from '../../lib/cartStore';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const RECENT_KEY = 'fl_recent_searches';
const MAX_RECENT = 8;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const current = loadRecent().filter((t) => t !== term);
  const updated = [term, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  return updated;
}

function removeRecent(term: string): string[] {
  const updated = loadRecent().filter((t) => t !== term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  return updated;
}

function clearAllRecent(): string[] {
  localStorage.removeItem(RECENT_KEY);
  return [];
}

export function SearchFilters() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [distanceIdx, setDistanceIdx] = useState(3); // default: Anywhere
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent);

  const deferredQuery = useDeferredValue(query);
  const initialCategory = searchParams.get('category') ?? undefined;
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const { data: categoriesData, isLoading: catsLoading } = useProduceCategories();
  const categories = categoriesData ?? [];

  const { data, isLoading } = useProduceList({
    search: deferredQuery || undefined,
    category: activeCategory,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    limit: 30,
  });

  const results = data?.items ?? [];
  const hasSearch = !!deferredQuery || !!activeCategory;

  // Save to recent when user settles on a typed query
  useEffect(() => {
    if (!deferredQuery.trim()) return;
    const id = setTimeout(() => {
      setRecentSearches(saveRecent(deferredQuery.trim()));
    }, 1000);
    return () => clearTimeout(id);
  }, [deferredQuery]);

  const selectRecent = useCallback((term: string) => {
    setQuery(term);
    setActiveCategory(undefined);
  }, []);

  const deleteRecent = useCallback((e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches(removeRecent(term));
  }, []);

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      {/* Search bar */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3 bg-cream z-10">
        <div className="flex-1 flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-green-500">
          <Search size={20} className="text-muted flex-shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent px-3 outline-none text-ink font-medium"
            placeholder="Search produce…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted hover:text-ink">
              <X size={18} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-ink hover:bg-gray-50 flex-shrink-0"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
        {!hasSearch ? (
          <div>
            {/* Browse Farmers CTA */}
            <button
              onClick={() => navigate('/buyer/farmers')}
              className="w-full mb-6 flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-400 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green flex-shrink-0">
                <Users size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-sm text-ink">Looking for farmers?</p>
                <p className="text-xs text-muted">Browse all verified farmers near you</p>
              </div>
              <span className="text-xs font-bold text-green group-hover:underline">Browse →</span>
            </button>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-ink">Recent Searches</h3>
                  <button
                    onClick={() => setRecentSearches(clearAllRecent())}
                    className="text-xs text-muted hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear all
                  </button>
                </div>
                <div className="space-y-2 mb-8">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => selectRecent(term)}
                      className="w-full flex items-center gap-3 text-muted hover:text-ink cursor-pointer text-left group py-1"
                    >
                      <Clock size={16} className="flex-shrink-0" />
                      <span className="font-medium text-sm flex-1">{term}</span>
                      <span
                        role="button"
                        onClick={(e) => deleteRecent(e, term)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-opacity"
                      >
                        <X size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Popular Categories */}
            <h3 className="font-bold text-ink mb-3">Popular Categories</h3>
            {catsLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-9 w-24 rounded-full bg-white animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted">No categories yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name === activeCategory ? undefined : cat.name)}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm border transition-all ${
                      cat.name === activeCategory
                        ? 'bg-green text-white border-green'
                        : 'bg-white text-ink border-gray-100'
                    }`}
                  >
                    {cat.name}
                    <span className="ml-1.5 text-[10px] opacity-60">({cat.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              🔍
            </div>
            <h3 className="font-bold text-ink mb-1">
              Searching for "{deferredQuery || activeCategory}"
            </h3>
            <p className="text-sm text-muted">Finding the best local produce…</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              🌾
            </div>
            <h3 className="font-bold text-ink mb-1">No results found</h3>
            <p className="text-sm text-muted">Try a different search or adjust your filters</p>
          </div>
        ) : (
          <>
            {/* Active category chip */}
            {activeCategory && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted">{results.length} results in</span>
                <button
                  onClick={() => setActiveCategory(undefined)}
                  className="flex items-center gap-1 px-3 py-1 bg-green text-white rounded-full text-xs font-bold"
                >
                  {activeCategory} <X size={12} />
                </button>
              </div>
            )}
            <div className="space-y-4">
              {results.map((p) => (
                <SearchResultCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  price={p.price}
                  unit={p.unit}
                  farmer={p.farmer?.user?.name ?? 'Farmer'}
                  farmerId={p.farmer?.userId ?? ''}
                  image={resolveMediaUrl(p.images[0]) ?? ''}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="bg-white w-full rounded-t-[2rem] p-6 relative z-10 flex flex-col max-h-[80%]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold text-ink">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-muted">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 space-y-6">
              <div>
                <h3 className="font-bold text-ink mb-3">Price Range</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <span className="text-xs text-muted block mb-1">Min (₵)</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-transparent outline-none font-bold text-ink"
                    />
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <span className="text-xs text-muted block mb-1">Max (₵)</span>
                    <input
                      type="number"
                      placeholder="500"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-transparent outline-none font-bold text-ink"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-ink mb-3">Distance</h3>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {['< 5km', '< 10km', '< 20km', 'Anywhere'].map((dist, i) => (
                    <button
                      key={dist}
                      onClick={() => setDistanceIdx(i)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        i === distanceIdx ? 'bg-green text-white shadow-sm' : 'bg-gray-50 text-ink'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setDistanceIdx(3);
                  setShowFilters(false);
                }}
              >
                Reset
              </Button>
              <Button className="flex-[2]" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function SearchResultCard({
  id,
  title,
  price,
  unit,
  farmer,
  farmerId,
  image,
}: {
  id: string;
  title: string;
  price: number;
  unit: string;
  farmer: string;
  farmerId: string;
  image: string;
}) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  return (
    <Card
      className="p-3 flex gap-3 items-center bg-green border-none"
      onClick={() => navigate(`/buyer/product/${id}`)}
    >
      <div className="w-20 h-20 bg-white/20 rounded-2xl overflow-hidden flex-shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-white leading-tight mb-1 line-clamp-2">{title}</h4>
        <p className="text-xs text-green-100 mb-2">By {farmer}</p>
        <p className="font-bold text-white text-sm">
          ₵{price.toFixed(2)}{' '}
          <span className="font-normal text-green-100 text-xs">/ {unit}</span>
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          addItem({ id, title, pricePerUnit: price, farmer, farmerId, image, unit });
          navigate('/buyer/cart');
        }}
        className="w-9 h-9 bg-white text-green rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 hover:bg-green-50"
      >
        <Plus size={18} />
      </button>
    </Card>
  );
}
