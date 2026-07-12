import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get occupied seats for a specific date and slot (Public or any authenticated user can view)
router.get('/occupied', authenticateToken, (req, res) => {
  const { date, slot } = req.query;
  if (!date || !slot) {
    return res.status(400).json({ success: false, message: 'Date and slot are required' });
  }

  try {
    const occupiedSeats = db.prepare('SELECT seat FROM bookings WHERE booking_date = ? AND slot = ?').all(date, slot);
    res.json({
      success: true,
      occupied: occupiedSeats.map(row => Number(row.seat))
    });
  } catch (error) {
    console.error('Error fetching occupied seats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get booking history for the current user
router.get('/', authenticateToken, (req, res) => {
  try {
    const userBookings = db.prepare('SELECT id, booking_date as date, slot, seat, created_at as bookedAt FROM bookings WHERE user_id = ? ORDER BY booking_date DESC, created_at DESC').all(req.user.id);
    res.json({ success: true, bookings: userBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create a new booking
router.post('/', authenticateToken, (req, res) => {
  const { date, slot, seat } = req.body;

  if (!date || !slot || !seat) {
    return res.status(400).json({ success: false, message: 'Date, slot, and seat are required' });
  }

  try {
    const insertStmt = db.prepare('INSERT INTO bookings (user_id, booking_date, slot, seat) VALUES (?, ?, ?, ?)');
    const result = insertStmt.run(req.user.id, date, slot, String(seat));
    
    res.status(201).json({ success: true, message: 'Booking successful', bookingId: result.lastInsertRowid });
  } catch (error) {
    // Check for UNIQUE constraint violation
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, message: 'Seat already booked for this date and slot' });
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete a booking
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM bookings WHERE id = ? AND user_id = ?').run(id, req.user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or not authorized' });
    }
    
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
