const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'pharmdash.json');

const DEFAULT_DB = {
  users: [],
  settings: {}
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return structuredClone(DEFAULT_DB);
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function getUserByUsername(username) {
  const db = readDb();
  return db.users.find(u => u.username === username) || null;
}

function getUserSettings(username) {
  const db = readDb();
  return db.settings[username] || {};
}

function setUserSetting(username, key, value) {
  const db = readDb();
  if (!db.settings[username]) db.settings[username] = {};
  db.settings[username][key] = value;
  db.settings[username]._updatedAt = new Date().toISOString();
  writeDb(db);
  return db.settings[username];
}

function setUserSettingsBulk(username, settings) {
  const db = readDb();
  if (!db.settings[username]) db.settings[username] = {};
  Object.assign(db.settings[username], settings);
  db.settings[username]._updatedAt = new Date().toISOString();
  writeDb(db);
  return db.settings[username];
}

function upsertUsers(users) {
  const db = readDb();
  db.users = users;
  writeDb(db);
}

module.exports = {
  readDb,
  writeDb,
  getUserByUsername,
  getUserSettings,
  setUserSetting,
  setUserSettingsBulk,
  upsertUsers,
  DB_FILE
};
