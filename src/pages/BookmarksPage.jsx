import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Trash2, RefreshCw, LogIn, BookOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop';

export default function BookmarksPage() {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/bookmarks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setBookmarks(res.data.bookmarks || []);
      }
    } catch (err) {
      setError('Gagal memuat bookmarks. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemove = async (mangaId, e) => {
    e.stopPropagation();
    setRemovingId(mangaId);
    try {
      await axios.delete(`/api/bookmarks/${mangaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarks(prev => prev.filter(b => b.manga_id !== mangaId));
      toast.success('Bookmark dihapus');
    } catch (err) {
      toast.error('Gagal menghapus bookmark');
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  // ── Unauthenticated state ──
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
          <LogIn className="h-9 w-9 text-brand-orange" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-textMain mb-2">Login Diperlukan</h1>
        <p className="text-brand-textMuted mb-6 max-w-sm">
          Masuk ke akunmu untuk melihat daftar bookmark manga.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 bg-brand-orange hover:bg-brand-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-neon"
        >
          <LogIn className="h-4 w-4" /> Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
            <Bookmark className="h-6 w-6 text-brand-orange" />
            Bookmarks
          </h1>
          <p className="text-sm text-brand-textMuted mt-1">
            {bookmarks.length > 0
              ? `${bookmarks.length} manga yang kamu simpan`
              : 'Belum ada manga yang di-bookmark'}
          </p>
        </div>
        <button
          onClick={fetchBookmarks}
          disabled={loading}
          className="flex items-center gap-2 text-brand-textMuted hover:text-brand-orange border border-brand-border hover:border-brand-orange/40 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && bookmarks.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[3/4.2] rounded-xl bg-brand-cardBg border border-brand-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && bookmarks.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-dashed border-brand-border/60 bg-brand-cardBg/30">
          <Bookmark className="h-14 w-14 text-brand-textMuted/30 mb-4" />
          <h2 className="text-lg font-bold text-brand-textMain mb-2">Belum Ada Bookmark</h2>
          <p className="text-brand-textMuted text-sm max-w-xs">
            Bookmark manga favoritmu dari halaman detail atau kartu manga.
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
      {bookmarks.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence>
            {bookmarks.map((bm) => {
              const mangaId = bm.manga_id;
              const title = bm.manga_title || `Manga ${mangaId?.slice(0, 8) || '?'}`;
              const image = bm.manga_image || FALLBACK_IMAGE;
              const isRemoving = removingId === mangaId;

              return (
                <motion.div
                  key={mangaId}
                  variants={cardVariants}
                  exit="exit"
                  layout
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-brand-cardBg border border-brand-border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-orange/40 hover:shadow-neon"
                  onClick={() => navigate(`/book/${mangaId}`)}
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-brand-darkBg">
                    <img
                      src={image}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-darkBg via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemove(mangaId, e)}
                      disabled={isRemoving}
                      aria-label="Hapus bookmark"
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg disabled:opacity-50"
                    >
                      {isRemoving ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* View link */}
                    <div className="absolute left-2 bottom-2">
                      <span className="flex items-center gap-1 rounded-lg bg-brand-orange/90 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <ExternalLink className="h-2.5 w-2.5" /> Detail
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-xs font-bold leading-snug text-brand-textMain group-hover:text-brand-orange transition-colors duration-200">
                      {title}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
