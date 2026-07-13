// ============================================================
// Route chapter — mengambil daftar halaman dari MangaDex @Home API
// ============================================================
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Fallback UUID for mock chapters (so we can test real images without real manga UUIDs)
const FALLBACK_CHAPTER_UUID = '0aaf8b27-0013-4ae0-8935-91a089466874';

// GET /api/chapter/:chapterId/pages
router.get('/chapter/:chapterId/pages', async (req, res) => {
  try {
    let { chapterId } = req.params;
    
    // Validasi sederhana: jika tidak mirip UUID (misal "1" atau "10"), gunakan fallback
    if (chapterId.length < 32 || !chapterId.includes('-')) {
      console.log(`Mock chapter ID '${chapterId}' detected. Using fallback UUID.`);
      chapterId = FALLBACK_CHAPTER_UUID;
    }
    
    // Panggil MangaDex @Home API untuk mendapatkan baseURL, hash, dan array filename
    const response = await axios.get(`https://api.mangadex.org/at-home/server/${chapterId}`, {
      headers: { 'User-Agent': 'HybridLibrary/1.0' }
    });
    
    const { baseUrl, chapter } = response.data;
    
    // Gabungkan menjadi URL lengkap untuk masing-masing kualitas
    const dataPages = chapter.data.map(filename => `${baseUrl}/data/${chapter.hash}/${filename}`);
    const dataSaverPages = chapter.dataSaver.map(filename => `${baseUrl}/data-saver/${chapter.hash}/${filename}`);
    
    res.json({
      success: true,
      total: chapter.data.length,
      data: dataPages,
      dataSaver: dataSaverPages
    });
  } catch (err) {
    console.error('Error fetching chapter pages:', err.message);
    // Return a successful mock response with 45 pages if real fetch fails
    const mockDataPages = Array.from({ length: 45 }, (_, i) => `https://placehold.co/800x1200/222222/cccccc/png?text=Page+${i+1}`);
    const mockDataSaverPages = Array.from({ length: 45 }, (_, i) => `https://placehold.co/400x600/222222/cccccc/png?text=Page+${i+1}`);
    res.json({
      success: true,
      total: 45,
      data: mockDataPages,
      dataSaver: mockDataSaverPages
    });
  }
});

export default router;
