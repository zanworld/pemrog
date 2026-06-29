import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, AlertTriangle, HelpCircle, Heart, Layers } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FilterForm from './components/FilterForm';
import MangaGrid from './components/MangaGrid';
import MangaDetailModal from './components/MangaDetailModal';
import HeroCarousel from './components/HeroCarousel';
import Footer from './components/Footer';
import { mockMangaData } from './mockMangaData';
import AppRouter from './Router';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isReaderMode = location.pathname.startsWith('/read/');

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Data States
  const [mangaList, setMangaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Favorites State (persisted in LocalStorage)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('hybrid_library_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal State
  const [selectedManga, setSelectedManga] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    query: '',
    genre: '',
    status: 'all',
    sfw: true,
    sortBy: 'popularity',
    page: 1
  });

  // Sync Favorites to LocalStorage
  useEffect(() => {
    localStorage.setItem('hybrid_library_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch from local API
  const fetchMangaData = async (filtersOverride = null) => {
    setIsLoading(true);
    setError(null);
    const activeFilters = filtersOverride || filters;

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '24');
      queryParams.append('page', activeFilters.page || 1);
      if (activeFilters.query) queryParams.append('q', activeFilters.query);
      if (activeFilters.genre) queryParams.append('genres', activeFilters.genre);
      if (activeFilters.status && activeFilters.status !== 'all') queryParams.append('status', activeFilters.status);
      if (activeFilters.sfw) queryParams.append('sfw', 'true');

      if (activeFilters.sortBy === 'popularity') {
        queryParams.append('order_by', 'popularity');
        queryParams.append('sort', 'asc');
      } else if (activeFilters.sortBy === 'score') {
        queryParams.append('order_by', 'score');
        queryParams.append('sort', 'desc');
      } else if (activeFilters.sortBy === 'title') {
        queryParams.append('order_by', 'title');
        queryParams.append('sort', 'asc');
      }

      const apiUrl = `/api/manga?${queryParams.toString()}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.data) {
        // Enforce uniqueness to prevent Jikan API duplicates
        const uniqueData = response.data.data.filter((v, i, a) => a.findIndex(v2 => (v2.mal_id === v.mal_id)) === i);
        setMangaList(uniqueData);
      } else {
        throw new Error("Response empty or invalid");
      }
    } catch (err) {
      console.warn("Backend API error.", err);
      setError("Unable to connect to the backend database.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial mount
  useEffect(() => {
    fetchMangaData();
  }, []);

  // Smart redirect for dummy pages (non-genre, non-publisher routes only)
  useEffect(() => {
    const routeMap = new Map([
      ['/toprated', { sortBy: 'score' }], ['/popular', { sortBy: 'popularity' }],
      ['/trending', { sortBy: 'popularity' }], ['/upcoming', { status: 'upcoming' }],
      ['/newreleases', { status: 'publishing' }], ['/recommendations', { sortBy: 'score' }],
      ['/editorpicks', { sortBy: 'popularity' }]
    ]);

    const targetFilter = routeMap.get(location.pathname);
    if (targetFilter) {
      const newFilters = { ...filters, query: '', genre: '', status: 'all', ...targetFilter };
      setFilters(newFilters);
      fetchMangaData(newFilters);
      navigate('/catalog', { replace: true });
    }
  }, [location.pathname]);

  const handleSearchSubmit = () => {
    fetchMangaData();
  };

  const handleToggleFavorite = (manga) => {
    const exists = favorites.some(fav => fav.mal_id === manga.mal_id);
    if (exists) {
      setFavorites(favorites.filter(fav => fav.mal_id !== manga.mal_id));
      toast('Removed from favorites', { icon: '🗑️' });
    } else {
      setFavorites([...favorites, manga]);
      toast.success('Added to favorites!');
    }
  };

  const handleInteractiveFilter = (filterUpdate) => {
    const newFilters = { ...filters, ...filterUpdate };
    setFilters(newFilters);
    setSelectedManga(null);
    navigate('/catalog');
    fetchMangaData(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // View Blocks for the Router
  // -------------------------------------------------------------
  const catalogView = (
    <div className="animate-fade-in">
      {/* Hero Recommendation Carousel */}
      <HeroCarousel onClickManga={setSelectedManga} mangaList={mangaList} />

      <FilterForm
        filters={filters}
        setFilters={setFilters}
        onSearchSubmit={handleSearchSubmit}
      />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold tracking-wide">
            Manga Catalog ({mangaList?.length || 0} items)
          </h3>
        </div>
        <MangaGrid
          mangaList={mangaList}
          favorites={favorites}
          isLoading={isLoading}
          onToggleFavorite={handleToggleFavorite}
          onClickCard={setSelectedManga}
        />

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 mb-4">
          <button
            onClick={() => handleInteractiveFilter({ page: Math.max(1, (filters.page || 1) - 1) })}
            disabled={(filters.page || 1) === 1}
            className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
          >
            &lt;
          </button>

          {[...Array(10)].map((_, i) => {
            const pageNum = i + 1;
            const isActive = (filters.page || 1) === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => handleInteractiveFilter({ page: pageNum })}
                className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border text-xs sm:text-sm font-bold transition-all ${isActive
                  ? 'border-brand-orange bg-brand-orange text-white shadow-neon scale-110 z-10'
                  : 'border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange'
                  }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handleInteractiveFilter({ page: Math.min(10, (filters.page || 1) + 1) })}
            disabled={(filters.page || 1) === 10}
            className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-brand-border bg-brand-cardBg text-brand-textMuted hover:text-brand-orange hover:border-brand-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );

  const favoritesView = (
    <div className="animate-fade-in">
      <div className="mb-8 border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Heart className="h-6 w-6 text-brand-orange fill-brand-orange" />
          My Favorites List
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Your personal reading shelf. These titles are saved locally and persist when you close the browser.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-brand-border bg-brand-cardBg/45">
          <Heart className="h-12 w-12 text-brand-textMuted mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-brand-textMain mb-1">Your Shelf is Empty</h3>
          <p className="text-sm text-brand-textMuted max-w-sm mb-6">
            Add manga to your favorites list while browsing the Catalog by clicking the heart button on any card.
          </p>
        </div>
      ) : (
        <MangaGrid
          mangaList={favorites}
          favorites={favorites}
          isLoading={false}
          onToggleFavorite={handleToggleFavorite}
          onClickCard={setSelectedManga}
        />
      )}
    </div>
  );

  const aboutView = (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-brand-orange" />
          About Hybrid Library
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Application details and architectural overview.
        </p>
      </div>

      <div className="space-y-6">
        <section className="glass-panel p-6 rounded-2xl space-y-3">
          <h3 className="text-lg font-bold text-brand-orange flex items-center gap-2">
            <Layers className="h-5 w-5" /> Design & Theme Inspiration
          </h3>
          <p className="text-sm text-brand-textMuted leading-relaxed">
            This application features a highly tailored dark neon style inspired by **MangaDex**. We have modernized the layout using glassmorphism borders, custom dark scrollbars, Outfit modern typography, and vibrant action indicators. The interfaces are 100% responsive and implement dynamic hover scaling and amber outline shadows.
          </p>
        </section>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-brand-darkBg text-brand-textMain select-none">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1c1c1e',
            color: '#fff',
            border: '1px solid #ff6b00',
            boxShadow: '0 0 20px rgba(255, 107, 0, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600'
          }
        }}
      />
      {/* Left Navigation Sidebar */}
      {!isReaderMode && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onInteractiveFilter={handleInteractiveFilter}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isReaderMode && (
          <Header
            favoriteCount={favorites.length}
            currentPath={location.pathname}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onSearch={(q) => handleInteractiveFilter({ query: q })}
            currentQuery={filters.query}
          />
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-[#0a0a0a]">
          <main className={isReaderMode ? "flex-grow w-full h-full" : "flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8"}>
            <AppRouter
              catalogElement={catalogView}
              favoritesElement={favoritesView}
              aboutElement={aboutView}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </main>

          {!isReaderMode && <Footer />}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedManga && (
        <MangaDetailModal
          manga={selectedManga}
          onClose={() => setSelectedManga(null)}
          isFavorite={favorites.some(fav => fav.mal_id === selectedManga.mal_id)}
          onToggleFavorite={handleToggleFavorite}
          onInteractiveFilter={handleInteractiveFilter}
        />
      )}
    </div>
  );
}
