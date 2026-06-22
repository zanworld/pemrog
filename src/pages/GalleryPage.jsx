import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Image as ImageIcon, AlertCircle, RefreshCw, Heart, Maximize2, LayoutGrid, Layout } from 'lucide-react';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import Lightbox from '../components/Lightbox';

export default function GalleryPage() {
  const navigate = useNavigate();

  // Data states
  const [mangaList, setMangaList] = useState([]);
  const [filteredManga, setFilteredManga] = useState([]);
  const [displayedManga, setDisplayedManga] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'score', 'title', 'newest'

  // View & Interaction states
  const [viewMode, setViewMode] = useState('masonry'); // 'masonry' or 'grid'
  const [lightboxManga, setLightboxManga] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch manga data on mount (fetch all available data up to a high limit for client-side ops)
  const fetchManga = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/manga?limit=100');
      if (response.data && response.data.data) {
        // Enforce uniqueness
        const uniqueData = response.data.data.filter(
          (v, i, a) => a.findIndex(v2 => v2.mal_id === v.mal_id) === i
        );
        setMangaList(uniqueData);

        // Extract unique genres
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

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e, mal_id) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(mal_id) ? prev.filter(id => id !== mal_id) : [...prev, mal_id]
    );
  };

  // Search query debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Apply filtering and sorting
  useEffect(() => {
    let result = [...mangaList];

    // Filter by genre
    if (selectedGenre) {
      const genreId = parseInt(selectedGenre, 10);
      result = result.filter(manga =>
        manga.genres && manga.genres.some(genre => genre.mal_id === genreId)
      );
    }

    // Filter by search query
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase().trim();
      result = result.filter(manga => {
        const titleMatch = manga.title && manga.title.toLowerCase().includes(query);
        const englishTitleMatch = manga.title_english && manga.title_english.toLowerCase().includes(query);
        return titleMatch || englishTitleMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      } else if (sortBy === 'popularity') {
        return (a.popularity || 99999) - (b.popularity || 99999);
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'newest') {
        const dateA = new Date(a.published?.string?.split(' to')[0] || 0);
        const dateB = new Date(b.published?.string?.split(' to')[0] || 0);
        return dateB - dateA;
      }
      return 0;
    });

    setFilteredManga(result);
    setPage(1); // Reset pagination when filters change
  }, [debouncedQuery, selectedGenre, sortBy, mangaList]);

  // Update displayed manga based on pagination
  useEffect(() => {
    setDisplayedManga(filteredManga.slice(0, page * itemsPerPage));
  }, [filteredManga, page]);

  // Infinite Scroll Callback
  const loadMore = useCallback(() => {
    if (displayedManga.length < filteredManga.length) {
      // Add a slight artificial delay to show loading state smoothly
      setTimeout(() => {
        setPage(prev => prev + 1);
        setIsFetching(false);
      }, 300);
    } else {
      setIsFetching(false);
    }
  }, [displayedManga.length, filteredManga.length]);

  const [observerRef, isFetching, setIsFetching] = useInfiniteScroll(loadMore);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSortBy('popularity');
  };

  const skeletonHeights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-60', 'h-84', 'h-76', 'h-90', 'h-72', 'h-80', 'h-64', 'h-88'];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      
      {/* Lightbox Modal */}
      <Lightbox manga={lightboxManga} onClose={() => setLightboxManga(null)} />

      {/* Page Header */}
      <div className="border-b border-brand-border/60 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange shadow-neon/20">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-textMain">
                Manga <span className="bg-gradient-to-r from-brand-orange to-brand-accent bg-clip-text text-transparent">Gallery</span>
              </h1>
              <p className="text-sm text-brand-textMuted mt-1">
                Jelajahi seni visual cover manga favorit Anda.
              </p>
            </div>
          </div>
          
          {/* View Toggles */}
          <div className="hidden sm:flex bg-brand-darkBg border border-brand-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'masonry' ? 'bg-brand-orange text-white' : 'text-brand-textMuted hover:text-brand-textMain'}`}
              title="Masonry View"
            >
              <Layout className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-orange text-white' : 'text-brand-textMuted hover:text-brand-textMain'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-brand-border/60 flex flex-col xl:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow">
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
          <div className="relative min-w-[160px]">
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

          {/* Sort Dropdown Selector */}
          <div className="relative min-w-[160px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain placeholder-brand-textMuted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="popularity">Terpopuler</option>
              <option value="score">Skor Tertinggi</option>
              <option value="title">Judul (A-Z)</option>
              <option value="newest">Terbaru</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-textMuted">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Counter Display & Reset Option */}
        <div className="flex items-center justify-between xl:justify-end gap-4 shrink-0">
          <span className="text-sm font-semibold text-brand-textMuted bg-brand-cardBg px-4 py-2 rounded-xl border border-brand-border/40">
            Menampilkan <span className="text-brand-orange font-bold">{filteredManga.length}</span> manga
          </span>
          {(searchQuery || selectedGenre || sortBy !== 'popularity') && (
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
        <div className={viewMode === 'masonry' ? "columns-2 md:columns-3 lg:columns-4 gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className={`break-inside-avoid ${viewMode === 'masonry' ? 'mb-4' : ''} bg-brand-cardBg/60 border border-brand-border/30 rounded-xl animate-pulse ${
                viewMode === 'masonry' ? skeletonHeights[idx % skeletonHeights.length] : 'aspect-[2/3]'
              }`}
            />
          ))}
        </div>
      ) : error ? (
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
      ) : displayedManga.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-brand-border bg-brand-cardBg/30 max-w-lg mx-auto">
          <ImageIcon className="h-12 w-12 text-brand-textMuted mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-brand-textMain mb-1">Tidak Ada Manga Ditemukan</h3>
          <p className="text-sm text-brand-textMuted mb-6 max-w-xs">
            Tidak ada manga yang cocok dengan pencarian atau filter Anda.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-brand-cardBg border border-brand-border hover:border-brand-orange text-brand-textMain hover:text-brand-orange font-bold rounded-xl transition-all duration-200 text-sm"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <>
          <div className={viewMode === 'masonry' ? "columns-2 md:columns-3 lg:columns-4 gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
            <AnimatePresence>
              {displayedManga.map((manga) => {
                const isFavorite = favorites.includes(manga.mal_id);
                return (
                  <motion.div
                    key={manga.mal_id}
                    layoutId={`manga-gallery-card-${manga.mal_id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`break-inside-avoid ${viewMode === 'masonry' ? 'mb-4' : ''} group relative overflow-hidden rounded-xl border border-brand-border/60 hover:border-brand-orange/80 hover:shadow-neon cursor-pointer transition-all duration-300`}
                    onClick={() => navigate(`/book/${manga.mal_id}`)}
                  >
                    <div className="relative overflow-hidden aspect-auto bg-brand-cardBg h-full">
                      <img
                        src={manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url}
                        alt={manga.title}
                        className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${viewMode === 'grid' ? 'h-full aspect-[2/3]' : ''}`}
                        loading="lazy"
                      />

                      {/* Action Buttons Overlay */}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button
                          onClick={(e) => toggleFavorite(e, manga.mal_id)}
                          className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-brand-orange/80 transition-colors"
                          title={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxManga(manga);
                          }}
                          className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-brand-orange/80 transition-colors"
                          title="Perbesar Cover"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h4 className="text-brand-textMain font-bold text-sm sm:text-base tracking-wide line-clamp-2 drop-shadow">
                          {manga.title}
                        </h4>
                        
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

                        {manga.score && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-black text-brand-orange drop-shadow">
                            <span className="text-yellow-400">★</span> {manga.score.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Infinite Scroll Loading Indicator */}
          {displayedManga.length < filteredManga.length && (
            <div ref={observerRef} className="py-8 flex justify-center items-center">
              {isFetching ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-6 w-6 text-brand-orange animate-spin" />
                  <span className="text-sm font-medium text-brand-textMuted">Memuat batch berikutnya...</span>
                </div>
              ) : (
                <div className="h-8" /> // Invisible spacer to trigger intersection
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

