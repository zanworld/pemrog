import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Monitor, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  
  const [readerMode, setReaderMode] = useState(() => {
    return localStorage.getItem('settings_reader_mode') || 'fit_width';
  });

  useEffect(() => {
    localStorage.setItem('settings_reader_mode', readerMode);
  }, [readerMode]);

  const clearData = (type) => {
    let message = '';
    
    if (type === 'history') {
      if (!window.confirm("Are you sure you want to clear all reading history? This cannot be undone.")) return;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reading_progress_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      message = 'Reading history cleared successfully.';
    } 
    else if (type === 'favorites') {
      if (!window.confirm("Are you sure you want to remove all favorites? This cannot be undone.")) return;
      localStorage.removeItem('hybrid_library_favorites');
      // Dispatch storage event to sync with App state if needed
      window.dispatchEvent(new Event('storage'));
      message = 'All favorites removed successfully.';
    }
    else if (type === 'bookings') {
      if (!window.confirm("Are you sure you want to cancel and clear all reading seat bookings?")) return;
      localStorage.removeItem('booking_history');
      message = 'All bookings cleared successfully.';
    }

    toast.success(message, { icon: '🗑️' });
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-10">
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
          <Settings className="h-6 w-6 text-brand-orange" />
          Settings
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Customize your application experience and manage your data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h2 className="text-lg font-bold text-brand-textMain flex items-center gap-2 border-b border-brand-border/40 pb-2">
            <Monitor className="w-5 h-5 text-brand-orange" /> Appearance
          </h2>
          
          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-brand-textMain">Application Theme</div>
                <div className="text-xs text-brand-textMuted">Toggle between Light and Dark mode.</div>
              </div>
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-center p-3 rounded-xl bg-brand-darkBg border border-brand-border hover:border-brand-orange text-brand-textMain transition-colors shadow-sm"
              >
                {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </button>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 space-y-4">
            <div>
              <div className="font-bold text-brand-textMain mb-1">Default Reader Mode</div>
              <div className="text-xs text-brand-textMuted mb-3">How manga pages should scale by default.</div>
            </div>
            <div className="flex p-1 bg-brand-darkBg rounded-xl border border-brand-border/60">
              <button
                onClick={() => setReaderMode('fit_width')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  readerMode === 'fit_width' ? 'bg-brand-orange text-white shadow-neon' : 'text-brand-textMuted hover:text-brand-textMain'
                }`}
              >
                Fit Width
              </button>
              <button
                onClick={() => setReaderMode('fit_height')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  readerMode === 'fit_height' ? 'bg-brand-orange text-white shadow-neon' : 'text-brand-textMuted hover:text-brand-textMain'
                }`}
              >
                Fit Height
              </button>
            </div>
          </div>
        </motion.div>

        {/* Data Management (Danger Zone) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 border-b border-brand-border/40 pb-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>

          <div className="glass-panel p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
            
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cardBg transition-colors border border-transparent hover:border-brand-border">
              <div>
                <div className="font-bold text-brand-textMain text-sm">Clear Reading History</div>
                <div className="text-[11px] text-brand-textMuted">Removes all saved page progress.</div>
              </div>
              <button 
                onClick={() => clearData('history')}
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cardBg transition-colors border border-transparent hover:border-brand-border">
              <div>
                <div className="font-bold text-brand-textMain text-sm">Clear All Favorites</div>
                <div className="text-[11px] text-brand-textMuted">Empties your favorite list.</div>
              </div>
              <button 
                onClick={() => clearData('favorites')}
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cardBg transition-colors border border-transparent hover:border-brand-border">
              <div>
                <div className="font-bold text-brand-textMain text-sm">Clear Bookings</div>
                <div className="text-[11px] text-brand-textMuted">Deletes all seat reservations.</div>
              </div>
              <button 
                onClick={() => clearData('bookings')}
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
