import express from 'express';
import { mockMangaData } from '../../src/mockMangaData.js';

const router = express.Router();

router.get('/manga', (req, res) => {
  const { q, genres, status, order_by = 'popularity', sort = 'asc', page = 1, limit = 12 } = req.query;
  
  let result = [...mockMangaData];
  
  if (q) {
    const searchStr = q.toLowerCase().trim();
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
  
  // Sort
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
  
  // Pagination
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
        per_page: parsedLimit
      }
    }
  });
});

router.get('/manga/:id', (req, res) => {
  const mangaId = parseInt(req.params.id, 10);
  const manga = mockMangaData.find(m => m.mal_id === mangaId);
  
  if (manga) {
    res.status(200).json({ data: manga });
  } else {
    res.status(404).json({ message: "Manga not found" });
  }
});

export default router;
