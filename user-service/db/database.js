// eLearning-platform/user-service/db/database.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'users.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    createdAt TEXT NOT NULL
  )
`);

function insertUser({ id, name, email, password, role, createdAt }) {
  db.prepare(
    'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, password, role || 'student', createdAt);
  return getUserById(id);
}

function getUserById(id) {
  const row = db.prepare(
    'SELECT id, name, email, role, createdAt FROM users WHERE id = ?'
  ).get(id);
  return row || null;
}

function updateUser(id, name, email) {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return null;
  const newName = name || existing.name;
  const newEmail = email || existing.email;
  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(newName, newEmail, id);
  return getUserById(id);
}

function deleteUser(id) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

function listUsers() {
  return db.prepare(
    'SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt DESC'
  ).all();
}

module.exports = {
  db,
  insertUser,
  getUserById,
  updateUser,
  deleteUser,
  listUsers
};
