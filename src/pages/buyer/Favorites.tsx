import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageOff, Loader2 } from 'lucide-react';
import { favoriteIcon, favoriteFilledIcon } from '../../assets/icons';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { useFavorites, useToggleFavorite } from '../../lib/hooks/useProduce';
import { resolveMediaUrl } from '../../lib/mediaUrl';

export function Favorites() {
  const navigate = useNavigate();
  const { data: favorites = [], isLoading } = useFavorites();
  const toggle = useToggleFavorite();

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Favorites" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <img src={favoriteIcon} alt="Favorites" className="w-10 h-10 object-contain opacity-40" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink mb-2">No Favorites Yet</h3>
            <p className="text-muted text-sm max-w-[200px]">
              Items you favorite will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favorites.map((product, idx) => {
              const image = resolveMediaUrl(product.images[0]);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className="p-3 flex flex-col h-full relative bg-green border-none"
                    onClick={() => navigate(`/buyer/product/${product.id}`)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle.mutate({ produceId: product.id, isFav: true });
                      }}
                      className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                    >
                      <img src={favoriteFilledIcon} alt="Unfavourite" className="w-4 h-4 object-contain" />
                    </button>

                    <div className="w-full h-28 bg-white/20 rounded-2xl mb-3 overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img
                          src={image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageOff size={28} className="text-gray-300" />
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-white leading-tight mb-2 flex-1">
                      {product.title}
                    </h4>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">
                          ₵{product.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-green-100">/ {product.unit}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
