import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, BookOpen, Bookmark, BookmarkCheck, Star,
  TrendingUp, Calendar, User, BookOpenCheck, Layers,
  Hash, Eye, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import RatingStars from '../components/RatingStars';
import ReviewSection from '../components/ReviewSection';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAuth } from '../context/AuthContext';
import { getMangaDetail, getMangaFeed, getReviews, postReview } from '../services/mangadex';

// ── Animation Variants ──────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], staggerChildren: 0.08 }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};

const coverVariants = {
  hidden: { opacity: 0, scale: 0.9, rotateY: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const recCardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' }
  })
};

// ── Loading Skeleton ─────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Hero skeleton */}
      <div className="relative h-64 sm:h-72 rounded-2xl bg-brand-cardBg border border-brand-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-darkBg via-brand-cardBg to-brand-darkBg" />
      </div>
      {/* Content skeleton */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-56 h-80 rounded-xl bg-brand-border/40 flex-shrink-0 mx-auto md:mx-0" />
        <div className="flex-1 space-y-4">
          <div className="h-5 w-20 bg-brand-border/45 rounded" />
          <div className="h-8 w-3/4 bg-brand-border/45 rounded" />
          <div className="h-4 w-1/2 bg-brand-border/40 rounded" />
          <div className="flex gap-3 pt-2">
            <div className="h-9 w-28 bg-brand-border/45 rounded-lg" />
            <div className="h-9 w-28 bg-brand-border/45 rounded-lg" />
            <div className="h-9 w-28 bg-brand-border/45 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-brand-border/35 rounded-lg" />
            ))}
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full bg-brand-border/30 rounded" />
            <div className="h-3 w-full bg-brand-border/30 rounded" />
            <div className="h-3 w-5/6 bg-brand-border/30 rounded" />
            <div className="h-3 w-3/4 bg-brand-border/30 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mini Recommendation Card ─────────────────────────────────
