import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-hybrid-library';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    // Auto-restore user row in SQLite if missing (handles serverless DB resets seamlessly)
    try {
      if (user && user.id) {
        const userId = user.id;
        const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!exists) {
          db.prepare('INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)')
            .run(userId, user.name || 'Restored User', user.email || `user_${userId}@example.com`, 'restored-session-dummy-hash');
          console.log(`♻️ Auto-restored missing user row for ID: ${userId} in SQLite database.`);
        }
      }
    } catch (dbErr) {
      console.error('Error during auto-restoring user session in middleware:', dbErr);
    }

    req.user = user; // Set user from payload
    next();
  });
};
