import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Settings, 
  ZoomIn, ZoomOut, Sun, Layout, List, Columns, Grid, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import useIdleTimer from '../hooks/useIdleTimer';
import PageThumbnails from '../components/PageThumbnails';
import PageImage from '../components/PageImage';
import { samplePages, sampleDataSaverPages } from '../data/samplePages';

export default function ReadOnlyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapter = searchParams.get('chapter') || '1';

  // Toast current chapter
  useEffect(() => {
    if (chapter && chapter !== '1') {
      toast.success(`Membaca Chapter ${chapter}`);
    }
  }, [chapter]);

  const getSavedMode = () => localStorage.getItem('settings_reader_mode') || 'single';
  const getSavedBrightness = () => {
    const saved = localStorage.getItem('settings_reader_brightness');
    return saved ? parseInt(saved, 10) : 100;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [readMode, setReadMode] = useState(getSavedMode); // 'single', 'double', 'vertical'
  const [brightness, setBrightness] = useState(getSavedBrightness); // 0-100
  const [zoomLevel, setZoomLevel] = useState(100); // 50-200
  
  const [dataPages, setDataPages] = useState([]);
  const [dataSaverPages, setDataSaverPages] = useState([]);
  const [quality, setQuality] = useState('data-saver');
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [direction, setDirection] = useState(1);

  const [chaptersList, setChaptersList] = useState([]);

  // Auto-hide controls
  const { isIdle, setIsIdle } = useIdleTimer(3000, showSettings || showThumbnails);
  const showControls = !isIdle || showSettings || showThumbnails;

  const verticalScrollRef = useRef(null);

  // Fetch all chapters feed for this manga
  useEffect(() => {
    const fetchMangaChapters = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/manga/${id}/feed`);
        const data = await res.json();
        if (data && data.data) {
          const mapped = data.data.map(ch => ({
            id: ch.id,
            chapterNumber: ch.attributes?.chapter || '?',
            title: ch.attributes?.title || `Chapter ${ch.attributes?.chapter || '?'}`
          }));
          // Sort chapters ascending by chapterNumber
          mapped.sort((a, b) => {
            const numA = parseFloat(a.chapterNumber);
            const numB = parseFloat(b.chapterNumber);
            if (isNaN(numA) || isNaN(numB)) return 0;
            return numA - numB;
          });
          setChaptersList(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch manga chapters feed:', err);
      }
    };
    fetchMangaChapters();
  }, [id]);

  // Redirect to first chapter (or last read chapter if saved) on mount
  useEffect(() => {
    if (chaptersList.length > 0 && (chapter === '1' || !chapter.includes('-'))) {
      const savedLastChapter = localStorage.getItem(`progress_manga_${id}_last_chapter`);
      const matchedSaved = savedLastChapter && chaptersList.some(ch => ch.id === savedLastChapter);
      const targetChapterId = matchedSaved ? savedLastChapter : chaptersList[0]?.id;
      
      if (targetChapterId) {
        navigate(`/read/${id}?chapter=${targetChapterId}`, { replace: true });
      }
    }
  }, [chaptersList, chapter, id, navigate]);

  const currentChapterIndex = chaptersList.findIndex(ch => ch.id === chapter);

  // Fetch initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      const localKey = `progress_manga_${id}_${chapter}`;
      const localSaved = localStorage.getItem(localKey);

      const token = localStorage.getItem('hybrid_library_token') || localStorage.getItem('token');
      if (token && id) {
        try {
          const res = await fetch(`/api/progress/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.progress && data.progress.chapter_id === chapter) {
            setCurrentPage(data.progress.last_page);
            return;
          }
        } catch (err) {}
      }

      if (localSaved) {
        const parsed = parseInt(localSaved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setCurrentPage(parsed);
        }
      }
    };
    fetchProgress();
  }, [id, chapter]);

  // Save progress
  useEffect(() => {
    const saveProgress = async () => {
      if (!id || !chapter || totalPages === 0) return;
      
      const localKey = `progress_manga_${id}_${chapter}`;
      localStorage.setItem(localKey, currentPage.toString());
      localStorage.setItem(`progress_manga_${id}_last_chapter`, chapter);

      const token = localStorage.getItem('hybrid_library_token') || localStorage.getItem('token');
      if (!token) return;
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ manga_id: id, chapter_id: chapter, last_page: currentPage })
        });
      } catch (err) {}
    };
    const timer = setTimeout(saveProgress, 1000); // debounce
    return () => clearTimeout(timer);
  }, [currentPage, id, chapter, totalPages]);

  // Fetch Chapter Pages
  const fetchPages = useCallback(async () => {
    if (!chapter || chapter === '1') return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chapter/${chapter}/pages`);
      const data = await res.json();
      console.log('fetchPages response:', data);
      if (data.success && data.data && data.data.length > 0) {
        setDataPages(data.data);
        setDataSaverPages(data.dataSaver || data.data);
        setTotalPages(data.total || data.data.length);
        console.log('setTotalPages called with:', data.total || data.data.length);
      } else {
        toast.error('Gagal mengambil halaman manga, memuat halaman contoh');
        setDataPages(samplePages);
        setDataSaverPages(sampleDataSaverPages);
        setTotalPages(samplePages.length);
      }
    } catch (err) {
      toast.error('Gagal mengambil halaman manga, memuat halaman contoh');
      setDataPages(samplePages);
      setDataSaverPages(sampleDataSaverPages);
      setTotalPages(samplePages.length);
    } finally {
      setIsLoading(false);
    }
  }, [chapter]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    localStorage.setItem('settings_reader_mode', readMode);
    // Reset zoom and page boundary logic when changing modes
    setZoomLevel(100);
    if (readMode === 'double' && currentPage % 2 === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [readMode, currentPage]);

  useEffect(() => {
    localStorage.setItem('settings_reader_brightness', brightness);
  }, [brightness]);

  const goToPage = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  }, [currentPage, totalPages]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (currentPage === 1) {
      if (chaptersList.length > 0 && currentChapterIndex > 0) {
        const prevChapter = chaptersList[currentChapterIndex - 1];
        toast.success(`Memuat Chapter ${prevChapter.chapterNumber}...`, { icon: '⏮️' });
        navigate(`/read/${id}?chapter=${prevChapter.id}`);
        setCurrentPage(1);
      } else {
        toast('Ini adalah chapter pertama', { icon: '⏮️' });
      }
      return;
    }
    const step = readMode === 'double' ? 2 : 1;
    goToPage(Math.max(1, currentPage - step));
  }, [currentPage, goToPage, readMode, chaptersList, currentChapterIndex, id, navigate]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    const isLastBoundary = readMode === 'double' ? currentPage >= totalPages - 1 : currentPage === totalPages;
    if (isLastBoundary) {
      if (chaptersList.length > 0 && currentChapterIndex !== -1 && currentChapterIndex < chaptersList.length - 1) {
        const nextChapter = chaptersList[currentChapterIndex + 1];
        toast.success(`Memuat Chapter ${nextChapter.chapterNumber}...`, { icon: '⏭️' });
        navigate(`/read/${id}?chapter=${nextChapter.id}`);
        setCurrentPage(1);
      } else {
        toast('Ini adalah chapter terakhir', { icon: '⏭️' });
      }
      return;
    }
    const step = readMode === 'double' ? 2 : 1;
    goToPage(Math.min(totalPages, currentPage + step));
  }, [currentPage, goToPage, readMode, totalPages, chaptersList, currentChapterIndex, id, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere if user is typing somewhere, though reader shouldn't have inputs
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Framer motion variants
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const toggleControls = () => setIsIdle(!isIdle);

  const zoomIn = (e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(200, prev + 10)); };
  const zoomOut = (e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(50, prev - 10)); };
  const zoomReset = (e) => { e.stopPropagation(); setZoomLevel(100); };

  // Generate image URL
  const getImageUrl = useCallback((page) => {
    if (page < 1 || page > totalPages) return '';
    const index = page - 1;
    const url = quality === 'data' ? dataPages[index] : dataSaverPages[index];
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('placehold.co')) return url;
      return `/api/manga-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [totalPages, quality, dataPages, dataSaverPages]);

  const handleImageError = () => {
    fetchPages(); // Attempt to refetch if token expired
  };

  // Preload next pages
  useEffect(() => {
    if (totalPages === 0) return;
    const preloadPage = (page) => {
      const url = getImageUrl(page);
      if (url) {
        const img = new Image();
        img.src = url;
      }
    };
    
    if (readMode === 'single' || readMode === 'vertical') {
      if (currentPage + 1 <= totalPages) preloadPage(currentPage + 1);
      if (currentPage + 2 <= totalPages) preloadPage(currentPage + 2);
    } else if (readMode === 'double') {
      if (currentPage + 2 <= totalPages) preloadPage(currentPage + 2);
      if (currentPage + 3 <= totalPages) preloadPage(currentPage + 3);
    }
  }, [currentPage, totalPages, readMode, getImageUrl]);

  // Brightness overlay style
  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(100 - brightness) / 100})`,
    pointerEvents: 'none'
  };

  // Render Page Content based on mode
  const renderContent = () => {
    if (readMode === 'vertical') {
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      return (
        <div 
          ref={verticalScrollRef}
          className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-24 pb-24"
          onClick={toggleControls}
        >
          <div className="flex flex-col items-center gap-4 w-full max-w-4xl" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (chaptersList.length > 0 && currentChapterIndex > 0) {
                  const prevChapter = chaptersList[currentChapterIndex - 1];
                  toast.success(`Memuat Chapter ${prevChapter.chapterNumber}...`, { icon: '⏮️' });
                  navigate(`/read/${id}?chapter=${prevChapter.id}`);
                  setCurrentPage(1);
                } else {
                  toast('Ini adalah chapter pertama', { icon: '⏮️' });
                }
              }}
              className="py-4 px-8 bg-white/5 hover:bg-white/10 rounded-full font-bold text-sm mb-4 transition-colors"
            >
              Chapter Sebelumnya
            </button>
            
            {pages.map(page => (
              <div key={page} className="relative w-full shadow-2xl">
                <PageImage 
                  src={getImageUrl(page)}
                  alt={`Page ${page}`}
                  className="w-full h-auto object-contain min-h-[400px]"
                />
                <div className="absolute inset-0" style={overlayStyle}></div>
                {/* Page indicator overlay for vertical mode */}
                <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white/80">
                  {page}
                </div>
              </div>
            ))}

            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (chaptersList.length > 0 && currentChapterIndex !== -1 && currentChapterIndex < chaptersList.length - 1) {
                  const nextChapter = chaptersList[currentChapterIndex + 1];
                  toast.success(`Memuat Chapter ${nextChapter.chapterNumber}...`, { icon: '⏭️' });
                  navigate(`/read/${id}?chapter=${nextChapter.id}`);
                  setCurrentPage(1);
                } else {
                  toast('Ini adalah chapter terakhir', { icon: '⏭️' });
                }
              }}
              className="py-4 px-8 bg-brand-orange/20 hover:bg-brand-orange/40 text-brand-orange rounded-full font-bold text-sm mt-4 transition-colors"
            >
              Chapter Selanjutnya
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={toggleControls}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="flex items-center justify-center h-full max-h-screen w-full"
            style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 0.2s' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe < -100) handleNext();
              else if (swipe > 100) handlePrev();
            }}
          >
            {/* Image 1 */}
            <div className="relative h-full max-w-full flex items-center shadow-2xl bg-[#0a0a0a]">
              <PageImage
                src={getImageUrl(currentPage)}
                className="h-full w-auto object-contain max-h-screen min-w-[200px]"
                alt={`Page ${currentPage}`}
                draggable={false}
              />
              <div className="absolute inset-0" style={overlayStyle}></div>
            </div>

            {/* Image 2 (Double Mode) */}
            {readMode === 'double' && currentPage < totalPages && (
              <div className="relative h-full max-w-full flex items-center shadow-2xl ml-[1px] bg-[#0a0a0a]">
                <PageImage
                  src={getImageUrl(currentPage + 1)}
                  className="h-full w-auto object-contain max-h-screen min-w-[200px]"
                  alt={`Page ${currentPage + 1}`}
                  draggable={false}
                />
                <div className="absolute inset-0" style={overlayStyle}></div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Previous/Next Chapter overlays for single/double mode */}
        {currentPage === 1 && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={handlePrev} className="flex flex-col items-center p-4 bg-black/50 rounded-xl">
              <ChevronLeft className="w-8 h-8 mb-2 text-brand-orange" />
              <span className="text-xs font-bold text-white whitespace-nowrap">Chapter Prev</span>
            </button>
          </div>
        )}

        {((readMode === 'single' && currentPage === totalPages) || (readMode === 'double' && currentPage >= totalPages - 1)) && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={handleNext} className="flex flex-col items-center p-4 bg-black/50 rounded-xl">
              <ChevronRight className="w-8 h-8 mb-2 text-brand-orange" />
              <span className="text-xs font-bold text-white whitespace-nowrap">Chapter Next</span>
            </button>
          </div>
        )}

        {/* Left/Right Click Zones */}
        <div className="absolute inset-y-0 left-0 w-[20%] z-40 cursor-pointer" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-[20%] z-40 cursor-pointer" onClick={handleNext} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-[#0a0a0a] text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0a0a0a] text-white overflow-hidden flex flex-col items-center justify-center select-none">
      
      {/* Top Bar Navigation Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md p-4 px-6 flex items-center justify-between border-b border-white/10"
          >
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 hover:text-brand-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold hidden sm:inline">Kembali</span>
            </button>

            {/* Top Zoom Controls */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
              <button onClick={zoomOut} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold w-12 text-center">{zoomLevel}%</span>
              <button onClick={zoomIn} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1"></div>
              <button onClick={zoomReset} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Reset Zoom">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowThumbnails(true); }}
                className="flex items-center gap-2 p-2 px-3 rounded-full hover:bg-white/10 transition-colors bg-white/5 border border-white/10"
              >
                <Grid className="w-4 h-4 text-brand-orange" />
                <span className="text-sm font-bold flex items-center">
                  <span className="text-white/50 font-normal mr-1 hidden sm:inline">Halaman</span>
                  {currentPage}
                  {readMode === 'double' && currentPage < totalPages && `-${currentPage + 1}`}
                  <span className="text-white/40 mx-1">dari</span>
                  {totalPages}
                </span>
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${showSettings ? 'text-brand-orange bg-white/5' : ''}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full right-0 mt-3 bg-[#1c1c1e] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[280px]"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Read Mode */}
                    <div className="mb-6">
                      <h4 className="text-xs font-bold mb-3 text-white/50 uppercase tracking-wider">Mode Baca</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setReadMode('single')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors border border-transparent ${readMode === 'single' ? 'bg-brand-orange/20 text-brand-orange border-brand-orange/30' : 'hover:bg-white/5 text-white/70'}`}
                        >
                          <Layout className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Single</span>
                        </button>
                        <button 
                          onClick={() => setReadMode('double')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors border border-transparent ${readMode === 'double' ? 'bg-brand-orange/20 text-brand-orange border-brand-orange/30' : 'hover:bg-white/5 text-white/70'}`}
                        >
                          <Columns className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Double</span>
                        </button>
                        <button 
                          onClick={() => setReadMode('vertical')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors border border-transparent ${readMode === 'vertical' ? 'bg-brand-orange/20 text-brand-orange border-brand-orange/30' : 'hover:bg-white/5 text-white/70'}`}
                        >
                          <List className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Scroll</span>
                        </button>
                      </div>
                    </div>

                    {/* Quality Toggle */}
                    <div className="mb-6">
                      <h4 className="text-xs font-bold mb-3 text-white/50 uppercase tracking-wider">Kualitas Gambar</h4>
                      <div className="flex bg-white/5 rounded-lg p-1">
                        <button 
                          onClick={() => setQuality('data-saver')}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${quality === 'data-saver' ? 'bg-brand-orange text-white' : 'text-white/50 hover:text-white'}`}
                        >
                          Hemat Data
                        </button>
                        <button 
                          onClick={() => setQuality('data')}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${quality === 'data' ? 'bg-brand-orange text-white' : 'text-white/50 hover:text-white'}`}
                        >
                          Kualitas Penuh
                        </button>
                      </div>
                    </div>

                    {/* Brightness */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">Kecerahan</h4>
                        <span className="text-xs font-bold text-white/70">{brightness}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sun className="w-4 h-4 text-white/50" />
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={brightness}
                          onChange={(e) => setBrightness(parseInt(e.target.value))}
                          className="flex-1 accent-brand-orange h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Mobile Zoom Controls (if needed) */}
                    <div className="mt-6 md:hidden">
                      <h4 className="text-xs font-bold mb-3 text-white/50 uppercase tracking-wider">Zoom</h4>
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                        <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded-md"><ZoomOut className="w-4 h-4" /></button>
                        <span className="text-xs font-bold">{zoomLevel}%</span>
                        <button onClick={zoomReset} className="p-2 hover:bg-white/10 rounded-md"><RefreshCw className="w-4 h-4" /></button>
                        <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded-md"><ZoomIn className="w-4 h-4" /></button>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Image View */}
      {renderContent()}

      {/* Bottom Navigation Control (Hidden in vertical scroll) */}
      <AnimatePresence>
        {showControls && readMode !== 'vertical' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center gap-2 shadow-2xl"
          >
            <button 
              onClick={handlePrev}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="px-4 py-1 rounded-full bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setShowThumbnails(true)}>
              <span className="font-bold text-sm text-center text-white/90 flex gap-1 items-center">
                <span className="text-white/50 text-xs mr-1 hidden sm:inline">Halaman</span>
                {currentPage} 
                {readMode === 'double' && currentPage < totalPages && `-${currentPage + 1}`}
                <span className="text-white/40"> dari </span> {totalPages}
              </span>
            </div>
            <button 
              onClick={handleNext}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Thumbnails Drawer */}
      <PageThumbnails 
        totalPages={totalPages}
        currentPage={currentPage}
        onSelectPage={(p) => { goToPage(p); setShowThumbnails(false); }}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
        mangaId={id}
      />
      
    </div>
  );
}
