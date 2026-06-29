import React from 'react';
import { X, Star, Heart, Calendar, BookOpen, User, BookOpenCheck, TrendingUp } from 'lucide-react';

export default function MangaDetailModal({ manga, onClose, isFavorite, onToggleFavorite, onInteractiveFilter }) {
  if (!manga) return null;

  const title = manga.title || manga.title_english || 'Unknown Title';
  const alternativeTitle = manga.title_japanese || manga.title_synonyms?.[0] || '';
  const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop';
  const score = manga.score ? manga.score.toFixed(1) : 'N/A';
  const rank = manga.rank || 'N/A';
  const popularity = manga.popularity || 'N/A';
  const chapters = manga.chapters || 'Unknown';
  const volumes = manga.volumes || 'Unknown';
  const status = manga.status || 'Unknown';
  const publishedStr = manga.published?.string || 'Unknown Period';
  const synopsis = manga.synopsis || 'No description available for this manga.';
  
  const genres = manga.genres || [];
  const authors = manga.authors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl rounded-2xl glass-modal overflow-hidden text-brand-textMain shadow-2xl animate-fade-in my-8">
        
        {/* Banner Graphic background */}
        <div className="absolute top-0 left-0 w-full h-48 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${imageUrl})` }} />
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-transparent to-brand-darkBg" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-darkBg/60 text-brand-textMuted border border-white/10 hover:text-brand-textMain hover:bg-brand-darkBg/90 transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal content */}
        <div className="relative p-6 sm:p-8 pt-20">
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            
            {/* Cover Column */}
            <div className="w-48 mx-auto md:mx-0 flex-shrink-0">
              <div className="overflow-hidden rounded-xl border border-brand-border/80 shadow-lg aspect-[3/4.2] bg-brand-darkBg">
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
              </div>
              
              <div className="mt-4 flex flex-col gap-2">
                {/* Read Manga Button */}
                <button
                  onClick={() => window.open(`https://myanimelist.net/manga/${manga.mal_id}`, '_blank')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 bg-brand-orange hover:bg-brand-accent text-white shadow-neon hover:shadow-neon-hover group"
                >
                  <BookOpen className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                  View on MyAnimeList
                </button>

                {/* Favorites toggle inside modal */}
                <button
                  onClick={() => onToggleFavorite(manga)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 border ${
                    isFavorite 
                      ? 'bg-brand-orange/10 border-brand-orange text-brand-orange hover:bg-brand-orange/20' 
                      : 'bg-brand-darkBg hover:bg-brand-cardBg border-brand-border text-brand-textMain'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-brand-orange' : ''}`} />
                  {isFavorite ? 'Remove Favorite' : 'Add to Shelf'}
                </button>
              </div>
            </div>

            {/* Details Column */}
            <div className="flex-1">
              <span className="inline-block rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
                {manga.type || 'Manga'}
              </span>
              
              <h2 className="text-xl sm:text-2xl font-extrabold text-brand-textMain tracking-tight leading-tight mb-1">
                {title}
              </h2>
              {alternativeTitle && (
                <p className="text-sm text-brand-textMuted mb-4 italic">{alternativeTitle}</p>
              )}

              {/* Stats badges */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                <button 
                  onClick={() => onInteractiveFilter({ sortBy: 'score', query: '' })}
                  className="flex items-center gap-1 bg-brand-cardBg hover:bg-brand-orange/10 hover:border-brand-orange/50 transition-colors cursor-pointer border border-brand-border px-3 py-1 rounded-lg text-xs group"
                  title="Sort catalog by Highest Score"
                >
                  <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange group-hover:animate-spin-slow" />
                  <span className="font-bold group-hover:text-brand-orange">{score}</span>
                </button>
                <button 
                  onClick={() => onInteractiveFilter({ sortBy: 'popularity', query: '' })}
                  className="bg-brand-cardBg hover:bg-brand-orange/10 hover:border-brand-orange/50 transition-colors cursor-pointer border border-brand-border px-3 py-1 rounded-lg text-xs text-brand-textMuted group"
                  title="Sort catalog by Popularity"
                >
                  Rank <span className="font-bold text-brand-orange group-hover:text-brand-accent">#{rank}</span>
                </button>
                <button 
                  onClick={() => onInteractiveFilter({ sortBy: 'popularity', query: '' })}
                  className="bg-brand-cardBg hover:bg-brand-orange/10 hover:border-brand-orange/50 transition-colors cursor-pointer border border-brand-border px-3 py-1 rounded-lg text-xs text-brand-textMuted group flex items-center gap-1"
                  title="Sort catalog by Popularity"
                >
                  <TrendingUp className="h-3 w-3 text-brand-textMuted group-hover:text-brand-orange" />
                  Popularity <span className="font-bold text-brand-orange group-hover:text-brand-accent">#{popularity}</span>
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-4 mb-6 text-xs border-t border-b border-brand-border/45 py-4">
                <div className="flex items-center gap-2 text-brand-textMuted group cursor-pointer" onClick={() => onInteractiveFilter({ query: authors[0]?.name || '' })}>
                  <User className="h-4 w-4 text-brand-orange flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate group-hover:text-brand-orange transition-colors" title="Search for this author">
                    <strong>Author:</strong> {authors.map(a => a.name).join(', ') || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-brand-textMuted">
                  <BookOpen className="h-4 w-4 text-brand-orange flex-shrink-0" />
                  <span>
                    <strong>Status:</strong> {status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-brand-textMuted">
                  <BookOpenCheck className="h-4 w-4 text-brand-orange flex-shrink-0" />
                  <span>
                    <strong>Chapters:</strong> {chapters} (Vol {volumes})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-brand-textMuted">
                  <Calendar className="h-4 w-4 text-brand-orange flex-shrink-0" />
                  <span className="truncate">
                    <strong>Published:</strong> {publishedStr}
                  </span>
                </div>
              </div>

              {/* Genres */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider mb-2">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => (
                    <button 
                      key={g.mal_id} 
                      onClick={() => onInteractiveFilter({ genre: g.mal_id.toString(), query: '' })}
                      className="rounded-lg bg-brand-darkBg/60 hover:bg-brand-orange hover:text-white transition-all cursor-pointer border border-brand-border px-3 py-1.5 text-xs text-brand-textMain shadow-sm hover:shadow-neon"
                      title={`Find more ${g.name} manga`}
                    >
                      {g.name}
                    </button>
                  ))}
                  {genres.length === 0 && (
                    <span className="rounded-lg bg-brand-darkBg/60 border border-brand-border px-3 py-1.5 text-xs text-brand-textMuted">
                      General
                    </span>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h4 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider mb-2">Synopsis</h4>
                <p className="text-sm leading-relaxed text-brand-textMuted max-h-40 overflow-y-auto pr-2 bg-brand-darkBg/30 p-3 rounded-lg border border-brand-border/30">
                  {synopsis}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
