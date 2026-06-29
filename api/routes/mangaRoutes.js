import express from 'express';
import axios from 'axios';
import { mockMangaData } from '../../src/mockMangaData.js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const router = express.Router();
const MANGADEX = 'https://api.mangadex.org';
const MD_HEADERS = {
  'User-Agent': 'HybridLibrary/1.0 (github.com/zanworld/pemrog)',
};

// ── Helper: is string a UUID? ──────────────────────────────────
const isUUID = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(str)
  );

// ── Helper: normalize MangaDex manga to Jikan-like shape ───────
// BookDetailPage reads Jikan fields; we map MangaDex → Jikan here
// so BookDetailPage needs zero changes.
function normalizeMD(md) {
  const a = md.attributes || {};

  const title =
    (a.title &&
      (a.title.en ||
        a.title['ja-ro'] ||
        Object.values(a.title)[0])) ||
    'Unknown';

  const altEn =
    (a.altTitles || []).find((t) => t.en)?.en ||
    (a.altTitles || []).find((t) => t['en-ro'])?.['en-ro'] ||
    title;
  const altJa = (a.altTitles || []).find((t) => t.ja)?.ja || '';

  const coverRel = (md.relationships || []).find(
    (r) => r.type === 'cover_art'
  );
  const fileName = coverRel?.attributes?.fileName;
  const coverUrl = fileName
    ? `https://uploads.mangadex.org/covers/${md.id}/${fileName}`
    : 'https://via.placeholder.com/400x600/131214/FF5722?text=No+Cover';

  const authorRels = (md.relationships || []).filter(
    (r) => r.type === 'author'
  );

  const genres = (a.tags || [])
    .filter((t) => t.attributes?.group === 'genre')
    .map((t) => ({
      mal_id: t.id,
      name:
        t.attributes?.name?.en ||
        Object.values(t.attributes?.name || {})[0] ||
        '',
    }));

  const statusMap = {
    ongoing: 'Publishing',
    completed: 'Finished',
    hiatus: 'On Hiatus',
    cancelled: 'Discontinued',
  };

  const description = a.description
    ? a.description.en ||
      a.description['pt-br'] ||
      Object.values(a.description)[0] ||
      ''
    : '';

  return {
    mal_id: md.id,
    title,
    title_english: altEn,
    title_japanese: altJa,
    images: {
      jpg: {
        image_url: coverUrl,
        large_image_url: coverUrl,
      },
    },
    synopsis: description || 'No description available.',
    status: statusMap[a.status] || a.status || 'Unknown',
    chapters: a.lastChapter ? parseInt(a.lastChapter) : null,
    volumes: a.lastVolume ? parseInt(a.lastVolume) : null,
    published: {
      string: a.year ? `${a.year}` : 'Unknown',
    },
    genres,
    authors: authorRels.map((r) => ({
      name: r.attributes?.name || 'Unknown',
    })),
    type:
      a.publicationDemographic
        ? a.publicationDemographic.charAt(0).toUpperCase() +
          a.publicationDemographic.slice(1)
        : 'Manga',
    score: null,
    rank: null,
    popularity: null,
    _source: 'mangadex',
    _id: md.id,
  };
}

// ── GET /api/manga/tag ─────────────────────────────────────────
// MUST be defined BEFORE /manga/:id to avoid route conflict
router.get('/manga/tag', async (_req, res) => {
  try {
    const { data } = await axios.get(`${MANGADEX}/manga/tag`, {
      headers: MD_HEADERS,
      timeout: 10000,
    });
    res.json(data);
  } catch (err) {
    console.error('MangaDex /manga/tag error:', err.message);
    res
      .status(500)
      .json({ error: 'Failed to fetch tags from MangaDex' });
  }
});

