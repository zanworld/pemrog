import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle, ArrowRight, ChevronLeft, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ date: '', slot: '' });
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Mock booked seats (hardcoded)
  const bookedSeats = [3, 7, 12, 18, 25];

  const sessions = [
    { id: 'Pagi', time: '08:00 - 12:00' },
    { id: 'Siang', time: '12:00 - 16:00' },
    { id: 'Sore', time: '16:00 - 20:00' }
  ];

  const handleNextStep = () => {
    if (!formData.date) {
      toast.error('Silakan pilih tanggal terlebih dahulu.');
      return;
    }
    if (!formData.slot) {
      toast.error('Silakan pilih sesi terlebih dahulu.');
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    if (!selectedSeat) {
      toast.error('Silakan pilih kursi terlebih dahulu.');
      return;
    }

    const newBooking = {
      date: formData.date,
      slot: formData.slot,
      seat: selectedSeat,
      bookedAt: new Date().toISOString()
    };

    const existingHistory = JSON.parse(localStorage.getItem('booking_history') || '[]');
    localStorage.setItem('booking_history', JSON.stringify([...existingHistory, newBooking]));

    toast.success('Kursi berhasil dipesan!');
    
    // Reset form
    setStep(1);
    setFormData({ date: '', slot: '' });
    setSelectedSeat(null);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-brand-textMain">
          <CalendarCheck className="h-6 w-6 text-brand-orange" />
          Book a Reading Seat
        </h1>
        <p className="text-sm text-brand-textMuted mt-1">
          Reserve a comfortable spot in our library to enjoy your favorite manga offline.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-brand-cardBg/50 border border-brand-border/40">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-brand-orange flex items-center gap-2">
                <span className="flex items-center justify-center bg-brand-orange text-white rounded-full w-6 h-6 text-xs font-bold">1</span>
                Pilih Tanggal dan Sesi
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-textMuted mb-2">Tanggal Kedatangan</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-textMuted" />
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-darkBg text-brand-textMain focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-textMuted mb-2">Pilih Sesi</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setFormData({ ...formData, slot: session.id })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.slot === session.id
                            ? 'border-brand-orange bg-brand-orange/10 text-brand-orange shadow-neon'
                            : 'border-brand-border bg-brand-darkBg text-brand-textMuted hover:border-brand-orange/50 hover:text-brand-textMain'
                        }`}
                      >
                        <Clock className="h-6 w-6 mb-2" />
                        <span className="font-bold">{session.id}</span>
                        <span className="text-xs opacity-70">{session.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 bg-brand-orange hover:bg-brand-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-neon"
                >
                  Pilih Kursi
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-orange flex items-center gap-2">
                  <span className="flex items-center justify-center bg-brand-orange text-white rounded-full w-6 h-6 text-xs font-bold">2</span>
                  Pilih Kursi Anda
                </h2>
                <div className="text-xs text-brand-textMuted bg-brand-darkBg px-3 py-1.5 rounded-full border border-brand-border">
                  <span className="font-bold text-brand-textMain">{formData.date}</span> • {formData.slot}
                </div>
              </div>

              <div className="flex justify-center gap-6 text-xs font-semibold pb-4 border-b border-brand-border/40">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500"></div> Tersedia</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div> Sudah Dipesan</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-brand-orange border border-brand-orange shadow-neon"></div> Dipilih</div>
              </div>

              <div className="max-w-xl mx-auto bg-brand-darkBg p-6 rounded-2xl border border-brand-border/40">
                <div className="w-full h-8 bg-brand-border/40 rounded-t-xl mb-8 flex items-center justify-center text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                  Library Entrance
                </div>
                
                <div className="grid grid-cols-6 gap-3 sm:gap-4">
                  {[...Array(30)].map((_, index) => {
                    const seatNum = index + 1;
                    const isBooked = bookedSeats.includes(seatNum);
                    const isSelected = selectedSeat === seatNum;

                    let seatClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-110";
                    if (isBooked) {
                      seatClass = "border-red-500 bg-red-500/10 text-red-500/50 cursor-not-allowed";
                    } else if (isSelected) {
                      seatClass = "border-brand-orange bg-brand-orange text-white shadow-neon scale-110";
                    }

                    return (
                      <button
                        key={seatNum}
                        disabled={isBooked}
                        onClick={() => setSelectedSeat(seatNum)}
                        className={`aspect-square flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all duration-200 ${seatClass}`}
                      >
                        {seatNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-brand-textMuted hover:text-brand-orange px-4 py-2 font-bold transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Kembali
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 bg-brand-orange hover:bg-brand-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-neon"
                >
                  <CheckCircle className="h-5 w-5" />
                  Konfirmasi Booking
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
