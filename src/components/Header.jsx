import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, User, Loader2, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Header({ isSidebarOpen, setIsSidebarOpen, onSearch, currentQuery }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Sync with global search filter if it changes from elsewhere
  useEffect(() => {
    setQuery(currentQuery || '');
  }, [currentQuery]);

  // Autocomplete fetch effect (debounced)
  useEffect(() => {
    // Skip fetching if the query was just updated by clicking a suggestion or it's empty
    if (query.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setShowSuggestions(true);
      try {
        const res = await axios.get(`/api/manga?q=${query}&limit=5&sfw=true&genres_exclude=12,49,9,28,26,43`);
        setSuggestions(res.data?.data || []);
      } catch (err) {
        console.warn('Autocomplete fetch failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (mangaOrTitle) => {
    if (typeof mangaOrTitle === 'string') {
      setQuery(mangaOrTitle);
      onSearch(mangaOrTitle);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(false);
      navigate(`/book/${mangaOrTitle.id || mangaOrTitle.mal_id}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-brand-border bg-brand-darkBg">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Mobile Hamburger & Mobile Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-brand-textMuted hover:bg-brand-orange/20 hover:text-brand-orange focus:outline-none transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Mobile Logo (Hidden on Desktop if Sidebar is open) */}
          <Link to="/catalog" className={`${isSidebarOpen ? 'md:hidden' : ''} flex items-center gap-2`}>
            <span className="text-xl font-extrabold tracking-tight font-sans text-brand-textMain">
              HYBRID<span className="text-brand-orange">DEX</span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar with Autocomplete Dropdown */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
           <div className="relative w-full" ref={dropdownRef}>
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
               <Search className="h-4 w-4 text-brand-textMuted" />
             </div>
             <input
               type="text"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={handleKeyDown}
               onFocus={() => {
                 if (query.trim() !== '') setShowSuggestions(true);
               }}
               placeholder="Quick search... (Type to get suggestions)"
               className="block w-full rounded-lg border border-brand-border bg-brand-cardBg/50 py-1.5 pl-10 pr-3 text-sm text-brand-textMain placeholder-brand-textMuted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-colors"
             />

             {/* Autocomplete Dropdown Panel */}
             {showSuggestions && (query.trim() !== '') && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-brand-cardBg border border-brand-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 flex flex-col">
                 {isLoading ? (
                   <div className="p-4 flex items-center justify-center gap-2 text-sm text-brand-textMuted">
                     <Loader2 className="h-4 w-4 animate-spin text-brand-orange" />
                     Searching Local Database...
                   </div>
                 ) : suggestions.length > 0 ? (
                   <div className="overflow-y-auto custom-scrollbar flex-1">
                     {suggestions.map((manga) => {
                       const title = manga.title_english || manga.title;
                       const image = manga.images?.jpg?.small_image_url || manga.images?.jpg?.image_url;
                       const score = manga.score || 'N/A';
                       
                       return (
                         <button
                           key={manga.mal_id}
                           onClick={() => handleSuggestionClick(manga)}
                           className="flex items-center gap-3 w-full p-3 hover:bg-brand-orange/10 transition-colors text-left border-b border-brand-border/40 last:border-0"
                         >
                           {image && (
                             <img 
                               src={image} 
                               alt={title} 
                               className="w-10 h-14 object-cover rounded shadow-sm border border-brand-border/50" 
                             />
                           )}
                           <div className="flex-1 overflow-hidden">
                             <div className="text-sm font-bold text-brand-textMain truncate">{title}</div>
                             <div className="text-xs text-brand-textMuted flex items-center gap-2 mt-1">
                               <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                                 <Star className="h-3 w-3 fill-amber-400" /> {score}
                               </span>
                               <span className="text-brand-border">•</span>
                               <span className="truncate">{manga.genres?.map(g => g.name).slice(0, 2).join(', ')}</span>
                               <span className="text-brand-border">•</span>
                               <span>{manga.status === 'Publishing' ? 'Ongoing' : 'Completed'}</span>
                             </div>
                           </div>
                         </button>
                       );
                     })}
                     
                     {/* Footer button to search full text */}
                     <button 
                       onClick={() => handleSuggestionClick(query)}
                       className="w-full p-3 text-center text-xs font-semibold text-brand-orange hover:bg-brand-orange/10 transition-colors border-t border-brand-border"
                     >
                       See all results for "{query}"
                     </button>
                   </div>
                 ) : (
                   <div className="p-4 text-center text-sm text-brand-textMuted">
                     No manga found starting with "{query}"
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>

        {/* Right: API Status & Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-brand-border bg-brand-cardBg px-3 py-1 text-xs text-brand-textMuted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Local DB Active</span>
          </div>
          
          <Link 
            to="/login"
            title="Sign In"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-cardBg border border-brand-border hover:border-brand-orange transition-colors text-brand-textMuted hover:text-brand-orange"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
