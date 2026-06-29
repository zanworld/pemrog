// ============================================================
// Proxy gambar — meneruskan (stream) gambar halaman chapter dari
// server MangaDex@Home ke browser. Diperlukan karena MangaDex
// tidak mengizinkan hotlink gambar langsung dari browser.
// ============================================================
import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/manga-image?url=<url gambar MangaDex@Home>
router.get('/manga-image', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).json({ message: 'Parameter url wajib diisi' });

  // Validasi sederhana untuk mencegah penyalahgunaan (SSRF):
  // hanya izinkan https dan path gambar chapter MangaDex (/data/ atau /data-saver/).
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ message: 'URL tidak valid' });
  }
  if (parsed.protocol !== 'https:' || !/\/(data|data-saver)\//.test(parsed.pathname)) {
    return res.status(400).json({ message: 'URL bukan halaman chapter MangaDex' });
  }

  try {
    const upstream = await axios.get(target, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: { 'User-Agent': 'HybridLibrary/1.0 (Tugas Pemrograman Web - Amikom)' },
    });
    res.set('Content-Type', upstream.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(upstream.data));
  } catch (err) {
    console.error('image proxy error:', err.message);
    res.status(502).json({ message: 'Gagal memuat gambar' });
  }
});

export default router;
