import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Check, X, Heart, Bookmark, BookOpen, Calendar, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();

  // ── Profile Edit State ─────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // ── Stats State ────────────────────────────────────────────
  const [stats, setStats] = useState({ favorites: 0, bookmarks: 0, bookings: 0, lastRead: null });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Favorites Showcase ─────────────────────────────────────
  const [favoriteList, setFavoriteList] = useState([]);

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Guest')}`;

  // Fetch stats + favorites whenever user/token changes
  useEffect(() => {
    const fetchAll = async () => {
      setStatsLoading(true);
      try {
        if (token) {
          const [statsRes] = await Promise.all([
            axios.get('/api/profile/stats', {
              headers: { Authorization: `Bearer ${token}` }
            }),
          ]);
          if (statsRes.data.success) {
            const s = statsRes.data.stats;
            setStats({
              favorites: s.favorites,
              bookmarks: s.bookmarks,
              bookings: s.bookings,
              lastRead: s.last_manga_read || null,
            });
          }
        } else {
          // Fallback for guest: read localStorage favorites count
          const favs = JSON.parse(localStorage.getItem('hybrid_library_favorites') || '[]');
          setStats(prev => ({ ...prev, favorites: favs.length }));
        }
      } catch (err) {
        console.error('Failed to fetch profile stats', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchAll();

    // Load favorites showcase from localStorage
    const favs = JSON.parse(localStorage.getItem('hybrid_library_favorites') || '[]');
    setFavoriteList(favs);
  }, [user, token]);

  // ── Save Name Handler ──────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    if (editName.trim() === user?.name) {
      setIsEditing(false);
      return;
    }
    setIsSavingName(true);
    try {
      const res = await axios.patch(
        '/api/auth/profile',
        { name: editName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        updateUser(res.data.user, res.data.token);
        toast.success('Nama berhasil diperbarui!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan nama.');
    } finally {
      setIsSavingName(false);
    }
  };

  // ── Stat Card ──────────────────────────────────────────────
  const StatCard = ({ icon, label, value, iconBg, iconColor }) => (
    <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
        <span className="text-xs font-bold text-brand-textMuted uppercase tracking-wider">{label}</span>
      </div>
      {statsLoading ? (
        <div className="h-8 w-12 bg-brand-border/40 rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-black text-brand-textMain">{value}</div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
          <User className="h-6 w-6 text-brand-orange" />
          My Profile
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Manage your personal information and view your reading statistics.
        </p>
      </div>

      {/* Profile + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 glass-panel p-6 rounded-3xl border border-brand-border/40 flex flex-col items-center text-center space-y-4 shadow-xl shadow-black/20"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-orange to-brand-accent shadow-neon">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full bg-brand-darkBg" />
            </div>
          </div>

          {/* Name */}
          <div className="w-full space-y-1">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  disabled={isSavingName}
                  className="w-full max-w-[160px] bg-brand-darkBg border border-brand-border rounded-lg px-3 py-1 text-sm text-center text-brand-textMain focus:border-brand-orange outline-none disabled:opacity-60"
                />
                {isSavingName ? (
                  <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />
                ) : (
                  <>
                    <button onClick={handleSaveProfile} className="text-emerald-500 hover:text-emerald-400">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <h2 className="text-xl font-bold text-brand-textMain flex items-center justify-center gap-2 group">
                {user?.name || 'Guest User'}
                {token && (
                  <button
                    onClick={() => { setEditName(user?.name || ''); setIsEditing(true); }}
                    className="text-brand-textMuted opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand-orange"
                    title="Edit nama"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </h2>
            )}
            <p className="text-sm text-brand-textMuted flex items-center justify-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email || 'Not logged in'}
            </p>
            {!token && (
              <button
                onClick={() => navigate('/login')}
                className="mt-3 text-xs font-bold text-brand-orange hover:underline"
              >
                Login untuk melihat statistik →
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4"
        >
          <StatCard
            icon={<Heart className="w-5 h-5 fill-rose-500/20" />}
            label="Favorites"
            value={stats.favorites}
            iconBg="bg-rose-500/10"
            iconColor="text-rose-500"
          />
          <StatCard
            icon={<Bookmark className="w-5 h-5" />}
            label="Bookmarks"
            value={stats.bookmarks}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Bookings"
            value={stats.bookings}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-500"
          />
          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-brand-textMuted uppercase tracking-wider">Last Read</span>
            </div>
            {statsLoading ? (
              <div className="h-5 w-24 bg-brand-border/40 rounded animate-pulse" />
            ) : stats.lastRead ? (
              <button
                onClick={() => navigate(`/book/${stats.lastRead}`)}
                className="text-sm font-bold text-brand-orange hover:underline text-left truncate"
                title={stats.lastRead}
              >
                {stats.lastRead}
              </button>
            ) : (
              <span className="text-sm text-brand-textMuted italic">None yet</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Favorites Showcase ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-brand-textMain flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-orange fill-brand-orange" />
            Favorite Collection
            {favoriteList.length > 0 && (
              <span className="text-xs font-semibold bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-2 py-0.5 rounded-full">
                {favoriteList.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => navigate('/favorites')}
            className="text-sm text-brand-textMuted hover:text-brand-orange flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {favoriteList.length === 0 ? (
          <div className="py-10 text-center border border-brand-border border-dashed rounded-2xl bg-brand-cardBg/30 text-brand-textMuted text-sm flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 opacity-40" />
            <span>You haven't added any favorites yet.</span>
            <button
              onClick={() => navigate('/catalog')}
              className="text-brand-orange text-xs font-bold hover:underline mt-1"
            >
              Browse Catalog →
            </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x snap-mandatory">
            {favoriteList.map((manga, idx) => (
              <motion.div
                key={manga.id || manga.mal_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * Math.min(idx, 8) }}
                onClick={() => navigate(`/book/${manga.id || manga.mal_id}`)}
                className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] cursor-pointer group snap-start flex-shrink-0"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 relative border border-brand-border/40 bg-brand-cardBg">
                  <img
                    src={
                      manga.imageUrl ||
                      manga.images?.jpg?.large_image_url ||
                      manga.images?.jpg?.image_url ||
                      'https://via.placeholder.com/120x160?text=No+Cover'
                    }
                    alt={manga.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/120x160?text=No+Cover'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] text-white font-bold bg-brand-orange/80 px-1.5 py-0.5 rounded">
                      View Detail
                    </span>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-brand-textMain line-clamp-2 group-hover:text-brand-orange transition-colors">
                  {manga.title}
                </h4>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
