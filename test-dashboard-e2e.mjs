import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname);
const HTML = path.join(ROOT, 'PharmaDash-v3-medical-ready.html');
const PDF = '/home/ubuntu/.cursor/projects/workspace/uploads/_____________________16-05-2026__a09f.pdf';
const PORT = 8765;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = req.url.split('?')[0];
      if (p === '/') p = '/PharmaDash-v3-medical-ready.html';
      const fp = path.join(ROOT, p.replace(/^\//, ''));
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) {
        res.writeHead(404); res.end('Not found'); return;
      }
      const ext = path.extname(fp);
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.pdf': 'application/pdf' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const errors = [];
  const checks = [];

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', e => errors.push('PAGE: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });

  try {
    await page.goto(`http://127.0.0.1:${PORT}/PharmaDash-v3-medical-ready.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#loginUser', { timeout: 15000 });

    // Login
    await page.fill('#loginUser', 'elsayed');
    await page.fill('#loginPass', 'pharma2026');
    await page.click('.login-btn');
    await page.waitForFunction(() => {
      const ls = document.getElementById('loginScreen');
      return ls && (ls.style.display === 'none' || getComputedStyle(ls).display === 'none');
    }, { timeout: 30000 });
    await page.waitForSelector('.app-shell', { timeout: 10000 });
    // Dismiss onboarding if shown
    await page.evaluate(() => { if (typeof closeOnboarding === 'function') closeOnboarding(true); });
    checks.push('Login OK');

    // Upload PDF to T1
    const fileInput = page.locator('#file-T1');
    await fileInput.setInputFiles(PDF);

    // Wait for upload toast / branch meta update
    await page.waitForFunction(() => {
      const meta = document.getElementById('meta-T1');
      return meta && meta.textContent.includes('وصفة');
    }, { timeout: 120000 });
    checks.push('PDF upload parsed');

    const metaT1 = await page.locator('#meta-T1').textContent();
    checks.push('Meta: ' + metaT1.trim().slice(0, 80));

    // Overview should have KPI content
    await page.waitForFunction(() => {
      const el = document.getElementById('overview-content');
      return el && el.textContent.length > 200 && !el.textContent.includes('ارفع أول ملف');
    }, { timeout: 15000 });
    checks.push('Overview rendered');

    const overviewText = await page.locator('#overview-content').innerText();
    if (overviewText.includes('4304') || overviewText.match(/\d[\d,]{2,}/)) checks.push('Overview has numeric KPIs');
    else errors.push('Overview missing expected counts');

    // Doctors tab badge
    const docBadge = await page.locator('#sb-badge-doctors').textContent();
    checks.push('Doctors badge: ' + docBadge.trim());
    if (parseInt(docBadge) < 5) errors.push('Doctors badge too low: ' + docBadge);

    // Navigate doctors
    await page.click('[data-tab="doctors"]');
    await page.waitForTimeout(800);
    const doctorsContent = await page.locator('#doctors-content').innerText();
    if (doctorsContent.length > 100) checks.push('Doctors section OK');
    else errors.push('Doctors section empty');

    // Smart insights
    await page.click('[data-tab="smartinsights"]');
    await page.waitForFunction(() => {
      const el = document.getElementById('smartinsights-content');
      return el && el.querySelector('.si-health-val');
    }, { timeout: 15000 });
    const healthScore = await page.locator('.si-health-val span').first().textContent();
    checks.push('Smart Insights health score: ' + healthScore);
    const actions = await page.locator('.si-action').count();
    checks.push('Smart Insights actions: ' + actions);

    // Trends
    await page.click('[data-tab="trends"]');
    await page.waitForTimeout(800);
    const trendsText = await page.locator('#trends-content').innerText();
    if (trendsText.includes('طبيب') || trendsText.includes('doctor') || trendsText.includes('13')) checks.push('Trends section OK');
    else errors.push('Trends section unexpected: ' + trendsText.slice(0, 100));

    // Global search
    await page.fill('#globalSearch', 'Paracetamol');
    await page.waitForTimeout(400);
    const searchOpen = await page.locator('#searchDropdown.open').count();
    if (searchOpen) checks.push('Global search works');
    else errors.push('Global search dropdown did not open');

    // Verify sync badge hidden (offline mode on http without api base - actually PDCloud might try health check)
    const syncDisplay = await page.locator('#syncBadge').evaluate(el => getComputedStyle(el).display);
    checks.push('Sync badge display: ' + syncDisplay);
    if (syncDisplay !== 'none') errors.push('Sync badge should be hidden in offline mode');

    // Extract STATE via page evaluate
    const stateSummary = await page.evaluate(() => {
      const loaded = ['T1','T2','T3'].filter(b => STATE.data[b]);
      if (!loaded.length) return null;
      const d = STATE.data['T1'];
      return {
        rows: d.totalRows,
        doctors: d.doctors.length,
        drugs: d.drugs.length,
        sections: d.sections.length,
        patients: d.totalPatients,
        status: d.statusCounts,
        topDoc: d.doctors[0]?.name,
        topDrug: d.drugs[0]?.name?.slice(0, 40)
      };
    });
    checks.push('STATE: ' + JSON.stringify(stateSummary));

    if (!stateSummary || stateSummary.rows !== 4304) errors.push('Expected 4304 rows, got ' + (stateSummary?.rows || 0));
    if (stateSummary && stateSummary.doctors !== 13) errors.push('Expected 13 doctors, got ' + stateSummary.doctors);

  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=== CHECKS ===');
  checks.forEach(c => console.log('✓', c));
  if (errors.length) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log('✗', e));
    process.exit(1);
  }
  console.log('\n=== BROWSER E2E: PASS ✓ ===');
}

main().catch(e => { console.error(e); process.exit(2); });
