import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import mangaRoutes from '../server/routes/mangaRoutes.js';
import chapterRoutes from '../server/routes/chapterRoutes.js';
import imageProxy from '../server/routes/imageProxy.js';
import authRoutes from '../server/routes/authRoutes.js';
import bookingRoutes from '../server/routes/bookingRoutes.js';
import reviewRoutes from '../server/routes/reviewRoutes.js';
import progressRoutes from '../server/routes/progressRoutes.js';
import { authenticateToken } from '../server/middleware/auth.js';
import db, { initDB } from '../server/db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database Schema
initDB();

// Seed Demo User
try {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('dosen@amikom.ac.id');
  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(
      'Dosen Pembimbing', 'dosen@amikom.ac.id', passwordHash
    );
    console.log('✅ Demo user seeded: dosen@amikom.ac.id / password123');
  }
} catch (err) {
  console.error('Error seeding demo user:', err);
}

// Public Routes
app.use('/api', mangaRoutes);
app.use('/api', chapterRoutes); // GET /api/chapter/:chapterId/pages
app.use('/api', imageProxy);    // GET /api/manga-image?url=...
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', progressRoutes);

// Backend Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running perfectly!', timestamp: new Date() });
});

// ----------------------------------------------------
// Protected Routes
// ----------------------------------------------------

// Profile Stats
app.get('/api/profile/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const favCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(userId).count;
    const bookmarkCount = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?').get(userId).count;
    const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE user_id = ?').get(userId).count;
    
    // For last reading progress, joining with manga is ideal, but here we just return the row
    const lastProgress = db.prepare('SELECT * FROM reading_progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(userId);

    res.json({
      success: true,
      stats: {
        favorites: favCount,
        bookmarks: bookmarkCount,
        bookings: bookingCount,
        last_manga_read: lastProgress ? lastProgress.manga_id : null,
        last_chapter: lastProgress ? lastProgress.chapter_id : null
      }
    });
  } catch (error) {
    console.error('Profile stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Favorites CRUD
app.get('/api/favorites', authenticateToken, (req, res) => {
  try {
    const favorites = db.prepare('SELECT manga_id FROM favorites WHERE user_id = ?').all(req.user.id);
    res.json({ success: true, favorites: favorites.map(f => f.manga_id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/favorites', authenticateToken, (req, res) => {
  try {
    const { manga_id } = req.body;
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, manga_id) VALUES (?, ?)').run(req.user.id, manga_id);
    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/favorites/:mangaId', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND manga_id = ?').run(req.user.id, req.params.mangaId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bookmarks CRUD (Similar structure)
app.get('/api/bookmarks', authenticateToken, (req, res) => {
  try {
    const bookmarks = db.prepare('SELECT manga_id FROM bookmarks WHERE user_id = ?').all(req.user.id);
    res.json({ success: true, bookmarks: bookmarks.map(b => b.manga_id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/bookmarks', authenticateToken, (req, res) => {
  try {
    const { manga_id } = req.body;
    db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, manga_id) VALUES (?, ?)').run(req.user.id, manga_id);
    res.json({ success: true, message: 'Added to bookmarks' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/bookmarks/:mangaId', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND manga_id = ?').run(req.user.id, req.params.mangaId);
    res.json({ success: true, message: 'Removed from bookmarks' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start local server if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Functions
export default app;
