import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Star, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';

interface DriverReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyer?: { name: string } | null;
}

interface ReviewsResponse {
  items: DriverReview[];
  total: number;
  averageRating: number;
}

function useDriverRatings() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['transport', 'ratings', userId],
    queryFn: () => api.get<ReviewsResponse>('/users/me/transport-reviews'),
    enabled: !!userId,
    retry: false,
  });
}

export function TransportRatings() {
  const { data, isLoading } = useDriverRatings();

  const reviews = data?.items ?? [];
  const totalRatings = data?.total ?? reviews.length;
  const averageRating = data?.averageRating ?? 0;
  const avgStr = averageRating.toFixed(1);

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Ratings & Reviews" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-green" />
          </div>
        ) : (
          <>
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <h2 className="text-4xl font-display font-bold text-ink">{avgStr}</h2>
                  <div className="flex text-orange my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</p>
                </div>

                <div className="flex-1 space-y-1.5">
                  {breakdown.map(({ stars, percentage }) => (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-2 font-medium text-muted">{stars}</span>
                      <Star size={10} className="text-muted" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <h3 className="font-bold text-ink mb-4">Recent Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={`https://i.pravatar.cc/150?u=${review.buyer?.name ?? review.id}`}
                        alt={review.buyer?.name ?? 'Reviewer'}
                        className="w-10 h-10 rounded-full bg-gray-200"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-ink">
                          {review.buyer?.name ?? 'Anonymous'}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex text-orange">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-ink mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
