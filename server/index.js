const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticate, authMiddleware, seedUsersIfNeeded } = require('./auth');
const { getUserSettings, setUserSetting, setUserSettingsBulk } = require('./db');

const PORT = process.env.PORT || 3847;
const ROOT = path.join(__dirname, '..');

const SYNC_KEYS = new Set([
  'pharmdash_agedmeds_v1',
  'pharmdash_ph_target_v1',
  'pharmdash_pl_target_v1',
  'pharmdash_pl_amounts_v1',
  'pharmdash_lang_v1',
  'pharmdash_onboard_v1_done',
  'pharmdash_comp_custom_v1',
  'rx-theme',
  'rx-density',
  'rx-calm'
]);

async function main() {
  await seedUsersIfNeeded();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, version: '4.0.0', service: 'PharmaDash Cloud API' });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body || {};
      const result = await authenticate(username, password);
      if (!result) return res.status(401).json({ error: 'Invalid credentials' });
      res.json({
        token: result.token,
        user: { username: result.username, name: result.name, role: result.role }
      });
    } catch (e) {
      res.status(500).json({ error: e.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({
      username: req.user.sub,
      name: req.user.name,
      role: req.user.role
    });
  });

  app.get('/api/settings', authMiddleware, (req, res) => {
    const settings = getUserSettings(req.user.sub);
    res.json({ settings, updatedAt: settings._updatedAt || null });
  });

  app.put('/api/settings/:key', authMiddleware, (req, res) => {
    const key = req.params.key;
    if (!SYNC_KEYS.has(key)) {
      return res.status(400).json({ error: 'Key not allowed for sync', allowed: [...SYNC_KEYS] });
    }
    const value = req.body && Object.prototype.hasOwnProperty.call(req.body, 'value')
      ? req.body.value
      : req.body;
    const settings = setUserSetting(req.user.sub, key, value);
    res.json({ ok: true, key, updatedAt: settings._updatedAt });
  });

  app.put('/api/settings', authMiddleware, (req, res) => {
    const incoming = (req.body && req.body.settings) || {};
    const filtered = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (SYNC_KEYS.has(k)) filtered[k] = v;
    }
    const settings = setUserSettingsBulk(req.user.sub, filtered);
    res.json({ ok: true, count: Object.keys(filtered).length, updatedAt: settings._updatedAt });
  });

  app.use(express.static(ROOT, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  app.get('/', (_req, res) => {
    res.redirect('/PharmaDash-v3-medical-ready.html');
  });

  app.listen(PORT, () => {
    console.log(`PharmaDash Cloud API v4 running on http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/PharmaDash-v3-medical-ready.html`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
