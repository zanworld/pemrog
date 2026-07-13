import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Swords, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import MangaGrid from './MangaGrid';
import MangaDetailModal from './MangaDetailModal';
import HeroCarousel from './HeroCarousel';

const GENRE_INFO = {
  1:  { name: 'Action',       emoji: '⚔️',  desc: 'High-octane battles, martial arts, and explosive combat sequences.', color: 'red' },
  2:  { name: 'Adventure',    emoji: '🧭',  desc: 'Epic quests, exploration, and thrilling journeys across vast worlds.', color: 'emerald' },
  4:  { name: 'Comedy',       emoji: '😂',  desc: 'Hilarious stories that will make you laugh out loud on every page.', color: 'yellow' },
  8:  { name: 'Drama',        emoji: '🎭',  desc: 'Deep emotional narratives with powerful character development.', color: 'violet' },
  10: { name: 'Fantasy',      emoji: '🧙',  desc: 'Magic, mythical creatures, and otherworldly realms await.', color: 'purple' },
  22: { name: 'Romance',      emoji: '💕',  desc: 'Heartwarming love stories with unforgettable couples.', color: 'pink' },
  24: { name: 'Sci-Fi',       emoji: '🚀',  desc: 'Futuristic technology, space exploration, and scientific wonders.', color: 'cyan' },
  36: { name: 'Slice of Life', emoji: '🌸', desc: 'Everyday life stories that capture the beauty of the mundane.', color: 'orange' },
  37: { name: 'Supernatural', emoji: '👻',  desc: 'Ghosts, demons, and mysterious powers beyond human understanding.', color: 'indigo' },
  7:  { name: 'Mystery',      emoji: '🔍',  desc: 'Thrilling mysteries, detective stories, and mind-bending puzzles.', color: 'slate' },
};

export default function GenrePage({ genreId, favorites = [], onToggleFavorite }) {
  const [mangaList, setMangaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedManga, setSelectedManga] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisiblePage, setLastVisiblePage] = useState(10);

  // Reset to page 1 when genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [genreId]);

  const genre = Object.prototype.hasOwnProperty.call(GENRE_INFO, genreId) ? GENRE_INFO[genreId] : { name: 'Unknown', emoji: '📚', desc: '' };

  const fetchGenreManga = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/manga?genres=${genreId}&order_by=popularity&sort=asc&limit=24&page=${page}`);
      if (res.data && res.data.data) {
        // Enforce uniqueness to prevent Jikan API duplicates
        const uniqueData = res.data.data.filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);
        setMangaList(uniqueData);

        if (res.data.degraded) {
          setError(res.data.warning || 'Sedang menampilkan data contoh — API eksternal sedang gangguan.');
        } else {
          setError(null);
        }

        const total = res.data.pagination?.items?.total ?? uniqueData.length;
        setLastVisiblePage(res.data.pagination?.last_visible_page || Math.max(1, Math.ceil(total / 24)));
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.warn('Genre fetch failed', err);
      setError('Failed to fetch data from the server.');
      setMangaList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGenreManga(currentPage);
  }, [genreId, currentPage]);

  return (
    <div className="animate-fade-in">
      {/* Genre Recommendations Carousel */}
      {mangaList.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5 pl-2 border-b border-brand-border/40 pb-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-textMain">
              Rekomendasi <span className="text-brand-orange">{genre.name}</span>
            </h2>
          </div>
          <HeroCarousel 
            onClickManga={setSelectedManga} 
            mangaList={mangaList} 
            useLiveApi={false}
            themeColor={genre.color}
          />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Offline Mode</h4>
            <p className="text-xs text-amber-200/80 mt-1">{error}</p>
          </div>
          <button onClick={fetchGenreManga} className="flex items-center gap-1.5 text-xs text-brand-orange hover:underline font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold tracking-wide">
          {genre.name} Collection ({mangaList.length} titles)
        </h3>
      </div>

      {/* Manga Grid */}
      <MangaGrid
        mangaList={mangaList}
        favorites={favorites}
        isLoading={isLoading}
        onToggleFavorite={onToggleFavorite}
        onClickCard={setSelectedManga}
      />

      {/* Pagination Controls — capped at the real last_visible_page so users are never
          sent to a page the backend already told us is empty. */}
      {(() => {
        const visiblePageCount = Math.max(1, Math.min(lastVisiblePage, 10));
        return (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 mb-4">
            <button
              onClick={() => {
                setCurrentPage(Math.max(1, currentPage - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
            >
              &lt;
            </button>

            {[...Array(visiblePageCount)].map((_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'border-brand-orange bg-brand-orange text-white shadow-neon scale-110 z-10'
                      : 'border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => {
                setCurrentPage(Math.min(visiblePageCount, currentPage + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage >= visiblePageCount}
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
            >
              &gt;
            </button>
          </div>
        );
      })()}

      {/* Detail Modal */}
      {selectedManga && (
        <MangaDetailModal
          manga={selectedManga}
          onClose={() => setSelectedManga(null)}
          isFavorite={favorites.some(fav => fav.mal_id === selectedManga.mal_id)}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
}
