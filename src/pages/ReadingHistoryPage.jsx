import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, RefreshCw, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ReadingHistoryPage() {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/progress/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      setError('Gagal memuat riwayat baca. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isAuthenticated, token]);

  // ── Unauthenticated state ──
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
          <LogIn className="h-9 w-9 text-brand-orange" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-textMain mb-2">Login Diperlukan</h1>
        <p className="text-brand-textMuted mb-6 max-w-sm">
          Masuk ke akunmu untuk melihat riwayat baca manga.
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
            <Clock className="h-6 w-6 text-brand-orange" />
            Reading History
          </h1>
          <p className="text-sm text-brand-textMuted mt-1">
            {history?.length > 0
              ? `${history.length} manga yang pernah kamu baca`
              : 'Belum ada riwayat baca'}
          </p>
        </div>
        <button
          onClick={fetchHistory}
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
      {loading && history?.length === 0 && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-brand-cardBg border border-brand-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && history?.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-dashed border-brand-border/60 bg-brand-cardBg/30">
          <BookOpen className="h-14 w-14 text-brand-textMuted/30 mb-4" />
          <h2 className="text-lg font-bold text-brand-textMain mb-2">Belum Ada Riwayat Baca</h2>
          <p className="text-brand-textMuted text-sm max-w-xs">
            Baca manga dan progresmu akan muncul di sini secara otomatis.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-6 flex items-center gap-2 bg-brand-orange hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
          >
            <BookOpen className="h-4 w-4" /> Jelajahi Katalog
          </button>
        </div>
      )}

      {/* History list */}
      {history?.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {history.map((entry, idx) => {
            const mangaId = entry.manga_id;
            const isUuid = mangaId && mangaId.includes('-');
            const displayTitle = isUuid
              ? `Manga ${mangaId.slice(0, 8)}...`
              : `Manga #${mangaId}`;

            return (
              <motion.div
                key={`${mangaId}-${idx}`}
                variants={itemVariants}
                className="group flex items-center gap-4 rounded-xl bg-brand-cardBg border border-brand-border hover:border-brand-orange/40 p-4 transition-all duration-200 hover:shadow-neon cursor-pointer"
                onClick={() => navigate(`/book/${mangaId}`)}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-brand-orange" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand-textMain text-sm truncate group-hover:text-brand-orange transition-colors">
                    {displayTitle}
                  </p>
                  <p className="text-xs text-brand-textMuted mt-0.5">
                    Chapter {entry.chapter_id ? entry.chapter_id.slice(0, 8) + '...' : '?'}
                    {entry.last_page > 1 && ` · Halaman ${entry.last_page}`}
                  </p>
                </div>

                {/* Time + Continue */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <span className="text-[10px] text-brand-textMuted">{formatRelativeTime(entry.updated_at)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (entry.chapter_id) {
                        navigate(`/read/${entry.chapter_id}?page=${entry.last_page || 1}`);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-orange hover:text-brand-accent transition-colors"
                  >
                    Lanjutkan <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
