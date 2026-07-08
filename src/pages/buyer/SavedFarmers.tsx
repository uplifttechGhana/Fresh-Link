import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { MapPin } from 'lucide-react';
import { useSavedFarmers, useUnsaveFarmer } from '../../lib/hooks/useSavedFarmers';
import { BottomNav } from '../../components/ui/BottomNav';

export function SavedFarmers() {
  const navigate = useNavigate();
  const { data: savedFarmers = [], isLoading } = useSavedFarmers();
  const unsave = useUnsaveFarmer();

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Saved Farmers" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : savedFarmers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <span className="text-3xl">👨‍🌾</span>
            </div>
            <h3 className="font-display font-bold text-lg text-ink mb-2">No Saved Farmers</h3>
            <p className="text-muted text-sm max-w-[200px]">
              Farmers you follow will appear here for quick access.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedFarmers.map((farmer, idx) => (
              <motion.div
                key={farmer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="p-4 flex items-center gap-4"
                  onClick={() => navigate(`/buyer/farmer/${farmer.id}`)}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    <img
                      src={farmer.avatarUrl ?? `https://i.pravatar.cc/150?u=${farmer.id}`}
                      alt={farmer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-ink text-base truncate">{farmer.name}</h4>
                    {farmer.farmerProfile?.location && (
                      <div className="flex items-center text-xs text-muted mt-1">
                        <MapPin size={12} className="mr-1" />
                        <span className="truncate">{farmer.farmerProfile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {farmer.farmerProfile?.rating != null && (
                        <div className="flex items-center gap-1">
                          <span className="text-orange text-xs">★</span>
                          <span className="text-xs font-bold text-ink">
                            {farmer.farmerProfile.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unsave.mutate(farmer.id);
                    }}
                    disabled={unsave.isPending}
                    className="px-4 py-1.5 rounded-full text-xs font-bold border border-green text-green hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    Following
                  </button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
