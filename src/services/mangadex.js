import axios from 'axios';

// Manga details from backend proxy
export const getMangaDetail = async (id) => {
  const response = await axios.get(`/api/manga/${id}`);
  return response.data;
};

// Manga chapter feed from backend proxy
export const getMangaFeed = async (id) => {
  const response = await axios.get(`/api/manga/${id}/feed`);
  return response.data;
};

// Reviews list for a specific manga
export const getReviews = async (mangaId) => {
  const response = await axios.get('/api/reviews', {
    params: { manga_id: mangaId }
  });
  return response.data;
};

// Post a new review or update a rating
export const postReview = async ({ mangaId, rating, comment }) => {
  const response = await axios.post('/api/reviews', {
    manga_id: mangaId,
    rating,
    comment
  });
  return response.data;
};
