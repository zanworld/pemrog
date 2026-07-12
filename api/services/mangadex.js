import axios from 'axios';

const MANGADEX_BASE_URL = 'https://api.mangadex.org';

const client = axios.create({
  baseURL: MANGADEX_BASE_URL,
  timeout: 5000, // 5 seconds timeout
});

// Mapping from Jikan/Mock Genre ID (integer) to MangaDex Tag UUID
export const GENRE_MAP_MAL_TO_MD = {
  1: '391b0423-db2f-4837-87bb-85d51870f194',  // Action
  2: '87cc8738-96f1-4326-a0d0-aa22fe350c72',  // Adventure
  4: '4d8728a5-dd9e-4d52-a3b7-94f1772624df',  // Comedy
  8: 'b9cafd37-773b-4310-bac7-5392b3c29dba',  // Drama
  10: 'cdc58593-397d-4150-b213-74566f4e8e3c', // Fantasy
  22: '423e2eae-9779-41b4-96fd-8b1e193a5217', // Romance
  24: '256c8064-7c8f-4efc-80db-b101750b9a1c', // Sci-Fi
  36: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9', // Slice of Life
  37: 'e64f6763-cbf9-472e-a5e9-fd5b27e22548', // Supernatural
  7: 'ee96339f-2c68-4a30-85f4-7d54ee22c547',  // Mystery
  30: '69977b5c-a22f-47b0-b78b-d1c13143d477', // Sports
  45: '18bce068-23c5-4ab8-85dd-d2c60d84f2cc', // Suspense (Thriller)
};

// Reverse mapping for adapter
export const GENRE_MAP_MD_TO_MAL = Object.fromEntries(
  Object.entries(GENRE_MAP_MAL_TO_MD).map(([malId, mdUuid]) => [mdUuid, parseInt(malId, 10)])
);

export const searchManga = async (query = '', limit = 12, page = 1, genres = '', status = '', order_by = 'popularity', sort = 'asc') => {
  const offset = (page - 1) * limit;
  
  const params = {
    limit,
    offset,
    'includes[]': ['cover_art', 'author'],
  };

  if (query) {
    params.title = query;
  }

  // Handle genres filtering
  if (genres) {
    const malGenreIds = genres.split(',').map(id => parseInt(id.trim(), 10));
    const mdTags = malGenreIds
      .map(id => GENRE_MAP_MAL_TO_MD[id])
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
      'upcoming': 'hiatus', // closed / hiatus / etc.
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
