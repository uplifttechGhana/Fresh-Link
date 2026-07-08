import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ImageOff, X } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BottomNav } from '../../components/ui/BottomNav';
import {
  useMyListings,
  useUpdateProduce,
  useDeleteProduce,
  MyProduceListing,
} from '../../lib/hooks/useProduce';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const TABS = ['Active', 'Out of Stock'] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS: Record<Tab, string> = {
  Active: 'active',
  'Out of Stock': 'out_of_stock',
};

export function MyProduce() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Active');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: produce = [], isLoading } = useMyListings();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
    else setQuery('');
  }, [searchOpen]);

  const byTab = produce.filter((p) => p.status === TAB_STATUS[activeTab]);
  const filteredProduce = query.trim()
    ? byTab.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    : byTab;

  return (
    <div className="w-full h-full bg-cream flex flex-col relative min-h-0">
      <div className="flex-shrink-0">
        <TopBar
          title="My Produce"
          showBack
          rightAction="search"
          onRightAction={() => setSearchOpen((o) => !o)}
        />

        {/* Inline search bar — below header so it is not clipped under the top bar */}
        {searchOpen && (
          <div className="px-6 pt-2 pb-3 bg-cream flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 flex items-center bg-white rounded-full px-4 h-11 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-green-500">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent outline-none text-sm text-ink font-medium"
                placeholder="Search your listings…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-muted hover:text-ink">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="text-sm font-bold text-green flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-24">
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProduce.length === 0 ? (
          <div className="text-center py-12 text-muted">
            {query.trim() ? (
              <p className="font-medium">No listings match "{query}"</p>
            ) : activeTab === 'Out of Stock' ? (
              <p className="font-medium">No out-of-stock items. Toggle a listing off to mark it as out of stock.</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="font-medium">No active listings yet.</p>
                <Button
                  size="lg"
                  onClick={() => navigate('/farmer/produce/add')}
                  className="gap-2"
                >
                  <Plus size={20} strokeWidth={2.5} />
                  Add your first listing
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProduce.map((item) => (
              <ProduceItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-24 right-6 z-30">
        <button
          onClick={() => navigate('/farmer/produce/add')}
          className="w-14 h-14 bg-green text-white rounded-full shadow-fab flex items-center justify-center hover:bg-green-700 transition-colors"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function ProduceItem({ item }: { item: MyProduceListing }) {
  const navigate = useNavigate();
  const updateProduce = useUpdateProduce();
  const deleteProduce = useDeleteProduce();
  const isActive = item.status === 'active';
  const image = resolveMediaUrl(item.images[0]);

  const toggleStatus = () => {
    updateProduce.mutate({
      id: item.id,
      status: isActive ? 'out_of_stock' : 'active',
    });
  };

  return (
    <Card className="p-4 flex gap-4 items-center bg-green">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative">
        {image ? (
          <img
            src={image}
            alt={item.title}
            className={`w-full h-full object-cover ${!isActive ? 'grayscale opacity-50' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageOff size={28} />
          </div>
        )}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full">
              Out
            </span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-sm text-white leading-tight">{item.title}</h4>
          <div
            onClick={toggleStatus}
            className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
              isActive ? 'bg-white/30' : 'bg-black/20'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
        <p className="font-bold text-white text-sm mb-2">
          ₵{item.price.toFixed(2)}{' '}
          <span className="text-xs text-green-100 font-normal">/ {item.unit}</span>
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-100">
            Stock:{' '}
            <span className={`font-medium ${item.stock <= 5 ? 'text-orange-200' : 'text-white'}`}>
              {item.stock} {item.unit}
            </span>
            {item.stock > 0 && item.stock <= 5 && (
              <span className="ml-1.5 text-[10px] font-bold text-orange-600 bg-white px-1.5 py-0.5 rounded-full">
                Low stock
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/farmer/produce/edit/${item.id}`)}
              className="text-white/70 hover:text-white"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this listing?')) deleteProduce.mutate(item.id);
              }}
              className="text-red-200 hover:text-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
