import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import MangaGrid from './MangaGrid';
import MangaDetailModal from './MangaDetailModal';
import HeroCarousel from './HeroCarousel';

const PUBLISHER_INFO = {
  'shueisha':   { name: 'Shueisha',    emoji: '📕', desc: 'Home to Weekly Shonen Jump, the most popular manga magazine in the world.', color: 'red', jikanIds: '8,87,88,113' },
  'kodansha':   { name: 'Kodansha',    emoji: '📘', desc: 'One of the largest Japanese publishing companies, known for Shonen Magazine.', color: 'indigo', jikanIds: '83,84,65' },
  'shogakukan': { name: 'Shogakukan',  emoji: '📙', desc: 'Publisher of Shonen Sunday and many beloved classic series.', color: 'yellow', jikanIds: '82,127' },
  'kadokawa':   { name: 'Kadokawa',    emoji: '📗', desc: 'A massive media conglomerate with an incredible lineup of light novels and manga.', color: 'emerald', jikanIds: '100,102,103' },
  'squareenix': { name: 'Square Enix', emoji: '⚔️', desc: 'Famous for RPGs, but also a powerhouse manga publisher (Shonen Gangan).', color: 'slate', jikanIds: '13,14' },
  'vizmedia':   { name: 'Viz Media',   emoji: '🌎', desc: 'The largest publisher of English-translated manga in North America.', color: 'red', q: 'viz' },
  'yenpress':   { name: 'Yen Press',   emoji: '📖', desc: 'A leading publisher of manga and light novels in English.', color: 'slate', q: 'yen' },
  'sevenseas':  { name: 'Seven Seas',  emoji: '🌊', desc: 'Bringing a diverse library of manga and light novels to English readers.', color: 'cyan', q: 'seven seas' },
  'darkhorse':  { name: 'Dark Horse',  emoji: '🐴', desc: 'Renowned for publishing mature and critically acclaimed manga in English.', color: 'violet', q: 'dark horse' },
  'vertical':   { name: 'Vertical',    emoji: '🗼', desc: 'Specializing in contemporary and thought-provoking Japanese literature and manga.', color: 'orange', q: 'vertical' },
};

export default function PublisherPage({ publisherId, favorites = [], onToggleFavorite }) {
  const [mangaList, setMangaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedManga, setSelectedManga] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when publisher changes
  useEffect(() => {
    setCurrentPage(1);
  }, [publisherId]);

  const publisher = PUBLISHER_INFO[publisherId] || { name: 'Unknown', emoji: '📚', desc: '' };

  const fetchPublisherManga = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `https://api.jikan.moe/v4/manga?order_by=popularity&sort=asc&limit=24&sfw=true&page=${page}`;
      
      if (publisher.jikanIds) {
        url += `&magazines=${publisher.jikanIds}`;
      } else if (publisher.q) {
        url += `&q=${encodeURIComponent(publisher.q)}`;
      }

      const res = await axios.get(url);
      if (res.data && res.data.data) {
        // Enforce uniqueness to prevent Jikan API duplicates
        const uniqueData = res.data.data.filter((v, i, a) => a.findIndex(v2 => (v2.mal_id === v.mal_id)) === i);
        setMangaList(uniqueData);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.warn('Publisher fetch failed, using fallback', err);
      setError('API rate-limited. Showing available data.');
      // Try to load from mock if available
      try {
        const { mockMangaData } = await import('../mockMangaData');
        let filtered = [...mockMangaData];
        // Sort by popularity locally
        filtered.sort((a, b) => (a.popularity || 9999) - (b.popularity || 9999));
        
        // Paginate locally
        const startIndex = (page - 1) * 24;
        setMangaList(filtered.slice(startIndex, startIndex + 24));
      } catch {
        setMangaList([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublisherManga(currentPage);
  }, [publisherId, currentPage]);

  return (
    <div className="animate-fade-in">
      {/* Publisher Recommendations Carousel */}
      {mangaList.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5 pl-2 border-b border-brand-border/40 pb-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-textMain">
              Rekomendasi <span className="text-brand-orange">{publisher.name}</span>
            </h2>
          </div>
          <HeroCarousel 
            onClickManga={setSelectedManga} 
            mangaList={mangaList} 
            useLiveApi={false}
            themeColor={publisher.color}
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
          <button onClick={() => fetchPublisherManga(currentPage)} className="flex items-center gap-1.5 text-xs text-brand-orange hover:underline font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold tracking-wide">
          {publisher.name} Collection ({mangaList.length} titles)
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

      {/* Pagination Controls */}
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
        
        {[...Array(10)].map((_, i) => {
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
            setCurrentPage(Math.min(10, currentPage + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={currentPage === 10}
          className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
        >
          &gt;
        </button>
      </div>

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
