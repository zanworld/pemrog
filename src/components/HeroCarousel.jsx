import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Flame, TrendingUp, Clock, BookOpen } from 'lucide-react';
import axios from 'axios';

// Static slide metadata with fallback data baked in
const SLIDE_CONFIG = [
  {
    category: 'LATEST RELEASE',
    categoryIcon: Clock,
    accentColor: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    apiParam: 'order_by=start_date&sort=desc&status=publishing',
  },
  {
    category: 'MOST POPULAR',
    categoryIcon: Flame,
    accentColor: 'from-brand-orange to-red-600',
    badgeColor: 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange',
    apiParam: 'order_by=popularity&sort=asc',
  },
  {
    category: 'HIGHEST RATED',
    categoryIcon: Star,
    accentColor: 'from-amber-500 to-yellow-600',
    badgeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    apiParam: 'order_by=score&sort=desc&min_score=8',
  },
  {
    category: 'TRENDING NOW',
    categoryIcon: TrendingUp,
    accentColor: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-violet-500/20 border-violet-500/40 text-violet-400',
    apiParam: 'order_by=favorites&sort=desc',
  },
  {
    category: "EDITOR'S PICK",
    categoryIcon: BookOpen,
    accentColor: 'from-rose-500 to-pink-600',
    badgeColor: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
    apiParam: 'order_by=score&sort=desc&genres=8',  // Drama genre top rated
  },
];

