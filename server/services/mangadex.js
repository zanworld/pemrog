import axios from 'axios';

const MANGADEX_BASE_URL = 'https://api.mangadex.org';

const client = axios.create({
  baseURL: MANGADEX_BASE_URL,
  timeout: 8000,
});

// ── Genre Tag Cache ───────────────────────────────────────────
// MAL genre ID → human-readable name used to match MangaDex tag names
const MAL_GENRE_NAMES = {
  1:  'Action',
  2:  'Adventure',
  4:  'Comedy',
  7:  'Mystery',
  8:  'Drama',
  10: 'Fantasy',
  22: 'Romance',
  24: 'Sci-Fi',
  30: 'Sports',
  36: 'Slice of Life',
  37: 'Supernatural',
  45: 'Thriller',
};

// In-memory cache: populated once on first genre request
let cachedGenreMap = null;   // { malId: 'md-uuid', ... }
let cachedMdToMal = null;    // { 'md-uuid': malId, ... }

/**
 * Fetches all MangaDex genre tags and builds the MAL→MD UUID mapping
 * by matching on tag name (case-insensitive). Result is cached in memory.
 */
export const buildGenreMap = async () => {
  if (cachedGenreMap) return cachedGenreMap;

  try {
    const res = await client.get('/manga/tag');
    const tags = res.data?.data ?? [];

    const genreTags = tags.filter(t => t.attributes?.group === 'genre');

    const nameToUuid = {};
    for (const tag of genreTags) {
      const name = (tag.attributes?.name?.en || '').toLowerCase();
      if (name) nameToUuid[name] = tag.id;
    }

    const map = {};
    for (const [malId, name] of Object.entries(MAL_GENRE_NAMES)) {
      const uuid = nameToUuid[name.toLowerCase()];
      if (uuid) map[parseInt(malId, 10)] = uuid;
    }

    cachedGenreMap = map;
    cachedMdToMal = Object.fromEntries(
      Object.entries(map).map(([malId, uuid]) => [uuid, parseInt(malId, 10)])
    );

    console.log(`✅ Genre map built: ${Object.keys(map).length}/${Object.keys(MAL_GENRE_NAMES).length} genres resolved`);
    return map;
  } catch (err) {
    console.error('Failed to build genre map from MangaDex /manga/tag:', err.message);
    // Return empty map on failure — genre filter just won't apply
    cachedGenreMap = {};
    cachedMdToMal = {};
    return {};
  }
};

// Accessor for the reverse map (MD UUID → MAL ID)
export const getMdToMalMap = async () => {
  if (!cachedMdToMal) await buildGenreMap();
  return cachedMdToMal;
};

// Legacy named export kept for any code that imports it directly
export const GENRE_MAP_MAL_TO_MD = {};   // Will be populated lazily
export const GENRE_MAP_MD_TO_MAL = {};   // Will be populated lazily

// ── Search ───────────────────────────────────────────────────
export const searchManga = async (query = '', limit = 12, page = 1, genres = '', status = '', order_by = 'popularity', sort = 'asc') => {
  const offset = (page - 1) * limit;

  const params = {
    limit,
    offset,
    'includes[]': ['cover_art', 'author'],
    // BUG 4 FIX: only return manga with at least one available chapter
    hasAvailableChapters: true,
    // Limit to safe content for campus app context
    'contentRating[]': ['safe', 'suggestive'],
  };

  if (query) {
    params.title = query;
  }

  // BUG 1 FIX: resolve genre UUIDs dynamically from MangaDex /manga/tag
  if (genres) {
    const genreMap = await buildGenreMap();
    const malGenreIds = genres.split(',').map(id => parseInt(id.trim(), 10));
    const mdTags = malGenreIds
      .map(id => genreMap[id])
      .filter(Boolean);

    if (mdTags.length > 0) {
      params['includedTags[]'] = mdTags;
    }
  }

  // Handle status
  if (status && status !== 'all') {
    const statusMap = {
      'publishing': 'ongoing',
      'complete': 'completed',
      'upcoming': 'hiatus',
    };
    const mdStatus = statusMap[status.toLowerCase()] || status;
    params['status[]'] = [mdStatus];
  }

  // Handle sorting/ordering
  if (order_by === 'popularity') {
    params['order[followedCount]'] = sort;
  } else if (order_by === 'score') {
    params['order[rating]'] = sort;
  } else if (order_by === 'title') {
    params['order[title]'] = sort;
  }

  const response = await client.get('/manga', { params });
  return response.data;
};

export const getMangaById = async (id) => {
  const response = await client.get(`/manga/${id}`, {
    params: {
      'includes[]': ['author', 'cover_art']
    }
  });
  return response.data;
};

export const getMangaFeed = async (id) => {
  const response = await client.get(`/manga/${id}/feed`, {
    params: {
      'translatedLanguage[]': ['en'],
      'order[chapter]': 'asc',
      'limit': 100
    }
  });
  return response.data;
};

export const getGenres = async () => {
  const response = await client.get('/manga/tag');
  return response.data;
};
