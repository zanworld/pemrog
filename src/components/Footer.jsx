import React, { useState } from 'react';
import { Code2, MessageCircle, BookOpen, ExternalLink, Map, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);

  const sitemapCategories = [
    {
      title: 'Main Pages',
      pages: ['HomePage', 'CatalogPage', 'FavoritesPage', 'AboutPage', 'ProfilePage', 'SettingsPage', 'HelpFAQPage']
    },
    {
      title: 'Collections',
      pages: ['TopRatedPage', 'PopularPage', 'UpcomingPage', 'NewReleasesPage', 'RecommendationsPage', 'EditorPicksPage', 'TrendingPage', 'ReadingHistoryPage', 'ReadLaterPage', 'BookmarksPage']
    },
    {
      title: 'Genres',
      pages: ['ActionGenrePage', 'AdventureGenrePage', 'ComedyGenrePage', 'DramaGenrePage', 'FantasyGenrePage', 'RomanceGenrePage', 'SciFiGenrePage', 'SliceOfLifeGenrePage', 'SupernaturalGenrePage', 'MysteryGenrePage']
    },
    {
      title: 'Publishers',
      pages: ['ShueishaPage', 'KodanshaPage', 'ShogakukanPage', 'KadokawaPage', 'SquareEnixPage', 'VizMediaPage', 'YenPressPage', 'SevenSeasPage', 'DarkHorsePage', 'VerticalPage']
    }
  ];

  // Prevent body scroll when sitemap is open
  React.useEffect(() => {
    if (isSitemapOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSitemapOpen]);

  return (
    <footer className="mt-auto border-t border-brand-border bg-brand-darkBg relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-8 justify-between">
          
          {/* Left Section: Brand & Description */}
          <div className="flex-1 max-w-sm">
            <div className="flex items-center gap-2 mb-4 group cursor-pointer w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-orange to-brand-accent text-white shadow-neon transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-brand-textMain transition-colors duration-200 group-hover:text-brand-orange">
                HYBRID<span className="text-brand-orange">DEX</span>
              </span>
            </div>
            <p className="text-sm text-brand-textMuted mb-6 leading-relaxed">
              A meticulously designed, high-performance manga library application.
            </p>
            <div className="flex items-center gap-4 text-brand-textMuted">
              <a href="#" className="hover:text-brand-orange transition-transform duration-200 hover:scale-110 hover:-translate-y-1"><Code2 className="h-5 w-5" /></a>
              <a href="#" className="hover:text-brand-orange transition-transform duration-200 hover:scale-110 hover:-translate-y-1"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Right Section: Links & Button */}
          <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-10 sm:gap-16 lg:gap-20">
            
            <div className="min-w-[120px]">
              <h4 className="text-sm font-bold text-brand-textMain mb-4 uppercase tracking-widest border-b border-brand-border/60 pb-2">
                Discover
              </h4>
              <div className="flex flex-col gap-3 text-sm font-medium">
                <Link to="/catalog" className="text-brand-textMuted hover:text-brand-orange transition-colors">Catalog</Link>
                <Link to="/toprated" className="text-brand-textMuted hover:text-brand-orange transition-colors">Top Rated</Link>
                <Link to="/newreleases" className="text-brand-textMuted hover:text-brand-orange transition-colors">New Releases</Link>
                <Link to="/trending" className="text-brand-textMuted hover:text-brand-orange transition-colors">Trending</Link>
              </div>
            </div>

            <div className="min-w-[120px]">
              <h4 className="text-sm font-bold text-brand-textMain mb-4 uppercase tracking-widest border-b border-brand-border/60 pb-2">
                User
              </h4>
              <div className="flex flex-col gap-3 text-sm font-medium">
                <Link to="/profile" className="text-brand-textMuted hover:text-brand-orange transition-colors">Profile</Link>
                <Link to="/favorites" className="text-brand-textMuted hover:text-brand-orange transition-colors">Favorites</Link>
                <Link to="/readinghistory" className="text-brand-textMuted hover:text-brand-orange transition-colors">History</Link>
                <Link to="/settings" className="text-brand-textMuted hover:text-brand-orange transition-colors">Settings</Link>
              </div>
            </div>

            <div className="flex flex-col items-start pt-2 sm:pt-0">
              <button 
                onClick={() => setIsSitemapOpen(true)}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white transition-all duration-300 bg-brand-darkBg/50 border border-brand-border rounded-xl hover:border-brand-orange/50 overflow-hidden shadow-lg hover:shadow-brand-orange/20 whitespace-nowrap"
              >
                <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-brand-orange/10"></div>
                <Map className="h-5 w-5 mr-2 text-brand-orange group-hover:animate-bounce" />
                <span className="relative">Explore Site Map</span>
              </button>
            </div>
            
          </div>

        </div>

        <div className="mt-10 border-t border-brand-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-textMuted">
            &copy; {new Date().getFullYear()} HybridDex. All rights reserved.
          </p>
        </div>
      </div>

      {/* Sitemap Drawer Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isSitemapOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsSitemapOpen(false)}
      ></div>

      {/* Sitemap Drawer */}
      <div 
        className={`fixed top-0 right-0 z-[60] h-full w-full sm:w-96 md:w-[450px] bg-brand-darkBg border-l border-brand-border/50 shadow-2xl transition-transform duration-300 ease-in-out transform ${isSitemapOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-brand-border/50 flex justify-between items-center bg-brand-darkBg/95 backdrop-blur z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-orange to-brand-accent flex items-center justify-center text-white shadow-neon">
              <Map className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold text-brand-textMain">Site Map</h3>
          </div>
          <button 
            onClick={() => setIsSitemapOpen(false)} 
            className="text-brand-textMuted hover:text-brand-orange hover:bg-brand-orange/10 p-2 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {sitemapCategories.map((category) => (
            <div key={category.title}>
              <h4 className="text-sm font-bold text-brand-textMain uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-brand-orange/50 rounded-full"></span>
                {category.title}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {category.pages.map(page => {
                  const path = page === 'CatalogPage' ? '/catalog' : 
                               page === 'FavoritesPage' ? '/favorites' : 
                               page === 'AboutPage' ? '/about' : 
                               '/' + page.replace('Page', '').toLowerCase();
                  
                  // Format page name to be more readable
                  const displayName = page
                    .replace('Page', '')
                    .replace(/([A-Z])/g, ' $1')
                    .trim();

                  return (
                    <Link 
                      key={page} 
                      to={path}
                      onClick={() => setIsSitemapOpen(false)}
                      className="group flex items-center gap-2 text-sm text-brand-textMuted hover:text-brand-textMain transition-colors py-1"
                    >
                      <ChevronRight className="h-3 w-3 text-brand-orange opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                        {displayName}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
