const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByUsername, upsertUsers, readDb } = require('./db');

const JWT_SECRET = process.env.PHARMDASH_JWT_SECRET || 'pharmdash-dev-secret-change-in-production';
const JWT_EXPIRES = process.env.PHARMDASH_JWT_EXPIRES || '7d';

const SEED_USERS = [
  { username: 'elsayed', password: 'pharma2026', name: 'Dr. Elsayed Hassan', role: 'مدير تطوير الأعمال' },
  { username: 'admin', password: 'admin123', name: 'Admin', role: 'مدير النظام' },
  { username: 'manager', password: 'manager123', name: 'المدير', role: 'مدير قطاع الصيدليات' }
];

async function seedUsersIfNeeded() {
  const db = readDb();
  if (db.users && db.users.length > 0) return;
  const users = [];
  for (const u of SEED_USERS) {
    users.push({
      username: u.username,
      passwordHash: await bcrypt.hash(u.password, 10),
      name: u.name,
      role: u.role
    });
  }
  upsertUsers(users);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function authenticate(username, password) {
  const user = getUserByUsername(String(username || '').trim().toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
  if (!ok) return null;
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    token: signToken(user)
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = verifyToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  seedUsersIfNeeded,
  authenticate,
  authMiddleware,
  signToken
};
