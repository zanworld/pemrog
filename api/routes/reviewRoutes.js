import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET reviews by manga_id
router.get('/', (req, res) => {
  const { manga_id } = req.query;

  if (!manga_id) {
    return res.status(400).json({ success: false, message: 'manga_id is required' });
  }

  try {
    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.manga_id = ?
      ORDER BY r.created_at DESC
    `).all(manga_id);

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      name: r.user_name,
      text: r.comment || '',
      date: new Date(r.created_at + ' UTC').toISOString(),
      rating: r.rating
    }));

    res.json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST new review or update rating
router.post('/', authenticateToken, (req, res) => {
  const { manga_id, rating, comment } = req.body;
  const userId = req.user.id;

  if (!manga_id) {
    return res.status(400).json({ success: false, message: 'manga_id is required' });
  }

  try {
    // If it's only a rating update (no comment)
    if (rating !== undefined && comment === undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }

      // Check if user already has a review for this manga
      const existingReview = db.prepare(
        'SELECT id FROM reviews WHERE user_id = ? AND manga_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(userId, manga_id);

      if (existingReview) {
        db.prepare('UPDATE reviews SET rating = ? WHERE id = ?').run(rating, existingReview.id);
        return res.json({ success: true, message: 'Rating updated successfully' });
      } else {
        db.prepare('INSERT INTO reviews (user_id, manga_id, rating) VALUES (?, ?, ?)')
          .run(userId, manga_id, rating);
        return res.json({ success: true, message: 'Rating saved successfully' });
      }
    }

    // If it's a new review comment (optionally with rating)
    const ratingValue = rating !== undefined ? rating : null;
    if (ratingValue !== null && (ratingValue < 1 || ratingValue > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const result = db.prepare(
      'INSERT INTO reviews (user_id, manga_id, rating, comment) VALUES (?, ?, ?, ?)'
    ).run(userId, manga_id, ratingValue, comment || null);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review: {
        id: result.lastInsertRowid,
        name: req.user.name,
        text: comment || '',
        date: new Date().toISOString(),
        rating: ratingValue
      }
    });
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
