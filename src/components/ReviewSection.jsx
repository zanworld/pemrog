import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageSquare, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getReviews, postReview } from '../services/mangadex';

export default function ReviewSection({ mangaId }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load reviews from backend
  const fetchReviews = useCallback(async () => {
    if (!mangaId) return;
    try {
      const res = await getReviews(mangaId);
      if (res.success && res.reviews) {
        setReviews(res.reviews);
      }
    } catch (error) {
      console.error('Failed to load reviews from database:', error);
    }
  }, [mangaId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchReviews();
    });
  }, [fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk menulis ulasan!');
      return;
    }

    if (!comment.trim()) {
      toast.error('Komentar ulasan tidak boleh kosong!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await postReview({ mangaId, comment: comment.trim() });
      if (res.success) {
        toast.success('Ulasan berhasil ditambahkan!');
        setComment('');
        fetchReviews(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to save review:', error);
      toast.error(error.response?.data?.message || 'Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvatarColor = (nameString) => {
    const hash = nameString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'from-orange-500 to-amber-600',
      'from-rose-500 to-pink-600',
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
    ];
    return colors[hash % colors.length];
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Section (left / top) */}
      <div className="lg:col-span-5 lg:sticky lg:top-4 bg-brand-cardBg border border-brand-border/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-extrabold text-brand-textMain mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-orange" />
          Tulis Ulasan Baru
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name-input" className="block text-xs font-bold text-brand-textMuted uppercase mb-1.5">
              Nama Pengulas
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textMuted/60">
                <User className="w-4 h-4" />
              </span>
              <input
                id="name-input"
                type="text"
                value={isAuthenticated ? user?.name || '' : ''}
                disabled
                placeholder="Silakan login terlebih dahulu"
                className="w-full bg-brand-darkBg/30 border border-brand-border/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-textMain/70 placeholder-brand-textMuted/55 focus:outline-none transition-all cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comment-input" className="block text-xs font-bold text-brand-textMuted uppercase mb-1.5">
              Ulasan Anda
            </label>
            <textarea
              id="comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!isAuthenticated}
              placeholder={isAuthenticated ? "Tulis pendapat atau ulasan Anda tentang manga ini..." : "Silakan login terlebih dahulu untuk menulis ulasan"}
              rows="4"
              className={`w-full bg-brand-darkBg/60 border border-brand-border/70 rounded-xl py-2.5 px-4 text-sm text-brand-textMain placeholder-brand-textMuted/55 focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/30 transition-all resize-none ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isAuthenticated}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-brand-orange hover:bg-brand-accent text-white shadow-neon hover:shadow-neon-hover transition-all duration-200 group active:scale-98 ${(!isAuthenticated || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </form>
      </div>

      {/* Review List Section (right / bottom) */}
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-extrabold text-brand-textMain mb-4 flex items-center gap-2">
          Ulasan Komunitas ({reviews.length})
        </h3>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {reviews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center bg-brand-cardBg/30 border border-brand-border/40 rounded-2xl p-6"
              >
                <MessageSquare className="w-10 h-10 text-brand-textMuted/50 mb-3 stroke-1" />
                <p className="text-sm font-semibold text-brand-textMain">Belum ada ulasan</p>
                <p className="text-xs text-brand-textMuted mt-1">
                  Jadilah yang pertama untuk menulis ulasan tentang manga ini!
                </p>
              </motion.div>
            ) : (
              reviews.map((review, index) => {
                const initialLetter = (review.name || 'A')[0].toUpperCase();
                const avatarColor = getAvatarColor(review.name || 'Anonim');

                return (
                  <motion.div
                    key={review.id || `${review.date}-${index}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-4 bg-brand-cardBg/60 border border-brand-border/40 rounded-xl p-4 shadow-sm hover:border-brand-border/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br ${avatarColor} text-sm`}>
                      {initialLetter}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-sm font-bold text-brand-textMain truncate flex items-center gap-2">
                          {review.name}
                          {review.rating && (
                            <span className="text-xs text-brand-orange font-bold px-1.5 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20">
                              ★ {review.rating}
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-brand-textMuted flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(review.date)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-brand-textMuted/90 whitespace-pre-wrap break-words">
                        {review.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
