import express from 'express';
import * as dataSource from '../services/dataSource.js';
import * as jikan from '../services/jikan.js';
import { mockMangaData } from '../../src/mockMangaData.js';

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

// GET /api/manga/by-publisher?magazines=8,87,88,113  OR  ?q=viz&limit=24&page=1
// Serves local mock data filtered by publisher
router.get('/manga/by-publisher', async (req, res) => {
  const { magazines, q, limit = 24, page = 1 } = req.query;

  try {
    const limitNum = parseInt(limit, 10) || 24;
    const pageNum = parseInt(page, 10) || 1;
    const startIndex = (pageNum - 1) * limitNum;

    let ids = [];

    if (magazines) {
      const magList = magazines.split(',').map(id => id.trim());
      if (magList.some(id => ['8', '87', '88', '113'].includes(id))) {
        ids = [3, 6, 11]; // Shueisha -> One Piece, Chainsaw Man, Death Note
      } else if (magList.some(id => ['83', '84', '65'].includes(id))) {
        ids = [8]; // Kodansha -> Grand Blue
      } else if (magList.some(id => ['82', '127'].includes(id))) {
        ids = [5]; // Shogakukan -> Frieren
      } else if (magList.some(id => ['100', '102', '103'].includes(id))) {
        ids = [9]; // Kadokawa -> Steins;Gate
      } else if (magList.some(id => ['13', '14'].includes(id))) {
        ids = [10]; // Square Enix -> Horimiya
      }
    } else if (q) {
      const query = q.toLowerCase().trim();
      if (query.includes('viz')) {
        ids = [3, 6, 11];
      } else if (query.includes('yen')) {
        ids = [5, 10];
      } else if (query.includes('seven')) {
        ids = [12, 1];
      } else if (query.includes('dark')) {
        ids = [2];
      } else if (query.includes('vertical')) {
        ids = [4];
      } else {
        // Fallback search match by title
        const match = mockMangaData.filter(item => 
          item.title.toLowerCase().includes(query) || 
          (item.title_english && item.title_english.toLowerCase().includes(query))
        );
        ids = match.map(m => m.mal_id);
      }
    }

    let filteredData = [];
    if (ids.length > 0) {
      filteredData = mockMangaData.filter(m => ids.includes(m.mal_id));
    } else {
      filteredData = mockMangaData;
    }

    const slice = filteredData.slice(startIndex, startIndex + limitNum).map(item => ({
      ...item,
      id: String(item.mal_id),
      imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
      source: 'local'
    }));

    return res.json({
      data: slice,
      total: filteredData.length,
      source: 'local'
    });
  } catch (err) {
    console.error('Error in by-publisher route:', err.message);
    res.status(500).json({ error: 'Failed to fetch publisher manga', detail: err.message });
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
