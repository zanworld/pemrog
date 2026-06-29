// ============================================================
// Route manga — mengambil data dari Jikan API.
// ============================================================
import express from 'express';
import {
  searchManga,
  getMangaById,
  getGenres,
} from '../services/jikan.js';

const router = express.Router();

// GET /api/manga  — pencarian / daftar (search, filter, sort, pagination)
router.get('/manga', async (req, res) => {
  try {
    const {
      q, genres, status,
      order_by = 'popularity', sort = 'desc',
      page = 1, limit = 12,
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit, 10) || 12, 24);
    const parsedPage = parseInt(page, 10) || 1;

    const params = {
      page: parsedPage,
      limit: parsedLimit,
    };
    
    if (q) params.q = q;
    if (genres) params.genres = genres;
    if (status && status !== 'all') params.status = status.toLowerCase();
    
    // Jikan supports sort by title, start_date, end_date, chapters, volumes, score, scored_by, rank, popularity, members, favorites
    if (order_by) params.order_by = order_by;
    if (sort) params.sort = sort;

    const result = await searchManga(params);
    
    // result dari Jikan API sudah sesuai format: { data: [...], pagination: {...} }
    res.json(result);
  } catch (err) {
    console.error('GET /manga error:', err.response?.data || err.message);
    res.status(502).json({ message: 'Gagal mengambil data dari Jikan API' });
  }
});

// GET /api/manga/genres — daftar genre untuk filter
router.get('/manga/genres', async (req, res) => {
  try {
    const result = await getGenres();
    res.json(result); // Jikan returns { data: [...] }
  } catch (err) {
    console.error('GET /manga/genres error:', err.message);
    res.status(502).json({ message: 'Gagal mengambil daftar genre' });
  }
});

// GET /api/manga/:id/feed — dummy endpoint karena Jikan tidak menyediakan chapter
router.get('/manga/:id/feed', async (req, res) => {
  res.json({ data: [] });
});

// GET /api/manga/:id — detail satu judul
router.get('/manga/:id', async (req, res) => {
  try {
    const result = await getMangaById(req.params.id);
    if (!result.data) return res.status(404).json({ message: 'Manga not found' });
    res.json(result); // Jikan returns { data: {...} }
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'Manga not found' });
    }
    console.error('GET /manga/:id error:', err.message);
    res.status(502).json({ message: 'Gagal mengambil detail manga' });
  }
});

export default router;
