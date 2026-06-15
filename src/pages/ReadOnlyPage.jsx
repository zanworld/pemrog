import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, Maximize, Minimize } from 'lucide-react';

const TOTAL_PAGES = 10;

export default function ReadOnlyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const getSavedPage = () => {
    const saved = localStorage.getItem(`reading_progress_${id}`);
    return saved ? parseInt(saved, 10) : 1;
  };

  const [currentPage, setCurrentPage] = useState(getSavedPage);
  const [fitMode, setFitMode] = useState('height'); // 'height' or 'width'
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [direction, setDirection] = useState(1);

  // Save progress
  useEffect(() => {
    localStorage.setItem(`reading_progress_${id}`, currentPage);
  }, [currentPage, id]);

  const goToPage = useCallback((newPage) => {
    if (newPage < 1 || newPage > TOTAL_PAGES) return;
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  }, [currentPage]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!showSettings) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [showSettings]);

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
              <span className="font-semibold">Kembali</span>
            </button>

            <div className="flex items-center gap-4 relative">
              <span className="text-sm font-medium opacity-80">Halaman {currentPage} / {TOTAL_PAGES}</span>
              
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
                    className="absolute top-full right-0 mt-3 bg-[#1c1c1e] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[200px]"
                  >
                    <h4 className="text-xs font-bold mb-2 text-white/50 uppercase tracking-wider px-2">Mode Tampilan</h4>
                    <div className="space-y-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFitMode('height');
                          setShowSettings(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${fitMode === 'height' ? 'bg-brand-orange/20 text-brand-orange' : 'hover:bg-white/5 text-white/80'}`}
                      >
                        <Minimize className="w-4 h-4" />
                        <span className="text-sm font-medium">Fit Height</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFitMode('width');
                          setShowSettings(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${fitMode === 'width' ? 'bg-brand-orange/20 text-brand-orange' : 'hover:bg-white/5 text-white/80'}`}
                      >
                        <Maximize className="w-4 h-4" />
                        <span className="text-sm font-medium">Fit Width</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Image View */}
      <div 
        className={`relative w-full h-full flex items-center justify-center ${fitMode === 'width' ? 'overflow-y-auto custom-scrollbar items-start' : 'overflow-hidden'}`}
        onClick={() => setShowControls(!showControls)}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentPage}
            src={`https://picsum.photos/800/1200?random=${id}-${currentPage}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className={`shadow-2xl ${
              fitMode === 'height' ? 'h-full max-h-screen w-auto object-contain' : 'w-full h-auto object-contain'
            }`}
            alt={`Page ${currentPage}`}
            drag={fitMode === 'height' ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe < -100) {
                handleNext();
              } else if (swipe > 100) {
                handlePrev();
              }
            }}
          />
        </AnimatePresence>
      </div>

      {/* Left/Right Click Zones */}
      <div className="absolute inset-y-0 left-0 w-[15%] z-40 cursor-pointer" onClick={handlePrev} />
      <div className="absolute inset-y-0 right-0 w-[15%] z-40 cursor-pointer" onClick={handleNext} />

      {/* Bottom Navigation Control */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center gap-2 shadow-2xl"
          >
            <button 
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-3 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="px-4 py-1 rounded-full bg-white/5 border border-white/5">
              <span className="font-bold text-sm min-w-[80px] text-center tracking-widest text-white/90">
                {currentPage} <span className="text-white/40">/</span> {TOTAL_PAGES}
              </span>
            </div>
            <button 
              onClick={handleNext}
              disabled={currentPage === TOTAL_PAGES}
              className="p-3 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
