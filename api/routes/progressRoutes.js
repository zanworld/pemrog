import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/progress/:mangaId
router.get('/progress/:mangaId', authenticateToken, (req, res) => {
  try {
    const { mangaId } = req.params;
    const progress = db.prepare('SELECT chapter_id, last_page FROM reading_progress WHERE user_id = ? AND manga_id = ?').get(req.user.id, mangaId);
    
    if (progress) {
      res.json({ success: true, progress });
    } else {
      res.json({ success: true, progress: null });
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil progress baca' });
  }
});

// POST /api/progress
router.post('/progress', authenticateToken, (req, res) => {
  try {
    const { manga_id, chapter_id, last_page } = req.body;
    
    if (!manga_id || !chapter_id) {
      return res.status(400).json({ success: false, message: 'manga_id dan chapter_id wajib diisi' });
    }
    
    // Upsert reading progress
    db.prepare(`
      INSERT INTO reading_progress (user_id, manga_id, chapter_id, last_page, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, manga_id) DO UPDATE SET
        chapter_id = excluded.chapter_id,
        last_page = excluded.last_page,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, manga_id, chapter_id, last_page || 1);
    
    res.json({ success: true, message: 'Progress baca berhasil disimpan' });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan progress baca' });
  }
});

export default router;
