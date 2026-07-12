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
    console.log('✅ Database schema initialized successfully.');
  } else {
    console.warn('⚠️ schema.sql not found. Skipping schema initialization.');
  }
};

export default db;
