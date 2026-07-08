import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Play, BookOpen, Search, Loader2 } from 'lucide-react';
import {
  useKnowledgeArticles,
  useKnowledgeCategories,
  useYouTubeVideos,
  toYouTubeRouteId,
} from '../../lib/hooks/useKnowledge';
import { TypewriterText } from '../../components/ui/TypewriterText';

export function KnowledgeHub() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');

  const { data: videos = [], isLoading: videosLoading } = useYouTubeVideos(activeCategory, query);
  const { data: articles = [], isLoading: articlesLoading } = useKnowledgeArticles(activeCategory);
  const { data: categories = [] } = useKnowledgeCategories();

  const filteredArticles = articles.filter((a) =>
    !query || a.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Knowledge Hub" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-gray-100 mb-6 focus-within:ring-2 focus-within:ring-green-500">
          <Search size={20} className="text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent px-3 outline-none text-ink font-medium"
            placeholder="Search tutorials, tips..."
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveCategory(undefined)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!activeCategory ? 'bg-green text-white shadow-sm' : 'bg-white text-muted border border-gray-100'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(activeCategory === cat.name ? undefined : cat.name)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeCategory === cat.name ? 'bg-green text-white shadow-sm' : 'bg-white text-muted border border-gray-100'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <TypewriterText text="Featured Videos" className="font-bold text-ink mb-1" />
        <p className="text-xs text-muted mb-3">Agriculture tutorials from YouTube</p>
        {videosLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No videos found.</p>
        ) : (
          <div className="space-y-4 mb-8">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/farmer/knowledge/video/${toYouTubeRouteId(video.id)}`)}
              >
                <div className="relative h-40 w-full bg-gray-200">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-green backdrop-blur-sm">
                      <Play size={24} className="ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-green uppercase tracking-wider">
                      YouTube
                    </span>
                    <span className="text-[10px] text-muted truncate">{video.channelTitle}</span>
                  </div>
                  <h4 className="font-bold text-sm text-ink line-clamp-2">{video.title}</h4>
                </div>
              </Card>
            ))}
          </div>
        )}

        <TypewriterText text="Quick Guides" className="font-bold text-ink mb-3" />
        {articlesLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-green" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">No guides found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/farmer/knowledge/video/${article.id}`)}
              >
                <div className="w-8 h-8 bg-orange-soft text-orange rounded-full flex items-center justify-center mb-3">
                  <BookOpen size={16} />
                </div>
                <h4 className="font-bold text-sm text-ink mb-1 line-clamp-2">{article.title}</h4>
                {article.category && (
                  <p className="text-[10px] text-muted">{article.category}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
