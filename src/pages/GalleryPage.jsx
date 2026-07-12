import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, Image as ImageIcon, AlertCircle,
  RefreshCw, Heart, Maximize2, LayoutGrid, Layout, Tag
} from 'lucide-react';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import Lightbox from '../components/Lightbox';

const BATCH_SIZE = 16;

// ── Jikan API helpers ─────────────────────────────────────────────
function getCoverUrl(manga) {
  return manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || null;
}

function getTitle(manga) {
  return manga.title_english || manga.title || 'Unknown';
}

function getGenres(manga) {
  return (manga.genres || []).slice(0, 2).map(g => ({
    id: g.mal_id,
    name: g.name,
  }));
}

// ── Component ────────────────────────────────────────────────────
export default function GalleryPage() {
  const navigate = useNavigate();

  // ── Data states ──
  const [mangas, setMangas] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);

  // ── Tag/Genre states ──
  const [tags, setTags] = useState([]);

  // ── Filter states ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('popularity');

  // ── View / Interaction states ──
  const [viewMode, setViewMode] = useState('masonry');
  const [lightboxManga, setLightboxManga] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gallery_favorites') || '[]'); }
    catch { return []; }
  });

  // Keep filter params in a ref to avoid stale closures inside fetchBatch
  const filterRef = useRef({ debouncedQuery: '', selectedTag: '', sortBy: 'popularity' });
  useEffect(() => {
    filterRef.current = { debouncedQuery, selectedTag, sortBy };
  }, [debouncedQuery, selectedTag, sortBy]);

  // ── Fetch tags on mount ──────────────────────────────────────
  useEffect(() => {
    axios.get('/api/manga/genres')
      .then(({ data }) => {
        if (data?.data) {
          const genreTags = data.data
            .map((t) => ({
              id: t.mal_id,
              name: t.name,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setTags(genreTags);
        }
      })
      .catch((err) => console.warn('Failed to load tags:', err.message));
  }, []);

  // ── Core fetch function ──────────────────────────────────────
  const fetchBatch = useCallback(async (currentPage, isReset = false) => {
    if (currentPage === 1 || isReset) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsFetchingMore(true);
    }

    const { debouncedQuery: q, selectedTag: tag, sortBy: sb } = filterRef.current;

    try {
      const params = new URLSearchParams();
      params.append('limit', BATCH_SIZE);
      params.append('page', currentPage);
      
      if (sb === 'popularity') {
        params.append('order_by', 'popularity');
        params.append('sort', 'asc');
      } else if (sb === 'title') {
        params.append('order_by', 'title');
        params.append('sort', 'asc');
      } else if (sb === 'newest') {
        params.append('order_by', 'start_date');
        params.append('sort', 'desc');
      }

      if (q.trim()) params.append('q', q.trim());
      if (tag) params.append('genres', tag);

      const { data } = await axios.get(`/api/manga?${params.toString()}`);

      const items = data?.data || [];
      const pagination = data?.pagination || {};
      const totalItems = pagination.items?.total || 0;

      setMangas((prev) => (isReset || currentPage === 1 ? items : [...prev, ...items]));
      setPage(currentPage);
      setTotal(totalItems);
      setHasMore(pagination.has_next_page);
    } catch (err) {
      console.error('Error fetching manga from Jikan API:', err);
      if (currentPage === 1 || isReset) {
        setError('Gagal memuat galeri manga. Periksa koneksi internet dan coba lagi.');
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  // ── Initial fetch ────────────────────────────────────────────
  useEffect(() => {
    fetchBatch(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-fetch when filters change ─────────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setMangas([]);
    setPage(1);
    setHasMore(true);
    fetchBatch(1, true);
  }, [debouncedQuery, selectedTag, sortBy, fetchBatch]);

  // ── Debounce search ──────────────────────────────────────────
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(h);
  }, [searchQuery]);

  // ── Persist favorites ────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('gallery_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Infinite scroll ──────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (isFetchingMore || !hasMore) return;
    fetchBatch(page + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetchingMore, hasMore, page, fetchBatch]);

  const [observerRef, isFetching, setIsFetching] = useInfiniteScroll(loadMore);

  // Reset scroll hook state once async fetch finishes
  useEffect(() => {
    if (!isFetchingMore && isFetching) setIsFetching(false);
  }, [isFetchingMore, isFetching, setIsFetching]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
    setSortBy('popularity');
  };

  // ── Skeleton heights for masonry ─────────────────────────────
  const skeletonH = ['h-64', 'h-80', 'h-72', 'h-96', 'h-60', 'h-84',
    'h-76', 'h-90', 'h-72', 'h-80', 'h-64', 'h-88',
    'h-72', 'h-96', 'h-60', 'h-80'];

  const hasActiveFilter = searchQuery || selectedTag || sortBy !== 'popularity';

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

      {/* Lightbox */}
      <Lightbox manga={lightboxManga} onClose={() => setLightboxManga(null)} />

      {/* Page Header */}
      <div className="border-b border-brand-border/60 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-textMain">
                Manga{' '}
                <span className="bg-gradient-to-r from-brand-orange to-brand-accent bg-clip-text text-transparent">
                  Gallery
                </span>
              </h1>
              <p className="text-sm text-brand-textMuted mt-1 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-brand-orange" />
                Data dari MyAnimeList (Jikan API)
              </p>
            </div>
          </div>

          {/* View Toggles */}
          <div className="hidden sm:flex bg-brand-darkBg border border-brand-border rounded-lg p-1">
            <button
              id="gallery-view-masonry"
              onClick={() => setViewMode('masonry')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'masonry' ? 'bg-brand-orange text-white' : 'text-brand-textMuted hover:text-brand-textMain'}`}
              title="Masonry View"
            >
              <Layout className="w-5 h-5" />
            </button>
            <button
              id="gallery-view-grid"
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

          {/* Search */}
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textMuted">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="gallery-search"
              type="text"
              placeholder="Cari manga berdasarkan judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain placeholder-brand-textMuted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          {/* Genre / Tag Dropdown */}
          <div className="relative min-w-[170px]">
            <select
              id="gallery-genre-filter"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="">Semua Genre</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-textMuted">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[160px]">
            <select
              id="gallery-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="popularity">Terpopuler</option>
              <option value="relevance">Relevansi</option>
              <option value="title">Judul (A-Z)</option>
              <option value="newest">Terbaru</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-textMuted">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Counter + Reset */}
        <div className="flex items-center justify-between xl:justify-end gap-4 shrink-0">
          {!isLoading && (
            <span className="text-sm font-semibold text-brand-textMuted bg-brand-cardBg px-4 py-2 rounded-xl border border-brand-border/40">
              {mangas.length > 0 ? (
                <>
                  Memuat{' '}
                  <span className="text-brand-orange font-bold">{mangas.length}</span>
                  {total > 0 && <> / {total}</>} manga
                </>
              ) : 'Tidak ada hasil'}
            </span>
          )}
          {hasActiveFilter && !isLoading && (
            <button
              id="gallery-reset-filters"
              onClick={handleResetFilters}
              className="text-xs font-bold text-brand-orange hover:text-brand-accent transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}

      {/* Loading skeleton (initial load) */}
      {isLoading && (
        <div className={viewMode === 'masonry'
          ? 'columns-2 md:columns-3 lg:columns-4 gap-4'
          : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}>
          {Array.from({ length: 16 }).map((_, idx) => (
            <div
              key={idx}
              className={`break-inside-avoid ${viewMode === 'masonry' ? 'mb-4' : ''} bg-brand-cardBg/60 border border-brand-border/30 rounded-xl animate-pulse ${viewMode === 'masonry' ? skeletonH[idx % skeletonH.length] : 'aspect-[2/3]'}`}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-red-500/20 bg-red-500/5 max-w-xl mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-brand-textMain mb-1">Gagal Memuat Galeri</h3>
          <p className="text-sm text-brand-textMuted mb-6 max-w-xs">{error}</p>
          <button
            id="gallery-retry"
            onClick={() => fetchBatch(1, true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-accent text-white font-bold rounded-xl shadow-neon transition-all duration-200 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Coba Lagi
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && mangas.length === 0 && (
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
      )}

      {/* Manga grid / masonry */}
      {!isLoading && !error && mangas.length > 0 && (
        <>
          <div className={viewMode === 'masonry'
            ? 'columns-2 md:columns-3 lg:columns-4 gap-4'
            : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}>
            <AnimatePresence>
              {mangas.map((manga) => {
                const id = manga.mal_id || manga.id;
                const title = getTitle(manga);
                const coverUrl = getCoverUrl(manga);
                const genres = getGenres(manga);
                const isFavorite = favorites.includes(id);

                return (
                  <motion.div
                    key={id}
                    layoutId={`gallery-card-${id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`break-inside-avoid ${viewMode === 'masonry' ? 'mb-4' : ''} group relative overflow-hidden rounded-xl border border-brand-border/60 hover:border-brand-orange/80 hover:shadow-neon cursor-pointer transition-all duration-300`}
                    onClick={() => navigate(`/book/${id}`)}
                  >
                    <div className={`relative overflow-hidden bg-brand-cardBg ${viewMode === 'grid' ? 'aspect-[2/3]' : ''}`}>
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={title}
                          className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${viewMode === 'grid' ? 'h-full' : ''}`}
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to non-thumbnail version
                            const fallback = coverUrl.replace('.512.jpg', '');
                            if (e.target.src !== fallback) e.target.src = fallback;
                          }}
                        />
                      ) : (
                        <div className={`flex items-center justify-center bg-brand-cardBg/80 ${viewMode === 'grid' ? 'h-full' : 'h-64'}`}>
                          <ImageIcon className="h-10 w-10 text-brand-border" />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button
                          id={`gallery-fav-${id}`}
                          onClick={(e) => toggleFavorite(e, id)}
                          className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-brand-orange/80 transition-colors"
                          title={isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                        <button
                          id={`gallery-lightbox-${id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxManga({ id, title, coverUrl, genres });
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
                          {title}
                        </h4>
                        {genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {genres.map((g) => (
                              <span
                                key={g.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-brand-orange/25 text-brand-orange border border-brand-orange/30 font-semibold"
                              >
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={observerRef} className="py-8 flex justify-center items-center">
              {(isFetching || isFetchingMore) ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-6 w-6 text-brand-orange animate-spin" />
                  <span className="text-sm font-medium text-brand-textMuted">
                    Memuat batch berikutnya dari MangaDex...
                  </span>
                </div>
              ) : (
                <div className="h-8" />
              )}
            </div>
          )}

          {/* End of results */}
          {!hasMore && mangas.length > 0 && (
            <div className="py-6 text-center text-sm text-brand-textMuted">
              ✓ Semua <span className="text-brand-orange font-bold">{mangas.length}</span> manga sudah dimuat
            </div>
          )}
        </>
      )}
    </div>
  );
}