// ── GET /api/manga ─────────────────────────────────────────────
// Gallery mode  : query has 'offset' param  → proxy MangaDex
// Catalog mode  : query has 'page' / 'q'   → mock data (legacy)
router.get('/manga', async (req, res) => {
  const {
    offset,
    q,
    genres,
    status,
    order_by = 'popularity',
    sort = 'asc',
    page = 1,
    limit = 12,
  } = req.query;

  // ===== GALLERY MODE: real MangaDex =====
  if (offset !== undefined) {
    const {
      title,
      sortBy = 'popularity',
    } = req.query;

    // includedTags[] can be passed multiple times (array) or once
    let includedTags = req.query['includedTags[]'];
    if (includedTags && !Array.isArray(includedTags)) {
      includedTags = [includedTags];
    }

    const params = new URLSearchParams();
    params.append('limit', Math.min(parseInt(limit) || 16, 32));
    params.append('offset', Math.max(parseInt(offset) || 0, 0));
    params.append('includes[]', 'cover_art');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('availableTranslatedLanguage[]', 'en');

    if (title && title.trim()) {
      params.append('title', title.trim());
    }

    // Sort mapping → MangaDex order params
    const sortMap = {
      popularity: [['order[followedCount]', 'desc']],
      relevance: [['order[relevance]', 'desc']],
      title: [['order[title]', 'asc']],
      newest: [['order[updatedAt]', 'desc']],
    };
    (sortMap[sortBy] || sortMap.popularity).forEach(([k, v]) =>
      params.append(k, v)
    );

    // Tag / genre filter
    if (includedTags && includedTags.length > 0) {
      includedTags.forEach((t) => params.append('includedTags[]', t));
    }

    try {
      const { data } = await axios.get(
        `${MANGADEX}/manga?${params.toString()}`,
        { headers: MD_HEADERS, timeout: 12000 }
      );
      res.json(data);
    } catch (err) {
      console.error('MangaDex /manga error:', err.message);
      res
        .status(err.response?.status || 500)
        .json({ error: 'Failed to fetch from MangaDex' });
    }
    return;
  }

  // ===== LEGACY/CATALOG MODE: mock data =====
  let result = [...mockMangaData];

  if (q) {
    const s = q.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(s) ||
        (item.title_english &&
          item.title_english.toLowerCase().includes(s))
    );
  }

  if (genres) {
    const genreIds = genres
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    result = result.filter((item) => {
      if (!item.genres) return false;
      const itemGenreIds = item.genres.map((g) => String(g.mal_id));
      return genreIds.every((id) => itemGenreIds.includes(id));
    });
  }

  if (status && status !== 'all') {
    const statusMap = {
      publishing: 'Publishing',
      complete: 'Finished',
      upcoming: 'Not yet published',
    };
    const mapped = statusMap[status.toLowerCase()] || status;
    result = result.filter((item) => item.status === mapped);
  }

  result.sort((a, b) => {
    let valA = a[order_by];
    let valB = b[order_by];
    if (['popularity', 'rank'].includes(order_by)) {
      valA = valA || 99999;
      valB = valB || 99999;
    } else if (order_by === 'score') {
      valA = valA || 0;
      valB = valB || 0;
    } else if (order_by === 'title') {
      valA = valA || '';
      valB = valB || '';
      return sort === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (valA < valB) return sort === 'asc' ? -1 : 1;
    if (valA > valB) return sort === 'asc' ? 1 : -1;
    return 0;
  });

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 12;
  const startIndex = (parsedPage - 1) * parsedLimit;
  const paginatedData = result.slice(startIndex, startIndex + parsedLimit);

  res.json({
    data: paginatedData,
    pagination: {
      current_page: parsedPage,
      last_visible_page: Math.ceil(result.length / parsedLimit) || 1,
      has_next_page: startIndex + parsedLimit < result.length,
      items: {
        count: paginatedData.length,
        total: result.length,
        per_page: parsedLimit,
      },
    },
  });
});

// ── GET /api/manga/:id ─────────────────────────────────────────
// UUID  → proxy MangaDex (from Gallery navigation)
// int   → mock data (from Catalog navigation)
router.get('/manga/:id', async (req, res) => {
  const { id } = req.params;

  if (isUUID(id)) {
    try {
      const { data } = await axios.get(
        `${MANGADEX}/manga/${id}?includes[]=cover_art&includes[]=author`,
        { headers: MD_HEADERS, timeout: 10000 }
      );
      if (data?.data) {
        res.json({ data: normalizeMD(data.data) });
      } else {
        res.status(404).json({ message: 'Manga not found on MangaDex' });
      }
    } catch (err) {
      console.error('MangaDex /manga/:id error:', err.message);
      res
        .status(err.response?.status || 500)
        .json({ error: 'Failed to fetch from MangaDex' });
    }
    return;
  }

  // Integer ID → mock data
  const mangaId = parseInt(id, 10);
  const manga = mockMangaData.find((m) => m.mal_id === mangaId);
  if (manga) {
    res.json({ data: manga });
  } else {
    res.status(404).json({ message: 'Manga not found' });
  }
});

router.get('/manga/:id/feed', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`https://api.mangadex.org/manga/${id}/feed`, {
      params: {
        'translatedLanguage[]': ['en'],
        'order[chapter]': 'asc',
        'limit': 100
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error(`Error fetching manga feed ${id} from MangaDex:`, err.message);
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || 'Failed to fetch manga chapters feed from MangaDex'
    });
  }
});

export default router;