function MiniRecCard({ manga, index, navigate }) {
  const title = manga.title || manga.title_english || 'Unknown';
  const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || '';
  const score = manga.score ? manga.score.toFixed(1) : 'N/A';

  return (
    <motion.div
      custom={index}
      variants={recCardVariants}
      initial="hidden"
      animate="visible"
      onClick={() => navigate(`/book/${manga.id || manga.mal_id}`)}
      className="group flex-shrink-0 w-36 sm:w-40 cursor-pointer"
    >
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl bg-brand-darkBg border border-brand-border/60 transition-all duration-300 group-hover:border-brand-orange/50 group-hover:shadow-neon">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Score badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-brand-darkBg/90 px-2 py-0.5 text-[10px] font-bold text-brand-orange border border-brand-orange/20">
          <Star className="h-2.5 w-2.5 fill-brand-orange text-brand-orange" />
          {score}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h4 className="text-xs font-bold text-white leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors">
            {title}
          </h4>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main BookDetailPage ──────────────────────────────────────
export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [manga, setManga] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Sinopsis');
  const [userRating, setUserRating] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // ─── Check bookmark status on mount / id change ───
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('hybrid_library_bookmarks') || '[]');
    const isBookmarkedMatch = bookmarks.some(b => String(b.id || b.mal_id) === String(id));
    setIsBookmarked(isBookmarkedMatch);
  }, [id]);

  // ─── Fetch user rating from SQLite reviews database ───
  useEffect(() => {
    const fetchUserRatingAndReviews = async () => {
      try {
        const res = await getReviews(id);
        if (res.success && res.reviews) {
          if (user) {
            // Find rating from current user's review (if exists)
            const ourReview = res.reviews.find(r => r.name === user.name && r.rating !== undefined);
            if (ourReview) {
              setUserRating(ourReview.rating);
            } else {
              setUserRating(0);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load rating from db:', err);
      }
    };
    if (id) {
      fetchUserRatingAndReviews();
    }
  }, [id, user]);

  // ─── Fetch manga detail ───
  const fetchManga = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setManga(null);
    try {
      const res = await getMangaDetail(id);
      if (res?.data) {
        setManga(res.data);
      } else {
        throw new Error('Manga not found');
      }
    } catch (err) {
      console.error('Failed to fetch manga detail:', err);
      setError(err.response?.data?.message || 'Failed to load manga details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchManga();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchManga]);

  // ─── Fetch chapters feed ───
  useEffect(() => {
    const fetchChapters = async () => {
      setChaptersLoading(true);
      try {
        const res = await getMangaFeed(id);
        if (res?.data) {
          const mapped = res.data.map(ch => ({
            id: ch.id,
            chapterNumber: ch.attributes?.chapter || '?',
            title: ch.attributes?.title || `Chapter ${ch.attributes?.chapter || '?'}`
          }));
          setChapters(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch chapters:', err);
      } finally {
        setChaptersLoading(false);
      }
    };
    if (id) {
      fetchChapters();
    }
  }, [id]);

  // ─── Fetch "You May Also Like" recommendations ───
  useEffect(() => {
    if (!manga) return;

    const fetchRecs = async () => {
      setRecsLoading(true);
      try {
        const firstGenreId = manga.genres?.[0]?.mal_id;
        const queryParam = firstGenreId !== undefined ? `genres=${firstGenreId}&` : '';
        const res = await axios.get(`/api/manga?${queryParam}limit=12`);
        if (res.data?.data) {
          const currentIdStr = String(manga.id || manga.mal_id);
          const filtered = res.data.data.filter(m => String(m.id || m.mal_id) !== currentIdStr);
          setRecommendations(filtered.slice(0, 6));
        }
      } catch (err) {
        console.warn('Failed to fetch recommendations:', err);
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecs();
  }, [manga]);

  // ─── Bookmark handler ───
  const handleBookmark = () => {
    if (!manga) return;
    const bookmarks = JSON.parse(localStorage.getItem('hybrid_library_bookmarks') || '[]');
    const currentIdStr = String(manga.id || manga.mal_id);
    const isAlreadyBookmarked = bookmarks.some(b => String(b.id || b.mal_id) === currentIdStr);

    if (isAlreadyBookmarked) {
      const updated = bookmarks.filter(b => String(b.id || b.mal_id) !== currentIdStr);
      localStorage.setItem('hybrid_library_bookmarks', JSON.stringify(updated));
      setIsBookmarked(false);
      toast('Bookmark removed', { icon: '🗑️' });
    } else {
      const bookData = {
        id: manga.id || String(manga.mal_id),
        mal_id: manga.mal_id || manga.id,
        title: manga.title,
        images: manga.images,
        score: manga.score || 0
      };
      bookmarks.push(bookData);
      localStorage.setItem('hybrid_library_bookmarks', JSON.stringify(bookmarks));
      setIsBookmarked(true);
      toast.success('Bookmarked successfully!');
    }
  };

  // ─── User rating handler ───
  const handleRatingChange = async (newRating) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk memberikan rating!');
      return;
    }
    setUserRating(newRating);
    try {
      await postReview({ mangaId: id, rating: newRating });
      toast.success(`Terima kasih! Anda memberi rating ${newRating} bintang.`);
    } catch (err) {
      console.error('Failed to save rating:', err);
      toast.error('Gagal menyimpan rating ke database.');
    }
  };

  // ─── Share link handler ───
  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        toast.success('Tautan halaman berhasil disalin ke clipboard!');
      })
      .catch((err) => {
        console.error('Gagal menyalin tautan:', err);
        toast.error('Gagal menyalin tautan.');
      });
  };

  // ─── Error state with retry ───
  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center animate-fade-in">
        <div className="text-5xl mb-6">😵</div>
        <h2 className="text-2xl font-extrabold text-brand-textMain mb-3">Oops! Gagal Memuat Data</h2>
        <p className="text-brand-textMuted mb-8 max-w-md">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={fetchManga}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-brand-orange hover:bg-brand-accent text-white shadow-neon hover:shadow-neon-hover transition-all cursor-pointer"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-brand-cardBg border border-brand-border text-brand-textMain transition-all cursor-pointer hover:border-brand-orange/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="py-4">
        {/* Back button even while loading */}
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 mb-6 text-sm font-semibold text-brand-textMuted hover:text-brand-orange transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!manga) return null;

  const title = manga.title || manga.title_english || 'Unknown Title';
  const titleJp = manga.title_japanese || '';
  const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || 'https://via.placeholder.com/256x364?text=No+Cover';
  const score = manga.score ? manga.score.toFixed(1) : 'N/A';
  const rank = manga.rank || 'N/A';
  const popularity = manga.popularity || 'N/A';
  const chaptersCount = manga.chapters || 'Unknown';
  const volumes = manga.volumes || 'Unknown';
  const status = manga.status || 'Unknown';
  const synopsis = manga.synopsis || 'No description available for this manga.';
  const publishedStr = manga.published?.string || 'Unknown';
  const genres = manga.genres || [];
  const authors = manga.authors || [];
  const type = manga.type || 'Manga';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`detail-${id}`}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="pb-8"
      >
        {/* ── Back Button ────────────────────────────── */}
        <motion.button
          variants={childVariants}
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 mb-6 text-sm font-semibold text-brand-textMuted hover:text-brand-orange transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Catalog
        </motion.button>

        {/* ── Hero Banner ─────────────────────────────── */}
        <motion.div
          variants={childVariants}
          className="relative h-56 sm:h-64 md:h-72 rounded-2xl overflow-hidden mb-8 border border-brand-border/50"
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-darkBg via-brand-darkBg/85 to-brand-darkBg/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-darkBg via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent" />

          {/* Floating title inside hero */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block rounded-md bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                {type}
              </span>
              <DataSourceBadge source={manga.source} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>
            {titleJp && (
              <p className="text-sm text-gray-400 mt-1 italic">{titleJp}</p>
            )}
          </div>
        </motion.div>

        {/* ── Main Content ────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: Cover + Actions ──────────────── */}
          <motion.div variants={coverVariants} className="w-52 sm:w-56 mx-auto lg:mx-0 flex-shrink-0">
            {/* Cover Image */}
            <div className="relative group">
              <div className="overflow-hidden rounded-xl border-2 border-brand-border/60 shadow-2xl aspect-[3/4.2] bg-brand-darkBg group-hover:border-brand-orange/40 transition-colors duration-300">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              {/* Glow behind cover */}
              <div className="absolute -inset-2 rounded-xl bg-gradient-to-br from-brand-orange/15 to-transparent -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col gap-2.5">
              {/* Read Online */}
              <button
                onClick={() => navigate(`/read/${manga.id || manga.mal_id}`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-brand-orange hover:bg-brand-accent text-white shadow-neon hover:shadow-neon-hover transition-all duration-200 group cursor-pointer"
              >
                <BookOpen className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                Read Online
              </button>

              {/* Bookmark & Share */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleBookmark}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border transition-all duration-200 cursor-pointer ${
                    isBookmarked
                      ? 'bg-brand-orange/15 border-brand-orange text-brand-orange hover:bg-brand-orange/25 neon-pulse-glow shadow-neon'
                      : 'bg-brand-cardBg border-brand-border text-brand-textMain hover:border-brand-orange/50 hover:text-brand-orange'
                  }`}
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 fill-brand-orange text-brand-orange" />
                      Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      Bookmark
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border bg-brand-cardBg border-brand-border text-brand-textMain hover:border-brand-orange/50 hover:text-brand-orange transition-all duration-200 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {/* User Rating Panel */}
              <div className="mt-1 p-3 bg-brand-cardBg border border-brand-border/60 rounded-xl flex flex-col items-center justify-center shadow-sm">
                <p className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider mb-2">Beri Rating</p>
                <RatingStars value={userRating} onChange={handleRatingChange} readOnly={false} />
                {userRating > 0 && (
                  <span className="text-[9px] font-bold text-brand-orange mt-2 bg-brand-orange/10 px-2.5 py-0.5 rounded-full border border-brand-orange/20">
                    Rating Anda: {userRating} / 5
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Right: Details ─────────────────────── */}
          <motion.div variants={childVariants} className="flex-1 min-w-0">

            {/* ─ Stat Badges ─ */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              <div className="flex items-center gap-1.5 bg-brand-cardBg border border-brand-border px-3.5 py-1.5 rounded-lg text-xs group">
                <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
                <span className="font-bold text-brand-orange">{score}</span>
                <span className="text-brand-textMuted">Score</span>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-cardBg border border-brand-border px-3.5 py-1.5 rounded-lg text-xs">
                <Hash className="h-3.5 w-3.5 text-brand-orange" />
                <span className="text-brand-textMuted">Rank</span>
                <span className="font-bold text-brand-orange">#{rank}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-cardBg border border-brand-border px-3.5 py-1.5 rounded-lg text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-brand-orange" />
                <span className="text-brand-textMuted">Popularity</span>
                <span className="font-bold text-brand-orange">#{popularity}</span>
              </div>
            </div>

            {/* ─ Info Grid ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-5 mb-6 border-t border-b border-brand-border/40 py-5">
              <div className="flex items-center gap-2.5 text-sm text-brand-textMuted">
                <Eye className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span>
                  <strong className="text-brand-textMain">Status:</strong>{' '}
                  <span className={status === 'Publishing' ? 'text-emerald-400 font-semibold' : ''}>
                    {status}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-brand-textMuted">
                <BookOpenCheck className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span>
                  <strong className="text-brand-textMain">Chapters:</strong> {chaptersCount}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-brand-textMuted">
                <Layers className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span>
                  <strong className="text-brand-textMain">Volumes:</strong> {volumes}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-brand-textMuted">
                <Calendar className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span className="truncate">
                  <strong className="text-brand-textMain">Published:</strong> {publishedStr}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-brand-textMuted sm:col-span-2">
                <User className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span className="truncate">
                  <strong className="text-brand-textMain">Author:</strong>{' '}
                  {authors.map(a => a.name).join(', ') || 'Unknown'}
                </span>
              </div>
            </div>

            {/* ─ Genres ─ */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider mb-3">
                Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {genres.length > 0 ? genres.map(g => (
                  <span
                    key={g.mal_id}
                    className="rounded-lg bg-brand-darkBg/60 border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-textMain hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all cursor-default shadow-sm"
                  >
                    {g.name}
                  </span>
                )) : (
                  <span className="rounded-lg bg-brand-darkBg/60 border border-brand-border px-3 py-1.5 text-xs text-brand-textMuted">
                    General
                  </span>
                )}
              </div>
            </div>

            {/* ─ Tabs Navigation ─ */}
            <div className="flex border-b border-brand-border/40 mb-6 mt-8 overflow-x-auto gap-2 sm:gap-4 no-scrollbar">
              {['Sinopsis', 'Daftar Chapter', 'Ulasan'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-3 px-4 sm:px-6 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      isActive ? 'text-brand-orange font-extrabold' : 'text-brand-textMuted hover:text-brand-orange'
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ─ Tabs Content ─ */}
            <div className="min-h-[250px]">
              <AnimatePresence mode="wait">
                {activeTab === 'Sinopsis' && (
                  <motion.div
                    key="Sinopsis"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    inherit={false}
                    className="bg-brand-darkBg/40 border border-brand-border/30 rounded-xl p-4 sm:p-5"
                  >
                    <p className="text-sm leading-relaxed text-brand-textMuted whitespace-pre-line">
                      {synopsis}
                    </p>
                  </motion.div>
                )}

                {activeTab === 'Daftar Chapter' && (
                  <motion.div
                    key="Daftar Chapter"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    inherit={false}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full"
                  >
                    {chapters.length > 0 ? (
                      chapters.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => navigate(`/read/${ch.id}`)}
                          className="flex flex-col items-start p-3 bg-brand-cardBg/65 border border-brand-border/45 hover:border-brand-orange/50 hover:bg-brand-orange/5 hover:shadow-sm rounded-xl transition-all text-left group cursor-pointer w-full overflow-hidden"
                        >
                          <span className="text-xs font-bold text-brand-textMain group-hover:text-brand-orange transition-colors">
                            Chapter {ch.chapterNumber}
                          </span>
                          <span className="text-[10px] text-brand-textMuted mt-0.5 truncate max-w-full">
                            {ch.title || 'Klik untuk membaca'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-brand-textMuted col-span-full text-center py-8">
                        {chaptersLoading ? 'Memuat daftar chapter...' : 'Daftar chapter tidak tersedia.'}
                      </p>
                    )}
                  </motion.div>
                )}

                {activeTab === 'Ulasan' && (
                  <motion.div
                    key="Ulasan"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    inherit={false}
                  >
                    <ReviewSection mangaId={manga.id || manga.mal_id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </div>

        {/* ── You May Also Like ───────────────────────── */}
        {(recommendations.length > 0 || recsLoading) && (
          <motion.section
            variants={childVariants}
            className="mt-12 pt-8 border-t border-brand-border/40"
          >
            <h2 className="text-lg font-extrabold text-brand-textMain mb-5 flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-orange" />
              You May Also Like
              {genres[0] && (
                <span className="text-xs font-medium text-brand-textMuted ml-1">
                  — based on "{genres[0].name}"
                </span>
              )}
            </h2>

            {recsLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-36 sm:w-40 flex-shrink-0 animate-pulse">
                    <div className="aspect-[3/4.2] rounded-xl bg-brand-border/40" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1">
                {recommendations.map((rec, i) => (
                  <MiniRecCard
                    key={rec.id || rec.mal_id}
                    manga={rec}
                    index={i}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
