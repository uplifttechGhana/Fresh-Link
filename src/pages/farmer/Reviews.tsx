import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Star } from 'lucide-react';
import { useFarmerReviews, FarmerReview } from '../../lib/hooks/useProduce';
import { useAuthStore } from '../../lib/authStore';

export function Reviews() {
  const user = useAuthStore((s) => s.user);
  const { data: reviews = [], isLoading } = useFarmerReviews(user?.id);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }));

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Ratings & Reviews" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 space-y-6">
        {/* Summary Card */}
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-4xl font-display font-extrabold text-ink leading-none mb-1">
                {averageRating}
              </h2>
              <div className="flex text-orange mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= parseFloat(averageRating) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-xs text-muted">{reviews.length} reviews</p>
            </div>

            <div className="flex-1 space-y-1.5 border-l border-gray-100 pl-6">
              {ratingCounts.map(({ star, percentage }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-2 font-bold text-ink">{star}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Review List */}
        <div className="space-y-4">
          <h3 className="font-bold text-ink">Recent Reviews</h3>
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <Star size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm mt-1">Complete orders to start receiving reviews.</p>
            </div>
          ) : (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: FarmerReview }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-2">
        <Avatar name={review.buyer.name} src={review.buyer.avatarUrl} className="w-10 h-10 rounded-full bg-gray-100" />
        <div className="flex-1">
          <h4 className="font-bold text-sm text-ink">{review.buyer.name}</h4>
          <div className="flex items-center justify-between">
            <div className="flex text-orange">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={12} fill={s <= review.rating ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="text-[10px] text-muted">
              {new Date(review.createdAt).toLocaleDateString('en-GH', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-ink leading-relaxed">{review.comment}</p>
      )}
    </Card>
  );
}
