import React from 'react';
import { useParams } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Play, Share2, Bookmark, ThumbsUp, Loader2, ExternalLink } from 'lucide-react';
import {
  useKnowledgeItem,
  useYouTubeVideo,
  isYouTubeVideoId,
  extractYouTubeId,
} from '../../lib/hooks/useKnowledge';

export function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const isYouTube = isYouTubeVideoId(id);
  const youtubeId = isYouTube ? extractYouTubeId(id!) : undefined;

  const { data: item, isLoading: itemLoading } = useKnowledgeItem(isYouTube ? undefined : id);
  const { data: youtubeVideo, isLoading: youtubeLoading } = useYouTubeVideo(youtubeId);

  const isLoading = isYouTube ? youtubeLoading : itemLoading;
  const video = isYouTube ? youtubeVideo : null;

  const handleShare = async () => {
    const url = isYouTube && youtubeVideo
      ? youtubeVideo.videoUrl
      : item?.videoUrl ?? window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: isYouTube ? youtubeVideo?.title : item?.title,
        url,
      });
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar showBack transparent />

      <div className="flex-1 flex flex-col overflow-y-auto pb-8">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-green" />
          </div>
        ) : isYouTube && !video ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            Video not found.
          </div>
        ) : !isYouTube && !item ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            Content not found.
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-video bg-black flex-shrink-0 -mt-16 z-0">
              {isYouTube && youtubeId ? (
                <iframe
                  title={video?.title ?? 'YouTube video'}
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <>
                  {item?.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                  )}
                  {item?.isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {item.videoUrl ? (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-16 h-16 bg-green rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                        >
                          <Play size={32} className="ml-1.5" />
                        </a>
                      ) : (
                        <div className="w-16 h-16 bg-green rounded-full flex items-center justify-center text-white shadow-lg">
                          <Play size={32} className="ml-1.5" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 pt-6 flex-1">
              {isYouTube ? (
                <>
                  <span className="text-[10px] font-bold text-green uppercase tracking-wider mb-2 block">
                    YouTube · {video?.channelTitle}
                  </span>
                  <h1 className="text-xl font-display font-bold text-ink mb-2 leading-tight">
                    {video?.title}
                  </h1>
                  <p className="text-xs text-muted mb-6">
                    {video?.publishedAt &&
                      new Date(video.publishedAt).toLocaleDateString('en-GH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </p>
                </>
              ) : (
                <>
                  {item?.category && (
                    <span className="text-[10px] font-bold text-green uppercase tracking-wider mb-2 block">
                      {item.category}
                    </span>
                  )}
                  <h1 className="text-xl font-display font-bold text-ink mb-2 leading-tight">
                    {item?.title}
                  </h1>
                  <p className="text-xs text-muted mb-6">
                    {item?.publishedAt &&
                      new Date(item.publishedAt).toLocaleDateString('en-GH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </p>
                </>
              )}

              <div className="flex gap-3 mb-8">
                <button className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-ink hover:bg-gray-50">
                  <ThumbsUp size={18} />
                  <span className="text-[10px] font-bold">Like</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-ink hover:bg-gray-50"
                >
                  <Share2 size={18} />
                  <span className="text-[10px] font-bold">Share</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-ink hover:bg-gray-50">
                  <Bookmark size={18} />
                  <span className="text-[10px] font-bold">Save</span>
                </button>
              </div>

              {isYouTube && video?.videoUrl && (
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-green mb-6 hover:underline"
                >
                  <ExternalLink size={16} />
                  Watch on YouTube
                </a>
              )}

              <h3 className="font-bold text-ink mb-3">Description</h3>
              <p className="text-sm text-muted leading-relaxed mb-8 whitespace-pre-line">
                {isYouTube ? video?.description : item?.body}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
