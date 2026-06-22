import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Trash2, Check, X, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'completed'
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
    // Sort by newest bookedAt
    history.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
    setBookings(history);
  }, []);

  const handleCancel = (bookingToCancel) => {
    const updated = bookings.filter(b => b.bookedAt !== bookingToCancel.bookedAt);
    setBookings(updated);
    localStorage.setItem('booking_history', JSON.stringify(updated));
    setConfirmCancelId(null);
    toast.success('Booking cancelled successfully');
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter(b => {
    if (filter === 'upcoming') return b.date >= today;
    return b.date < today;
  });

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
          <Calendar className="h-6 w-6 text-brand-orange" />
          Booking History
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Manage your upcoming and past reading seat reservations.
        </p>
      </div>

      <div className="flex gap-4 border-b border-brand-border/40 pb-4">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            filter === 'upcoming' 
              ? 'bg-brand-orange text-white shadow-neon' 
              : 'text-brand-textMuted hover:text-brand-textMain hover:bg-brand-cardBg'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            filter === 'completed' 
              ? 'bg-brand-orange text-white shadow-neon' 
              : 'text-brand-textMuted hover:text-brand-textMain hover:bg-brand-cardBg'
          }`}
        >
          Completed
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredBookings.length === 0 && (
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-12 text-center border border-brand-border border-dashed rounded-2xl bg-brand-cardBg/30"
             >
               <p className="text-brand-textMuted">No {filter} bookings found.</p>
             </motion.div>
          )}

          {filteredBookings.map((booking) => {
            const isConfirming = confirmCancelId === booking.bookedAt;
            const qrData = JSON.stringify({ d: booking.date, s: booking.slot, st: booking.seat });
            
            return (
              <motion.div
                key={booking.bookedAt}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="glass-panel p-6 rounded-2xl border border-brand-border/40 bg-brand-cardBg/50 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-xs font-bold border border-brand-orange/20">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.slot}
                    </div>
                    
                    <div>
                      <div className="text-xs text-brand-textMuted uppercase tracking-wider font-bold mb-1">Date</div>
                      <div className="text-lg font-extrabold text-brand-textMain">{booking.date}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-brand-textMuted uppercase tracking-wider font-bold mb-1">Seat Number</div>
                      <div className="text-2xl font-black text-emerald-400">#{booking.seat}</div>
                    </div>
                    
                    <div className="text-xs text-brand-textMuted pt-2">
                      Booked on: {new Date(booking.bookedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-2 rounded-xl">
                      <QRCodeSVG value={qrData} size={100} level="M" />
                    </div>
                    <div className="text-[10px] font-bold text-brand-textMuted uppercase flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> E-Ticket
                    </div>
                  </div>
                </div>

                {filter === 'upcoming' && (
                  <div className="mt-6 pt-4 border-t border-brand-border/40 flex justify-end">
                    {isConfirming ? (
                      <div className="flex items-center gap-3 animate-fade-in">
                        <span className="text-xs font-bold text-red-400">Cancel booking?</span>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="p-2 rounded-lg bg-brand-cardBg hover:bg-brand-border text-brand-textMain transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(booking)}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(booking.bookedAt)}
                        className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
