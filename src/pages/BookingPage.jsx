import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle, ArrowRight, ChevronLeft, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CalendarPicker from '../components/CalendarPicker';

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ date: '', slot: '' });
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [dynamicBookedSeats, setDynamicBookedSeats] = useState([]);

  const { token, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(null);

  const fetchOccupiedSeats = async () => {
    if (formData.date && formData.slot && token) {
      try {
        const response = await axios.get('/api/bookings/occupied', {
          params: { date: formData.date, slot: formData.slot },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setDynamicBookedSeats(response.data.occupied);
        }
      } catch (error) {
        console.error("Failed to fetch occupied seats", error);
      }
    }
  };

  // Initial fetch when date+slot change
  useEffect(() => {
    fetchOccupiedSeats();
  }, [formData, token]);

  // Real-time polling while user is on step 2 (seat selection)
  useEffect(() => {
    // Clear any existing interval first
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (step === 2 && formData.date && formData.slot && token) {
      setIsPolling(true);
      pollingRef.current = setInterval(async () => {
        await fetchOccupiedSeats();
      }, 7000); // poll every 7 seconds
    } else {
      setIsPolling(false);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsPolling(false);
    };
  }, [step, formData.date, formData.slot, token]);

  const bookedSeats = [...new Set([...dynamicBookedSeats])];

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
    // Double-check: selected date must be >= today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = formData.date.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    if (selected < today) {
      toast.error('Tanggal yang dipilih sudah lewat. Pilih tanggal hari ini atau yang akan datang.');
      return;
    }
    if (!formData.slot) {
      toast.error('Silakan pilih sesi terlebih dahulu.');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk memesan kursi.');
      navigate('/login');
      return;
    }
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedSeat) {
      toast.error('Silakan pilih kursi terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/bookings', 
        { date: formData.date, slot: formData.slot, seat: selectedSeat },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Kursi berhasil dipesan!');
        setStep(1);
        setFormData({ date: '', slot: '' });
        setSelectedSeat(null);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Kursi sudah dipesan orang lain. Silakan pilih kursi lain.');
        // Refresh occupied seats
        fetchOccupiedSeats();
        setSelectedSeat(null);
      } else {
        toast.error(error.response?.data?.message || 'Gagal memesan kursi.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
                  <CalendarPicker
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    minDate={new Date().toISOString().split('T')[0]}
                    placeholder="Klik untuk pilih tanggal"
                  />
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold text-brand-orange flex items-center gap-2">
                  <span className="flex items-center justify-center bg-brand-orange text-white rounded-full w-6 h-6 text-xs font-bold">2</span>
                  Pilih Kursi Anda
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {isPolling && (
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      Live
                    </span>
                  )}
                  <div className="text-xs text-brand-textMuted bg-brand-darkBg px-3 py-1.5 rounded-full border border-brand-border">
                    <span className="font-bold text-brand-textMain">{formData.date}</span> • {formData.slot}
                  </div>
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
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 bg-brand-orange hover:bg-brand-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-neon ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:scale-105'}`}
                >
                  <CheckCircle className="h-5 w-5" />
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Booking'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
