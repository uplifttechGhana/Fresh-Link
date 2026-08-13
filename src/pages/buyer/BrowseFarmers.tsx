import React, { useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Star } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { useFarmersList, type FarmerSummary } from '../../lib/hooks/useProduce';

export function BrowseFarmers() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const { data, isLoading } = useFarmersList({ search: deferredQuery || undefined, limit: 30 });
  const farmers = data?.items ?? [];

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Browse Farmers" showBack />

      {/* Search bar */}
      <div className="px-6 pt-2 pb-4 bg-cream">
        <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-green-500">
          <Search size={18} className="text-muted flex-shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent px-3 outline-none text-ink font-medium text-sm"
            placeholder="Search farmers, farm name, location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={16} className="text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : farmers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-4xl mb-3">👨‍🌾</span>
            <p className="font-bold text-ink">No farmers found</p>
            <p className="text-sm text-muted mt-1">
              {query ? `No results for "${query}"` : 'No farmers have registered yet'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted font-medium mb-4">
              {data?.total ?? 0} farmer{(data?.total ?? 0) !== 1 ? 's' : ''} available
            </p>
            <div className="space-y-3">
              {farmers.map((farmer, idx) => (
                <FarmerCard key={farmer.id} farmer={farmer} rank={idx + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FarmerCard({ farmer, rank }: { farmer: FarmerSummary; rank: number }) {
  const navigate = useNavigate();

  return (
    <Card
      className="p-4 flex items-center gap-4"
      onClick={() => navigate(`/buyer/farmer/${farmer.userId}`)}
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <Avatar name={farmer.user.name} src={farmer.user.avatarUrl} className="w-full h-full" />
        </div>
        {rank <= 3 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: rank === 1 ? '#f59e0b' : rank === 2 ? '#9ca3af' : '#b45309' }}>
            {rank}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-ink text-sm truncate">{farmer.user.name}</h4>
        {(farmer.farmName) && (
          <p className="text-xs text-muted truncate">{farmer.farmName}</p>
        )}
        {farmer.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-muted flex-shrink-0" />
            <span className="text-xs text-muted truncate">{farmer.location}</span>
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <Star size={11} className="text-orange fill-orange" />
            <span className="text-xs font-bold text-ink">{farmer.rating.toFixed(1)}</span>
            {farmer.totalReviews > 0 && (
              <span className="text-xs text-muted">({farmer.totalReviews})</span>
            )}
          </div>
          <span className="text-xs text-muted">
            {farmer._count.produce} active listing{farmer._count.produce !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <span className="text-xs font-bold text-green bg-green-50 px-3 py-1 rounded-full">
          View
        </span>
      </div>
    </Card>
  );
}
