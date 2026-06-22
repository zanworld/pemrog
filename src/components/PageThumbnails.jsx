import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function PageThumbnails({ totalPages, currentPage, onSelectPage, isOpen, onClose, mangaId }) {
  const scrollRef = useRef(null);

  // Scroll to current page thumbnail when opened
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('.active-thumbnail');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, currentPage]);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-[#1c1c1e] z-[70] border-l border-white/10 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white/90">Semua Halaman</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {pages.map((page) => (
                  <div 
                    key={page}
                    onClick={() => onSelectPage(page)}
                    className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all ${
                      currentPage === page 
                        ? 'border-brand-orange active-thumbnail shadow-[0_0_15px_rgba(255,107,0,0.4)]' 
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="aspect-[2/3] bg-white/5 relative">
                      <img 
                        src={`https://picsum.photos/200/300?random=${mangaId}-${page}`}
                        alt={`Halaman ${page}`}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <span className="text-xs font-bold text-white drop-shadow-md">
                          Hal {page}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
