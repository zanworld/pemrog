import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Vercel serverless environment, the filesystem is read-only except for /tmp.
// We must place the database file in /tmp so it can be created and written to.
const isVercel = !!process.env.VERCEL;
const dataDir = isVercel ? '/tmp' : path.join(__dirname, 'data');

if (!isVercel && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to SQLite database
const dbPath = path.join(dataDir, 'hybrid.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Function to initialize database schema
export const initDB = () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    
    // Programmatic migration for reading_progress table if manga_id is INTEGER
    try {
      const tableInfo = db.prepare("PRAGMA table_info(reading_progress)").all();
      const mangaIdCol = tableInfo.find(col => col.name === 'manga_id');
      if (mangaIdCol && mangaIdCol.type.toUpperCase() === 'INTEGER') {
        console.log('🔄 Migrating reading_progress manga_id column to TEXT...');
        db.transaction(() => {
          // Backup existing data
          const tempExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reading_progress_backup'").get();
          if (tempExists) {
            db.exec("DROP TABLE reading_progress_backup");
          }
          db.exec("ALTER TABLE reading_progress RENAME TO reading_progress_backup");
          
          // Re-create table from updated schema
          db.exec(`
            CREATE TABLE reading_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                manga_id TEXT NOT NULL,
                chapter_id TEXT,
                last_page INTEGER,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, manga_id)
            );
          `);
          
          // Restore data with type casting to TEXT
          db.exec(`
            INSERT INTO reading_progress (id, user_id, manga_id, chapter_id, last_page, updated_at) 
            SELECT id, user_id, CAST(manga_id AS TEXT), chapter_id, last_page, updated_at 
            FROM reading_progress_backup
          `);
          
          // Drop backup
          db.exec("DROP TABLE reading_progress_backup");
        })();
        console.log('✅ reading_progress table migrated to TEXT successfully.');
      }
    } catch (migErr) {
      console.error('Error migrating reading_progress table:', migErr.message);
    }

    console.log('✅ Database schema initialized successfully.');
  } else {
    console.warn('⚠️ schema.sql not found. Skipping schema initialization.');
  }
};

export default db;
