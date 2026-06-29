import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Check, X, Heart, Bookmark, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();

  const { user, token } = useAuth();

  // User State
  const [profile, setProfile] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'Not logged in',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (user?.name || 'Guest')
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Stats State
  const [stats, setStats] = useState({
    favorites: 0,
    bookmarks: 0,
    bookings: 0,
    lastRead: 'None'
  });

  const [favoriteList, setFavoriteList] = useState([]);

  useEffect(() => {
    // Update profile if user changes
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name
      });
    }

    const fetchStats = async () => {
      try {
        if (token) {
          const response = await axios.get('/api/profile/stats');
          if (response.data.success) {
            setStats({
              favorites: response.data.stats.favorites,
              bookmarks: response.data.stats.bookmarks,
              bookings: response.data.stats.bookings,
              lastRead: response.data.stats.last_manga_read || 'None'
            });
          }
        } else {
           // Fallback to local storage if not logged in
           const favs = JSON.parse(localStorage.getItem('hybrid_library_favorites') || '[]');
           setStats(s => ({ ...s, favorites: favs.length }));
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    
    fetchStats();

    // Load Favorites for Showcase
    const favs = JSON.parse(localStorage.getItem('hybrid_library_favorites') || '[]');
    setFavoriteList(favs);
    
  }, [user, token]);

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    const newProfile = { ...profile, name: editName };
    setProfile(newProfile);
    // In a real app, update this via API.
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-10">
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
          <User className="h-6 w-6 text-brand-orange" />
          My Profile
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Manage your personal information and view your reading statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 glass-panel p-6 rounded-3xl border border-brand-border/40 flex flex-col items-center text-center space-y-4 shadow-xl shadow-black/20"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-orange to-brand-accent shadow-neon">
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full bg-brand-darkBg" />
            </div>
          </div>
          
          <div className="w-full space-y-1">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                <input 
                  type="text" 
                  autoFocus
                  defaultValue={profile.name}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="w-full max-w-[160px] bg-brand-darkBg border border-brand-border rounded-lg px-3 py-1 text-sm text-center text-brand-textMain focus:border-brand-orange outline-none"
                />
                <button onClick={handleSaveProfile} className="text-emerald-500 hover:text-emerald-400"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-brand-textMain flex items-center justify-center gap-2 group">
                {profile.name}
                <button onClick={() => { setEditName(profile.name); setIsEditing(true); }} className="text-brand-textMuted opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand-orange">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </h2>
            )}
            <p className="text-sm text-brand-textMuted flex items-center justify-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile.email}
            </p>
          </div>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4"
        >
          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500"><Heart className="w-5 h-5 fill-rose-500/20" /></div>
              <span className="text-sm font-bold text-brand-textMuted uppercase tracking-wider">Favorites</span>
            </div>
            <div className="text-3xl font-black text-brand-textMain">{stats.favorites}</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Bookmark className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-brand-textMuted uppercase tracking-wider">Bookmarks</span>
            </div>
            <div className="text-3xl font-black text-brand-textMain">{stats.bookmarks}</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Calendar className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-brand-textMuted uppercase tracking-wider">Bookings</span>
            </div>
            <div className="text-3xl font-black text-brand-textMain">{stats.bookings}</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange"><BookOpen className="w-5 h-5" /></div>
              <span className="text-sm font-bold text-brand-textMuted uppercase tracking-wider">Last Read</span>
            </div>
            <div className="text-lg font-bold text-brand-textMain truncate" title={stats.lastRead}>{stats.lastRead}</div>
          </div>
        </motion.div>
      </div>

      {/* Favorites Showcase */}
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
          </h3>
          <button 
            onClick={() => navigate('/favorites')}
            className="text-sm text-brand-textMuted hover:text-brand-orange flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {favoriteList.length === 0 ? (
          <div className="py-10 text-center border border-brand-border border-dashed rounded-2xl bg-brand-cardBg/30 text-brand-textMuted text-sm">
            You haven't added any favorites yet.
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x snap-mandatory">
            {favoriteList.map((manga, idx) => (
              <motion.div
                key={manga.mal_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * Math.min(idx, 5) }}
                onClick={() => navigate(`/book/${manga.mal_id}`)}
                className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] cursor-pointer group snap-start"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 relative border border-brand-border/40">
                  <img 
                    src={manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url} 
                    alt={manga.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
