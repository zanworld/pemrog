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

const TOTAL_PAGES = 10;

export default function ReadOnlyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapter = searchParams.get('chapter');

  // Toast current chapter
  useEffect(() => {
    if (chapter) {
      toast.success(`Membaca Chapter ${chapter}`);
    }
  }, [chapter]);

  // Load saved preferences
  const getSavedPage = () => {
    const saved = localStorage.getItem(`reading_progress_${id}`);
    return saved ? parseInt(saved, 10) : 1;
  };
  const getSavedMode = () => localStorage.getItem('settings_reader_mode') || 'single';
  const getSavedBrightness = () => {
    const saved = localStorage.getItem('settings_reader_brightness');
    return saved ? parseInt(saved, 10) : 100;
  };

  const [currentPage, setCurrentPage] = useState(getSavedPage);
  const [readMode, setReadMode] = useState(getSavedMode); // 'single', 'double', 'vertical'
  const [brightness, setBrightness] = useState(getSavedBrightness); // 0-100
  const [zoomLevel, setZoomLevel] = useState(100); // 50-200
  
  const [showSettings, setShowSettings] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [direction, setDirection] = useState(1);

  // Auto-hide controls
  const { isIdle, setIsIdle } = useIdleTimer(3000, showSettings || showThumbnails);
  const showControls = !isIdle || showSettings || showThumbnails;

  const verticalScrollRef = useRef(null);

  // Save progress and settings
  useEffect(() => {
    localStorage.setItem(`reading_progress_${id}`, currentPage);
  }, [currentPage, id]);

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
    if (newPage < 1 || newPage > TOTAL_PAGES) return;
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  }, [currentPage]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (currentPage === 1) {
      toast('Memuat Chapter Sebelumnya...', { icon: '⏮️' });
      return;
    }
    const step = readMode === 'double' ? 2 : 1;
    goToPage(Math.max(1, currentPage - step));
  }, [currentPage, goToPage, readMode]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    const isLastBoundary = readMode === 'double' ? currentPage >= TOTAL_PAGES - 1 : currentPage === TOTAL_PAGES;
    if (isLastBoundary) {
      toast('Memuat Chapter Selanjutnya...', { icon: '⏭️' });
      return;
    }
    const step = readMode === 'double' ? 2 : 1;
    goToPage(Math.min(TOTAL_PAGES, currentPage + step));
  }, [currentPage, goToPage, readMode]);

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
  const getImageUrl = (page) => `https://picsum.photos/800/1200?random=${id}-${page}`;

  // Brightness overlay style
  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(100 - brightness) / 100})`,
    pointerEvents: 'none'
  };

  // Render Page Content based on mode
  const renderContent = () => {
    if (readMode === 'vertical') {
      const pages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
      return (
        <div 
          ref={verticalScrollRef}
          className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-24 pb-24"
          onClick={toggleControls}
        >
          <div className="flex flex-col items-center gap-4 w-full max-w-4xl" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); toast('Memuat Chapter Sebelumnya...', { icon: '⏮️' }); }}
              className="py-4 px-8 bg-white/5 hover:bg-white/10 rounded-full font-bold text-sm mb-4 transition-colors"
            >
              Chapter Sebelumnya
            </button>
            
            {pages.map(page => (
              <div key={page} className="relative w-full shadow-2xl">
                <img 
                  src={getImageUrl(page)}
                  loading="lazy"
                  alt={`Page ${page}`}
                  className="w-full h-auto object-contain"
                />
                <div className="absolute inset-0" style={overlayStyle}></div>
                {/* Page indicator overlay for vertical mode */}
                <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white/80">
                  {page}
                </div>
              </div>
            ))}

            <button 
              onClick={(e) => { e.stopPropagation(); toast('Memuat Chapter Selanjutnya...', { icon: '⏭️' }); }}
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
            <div className="relative h-full max-w-full flex items-center shadow-2xl">
              <img
                src={getImageUrl(currentPage)}
                className="h-full w-auto object-contain max-h-screen"
                alt={`Page ${currentPage}`}
                draggable={false}
              />
              <div className="absolute inset-0" style={overlayStyle}></div>
            </div>

            {/* Image 2 (Double Mode) */}
            {readMode === 'double' && currentPage < TOTAL_PAGES && (
              <div className="relative h-full max-w-full flex items-center shadow-2xl ml-[1px]">
                <img
                  src={getImageUrl(currentPage + 1)}
                  className="h-full w-auto object-contain max-h-screen"
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

        {((readMode === 'single' && currentPage === TOTAL_PAGES) || (readMode === 'double' && currentPage >= TOTAL_PAGES - 1)) && (
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
                className="flex items-center gap-2 p-2 px-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <Grid className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Halaman</span>
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
              <span className="font-bold text-sm min-w-[80px] text-center tracking-widest text-white/90">
                {currentPage} 
                {readMode === 'double' && currentPage < TOTAL_PAGES && `-${currentPage + 1}`}
                <span className="text-white/40"> / </span> {TOTAL_PAGES}
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
        totalPages={TOTAL_PAGES}
        currentPage={currentPage}
        onSelectPage={(p) => { goToPage(p); setShowThumbnails(false); }}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
        mangaId={id}
      />
      
    </div>
  );
}
