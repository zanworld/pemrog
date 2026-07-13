import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Bookmark } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

export default function MangaCard({ manga, isFavorite, onToggleFavorite, onClickCard }) {
  const navigate = useNavigate();

  // Safe extraction of fields from Jikan API response structure
  const title = manga.title || manga.title_english || 'Unknown Title';
  const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop';
  const score = manga.score ? manga.score.toFixed(1) : 'N/A';
  const type = manga.type || 'Manga';
  
  // Extract main genres
  const genres = manga.genres?.slice(0, 2).map(g => g.name) || [];

  const [chapterCount, setChapterCount] = React.useState(null);

  React.useEffect(() => {
    if (manga.source === 'mangadex' && !manga.chapters) {
      fetch(`/api/manga/${manga.id || manga.mal_id}/feed`)
        .then(res => res.json())
        .then(data => {
          const count = data.total || (data.data ? data.data.length : 0);
          if (count > 0) {
            setChapterCount(count);
          }
        })
        .catch(err => console.warn('Failed to fetch chapters for card:', err));
    }
  }, [manga.id, manga.mal_id, manga.source, manga.chapters]);

  const chaptersDisplay = manga.chapters || (chapterCount ? `${chapterCount}+` : '?');

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent opening modal
    onToggleFavorite(manga);
  };

  return (
    <div 
      onClick={() => navigate(`/book/${manga.id || manga.mal_id}`)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-brand-cardBg border border-brand-border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-orange/40 hover:shadow-neon"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-brand-darkBg">
        <img 
          src={imageUrl} 
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Dark overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darkBg via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-85" />

        {/* Rating/Score Badge */}
        {manga.source !== 'mangadex' && score !== 'N/A' && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-brand-darkBg/95 px-2.5 py-1 text-xs font-bold text-brand-orange border border-brand-orange/20 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
            <span>{score}</span>
          </div>
        )}

        {/* Format Badge (Manga, Manhwa, etc) */}
        <div className="absolute right-3 top-3 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-brand-textMain border border-white/10">
          {type}
        </div>

        {/* Source Badge */}
        <div className="absolute left-3 bottom-3">
          <DataSourceBadge source={manga.source} />
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-darkBg/95 text-brand-textMuted border border-brand-border/60 transition-all duration-200 hover:text-brand-orange hover:border-brand-orange/30 hover:scale-110 shadow-sm"
        >
          <Heart className={`h-4.5 w-4.5 transition-colors ${isFavorite ? 'fill-brand-orange text-brand-orange' : 'text-brand-textMuted'}`} />
        </button>
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Genres */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {genres.map((genre, idx) => (
            <span key={idx} className="rounded bg-brand-darkBg border border-brand-border/80 px-2 py-0.5 text-[10px] font-medium text-brand-textMuted uppercase tracking-wider">
              {genre}
            </span>
          ))}
          {genres.length === 0 && (
            <span className="rounded bg-brand-darkBg border border-brand-border/80 px-2 py-0.5 text-[10px] font-medium text-brand-textMuted uppercase tracking-wider">
              General
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-brand-textMain group-hover:text-brand-orange transition-colors duration-200 mb-1.5">
          {title}
        </h3>

        {/* Details (Chapters, etc) */}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-brand-textMuted border-t border-brand-border/40">
          <span className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5 text-brand-orange" />
            <span>{chaptersDisplay} Chapters</span>
          </span>
          <span className="font-semibold text-brand-orange group-hover:text-brand-accent transition-colors duration-200">
            Show Info →
          </span>
        </div>
      </div>
    </div>
  );
}
