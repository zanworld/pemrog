// ============================================================
// Route chapter — mengambil daftar halaman dari MangaDex @Home API
// ============================================================
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Fallback UUID for mock chapters (so we can test real images without real manga UUIDs)
const FALLBACK_CHAPTER_UUID = '250f091f-4166-4831-9f45-89ff54bf433b';

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
    res.status(502).json({ success: false, message: 'Gagal mengambil halaman chapter' });
  }
});

export default router;
