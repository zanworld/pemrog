import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Lightbox({ manga, onClose }) {
  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (manga) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [manga]);

  if (!manga) return null;

  // Support both MangaDex (coverUrl) and Jikan (images.jpg.*) formats
  const imageUrl =
    manga.coverUrl ||
    manga.images?.jpg?.large_image_url ||
    manga.images?.jpg?.image_url ||
    '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full hover:bg-brand-orange transition-colors"
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </button>
        
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-4xl max-h-[90vh] flex flex-col items-center bg-brand-darkBg rounded-2xl overflow-hidden shadow-neon border border-brand-border"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={manga.title}
            className="max-w-full max-h-[80vh] object-contain bg-black"
          />
          <div className="w-full p-4 text-center bg-brand-cardBg border-t border-brand-border">
            <h3 className="text-lg md:text-xl font-bold text-brand-textMain">
              {manga.title}
            </h3>
            {manga.title_english && manga.title_english !== manga.title && (
              <p className="text-sm text-brand-textMuted mt-1">{manga.title_english}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
