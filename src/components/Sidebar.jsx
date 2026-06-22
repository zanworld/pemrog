import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Heart, HelpCircle, LayoutDashboard, Flame, 
  Calendar, Star, Clock, Bookmark, ChevronDown, ChevronRight, 
  X, User, Settings, Sparkles, Building2, Swords, Compass
} from 'lucide-react';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, onInteractiveFilter }) {
  const [expandedSections, setExpandedSections] = useState({
    library: false,
    user: false,
    genres: false,
    publishers: false,
  });

  const toggleSection = (section) => {
    if (!Object.prototype.hasOwnProperty.call(expandedSections, section)) return;
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navLinkClasses = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:translate-x-1.5 ${
      isActive 
        ? 'bg-brand-orange/10 text-brand-orange border-l-2 border-brand-orange' 
        : 'text-brand-textMuted hover:bg-brand-cardBg hover:text-brand-textMain'
    }`;

  const renderLinks = (links, sectionKey) => (
    <AnimatePresence initial={false}>
      {Object.prototype.hasOwnProperty.call(expandedSections, sectionKey) && expandedSections[sectionKey] && (
        <motion.div
          key={sectionKey}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="mt-1 space-y-1 pl-9 pb-2">
            {links.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.path} 
                onClick={(e) => {
                  if (link.filterUpdate && onInteractiveFilter) {
                    e.preventDefault();
                    onInteractiveFilter(link.filterUpdate);
                  }
                  if (window.innerWidth <= 768) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:translate-x-1.5 ${
                    isActive 
                      ? 'text-brand-orange bg-brand-orange/5 font-semibold' 
                      : 'text-brand-textMuted hover:text-brand-textMain hover:bg-brand-cardBg'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 h-full border-r border-brand-border bg-brand-darkBg transition-all duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}
        md:relative
      `}>
        <div className="w-64 h-full flex flex-col">
          
          {/* Sidebar Header / Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-brand-border shrink-0">
            <NavLink to="/catalog" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-orange to-brand-accent text-white shadow-neon transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight font-sans text-brand-textMain">
                HYBRID<span className="text-brand-orange">DEX</span>
              </span>
            </NavLink>
            
            <button 
              className="md:hidden text-brand-textMuted hover:text-brand-textMain p-1 transition-transform hover:rotate-90"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Nav Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            
            {/* Core Section */}
            <nav className="space-y-1">
              <NavLink to="/catalog" onClick={() => window.innerWidth <= 768 && setIsSidebarOpen(false)} className={navLinkClasses}>
                <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:text-brand-orange" /> Catalog
              </NavLink>
              <NavLink to="/gallery" onClick={() => window.innerWidth <= 768 && setIsSidebarOpen(false)} className={navLinkClasses}>
                <Compass className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:text-brand-orange" /> Gallery
              </NavLink>
              <NavLink to="/favorites" onClick={() => window.innerWidth <= 768 && setIsSidebarOpen(false)} className={navLinkClasses}>
                <Heart className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:text-brand-orange" /> Favorites
              </NavLink>
              <NavLink to="/about" onClick={() => window.innerWidth <= 768 && setIsSidebarOpen(false)} className={navLinkClasses}>
                <HelpCircle className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:text-brand-orange" /> About
              </NavLink>
              <NavLink to="/booking" onClick={() => window.innerWidth <= 768 && setIsSidebarOpen(false)} className={navLinkClasses}>
                <Calendar className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:text-brand-orange" /> Book a Seat
              </NavLink>
            </nav>

            <div className="border-t border-brand-border/60"></div>

            {/* Library Features Section */}
            <div>
              <button 
                onClick={() => toggleSection('library')}
                className="group flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-textMuted hover:text-brand-textMain transition-colors focus:outline-none"
              >
                <span className="flex items-center gap-2 group-hover:text-brand-orange transition-colors">
                  <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" /> Discover
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expandedSections.library ? 'rotate-180 text-brand-orange' : ''}`} />
              </button>
              {renderLinks([
                { name: 'Top Rated', path: '/toprated', filterUpdate: { sortBy: 'score', query: '', genre: '', status: 'all' } },
                { name: 'Popular', path: '/popular', filterUpdate: { sortBy: 'popularity', query: '', genre: '', status: 'all' } },
                { name: 'Trending', path: '/trending', filterUpdate: { sortBy: 'popularity', query: '', genre: '', status: 'all' } },
                { name: 'Upcoming', path: '/upcoming', filterUpdate: { status: 'upcoming', query: '', genre: '' } },
                { name: 'New Releases', path: '/newreleases', filterUpdate: { status: 'publishing', query: '', genre: '' } },
                { name: 'Recommendations', path: '/recommendations', filterUpdate: { sortBy: 'score', query: '', genre: '' } },
                { name: 'Editor Picks', path: '/editorpicks', filterUpdate: { sortBy: 'popularity', query: '', genre: '' } },
              ], 'library')}
            </div>

            {/* User Section */}
            <div>
              <button 
                onClick={() => toggleSection('user')}
                className="group flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-textMuted hover:text-brand-textMain transition-colors focus:outline-none"
              >
                <span className="flex items-center gap-2 group-hover:text-brand-orange transition-colors">
                  <User className="h-4 w-4 transition-transform group-hover:scale-110" /> Personal
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expandedSections.user ? 'rotate-180 text-brand-orange' : ''}`} />
              </button>
              {renderLinks([
                { name: 'Reading History', path: '/readinghistory' },
                { name: 'Read Later', path: '/readlater' },
                { name: 'Bookmarks', path: '/bookmarks' },
                { name: 'Booking History', path: '/booking/history' },
                { name: 'Profile', path: '/profile' },
                { name: 'Settings', path: '/settings' },
                { name: 'Help & FAQ', path: '/helpfaq' },
              ], 'user')}
            </div>

            {/* Genres Section */}
            <div>
              <button 
                onClick={() => toggleSection('genres')}
                className="group flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-textMuted hover:text-brand-textMain transition-colors focus:outline-none"
              >
                <span className="flex items-center gap-2 group-hover:text-brand-orange transition-colors">
                  <Swords className="h-4 w-4 transition-transform group-hover:scale-110" /> Genres
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expandedSections.genres ? 'rotate-180 text-brand-orange' : ''}`} />
              </button>
              {renderLinks([
                { name: 'Action', path: '/actiongenre' },
                { name: 'Adventure', path: '/adventuregenre' },
                { name: 'Comedy', path: '/comedygenre' },
                { name: 'Drama', path: '/dramagenre' },
                { name: 'Fantasy', path: '/fantasygenre' },
                { name: 'Romance', path: '/romancegenre' },
                { name: 'Sci-Fi', path: '/scifigenre' },
                { name: 'Slice of Life', path: '/sliceoflifegenre' },
                { name: 'Supernatural', path: '/supernaturalgenre' },
                { name: 'Mystery', path: '/mysterygenre' },
              ], 'genres')}
            </div>

            {/* Publishers Section */}
            <div>
              <button 
                onClick={() => toggleSection('publishers')}
                className="group flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-textMuted hover:text-brand-textMain transition-colors focus:outline-none"
              >
                <span className="flex items-center gap-2 group-hover:text-brand-orange transition-colors">
                  <Building2 className="h-4 w-4 transition-transform group-hover:scale-110" /> Publishers
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expandedSections.publishers ? 'rotate-180 text-brand-orange' : ''}`} />
              </button>
              {renderLinks([
                { name: 'Shueisha', path: '/shueisha' },
                { name: 'Kodansha', path: '/kodansha' },
                { name: 'Shogakukan', path: '/shogakukan' },
                { name: 'Kadokawa', path: '/kadokawa' },
                { name: 'Square Enix', path: '/squareenix' },
                { name: 'Viz Media', path: '/vizmedia' },
                { name: 'Yen Press', path: '/yenpress' },
                { name: 'Seven Seas', path: '/sevenseas' },
                { name: 'Dark Horse', path: '/darkhorse' },
                { name: 'Vertical', path: '/vertical' },
              ], 'publishers')}
            </div>

          </div>
          
        </div>
      </aside>
    </>
  );
}
