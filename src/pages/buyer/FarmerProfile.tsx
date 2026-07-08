import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, MessageCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { useFarmerProfile } from '../../lib/hooks/useProduce';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { useStartConversation } from '../../lib/hooks/useChat';
import { useSavedFarmers, useSaveFarmer, useUnsaveFarmer } from '../../lib/hooks/useSavedFarmers';
import { useAuthStore } from '../../lib/authStore';
import { useCartStore } from '../../lib/cartStore';
import { resolveMediaUrl } from '../../lib/mediaUrl';

export function FarmerProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: farmer, isLoading } = useFarmerProfile(id);
  const startConv = useStartConversation();
  const { data: savedFarmers = [] } = useSavedFarmers(user?.role === 'buyer');
  const saveFarmer = useSaveFarmer();
  const unsaveFarmer = useUnsaveFarmer();

  const farmerUserId = farmer?.userId ?? id ?? '';
  const isFollowing = savedFarmers.some((f) => f.id === farmerUserId);
  const followPending = saveFarmer.isPending || unsaveFarmer.isPending;
  const showFollow = user?.role === 'buyer';

  const handleFollow = async () => {
    if (!farmerUserId) return;
    try {
      if (isFollowing) {
        await unsaveFarmer.mutateAsync(farmerUserId);
        toast.success('Unfollowed farmer');
      } else {
        await saveFarmer.mutateAsync(farmerUserId);
        toast.success('Now following farmer');
      }
    } catch {
      toast.error('Could not update follow status');
    }
  };

  const handleChat = async () => {
    if (!farmer) return;
    try {
      const conv = await startConv.mutateAsync({ farmerId: farmer.userId });
      navigate(`/buyer/chat/${conv.id}`);
    } catch {
      navigate(`/buyer/chat/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="w-full h-full bg-cream flex flex-col items-center justify-center px-6">
        <p className="text-muted font-medium">Farmer profile not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-green font-bold">Go Back</button>
      </div>
    );
  }

  const farmName = farmer.farmName ?? `${farmer.user.name} Farm`;
  const location = farmer.location ?? farmer.user.location ?? 'Ghana';
  const avatar = farmer.user.avatarUrl ?? `https://i.pravatar.cc/150?u=${farmer.userId}`;

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <div className="absolute top-0 inset-x-0 z-20">
        <TopBar showBack transparent />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {/* Cover Image */}
        <div className="w-full h-48 bg-green-800 relative">
          <img
            src="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=800"
            alt="Farm"
            className="w-full h-full object-cover opacity-60" />
          
        </div>

        {/* Profile Info */}
        <div className="px-6 relative -mt-12 mb-6">
          <div className="flex justify-between items-end mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-cream overflow-hidden bg-white shadow-sm">
              <img
                src={avatar}
                alt={farmer.user.name}
                className="w-full h-full object-cover" />
              
            </div>
            <div className="flex gap-2 pb-2 mt-14">
              <button
                className="h-10 px-4 rounded-full bg-white shadow-sm flex items-center justify-center gap-2 text-green font-bold text-sm"
                onClick={handleChat}>
                
                <MessageCircle size={18} />
                Message
              </button>
              {showFollow && (
                <button
                  onClick={handleFollow}
                  disabled={followPending}
                  className={`px-5 h-10 rounded-full font-bold text-sm shadow-sm transition-colors disabled:opacity-50 ${isFollowing ? 'bg-gray-100 text-ink' : 'bg-green text-white'}`}
                >
                  {followPending ? '…' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-extrabold text-ink">
              {farmName}
            </h1>
            <div className="bg-green-100 text-green text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green rounded-full animate-pulse"></div>
              Live
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted mb-4">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-orange fill-orange" />
              <span className="font-bold text-ink">{farmer.rating.toFixed(1)}</span>
              <span>({farmer.totalReviews} reviews)</span>
            </div>
          </div>

          {farmer.bio && (
            <p className="text-sm text-muted leading-relaxed">
              {farmer.bio}
            </p>
          )}
        </div>

        {/* Produce Grid */}
        <div className="px-6">
          <TypewriterText text="Available Produce" className="font-display font-bold text-lg text-ink mb-4" />
          {farmer.produce?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {farmer.produce.map((p) => (
                <FarmerProductCard
                  key={p.id}
                  produce={p}
                  farmerName={farmer.user.name}
                  farmerId={farmer.userId}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">No active listings</p>
          )}
        </div>
      </div>
    </div>);

}

function FarmerProductCard({
  produce,
  farmerName: farmerNameProp,
  farmerId: farmerIdProp,
}: {
  produce: { id: string; title: string; price: number; unit: string; images: string[] };
  farmerName?: string;
  farmerId?: string;
}) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const image = resolveMediaUrl(produce.images[0]);
  const farmerName = farmerNameProp ?? 'Farmer';
  const farmerId = farmerIdProp ?? '';

  return (
    <Card
      className="p-3 flex flex-col bg-green border-none"
      onClick={() => navigate(`/buyer/product/${produce.id}`)}>
      
      <div className="w-full h-28 bg-white/20 rounded-2xl mb-3 overflow-hidden relative flex items-center justify-center">
        {image ? (
          <img src={image} alt={produce.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">🌿</span>
        )}
      </div>
      <h4 className="font-bold text-sm text-white leading-tight mb-2 flex-1">
        {produce.title}
      </h4>
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
              image,
              unit: produce.unit,
            });
            navigate('/buyer/cart');
          }}
          className="w-8 h-8 bg-white text-green rounded-xl flex items-center justify-center shadow-sm hover:bg-green-50">
          
          <Plus size={18} />
        </button>
      </div>
    </Card>);

}
