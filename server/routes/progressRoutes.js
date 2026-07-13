import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/progress/history
router.get('/progress/history', authenticateToken, (req, res) => {
  try {
    const history = db.prepare(
      'SELECT manga_id, chapter_id, last_page, updated_at FROM reading_progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50'
    ).all(req.user.id);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Progress history error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat baca' });
  }
});

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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runWithRetry = async (fn, maxRetries = 2, delay = 100) => {
  let attempt = 0;
  while (true) {
    try {
      return fn();
    } catch (error) {
      attempt++;
      console.warn(`[DB Attempt ${attempt}] Error: ${error.message} (code: ${error.code})`);
      if (error.code === 'SQLITE_BUSY' && attempt <= maxRetries) {
        console.warn(`Database busy. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      throw error;
    }
  }
};

// POST /api/progress
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { manga_id, chapter_id, last_page } = req.body;
    
    if (!manga_id || !chapter_id) {
      return res.status(400).json({ success: false, message: 'manga_id dan chapter_id wajib diisi' });
    }
    
    // Upsert reading progress with retry
    await runWithRetry(() => {
      db.prepare(`
        INSERT INTO reading_progress (user_id, manga_id, chapter_id, last_page, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, manga_id) DO UPDATE SET
          chapter_id = excluded.chapter_id,
          last_page = excluded.last_page,
          updated_at = CURRENT_TIMESTAMP
      `).run(req.user.id, String(manga_id), String(chapter_id), last_page || 1);
    });
    
    res.json({ success: true, message: 'Progress baca berhasil disimpan' });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ 
      success: false, 
      message: `Gagal menyimpan progress baca: ${error.message || 'Error internal'} (code: ${error.code || 'UNKNOWN'})` 
    });
  }
});

export default router;
