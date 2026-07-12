import express from 'express';
import * as dataSource from '../services/dataSource.js';

const router = express.Router();

// GET /api/manga
router.get('/manga', async (req, res) => {
  const { q, genres, status, sfw, order_by = 'popularity', sort = 'asc', page = 1, limit = 12 } = req.query;
  
  try {
    const result = await dataSource.searchManga(
      q,
      parseInt(limit, 10) || 12,
      parseInt(page, 10) || 1,
      genres,
      status,
      order_by,
      sort,
      sfw === 'true'
    );
    res.json(result);
  } catch (err) {
    console.error('Error in searchManga route:', err.message);
    res.status(500).json({ error: 'Failed to search manga' });
  }
});

// GET /api/manga/genres
router.get('/manga/genres', async (req, res) => {
  try {
    const genres = await dataSource.getGenres();
    res.json({ data: genres });
  } catch (err) {
    console.error('Error in getGenres route:', err.message);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// GET /api/manga/:id
router.get('/manga/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const manga = await dataSource.getMangaById(id);
    if (!manga) {
      return res.status(404).json({ message: 'Manga not found' });
    }
    res.json({ data: manga });
  } catch (err) {
    console.error(`Error in getMangaById route for ID ${id}:`, err.message);
    res.status(500).json({ message: err.message || 'Failed to fetch manga detail' });
  }
});

// GET /api/manga/:id/feed
router.get('/manga/:id/feed', async (req, res) => {
  const { id } = req.params;
  
  try {
    const feed = await dataSource.getMangaFeed(id);
    res.json(feed);
  } catch (err) {
    console.error(`Error in getMangaFeed route for ID ${id}:`, err.message);
    res.status(500).json({ message: 'Failed to fetch chapters feed' });
  }
});

export default router;
