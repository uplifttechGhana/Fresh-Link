import { useState, useDeferredValue, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ArrowUpDown, Plus, Search, X, ChevronRight, ImageOff } from 'lucide-react';
import { useProduceList, type ProduceListing } from '../../lib/hooks/useProduce';
import { useCartStore } from '../../lib/cartStore';
import { resolveMediaUrl } from '../../lib/mediaUrl';

type SortKey = 'price' | 'rating';

interface ProduceGroup {
  title: string;
  items: ProduceListing[];
  minPrice: number;
  unit: string;
  image: string;
}

export function PriceCompare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const initialTitle = searchParams.get('title') ?? '';
  const [query, setQuery] = useState(initialTitle);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(initialTitle || null);
  const [sortBy, setSortBy] = useState<SortKey>('price');

  const deferredQuery = useDeferredValue(query);

  const { data, isLoading, isFetching } = useProduceList({
    search: deferredQuery.trim() || undefined,
    limit: 100,
  });

  // The backend searches title + description + category, so filter client-side
  // to only show items whose TITLE contains the query.
  const titleQuery = deferredQuery.trim().toLowerCase();
  const allListings = (data?.items ?? []).filter(
    (item) => !titleQuery || item.title.toLowerCase().startsWith(titleQuery),
  );

  // Group matching produce by normalised title
  const groups = useMemo<ProduceGroup[]>(() => {
    const map = new Map<string, ProduceListing[]>();
    for (const item of allListings) {
      const key = item.title.toLowerCase().trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, items]) => ({
        title: items[0].title,
        items,
        minPrice: Math.min(...items.map((i) => i.price)),
        unit: items[0].unit,
        image: resolveMediaUrl(items[0].images[0]) ?? '',
      }));
  }, [allListings]);

  // Listings for the selected title, re-sorted
  const selectedListings = useMemo<ProduceListing[]>(() => {
    if (!selectedTitle) return [];
    const filtered = allListings.filter(
      (l) => l.title.toLowerCase().trim() === selectedTitle.toLowerCase().trim(),
    );
    return [...filtered].sort((a, b) =>
      sortBy === 'price' ? a.price - b.price : b.farmer.rating - a.farmer.rating,
    );
  }, [allListings, selectedTitle, sortBy]);

  const bestPrice =
    selectedListings.length > 0 ? Math.min(...selectedListings.map((l) => l.price)) : 0;

  const chartData = selectedListings.map((l) => ({
    farmer: l.farmer?.user?.name ?? 'Farmer',
    price: l.price,
    id: l.id,
  }));

  function selectGroup(g: ProduceGroup) {
    setQuery(g.title);
    setSelectedTitle(g.title);
  }

  function clearAll() {
    setQuery('');
    setSelectedTitle(null);
  }

  const showSuggestions = deferredQuery.trim().length > 0 && !selectedTitle;
  const showComparison = !!selectedTitle && selectedListings.length > 0;
  const showEmpty = !query && !selectedTitle;

  const isStale = isFetching && deferredQuery !== query;

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Compare Prices" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-10">

        {/* ── Search bar ── */}
        <div className="mb-6">
          <div className={`flex items-center bg-white rounded-2xl px-4 h-12 shadow-sm border transition-all
              ${isStale ? 'border-green-200' : 'border-gray-100'}
              focus-within:ring-2 focus-within:ring-green-500`}>
            <Search size={18} className="text-muted flex-shrink-0" />
            <input
              type="text"
              autoFocus
              className="flex-1 bg-transparent px-3 outline-none text-ink font-medium text-sm"
              placeholder="Type a produce name…  e.g. tomato, yam"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedTitle) setSelectedTitle(null);
              }}
            />
            {query && (
              <button onClick={clearAll} className="ml-1">
                <X size={16} className="text-muted" />
              </button>
            )}
          </div>
        </div>

        {/* ── Initial empty state ── */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center h-52 text-center gap-3">
            <span className="text-5xl">⚖️</span>
            <p className="font-bold text-ink">Find the best price</p>
            <p className="text-sm text-muted px-6">
              Start typing a produce name and we'll show you who's selling it and at what price.
            </p>
          </div>
        )}

        {/* ── Suggestions list ── */}
        {showSuggestions && (
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
                  ))}
                </div>
              </motion.div>
            ) : groups.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-40 text-center gap-2"
              >
                <span className="text-3xl">🔍</span>
                <p className="font-bold text-ink text-sm">No produce found for "{deferredQuery}"</p>
                <p className="text-xs text-muted">Try a different spelling or name</p>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs text-muted font-semibold mb-3 uppercase tracking-wide">
                  {groups.length} produce type{groups.length !== 1 ? 's' : ''} — tap to compare
                </p>
                <div className="space-y-2">
                  {groups.map((group, idx) => (
                    <motion.div
                      key={group.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card
                        className="p-3 flex items-center gap-3 bg-green border-none"
                        onClick={() => selectGroup(group)}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center">
                          {group.image ? (
                            <img src={group.image} alt={group.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageOff size={18} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white">{group.title}</p>
                          <p className="text-xs text-green-100 mt-0.5">
                            {group.items.length} seller{group.items.length !== 1 ? 's' : ''}
                            &nbsp;·&nbsp;from&nbsp;
                            <span className="font-bold text-white">
                              ₵{group.minPrice.toFixed(2)}/{group.unit}
                            </span>
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-white/80 flex-shrink-0" />
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Price comparison view ── */}
        {showComparison && (
          <AnimatePresence>
            <motion.div
              key={selectedTitle}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-5">
                <h3 className="font-display font-bold text-xl text-ink">{selectedTitle}</h3>
                <p className="text-sm text-muted mt-0.5">
                  {selectedListings.length} seller{selectedListings.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {/* Chart */}
              <Card className="p-4 mb-6">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-4">
                  Price comparison
                </p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                      <XAxis
                        dataKey="farmer"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7770' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7770' }}
                        tickFormatter={(v) => `₵${v}`}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(21,128,61,0.05)' }}
                        contentStyle={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`₵${v.toFixed(2)}`, 'Price']}
                      />
                      <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.price === bestPrice ? '#15803D' : '#D1E8D9'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted text-center mt-1">
                  Green bar = best price
                </p>
              </Card>

              {/* Sort toggle + offer cards */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-ink">Available Offers</h4>
                <button
                  onClick={() => setSortBy((s) => (s === 'price' ? 'rating' : 'price'))}
                  className="flex items-center gap-1 text-xs font-bold text-green bg-green/10 px-3 py-1.5 rounded-full"
                >
                  <ArrowUpDown size={11} />
                  {sortBy === 'price' ? 'By Price' : 'By Rating'}
                </button>
              </div>

              <div className="space-y-3">
                {selectedListings.map((offer, idx) => {
                  const farmerName = offer.farmer?.user?.name ?? 'Farmer';
                  const image = resolveMediaUrl(offer.images[0]) ?? '';
                  const isBest = offer.price === bestPrice;
                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card
                        className={`p-4 bg-green border-none ${isBest ? 'ring-2 ring-white' : ''}`}
                        onClick={() => navigate(`/buyer/product/${offer.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {image ? (
                              <img src={image} alt={offer.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageOff size={16} className="text-gray-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-white">{farmerName}</p>
                              {isBest && (
                                <span className="text-[10px] font-bold text-green bg-white px-2 py-0.5 rounded-full">
                                  Best
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-yellow-300 text-xs">★</span>
                              <span className="text-xs text-green-100">{offer.farmer.rating.toFixed(1)}</span>
                              {offer.stock > 0 && offer.stock <= 5 && (
                                <span className="text-[10px] font-bold text-orange-200">Low stock</span>
                              )}
                              {offer.stock === 0 && (
                                <span className="text-[10px] font-bold text-red-200">Out of stock</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <span className="block font-bold text-white">₵{offer.price.toFixed(2)}</span>
                              <span className="block text-[10px] text-green-100">/{offer.unit}</span>
                            </div>
                            <button
                              disabled={offer.stock === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem({
                                  id: offer.id,
                                  title: offer.title,
                                  pricePerUnit: offer.price,
                                  farmer: farmerName,
                                  farmerId: offer.farmer?.userId ?? '',
                                  image,
                                  unit: offer.unit,
                                });
                                navigate('/buyer/cart');
                              }}
                              className="w-8 h-8 bg-white text-green rounded-xl flex items-center justify-center shadow-sm disabled:opacity-40"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Selected title but no listings (edge case: produce exists but 0 active listings) */}
        {selectedTitle && !isLoading && selectedListings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
            <span className="text-3xl">🛒</span>
            <p className="font-bold text-ink text-sm">No active listings for "{selectedTitle}"</p>
            <p className="text-xs text-muted">Try searching for a different produce</p>
          </div>
        )}
      </div>
    </div>
  );
}
