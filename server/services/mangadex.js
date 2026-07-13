import axios from 'axios';

const MANGADEX_BASE_URL = 'https://api.mangadex.org';

const client = axios.create({
  baseURL: MANGADEX_BASE_URL,
  // Kept short — this is tried before Jikan in some fallback chains (e.g. by-publisher),
  // so it must not consume most of the serverless function's execution budget by itself.
  timeout: 4000,
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
let cachedTagNameToUuid = null; // { 'tag-name-lower': 'md-uuid', ... }

const FALLBACK_TAG_UUIDS = {
  'doujinshi': 'b13b2a48-c720-44a9-9c17-47b777402636',
  'boys\' love': '5920b825-4181-4a17-bee6-941e3090967d',
  'girls\' love': 'a3c67850-4684-404e-9b7f-c69850ee5da6',
  'ecchi': 'ddefd648-5146-4e11-85b3-3a780b43179e',
  'gore': 'badbb64b-741c-4233-a3d3-7d2d3856385e',
  'sexual violence': '799c81b4-7a4e-4f24-9b51-419b48f65706'
};

/**
 * Fetches all MangaDex genre tags and builds the MAL→MD UUID mapping
 * by matching on tag name (case-insensitive). Result is cached in memory.
 */
export const buildGenreMap = async () => {
  if (cachedGenreMap) return cachedGenreMap;

  try {
    const res = await client.get('/manga/tag');
    const tags = res.data?.data ?? [];

    const nameToUuid = {};
    for (const tag of tags) {
      const name = (tag.attributes?.name?.en || '').toLowerCase();
      if (name) nameToUuid[name] = tag.id;
    }
    cachedTagNameToUuid = nameToUuid;

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

export const resolveTagUuid = async (name) => {
  const nameLower = name.toLowerCase();
  await buildGenreMap();
  if (cachedTagNameToUuid && cachedTagNameToUuid[nameLower]) {
    return cachedTagNameToUuid[nameLower];
  }
  return FALLBACK_TAG_UUIDS[nameLower] || null;
};

// Accessor for the reverse map (MD UUID → MAL ID)
export const getMdToMalMap = async () => {
  if (!cachedMdToMal) await buildGenreMap();
  return cachedMdToMal;
};

// Legacy named exports kept for any code that imports it directly
export const GENRE_MAP_MAL_TO_MD = {};   // Will be populated lazily
export const GENRE_MAP_MD_TO_MAL = {};   // Will be populated lazily

// ── Search ───────────────────────────────────────────────────
export const searchManga = async (query = '', limit = 12, page = 1, genres = '', status = '', order_by = 'popularity', sort = 'asc', sfw = false) => {
  const offset = (page - 1) * limit;

  const params = {
    limit,
    offset,
    'includes[]': ['cover_art', 'author'],
    // Only return manga with at least one available chapter in English
    hasAvailableChapters: true,
    'availableTranslatedLanguage[]': ['en'],
    // Limit to safe content for campus app context (drop suggestive if sfw is true)
    'contentRating[]': sfw ? ['safe'] : ['safe', 'suggestive'],
  };

  if (query) {
    params.title = query;
  }

  // Handle SFW tag exclusions
  if (sfw) {
    const listToExclude = ["Doujinshi", "Boys' Love", "Girls' Love", "Ecchi", "Gore", "Sexual Violence"];
    const excludedIds = [];
    for (const tagName of listToExclude) {
      const uuid = await resolveTagUuid(tagName);
      if (uuid) excludedIds.push(uuid);
    }
    if (excludedIds.length > 0) {
      params['excludedTags[]'] = excludedIds;
      // MangaDex validates this as a case-sensitive enum ("AND"/"OR") — lowercase was
      // silently rejected with a 400, which is why every sfw=true search (Catalog's
      // default) fell straight past MangaDex to Jikan/mock even when MangaDex was healthy.
      params.excludedTagsMode = 'OR';
    }
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