const THEME_COLORS = {
  red: { accent: 'from-red-500 to-red-700', badge: 'bg-red-500/20 border-red-500/40 text-red-400', btn: 'bg-red-600 hover:bg-red-500' },
  emerald: { accent: 'from-emerald-500 to-emerald-700', badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500' },
  yellow: { accent: 'from-yellow-500 to-yellow-700', badge: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-500' },
  violet: { accent: 'from-violet-500 to-violet-700', badge: 'bg-violet-500/20 border-violet-500/40 text-violet-400', btn: 'bg-violet-600 hover:bg-violet-500' },
  purple: { accent: 'from-purple-500 to-purple-700', badge: 'bg-purple-500/20 border-purple-500/40 text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500' },
  pink: { accent: 'from-pink-500 to-pink-700', badge: 'bg-pink-500/20 border-pink-500/40 text-pink-400', btn: 'bg-pink-600 hover:bg-pink-500' },
  cyan: { accent: 'from-cyan-500 to-cyan-700', badge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400', btn: 'bg-cyan-600 hover:bg-cyan-500' },
  orange: { accent: 'from-brand-orange to-orange-700', badge: 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange', btn: 'bg-brand-orange hover:bg-brand-accent' },
  indigo: { accent: 'from-indigo-500 to-indigo-700', badge: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-500' },
  slate: { accent: 'from-slate-400 to-slate-600', badge: 'bg-slate-500/20 border-slate-500/40 text-slate-300', btn: 'bg-slate-600 hover:bg-slate-500' },
};

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 600 : -600, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ x: direction > 0 ? -600 : 600, opacity: 0, scale: 0.95 }),
};

export default function HeroCarousel({ onClickManga, mangaList, useLiveApi = true, themeColor = null }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch & pick unique random manga for carousel (1 API call only)
  useEffect(() => {
    let cancelled = false;

    const buildSlides = (pool) => {
      if (cancelled || pool.length === 0) return;

      // Shuffle pool for randomness on each load
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      
      const usedIds = new Set();
      const pickUnique = (filterFn) => {
        // First try filtered list
        const filtered = filterFn ? shuffled.filter(filterFn) : shuffled;
        for (const m of filtered) {
          if (!usedIds.has(m.mal_id)) {
            usedIds.add(m.mal_id);
            return m;
          }
        }
        // Fallback: any unused
        for (const m of shuffled) {
          if (!usedIds.has(m.mal_id)) {
            usedIds.add(m.mal_id);
            return m;
          }
        }
        return null;
      };

      const picks = [
        // Latest Release: ongoing manga
        pickUnique(m => m.status === 'Publishing'),
        // Most Popular: top popularity
        pickUnique(m => (m.popularity || 9999) <= 50),
        // Highest Rated: score >= 8.5
        pickUnique(m => (m.score || 0) >= 8.5),
        // Trending: any popular one
        pickUnique(m => (m.members || 0) > 100000 || (m.popularity || 9999) <= 100),
        // Editor's Pick: drama or supernatural
        pickUnique(m => m.genres?.some(g => ['Drama', 'Supernatural', 'Mystery'].includes(g.name))),
      ];

      const activeTheme = themeColor ? THEME_COLORS[themeColor] : null;

      const builtSlides = SLIDE_CONFIG.map((config, i) => {
        const manga = picks[i];
        if (!manga) return null;
        return {
          ...config,
          accentColor: activeTheme ? activeTheme.accent : config.accentColor,
          badgeColor: activeTheme ? activeTheme.badge : config.badgeColor,
          btnColor: activeTheme ? activeTheme.btn : 'bg-brand-orange hover:bg-brand-accent',
          manga: {
            ...manga,
            image: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || '',
            genres_list: (manga.genres || []).map(g => g.name),
            author: manga.authors?.[0]?.name || 'Unknown',
          },
        };
      }).filter(Boolean);

      if (builtSlides.length > 0 && !cancelled) {
        setSlides(builtSlides);
        setIsLoaded(true);
      }
    };

    // Strategy: 1 single API call for fresh real-time data
    const fetchFresh = async () => {
      if (useLiveApi) {
        try {
          const res = await axios.get('https://api.jikan.moe/v4/manga?order_by=popularity&sort=asc&limit=25&sfw=true');
          if (res.data?.data?.length > 0) {
            buildSlides(res.data.data);
            return;
          }
        } catch (err) {
          console.warn('Carousel API failed, using catalog data', err);
        }
      }

      // Fallback to already-loaded mangaList
      if (mangaList && mangaList.length > 0) {
        buildSlides(mangaList);
      }
    };

    fetchFresh();
    return () => { cancelled = true; };
  }, [mangaList, useLiveApi]);

  const totalSlides = slides.length;

  const goToSlide = useCallback((newIndex, dir) => {
    setDirection(dir);
    setCurrentIndex(newIndex);
  }, []);

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    goToSlide((currentIndex + 1) % totalSlides, 1);
  }, [currentIndex, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    goToSlide((currentIndex - 1 + totalSlides) % totalSlides, -1);
  }, [currentIndex, totalSlides, goToSlide]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (isPaused || totalSlides === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused, totalSlides]);

  // Loading skeleton
  if (!isLoaded || slides.length === 0) {
    return (
      <div className="relative mb-8 rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-cardBg h-[340px] sm:h-[320px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-brand-orange border-t-transparent" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-sm text-brand-textMuted font-medium">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  const current = slides[currentIndex];
  if (!current) return null;
  const CategoryIcon = current.categoryIcon;

  const imageUrl = current.manga.image;
  const title = current.manga.title_english || current.manga.title || 'Unknown';
  const score = current.manga.score || 0;
  const rank = current.manga.rank || 0;
  const chapters = current.manga.chapters || '??';
  const status = current.manga.status || 'Unknown';
  const genres = current.manga.genres_list || [];
  const author = current.manga.author || 'Unknown';
  const synopsis = (current.manga.synopsis || 'No description available.').substring(0, 280);

  return (
    <div
      className="relative mb-8 rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-cardBg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slide Area */}
      <div className="relative h-[340px] sm:h-[320px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Background Image with Heavy Overlay */}
            <div className="absolute inset-0">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
              <div className={`absolute inset-0 bg-gradient-to-t ${current.accentColor} opacity-[0.08]`} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center px-6 sm:px-10 lg:px-12">
              <div className="flex-1 max-w-xl space-y-4">
                {/* Category Badge */}
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest ${current.badgeColor}`}>
                  <CategoryIcon className="h-3 w-3" />
                  {current.category}
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {title}
                </h2>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                  {score > 0 && (
                    <>
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {score.toFixed ? score.toFixed(1) : score}
                      </span>
                      <span className="w-px h-3.5 bg-gray-600" />
                    </>
                  )}
                  {rank > 0 && (
                    <>
                      <span>Rank #{rank}</span>
                      <span className="w-px h-3.5 bg-gray-600" />
                    </>
                  )}
                  <span>{chapters}+ Chapters</span>
                  <span className="w-px h-3.5 bg-gray-600" />
                  <span className={`font-semibold ${status === 'Publishing' ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {status === 'Publishing' ? '● Ongoing' : '● Completed'}
                  </span>
                </div>

                {/* Genre Chips */}
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 4).map((g) => (
                    <span key={g} className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-gray-200">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Synopsis */}
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-2 max-w-lg">
                  {synopsis}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => onClickManga && onClickManga(current.manga)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-neon hover:shadow-neon-hover transition-all duration-200 hover:scale-105 ${current.btnColor || 'bg-brand-orange hover:bg-brand-accent'}`}
                  >
                    <BookOpen className="h-4 w-4" />
                    View Details
                  </button>
                  <span className="text-xs text-gray-500 italic">
                    by {author}
                  </span>
                </div>
              </div>

              {/* Right side manga cover (hidden on small screens) */}
              <div className="hidden lg:block flex-shrink-0 ml-8">
                <div className="relative">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-44 h-60 object-cover rounded-xl shadow-2xl border-2 border-white/10 transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${current.accentColor} opacity-20 -z-10 blur-md`} />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Left / Right Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-200 hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-200 hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom Indicator Bar */}
      <div className="flex items-center justify-center gap-2 py-3 bg-brand-darkBg/80 border-t border-brand-border/40">
        {slides.map((slide, i) => {
          const Icon = slide.categoryIcon;
          return (
            <button
              key={i}
              onClick={() => goToSlide(i, i > currentIndex ? 1 : -1)}
              className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider transition-all duration-300 ${
                i === currentIndex
                  ? `${slide.badgeColor} scale-105`
                  : 'text-gray-500 hover:text-gray-300 bg-transparent hover:bg-white/5'
              }`}
              aria-label={`Go to ${slide.category}`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{slide.category}</span>
              {/* Progress bar for active slide */}
              {i === currentIndex && !isPaused && (
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-gradient-to-r ${slide.accentColor}`}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  key={`progress-${currentIndex}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
