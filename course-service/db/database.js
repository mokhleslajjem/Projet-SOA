const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'courses.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor TEXT NOT NULL,
    price REAL DEFAULT 0,
    category TEXT DEFAULT 'General',
    level TEXT DEFAULT 'beginner',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    enrolled_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id)
  );
`);

const { v4: uuidv4 } = require('uuid');
const count = db.prepare('SELECT COUNT(*) as c FROM courses').get();
if (count.c === 0) {
  const insert = db.prepare(
    'INSERT INTO courses (id, title, description, instructor, price, category, level) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insert.run(uuidv4(), 'Node.js Microservices', 'Apprendre les microservices avec Node.js', 'Dr. Gontara', 49.99, 'Backend', 'intermediate');
  insert.run(uuidv4(), 'React Avancé', 'Maîtriser React avec hooks et patterns avancés', 'Prof. Ahmed', 39.99, 'Frontend', 'advanced');
  insert.run(uuidv4(), 'Docker & Kubernetes', 'Conteneurisation et orchestration', 'Eng. Sami', 59.99, 'DevOps', 'intermediate');
  console.log('🌱 Cours exemples ajoutés');
}

console.log('✅ Course database initialized');
module.exports = db;