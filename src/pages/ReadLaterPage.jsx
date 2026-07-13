import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, BookOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const READ_LATER_KEY = 'readLaterList';

export function getReadLaterList() {
  try {
    return JSON.parse(localStorage.getItem(READ_LATER_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToReadLater(manga) {
  const list = getReadLaterList();
  const id = String(manga.id || manga.mal_id);
  if (list.some(item => item.id === id)) return false; // already exists
  const newItem = {
    id,
    title: manga.title || manga.title_english || 'Unknown',
    image: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || '',
    source: manga.source || 'jikan',
    addedAt: new Date().toISOString(),
  };
  localStorage.setItem(READ_LATER_KEY, JSON.stringify([newItem, ...list]));
  return true;
}

export function removeFromReadLater(id) {
  const list = getReadLaterList();
  localStorage.setItem(READ_LATER_KEY, JSON.stringify(list.filter(item => item.id !== String(id))));
}

export function isInReadLater(manga) {
  const id = String(manga?.id || manga?.mal_id || '');
  return id ? getReadLaterList().some(item => item.id === id) : false;
}

// ─────────────────────────────────────────────────
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export default function ReadLaterPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);

  const loadList = useCallback(() => {
    setList(getReadLaterList());
  }, []);

  useEffect(() => {
    loadList();
    // Listen for storage changes from other tabs
    const handleStorage = (e) => {
      if (e.key === READ_LATER_KEY) loadList();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadList]);

  const handleRemove = (id, e) => {
    e.stopPropagation();
    removeFromReadLater(id);
    setList(prev => prev.filter(item => item.id !== String(id)));
    toast.success('Dihapus dari Read Later');
  };

  const handleClearAll = () => {
    localStorage.removeItem(READ_LATER_KEY);
    setList([]);
    toast.success('Semua Read Later dihapus');
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
            <Clock className="h-6 w-6 text-brand-orange" />
            Read Later
          </h1>
          <p className="text-sm text-brand-textMuted mt-1">
            {list.length > 0
              ? `${list.length} manga yang ingin kamu baca nanti`
              : 'Daftar baca nanti masih kosong'}
          </p>
        </div>
        {list.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Hapus Semua
          </button>
        )}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-dashed border-brand-border/60 bg-brand-cardBg/30">
          <Clock className="h-14 w-14 text-brand-textMuted/30 mb-4" />
          <h2 className="text-lg font-bold text-brand-textMain mb-2">Belum Ada yang Ditambahkan</h2>
          <p className="text-brand-textMuted text-sm max-w-xs">
            Klik tombol "+ Baca Nanti" di kartu manga atau halaman detail untuk menyimpan manga yang ingin kamu baca.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-6 flex items-center gap-2 bg-brand-orange hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
          >
            <BookOpen className="h-4 w-4" /> Jelajahi Katalog
          </button>
        </div>
      )}

      {/* Grid */}
      {list.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence>
            {list.map((item) => (
              <motion.div
                key={item.id}
                variants={cardVariants}
                exit="exit"
                layout
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-brand-cardBg border border-brand-border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-orange/40 hover:shadow-neon"
                onClick={() => navigate(`/book/${item.id}`)}
              >
                {/* Cover */}
                <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-brand-darkBg">
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-darkBg via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />

                  {/* Source badge */}
                  {item.source === 'mangadex' && (
                    <div className="absolute left-2 top-2 rounded-lg bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      LIVE
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(item.id, e)}
                    aria-label="Hapus dari Read Later"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* View link */}
                  <div className="absolute left-2 bottom-2">
                    <span className="flex items-center gap-1 rounded-lg bg-brand-orange/90 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <ExternalLink className="h-2.5 w-2.5" /> Detail
                    </span>
                  </div>
                </div>

                {/* Title + date */}
                <div className="p-3">
                  <h3 className="line-clamp-2 text-xs font-bold leading-snug text-brand-textMain group-hover:text-brand-orange transition-colors duration-200">
                    {item.title}
                  </h3>
                  {item.addedAt && (
                    <p className="text-[10px] text-brand-textMuted mt-1">
                      {new Date(item.addedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
