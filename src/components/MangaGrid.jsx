import React from 'react';
import MangaCard from './MangaCard';

export default function MangaGrid({ mangaList, favorites, isLoading, onToggleFavorite, onClickCard }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex flex-col overflow-hidden rounded-2xl bg-brand-cardBg border border-brand-border animate-pulse">
            <div className="aspect-[3/4.2] w-full bg-brand-border/40" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-1/3 bg-brand-border/45 rounded" />
              <div className="h-4.5 w-3/4 bg-brand-border/45 rounded" />
              <div className="h-3 w-1/2 bg-brand-border/45 rounded" />
              <div className="pt-3 border-t border-brand-border/40 flex justify-between">
                <div className="h-3.5 w-1/3 bg-brand-border/45 rounded" />
                <div className="h-3.5 w-1/4 bg-brand-border/45 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!mangaList || mangaList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-brand-border/80 bg-brand-cardBg/40 animate-fade-in">
        <div className="text-4xl mb-4 animate-bounce">🔍</div>
        <h3 className="text-lg font-bold text-brand-textMain mb-1">No Manga Found</h3>
        <p className="text-sm text-brand-textMuted max-w-sm mb-4">
          We couldn't find any titles that match your search filters. Try resetting the filters or typing a different title.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
      {mangaList.map((manga) => {
        const isFavorite = favorites.some(fav => fav.mal_id === manga.mal_id);
        return (
          <MangaCard 
            key={manga.mal_id} 
            manga={manga} 
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onClickCard={onClickCard}
          />
        );
      })}
    </div>
  );
}
