import express from 'express';
import * as dataSource from '../services/dataSource.js';
import * as jikan from '../services/jikan.js';
import * as mangadex from '../services/mangadex.js';
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

// GET /api/manga/by-publisher?magazines=8,87,88,113&name=Shueisha  OR  ?q=viz&limit=24&page=1
// For JP publishers (magazines param): MangaDex (title search on publisher name) -> Jikan (precise magazine filter) -> local mock
// For EN publishers (q param): does a title/query search via dataSource (MangaDex-first)
// The local mock fallback is a LAST RESORT — it only triggers once every live source above has
// failed outright (both attempts threw), not on a single transient hiccup from one of them.
router.get('/manga/by-publisher', async (req, res) => {
  const { magazines, q, name, limit = 24, page = 1 } = req.query;
  const limitNum = parseInt(limit, 10) || 24;
  const pageNum = parseInt(page, 10) || 1;

  try {
    if (magazines) {
      // Jikan expects array format: magazines[]=8&magazines[]=87...
      // NOT a comma-separated string
      const magazineIds = magazines.split(',').map(id => id.trim()).filter(Boolean);

      // 1. Try MangaDex first — approximate title-keyword match on the publisher's display
      // name (MangaDex has no per-magazine metadata, so this is a live-but-imprecise attempt,
      // same tradeoff already accepted for EN publishers below).
      if (name) {
        try {
          console.log(`[by-publisher] Trying MangaDex for JP publisher "${name}"...`);
          const mdRaw = await mangadex.searchManga(name, limitNum, pageNum, '', '', 'popularity', 'desc', false);
          if (mdRaw?.data?.length) {
            const adapted = mdRaw.data.map(dataSource.adaptMangaDex);
            return res.json({ data: adapted, total: mdRaw.total ?? adapted.length, source: 'mangadex' });
          }
          console.log(`[by-publisher] MangaDex returned no results for "${name}", falling back to Jikan.`);
        } catch (mdErr) {
          console.warn(`[by-publisher] MangaDex search failed for "${name}", falling back to Jikan:`, mdErr.message);
        }
      }

      // 2. Try Jikan (precise magazine filter). jikan.js itself now retries transient
      // errors (429/502/503/504/network) before giving up, so reaching the catch below
      // means Jikan was genuinely unreachable, not just rate-limited once.
      const jikanRes = await jikan.searchManga({
        'magazines[]': magazineIds,
        order_by: 'popularity',
        sort: 'desc',
        limit: limitNum,
        page: pageNum,
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

      return res.json({ data: adapted, total: jikanRes?.pagination?.items?.total ?? adapted.length, source: 'jikan' });
    }

    if (q) {
      // EN publishers — fallback to title search via regular dataSource (already MangaDex -> Jikan -> mock)
      const result = await dataSource.searchManga(
        q,
        limitNum,
        pageNum,
        '',    // no genre filter
        '',    // no status filter
        'popularity',
        'desc'
      );
      return res.json(result);
    }

    return res.status(400).json({ error: 'Provide either magazines or q parameter' });
  } catch (err) {
    console.error('Error in by-publisher route, both live sources failed — using mock fallback:', err.message);

    // Last-resort mock fallback: only reached once MangaDex AND Jikan (with its internal
    // retries) have both failed outright for this request.
    try {
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
        degraded: true,
        warning: 'Live manga sources (MangaDex, Jikan) are unreachable. Showing cached local library.'
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
