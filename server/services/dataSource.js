import * as mangadex from './mangadex.js';
import * as jikan from './jikan.js';
import { mockMangaData } from '../../src/mockMangaData.js';

// Cache mappings for IDs to transition fallback queries
const uuidToMalId = new Map();
const malIdToUuid = new Map();

// Helper to select a mock manga based on UUID hash consistently
const getMockMangaByUuid = (uuid) => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = uuid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % mockMangaData.length;
  return mockMangaData[index];
};

// ── ADAPTERS ──────────────────────────────────────────────────

const adaptMangaDex = (item) => {
  const coverRel = item.relationships?.find(r => r.type === 'cover_art');
  const fileName = coverRel?.attributes?.fileName;
  const rawImageUrl = fileName
    ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}`
    : 'https://via.placeholder.com/256x364?text=No+Cover';
  const imageUrl = fileName
    ? `/api/manga-image?url=${encodeURIComponent(rawImageUrl)}`
    : rawImageUrl;

  const authors = (item.relationships || [])
    .filter(r => r.type === 'author')
    .map(r => ({ name: r.attributes?.name || 'Unknown Author' }));

  const genres = (item.attributes?.tags || [])
    .filter(t => t.attributes?.group === 'genre')
    .map(t => ({
      mal_id: mangadex.GENRE_MAP_MD_TO_MAL[t.id] || 0,
      name: t.attributes?.name?.en || 'Unknown Genre'
    }));

  const statusMap = {
    'ongoing': 'Publishing',
    'completed': 'Finished',
    'hiatus': 'On Hiatus',
    'cancelled': 'Discontinued'
  };

  const malIdStr = item.attributes?.links?.mal;
  let mal_id = malIdStr ? parseInt(malIdStr, 10) : null;
  if (!mal_id) {
    // Generate a unique synthetic mal_id based on item.id (UUID) to prevent null duplication issues
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = item.id.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    mal_id = Math.abs(hash) + 1000000000;
  }

  if (mal_id) {
    uuidToMalId.set(item.id, mal_id);
    malIdToUuid.set(mal_id, item.id);
  }

  return {
    id: item.id,
    mal_id,
    title: item.attributes?.title?.en || Object.values(item.attributes?.title || {})[0] || 'Unknown Title',
    title_english: item.attributes?.altTitles?.find(t => t.en)?.en || '',
    title_japanese: item.attributes?.altTitles?.find(t => t.ja || t['ja-ro'])?.ja || '',
    score: null,
    rank: null,
    popularity: null,
    chapters: item.attributes?.lastChapter ? parseInt(item.attributes.lastChapter, 10) : null,
    volumes: item.attributes?.lastVolume ? parseInt(item.attributes.lastVolume, 10) : null,
    status: statusMap[item.attributes?.status] || item.attributes?.status || 'Unknown',
    type: 'Manga',
    images: {
      jpg: {
        large_image_url: imageUrl,
        image_url: imageUrl
      }
    },
    genres,
    authors,
    published: {
      string: item.attributes?.year ? String(item.attributes.year) : 'Unknown'
    },
    synopsis: item.attributes?.description?.en || Object.values(item.attributes?.description || {})[0] || 'No synopsis available.',
    source: 'mangadex'
  };
};

const adaptJikan = (item) => {
  return {
    id: String(item.mal_id),
    mal_id: item.mal_id,
    title: item.title,
    title_english: item.title_english || '',
    title_japanese: item.title_japanese || '',
    score: item.score || null,
    rank: item.rank || null,
    popularity: item.popularity || null,
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    status: item.status || 'Unknown',
    type: item.type || 'Manga',
    images: {
      jpg: {
        large_image_url: item.images?.jpg?.large_image_url || '',
        image_url: item.images?.jpg?.image_url || ''
      }
    },
    genres: (item.genres || []).map(g => ({ mal_id: g.mal_id, name: g.name })),
    authors: (item.authors || []).map(a => ({ name: a.name })),
    published: {
      string: item.published?.string || 'Unknown'
    },
    synopsis: item.synopsis || '',
    source: 'jikan'
  };
};

const adaptLocal = (item) => {
  return {
    ...item,
    id: String(item.mal_id),
    source: 'local'
  };
};

// ── CORE FALLBACK LOGIC ────────────────────────────────────────

export const searchManga = async (query = '', limit = 12, page = 1, genres = '', status = '', order_by = 'popularity', sort = 'asc', sfw = false) => {
  // 1. Try MangaDex
  try {
    console.log('Fetching search from MangaDex...');
    const rawData = await mangadex.searchManga(query, limit, page, genres, status, order_by, sort, sfw);
    if (rawData?.data) {
      return {
        data: rawData.data.map(adaptMangaDex),
        pagination: {
          current_page: page,
          last_visible_page: Math.ceil((rawData.total || 0) / limit) || 1,
          has_next_page: (page * limit) < (rawData.total || 0),
          items: {
            count: rawData.data.length,
            total: rawData.total || rawData.data.length,
            per_page: limit
          }
        },
        source: 'mangadex'
      };
    }
  } catch (err) {
    console.warn('MangaDex search failed, falling back to Jikan:', err.message);
  }

  // 2. Try Jikan (using cache inside services/jikan.js)
  try {
    console.log('Fetching search from Jikan API...');
    const jikanParams = {
      page,
      limit,
      order_by,
      sort,
    };
    if (query) jikanParams.q = query;
    if (genres) jikanParams.genres = genres;
    if (status && status !== 'all') jikanParams.status = status;
    if (sfw) {
      jikanParams.sfw = true;
      jikanParams.genres_exclude = '12,49,9,28,26,43';
    }

    const rawData = await jikan.searchManga(jikanParams);

    if (rawData?.data) {
      return {
        data: rawData.data.map(adaptJikan),
        pagination: {
          current_page: rawData.pagination?.current_page || page,
          last_visible_page: rawData.pagination?.last_visible_page || 1,
          has_next_page: rawData.pagination?.has_next_page || false,
          items: {
            count: rawData.data.length,
            total: rawData.pagination?.items?.total || rawData.data.length,
            per_page: limit
          }
        },
        source: 'jikan'
      };
    }
  } catch (err) {
    console.warn('Jikan search failed, falling back to local mock data:', err.message);
  }

  // 3. Fallback to Local Mock Data
  console.log('Using Local Mock Data search...');
  let result = [...mockMangaData];
  
  if (query) {
    const searchStr = query.toLowerCase().trim();
    result = result.filter(item => 
      item.title.toLowerCase().includes(searchStr) || 
      (item.title_english && item.title_english.toLowerCase().includes(searchStr))
    );
  }
  
  if (genres) {
    const genreIds = genres.split(',').map(id => parseInt(id.trim(), 10));
    result = result.filter(item => {
      if (!item.genres) return false;
      const itemGenreIds = item.genres.map(g => g.mal_id);
      return genreIds.every(id => itemGenreIds.includes(id));
    });
  }
  
  if (status && status !== 'all') {
    const statusMap = {
      'publishing': 'Publishing',
      'complete': 'Finished',
      'upcoming': 'Not yet published'
    };
    const mappedStatus = statusMap[status.toLowerCase()] || status;
    result = result.filter(item => item.status === mappedStatus);
  }
  
  // Sort local
  result.sort((a, b) => {
    let valA = a[order_by];
    let valB = b[order_by];
    
    if (order_by === 'popularity') {
      valA = valA || 99999;
      valB = valB || 99999;
    } else if (order_by === 'score') {
      valA = valA || 0;
      valB = valB || 0;
    } else if (order_by === 'rank') {
      valA = valA || 99999;
      valB = valB || 99999;
    } else if (order_by === 'title') {
      valA = valA || '';
      valB = valB || '';
      if (sort === 'asc') return valA.localeCompare(valB);
      return valB.localeCompare(valA);
    }
    
    if (valA < valB) return sort === 'asc' ? -1 : 1;
    if (valA > valB) return sort === 'asc' ? 1 : -1;
    return 0;
  });

  const startIndex = (page - 1) * limit;
  const paginatedData = result.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData.map(adaptLocal),
    pagination: {
      current_page: page,
      last_visible_page: Math.ceil(result.length / limit) || 1,
      has_next_page: startIndex + limit < result.length,
      items: {
        count: paginatedData.length,
        total: result.length,
        per_page: limit
      }
    },
    source: 'local'
  };
};

export const getMangaById = async (id) => {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

  if (isUuid) {
    // Try MangaDex
    try {
      console.log(`Fetching manga detail from MangaDex: ${id}`);
      const rawData = await mangadex.getMangaById(id);
      if (rawData?.data) {
        return adaptMangaDex(rawData.data);
      }
    } catch (err) {
      console.warn(`MangaDex fetch failed for UUID ${id}, trying Jikan via mapping...`);
    }

    // Try to find a Jikan mal_id mapped to this UUID
    const mappedMalId = uuidToMalId.get(id);
    if (mappedMalId) {
      try {
        console.log(`Fetching mapped Jikan ID: ${mappedMalId}`);
        const rawData = await jikan.getMangaById(mappedMalId);
        if (rawData?.data) {
          const adapted = adaptJikan(rawData.data);
          adapted.id = id; // Maintain the requesting ID!
          return adapted;
        }
      } catch (err) {
        console.warn(`Jikan fetch failed for mapped MAL ID ${mappedMalId}`);
      }
    }

    // Last resort: consistent local mock data select based on hash
    console.log(`Fallback: return consistent local manga for UUID ${id}`);
    const localItem = getMockMangaByUuid(id);
    const adapted = adaptLocal(localItem);
    adapted.id = id;
    return adapted;
  } else {
    // Numeric ID (Jikan / Mock ID)
    const malId = parseInt(id, 10);

    // If it's a small mock ID, we check mock data first to avoid Jikan rate limits on seed data
    if (malId >= 1 && malId <= 12) {
      const localItem = mockMangaData.find(m => m.mal_id === malId);
      if (localItem) {
        console.log(`Found ID ${malId} in local mock data`);
        return adaptLocal(localItem);
      }
    }

    // Try Jikan
    try {
      console.log(`Fetching details from Jikan: ${malId}`);
      const rawData = await jikan.getMangaById(malId);
      if (rawData?.data) {
        return adaptJikan(rawData.data);
      }
    } catch (err) {
      console.warn(`Jikan fetch failed for numeric ID ${id}, falling back to local...`);
    }

    // Fallback to local mock by index
    const localIdx = malId % mockMangaData.length;
    const localItem = mockMangaData[localIdx] || mockMangaData[0];
    const adapted = adaptLocal(localItem);
    adapted.id = String(id);
    adapted.mal_id = malId;
    return adapted;
  }
};

export const getMangaFeed = async (id) => {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

  if (isUuid) {
    try {
      console.log(`Fetching feed from MangaDex: ${id}`);
      const rawData = await mangadex.getMangaFeed(id);
      if (rawData?.data) {
        return rawData;
      }
    } catch (err) {
      console.warn(`MangaDex feed failed for UUID ${id}`);
    }
  }

  // Fallback: return mock chapters feed structured exactly like MangaDex
  console.log(`Fallback mock chapters for ID: ${id}`);
  const length = 20;
  const mockChapters = Array.from({ length }, (_, i) => ({
    id: `${id}-chapter-${i + 1}`,
    type: 'chapter',
    attributes: {
      volume: null,
      chapter: String(i + 1),
      title: `Chapter ${i + 1}`,
      translatedLanguage: 'en',
      publishAt: new Date().toISOString()
    }
  }));

  return {
    data: mockChapters
  };
};

export const getGenres = async () => {
  try {
    console.log('Fetching genres from Jikan...');
    const rawData = await jikan.getGenres();
    if (rawData?.data) {
      return rawData.data.map(g => ({
        mal_id: g.mal_id,
        name: g.name
      }));
    }
  } catch (err) {
    console.warn('Jikan genres fetch failed, using local fallback:', err.message);
  }

  // Extract from mock data
  const genresMap = new Map();
  mockMangaData.forEach(item => {
    if (item.genres) {
      item.genres.forEach(g => {
        genresMap.set(g.mal_id, g.name);
      });
    }
  });

  return Array.from(genresMap.entries()).map(([mal_id, name]) => ({
    mal_id,
    name
  }));
};
