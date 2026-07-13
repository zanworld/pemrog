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
// For JP publishers (magazines param): proxies directly to Jikan /manga?magazines=...
// For EN publishers (q param): does a title/query search via dataSource (MangaDex-first)
router.get('/manga/by-publisher', async (req, res) => {
  const { magazines, q, limit = 24, page = 1 } = req.query;

  try {
    if (magazines) {
      // Jikan expects array format: magazines[]=8&magazines[]=87...
      // NOT a comma-separated string
      const magazineIds = magazines.split(',').map(id => id.trim()).filter(Boolean);

      const jikanRes = await jikan.searchManga({
        'magazines[]': magazineIds,
        order_by: 'popularity',
        sort: 'desc',
        limit: parseInt(limit, 10) || 24,
        page: parseInt(page, 10) || 1,
      });

      const raw = jikanRes?.data ?? [];
      // Adapt Jikan items to the same shape the frontend expects
      const adapted = raw.map(item => ({
        id: String(item.mal_id),
        mal_id: item.mal_id,
        title: item.title,
        title_english: item.title_english,
        synopsis: item.synopsis,
        score: item.score,
        rank: item.rank,
        popularity: item.popularity,
        status: item.status,
        type: item.type,
        chapters: item.chapters,
        volumes: item.volumes,
        images: item.images,
        imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        genres: item.genres || [],
        authors: (item.authors || []).map(a => ({ name: a.name })),
        published: item.published,
        source: 'jikan',
      }));

      return res.json({ data: adapted, total: jikanRes?.pagination?.items?.total ?? adapted.length });
    }

    if (q) {
      // EN publishers — fallback to title search via regular dataSource
      const result = await dataSource.searchManga(
        q,
        parseInt(limit, 10) || 24,
        parseInt(page, 10) || 1,
        '',    // no genre filter
        '',    // no status filter
        'popularity',
        'desc'
      );
      return res.json(result);
    }

    return res.status(400).json({ error: 'Provide either magazines or q parameter' });
  } catch (err) {
    console.error('Error in by-publisher route, using mock fallback:', err.message);
    
    // Provide a robust mock data fallback to prevent the publisher page from showing "Offline Mode"
    try {
      const limitNum = parseInt(limit, 10) || 24;
      const pageNum = parseInt(page, 10) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      
      const slice = mockMangaData.slice(startIndex, startIndex + limitNum).map(item => ({
        ...item,
        id: String(item.mal_id),
        imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        source: 'local'
      }));

      return res.json({
        data: slice,
        total: mockMangaData.length,
        source: 'local_fallback',
        warning: 'Jikan API offline or blocked. Showing cached local library.'
      });
    } catch (fallbackErr) {
      console.error('Fallback failed too:', fallbackErr.message);
      res.status(500).json({ error: 'Failed to fetch publisher manga', detail: err.message });
    }
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
