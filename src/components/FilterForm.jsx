import React, { useEffect, useRef } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

export default function FilterForm({ filters, setFilters, onSearchSubmit }) {
  const isTyping = useRef(false);

  // Debounce text search
  useEffect(() => {
    if (!isTyping.current) return;
    const timeoutId = setTimeout(() => {
      if (onSearchSubmit) onSearchSubmit();
      isTyping.current = false;
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters.query, onSearchSubmit]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleReset = () => {
    setFilters({
      query: '',
      genre: '',
      status: 'all',
      sfw: true,
      sortBy: 'popularity'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-5 mb-8 shadow-lg border border-brand-border">
      <div className="flex items-center gap-2 mb-4 border-b border-brand-border pb-3">
        <Filter className="h-5 w-5 text-brand-orange animate-pulse" />
        <h2 className="text-lg font-bold tracking-wide text-brand-textMain">Refine Catalog Search</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Text Input (Search) */}
        <div className="col-span-1 md:col-span-5">
          <label htmlFor="search-input" className="block text-xs font-semibold uppercase tracking-wider text-brand-textMuted mb-2">
            Manga Title
          </label>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              name="query"
              value={filters.query}
              onChange={(e) => {
                isTyping.current = true;
                handleChange(e);
              }}
              placeholder="Search manga (e.g., Solo Leveling, Naruto)..."
              className="w-full rounded-xl border border-brand-border bg-brand-darkBg px-4 py-2.5 pl-10 text-sm text-brand-textMain placeholder-brand-textMuted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all duration-200"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-brand-textMuted" />
          </div>
        </div>

        {/* Select Input (Genre) */}
        <div className="col-span-1 md:col-span-3">
          <label htmlFor="genre-select" className="block text-xs font-semibold uppercase tracking-wider text-brand-textMuted mb-2">
            Genre
          </label>
          <select
            id="genre-select"
            name="genre"
            value={filters.genre}
            onChange={handleChange}
            className="w-full rounded-xl border border-brand-border bg-brand-darkBg px-4 py-2.5 text-sm text-brand-textMain focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all duration-200 cursor-pointer"
          >
            <option value="">All Genres</option>
            <option value="1">Action</option>
            <option value="2">Adventure</option>
            <option value="4">Comedy</option>
            <option value="8">Drama</option>
            <option value="10">Fantasy</option>
            <option value="22">Romance</option>
            <option value="24">Sci-Fi</option>
            <option value="36">Slices of Life</option>
            <option value="37">Supernatural</option>
          </select>
        </div>

        {/* Select Input (Sorting) */}
        <div className="col-span-1 md:col-span-4">
          <label htmlFor="sort-select" className="block text-xs font-semibold uppercase tracking-wider text-brand-textMuted mb-2">
            Sort By
          </label>
          <select
            id="sort-select"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className="w-full rounded-xl border border-brand-border bg-brand-darkBg px-4 py-2.5 text-sm text-brand-textMain focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all duration-200 cursor-pointer"
          >
            <option value="popularity">Most Popular</option>
            <option value="score">Highest Rated</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>

      </div>

      <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-end justify-between gap-5 mt-5 pt-4 border-t border-brand-border/50">
        
        {/* Radio Input (Status) */}
        <div className="flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-brand-textMuted mb-2">
            Release Status
          </span>
          <div className="flex flex-wrap gap-4 items-center lg:h-10">
            {[
              { id: 'status-all', label: 'All', val: 'all' },
              { id: 'status-publishing', label: 'Ongoing', val: 'publishing' },
              { id: 'status-complete', label: 'Completed', val: 'complete' },
              { id: 'status-upcoming', label: 'Upcoming', val: 'upcoming' }
            ].map((statusItem) => (
              <label key={statusItem.id} htmlFor={statusItem.id} className="inline-flex items-center gap-2 cursor-pointer text-sm text-brand-textMain select-none hover:text-brand-orange transition-colors duration-150">
                <input
                  id={statusItem.id}
                  type="radio"
                  name="status"
                  value={statusItem.val}
                  checked={filters.status === statusItem.val}
                  onChange={handleChange}
                  className="h-4 w-4 border-brand-border text-brand-orange bg-brand-darkBg focus:ring-brand-orange/50 focus:ring-2 accent-brand-orange"
                />
                <span className="whitespace-nowrap">{statusItem.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-2 lg:mt-0">
          {/* Checkbox Input (SFW Mode) */}
          <div className="flex items-center">
            <label htmlFor="sfw-checkbox" className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-brand-textMain select-none hover:text-brand-orange transition-colors duration-150">
              <input
                id="sfw-checkbox"
                type="checkbox"
                name="sfw"
                checked={filters.sfw}
                onChange={handleChange}
                className="h-4 w-4 rounded border-brand-border text-brand-orange bg-brand-darkBg focus:ring-brand-orange/50 focus:ring-2 accent-brand-orange"
              />
              <span className="font-medium whitespace-nowrap">Safe For Work Only</span>
            </label>
          </div>

          {/* Buttons (Filter actions) */}
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-transparent px-4 py-2.5 text-sm font-medium text-brand-textMuted hover:bg-brand-cardBg hover:text-brand-textMain transition-all duration-200 hover:border-brand-textMuted"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-orange hover:bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white shadow-neon hover:shadow-neon-hover transition-all duration-200"
            >
              Search
            </button>
          </div>
        </div>

      </div>
    </form>
  );
}
