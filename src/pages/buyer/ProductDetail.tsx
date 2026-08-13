import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { useProduceDetail } from '../../lib/hooks/useProduce';
import { useCartStore } from '../../lib/cartStore';
import { resolveMediaUrl, resolveMediaUrls } from '../../lib/mediaUrl';
import { Avatar } from '../../components/ui/Avatar';

const QUANTITY_OPTIONS = ['500 g', '1 kg', '1.5 kg', '2 kg', '2.5 kg', '3 kg'];

function parseQtyMultiplier(label: string): number {
  if (label.includes('g')) return parseFloat(label) / 1000;
  return parseFloat(label) || 1;
}

export function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: produce, isLoading } = useProduceDetail(id);
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState('1 kg');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const basePrice = produce?.price ?? 0;
  const currentPrice = basePrice * parseQtyMultiplier(quantity);
  const images = resolveMediaUrls(produce?.images);
  const video = resolveMediaUrl(produce?.video);
  const mediaCount = images.length + (video ? 1 : 0);
  const farmerName = produce?.farmer?.user?.name ?? 'Farmer';
  const farmerId = produce?.farmer?.userId ?? '';
  const farmerRating = produce?.farmer?.rating?.toFixed(1) ?? '—';
  const farmerAvatar = produce?.farmer?.user?.avatarUrl ?? null;

  if (isLoading) {
    return (
      <div className="w-full h-full bg-cream flex flex-col">
        <div className="absolute top-0 inset-x-0 z-20">
          <TopBar showBack transparent />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!produce) {
    return (
      <div className="w-full h-full bg-cream flex flex-col items-center justify-center px-6">
        <p className="text-muted font-medium">Produce not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-green font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar
          showBack
          rightAction="bookmark"
          onRightAction={() => setIsBookmarked(!isBookmarked)}
          transparent />
        
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Product Image Area */}
        <div className="w-full h-[340px] bg-white rounded-b-[3rem] shadow-sm relative pt-16 px-8 flex items-center justify-center">
          {activeImage < images.length ? (
            <img
              src={images[activeImage]}
              alt={produce.title}
              className="w-full h-full object-contain pb-8"
            />
          ) : video ? (
            <video
              src={video}
              controls
              className="w-full h-full object-contain pb-8"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200 pb-8">
              <span className="text-6xl">🌿</span>
            </div>
          )}
          {/* Pagination dots */}
          {mediaCount > 1 && (
            <div className="absolute bottom-6 flex gap-1.5">
              {Array.from({ length: mediaCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-4 bg-green' : 'w-1.5 bg-green-200'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-6 pt-6">
          <div className="flex justify-between items-start mb-4 gap-4">
            <h1 className="text-2xl font-display font-extrabold text-ink leading-tight">
              {produce.title}
            </h1>
            {isBookmarked &&
            <div className="bg-green-50 text-green p-2 rounded-full flex-shrink-0">
                <span className="text-sm">🔖</span>
              </div>
            }
          </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(`/buyer/farmer/${farmerId}`)}
              className="flex items-center gap-3 text-left">
              
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Avatar name={farmerName} src={farmerAvatar} className="w-full h-full" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{farmerName}</p>
                <div className="flex items-center gap-1">
                  <span className="text-orange text-[10px]">★</span>
                  <span className="text-xs text-muted font-medium">{farmerRating}</span>
                </div>
              </div>
            </button>
            <div className="text-right">
              <p className="text-lg font-bold text-ink">
                ₵{currentPrice.toFixed(2)}
                <span className="text-sm text-muted font-normal">
                  / {quantity}
                </span>
              </p>
            </div>
          </div>

          {produce.description && (
            <p className="text-sm text-muted leading-relaxed mb-6">
              {isExpanded ? produce.description : produce.description.slice(0, 120)}
              {produce.description.length > 120 && (
                <>
                  {!isExpanded && '... '}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-ink font-bold">
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </>
              )}
            </p>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-ink">Select Quantity</h3>
              <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="Custom"
                  className="w-16 bg-transparent text-sm font-bold text-ink outline-none text-right"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) setQuantity(`${val} kg`);
                  }} />
                
                <span className="text-xs font-bold text-muted ml-1">kg</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {QUANTITY_OPTIONS.map(
                (q) =>
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all
                    ${quantity === q ? 'bg-ink text-white' : 'bg-white text-ink shadow-sm hover:bg-gray-50'}`}>
                  
                    {q}
                  </button>

              )}
              {quantity &&
              !QUANTITY_OPTIONS.includes(quantity) &&
              <button className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all bg-ink text-white">
                    {quantity}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-cream/90 backdrop-blur-md z-30">
        <div className="flex items-center bg-green rounded-2xl shadow-float overflow-hidden h-14">
          <button
            onClick={() => {
              addItem({
                id: produce.id,
                title: produce.title,
                pricePerUnit: basePrice,
                farmer: farmerName,
                farmerId,
                image: images[0],
                unit: produce.unit,
              });
              navigate('/buyer/cart');
            }}
            className="flex-1 h-full text-white font-bold flex items-center justify-center hover:bg-green-700 transition-colors">
            
            Add to cart
          </button>
          <div className="w-[1px] h-6 bg-white/30"></div>
          <div className="px-6 h-full flex items-center justify-center text-white font-bold">
            ₵{currentPrice.toFixed(2)}
          </div>
        </div>
      </div>
    </div>);

}
