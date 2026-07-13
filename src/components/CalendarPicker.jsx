import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * CalendarPicker — a click-only date picker with dark theme & orange accent.
 * 
 * Props:
 *   value      {string}   Selected date in 'YYYY-MM-DD' format
 *   onChange   {fn}       Called with 'YYYY-MM-DD' string when user picks a date
 *   minDate    {string}   Minimum selectable date (default: today)
 *   placeholder {string}  Placeholder text
 */
export default function CalendarPicker({ value, onChange, minDate, placeholder = 'Pilih tanggal' }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateObj = minDate ? parseDate(minDate) : today;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = value ? parseDate(value) : today;
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? parseDate(value) : today;
    return d.getMonth();
  });

  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeydown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeydown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [open]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    const picked = new Date(viewYear, viewMonth, day);
    picked.setHours(0, 0, 0, 0);
    if (picked < minDateObj) return; // guard — shouldn't happen since button is disabled
    onChange(toDateStr(picked));
    setOpen(false);
  };

  const selectedDateObj = value ? parseDate(value) : null;

  const renderDays = () => {
    const totalDays = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const cells = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const thisDate = new Date(viewYear, viewMonth, day);
      thisDate.setHours(0, 0, 0, 0);
      const isPast = thisDate < minDateObj;
      const isSelected = selectedDateObj &&
        thisDate.getTime() === selectedDateObj.getTime();
      const isToday = thisDate.getTime() === today.getTime();

      cells.push(
        <button
          key={day}
          type="button"
          disabled={isPast}
          onClick={() => handleDayClick(day)}
          className={[
            'relative flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 select-none',
            isPast
              ? 'text-brand-textMuted/30 cursor-not-allowed'
              : 'hover:bg-brand-orange/15 hover:text-brand-orange cursor-pointer',
            isSelected
              ? '!bg-brand-orange text-white shadow-neon hover:!bg-brand-accent'
              : '',
            isToday && !isSelected
              ? 'ring-1 ring-brand-orange/50 text-brand-orange'
              : '',
          ].filter(Boolean).join(' ')}
        >
          {day}
          {isToday && !isSelected && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-orange" />
          )}
        </button>
      );
    }

    return cells;
  };

  const displayValue = value
    ? (() => {
        const d = parseDate(value);
        return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : null;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger button — styled to look like the original input */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 rounded-xl border bg-brand-darkBg text-left transition-all outline-none ${
          open
            ? 'border-brand-orange ring-2 ring-brand-orange/30'
            : 'border-brand-border hover:border-brand-orange/40'
        }`}
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-textMuted pointer-events-none" />
        <span className={displayValue ? 'text-brand-textMain text-sm font-medium' : 'text-brand-textMuted text-sm'}>
          {displayValue || placeholder}
        </span>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-brand-border bg-brand-cardBg shadow-2xl p-4 animate-fade-in"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,107,0,0.08)' }}
        >
          {/* Month / Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-textMuted hover:text-brand-orange hover:bg-brand-orange/10 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-brand-textMain">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-textMuted hover:text-brand-orange hover:bg-brand-orange/10 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="flex h-8 items-center justify-center text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {renderDays()}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-brand-border/40 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onChange(toDateStr(today));
                setOpen(false);
              }}
              className="text-xs font-semibold text-brand-orange hover:text-brand-accent transition-colors"
            >
              Hari ini
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="text-xs text-brand-textMuted hover:text-red-400 transition-colors"
              >
                Hapus pilihan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
