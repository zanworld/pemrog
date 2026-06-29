// ============================================================
// Route chapter — dummy endpoint karena Jikan tidak menyediakan page chapter
// ============================================================
import express from 'express';

const router = express.Router();

// GET /api/chapter/:chapterId/pages
router.get('/chapter/:chapterId/pages', async (req, res) => {
  res.json({ total: 0, quality: 'data', pages: [] });
});

export default router;
