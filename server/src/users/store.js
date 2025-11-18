const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const Database = require("better-sqlite3");
const { hashPassword } = require("../utils/password");
const config = require("../config");

let db;

const ensureDirectory = () => {
  const dir = path.dirname(config.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const initUserStore = () => {
  ensureDirectory();
  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();

  const existing = db.prepare("SELECT COUNT(1) as total FROM users").get();
  if (existing.total === 0 && config.defaultAdmin?.username && config.defaultAdmin?.password) {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)"
    ).run(
      randomUUID(),
      config.defaultAdmin.username,
      hashPassword(config.defaultAdmin.password),
      now
    );
    console.log(`Seeded default teacher account: ${config.defaultAdmin.username}`);
  }
};

const getUserByUsername = (username) =>
  db.prepare("SELECT * FROM users WHERE username = ?").get(username);

const createUser = (username, password) => {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, username, hashPassword(password), now);
  return { id, username, created_at: now };
};

module.exports = {
  initUserStore,
  getUserByUsername,
  createUser
};