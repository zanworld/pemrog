import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';

export default function GalleryPage() {
  const navigate = useNavigate();

  // Data states
  const [mangaList, setMangaList] = useState([]);
  const [filteredManga, setFilteredManga] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  // Fetch manga data on mount
  const fetchManga = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/manga?limit=24');
      if (response.data && response.data.data) {
        // Enforce uniqueness to prevent duplicate items
        const uniqueData = response.data.data.filter(
          (v, i, a) => a.findIndex(v2 => v2.mal_id === v.mal_id) === i
        );
        setMangaList(uniqueData);
        setFilteredManga(uniqueData);

        // Extract unique genres from fetched items
        const extractedGenres = [];
        const seenGenreIds = new Set();

        uniqueData.forEach(manga => {
          if (manga.genres && Array.isArray(manga.genres)) {
            manga.genres.forEach(genre => {
              if (!seenGenreIds.has(genre.mal_id)) {
                seenGenreIds.add(genre.mal_id);
                extractedGenres.push(genre);
              }
            });
          }
        });

        // Sort genres alphabetically
        extractedGenres.sort((a, b) => a.name.localeCompare(b.name));
        setGenres(extractedGenres);
      } else {
        throw new Error('Valid data was not received from the server.');
      }
    } catch (err) {
      console.error('Error fetching gallery manga:', err);
      setError('Gagal memuat galeri manga. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManga();
  }, []);

  // Search query debounce (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Apply filtering when search query or selected genre changes
  useEffect(() => {
    let result = [...mangaList];

    // Filter by genre
    if (selectedGenre) {
      const genreId = parseInt(selectedGenre, 10);
      result = result.filter(manga =>
        manga.genres && manga.genres.some(genre => genre.mal_id === genreId)
      );
    }

    // Filter by search query (title)
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase().trim();
      result = result.filter(manga => {
        const titleMatch = manga.title && manga.title.toLowerCase().includes(query);
        const englishTitleMatch = manga.title_english && manga.title_english.toLowerCase().includes(query);
        return titleMatch || englishTitleMatch;
      });
    }

    setFilteredManga(result);
  }, [debouncedQuery, selectedGenre, mangaList]);

  // Handle resetting all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
  };

  // Skeleton loader layout
  const skeletonHeights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-60', 'h-84', 'h-76', 'h-90', 'h-72', 'h-80', 'h-64', 'h-88'];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      
      {/* Page Header */}
      <div className="border-b border-brand-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange shadow-neon/20">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-textMain">
              Manga <span className="bg-gradient-to-r from-brand-orange to-brand-accent bg-clip-text text-transparent">Gallery</span>
            </h1>
            <p className="text-sm text-brand-textMuted mt-1">
              Jelajahi seni visual cover manga favorit Anda dalam layout masonry yang dinamis.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-brand-border/60 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow max-w-3xl">
          {/* Title Search Input */}
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textMuted">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari manga berdasarkan judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain placeholder-brand-textMuted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          {/* Genre Dropdown Selector */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain placeholder-brand-textMuted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="">Semua Genre</option>
              {genres.map(genre => (
                <option key={genre.mal_id} value={genre.mal_id}>
                  {genre.name}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-textMuted">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Counter Display & Reset Option */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
          <span className="text-sm font-semibold text-brand-textMuted bg-brand-cardBg px-4 py-2 rounded-xl border border-brand-border/40">
            Menampilkan <span className="text-brand-orange font-bold">{filteredManga.length}</span> manga
          </span>
          {(searchQuery || selectedGenre) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-brand-orange hover:text-brand-accent transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Content Render */}
      {isLoading ? (
        /* Loading skeleton state matching masonry column count */
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className={`break-inside-avoid mb-4 bg-brand-cardBg/60 border border-brand-border/30 rounded-xl animate-pulse ${
                skeletonHeights[idx % skeletonHeights.length]
              }`}
            />
          ))}
        </div>
      ) : error ? (
        /* Error displaying block with retry options */
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-red-500/20 bg-red-500/5 max-w-xl mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-brand-textMain mb-1">Gagal Memuat Galeri</h3>
          <p className="text-sm text-brand-textMuted mb-6 max-w-xs">{error}</p>
          <button
            onClick={fetchManga}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-accent text-white font-bold rounded-xl shadow-neon transition-all duration-200 text-sm"
          >
            <RefreshCw className="h-4 w-4 animate-spin-hover" /> Coba Lagi
          </button>
        </div>
      ) : filteredManga.length === 0 ? (
        /* Empty results state */
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-brand-border bg-brand-cardBg/30 max-w-lg mx-auto">
          <ImageIcon className="h-12 w-12 text-brand-textMuted mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-brand-textMain mb-1">Tidak Ada Manga Ditemukan</h3>
          <p className="text-sm text-brand-textMuted mb-6 max-w-xs">
            Tidak ada manga yang cocok dengan pencarian atau filter genre Anda.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-brand-cardBg border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-brand-orange font-bold rounded-xl transition-all duration-200 text-sm"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        /* Masonry Grid output containing covers */
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          <AnimatePresence>
            {filteredManga.map((manga) => (
              <motion.div
                key={manga.mal_id}
                layoutId={`manga-gallery-card-${manga.mal_id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="break-inside-avoid mb-4 group relative overflow-hidden rounded-xl border border-brand-border/60 hover:border-brand-orange/80 hover:shadow-neon cursor-pointer transition-all duration-300"
                onClick={() => navigate(`/book/${manga.mal_id}`)}
              >
                {/* Scale Image Container */}
                <div className="relative overflow-hidden aspect-auto bg-brand-cardBg">
                  <img
                    src={manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url}
                    alt={manga.title}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Dark overlay & info details visible on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h4 className="text-brand-textMain font-bold text-sm sm:text-base tracking-wide line-clamp-2 drop-shadow">
                      {manga.title}
                    </h4>
                    
                    {/* Genres details overlay */}
                    {manga.genres && manga.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {manga.genres.slice(0, 2).map((g) => (
                          <span
                            key={g.mal_id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-brand-orange/25 text-brand-orange border border-brand-orange/30 font-semibold"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Score / rating indicator overlay */}
                    {manga.score && (
                      <div className="flex items-center gap-1 mt-2 text-xs font-black text-brand-orange drop-shadow">
                        <span className="text-yellow-400">★</span> {manga.score.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
