const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.join(__dirname, '..', 'PharmaDash_Pro_offline_3.html');
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(FILE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // seed sales via localStorage so the rxsales screen has content to show the theme
  await page.evaluate(() => {
    try {
      const entries = [
        { date:'2026-07-05', pharmacy:'صيدلية 1', branch:'T1', product:'reflex', units:6, unitPrice:40, unitCost:22, prescriptions:0 },
        { date:'2026-07-12', pharmacy:'صيدلية 1', branch:'T1', product:'oracure', units:5, unitPrice:30, unitCost:18, prescriptions:0 }
      ];
      localStorage.setItem('pharmaDash.sales.v1', JSON.stringify({ entries, loadedAt:Date.now(), fileName:'sales.json', invalid:0 }));
    } catch(e) {}
  });

  // LIGHT — overview (landing)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'light-overview.png') });

  // open rxsales screen (light)
  await page.evaluate(() => { const b=document.querySelector('.nav-item[data-k="rxsales"]'); if(b) b.click(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'light-rxsales.png') });

  // DARK — toggle theme
  await page.evaluate(() => { const t=document.getElementById('themeToggle'); if(t) t.click(); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'dark-rxsales.png') });
  await page.evaluate(() => { const b=document.querySelector('.nav-item[data-k="overview"]'); if(b) b.click(); });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, 'dark-overview.png') });

  await browser.close();
  console.log('shots written to', OUT);
})().catch(e => { console.error(e); process.exit(1); });
