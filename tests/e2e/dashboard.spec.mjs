import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const sampleRows = [
  { doctor: 'Dr. Ahmed', service: 'REFLEX MASSAGE Emulgel 100ML', section: 'ORTHOPAEDIC', patient: 'P1', patientName: 'Patient 1', orderNo: 'O1', status: 'Closed' },
  { doctor: 'Dr. Ahmed', service: 'ZINCOLIVE Syrup 150ML', section: 'ORTHOPAEDIC', patient: 'P2', patientName: 'Patient 2', orderNo: 'O2', status: 'Closed' },
  { doctor: 'Dr. Sara', service: 'CENTROZON WOMEN 30Tab', section: 'GYNECOLOGY', patient: 'P3', patientName: 'Patient 3', orderNo: 'O3', status: 'New' },
];

test.beforeEach(async ({ page }) => {
  await page.goto('/PharmaDash-v3-medical-ready.html');
  await page.evaluate(async () => {
    indexedDB.deleteDatabase('pharmdash');
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});

test('login, aggregate data, navigate and render product sections', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await expect(page.locator('#loginScreen')).toBeHidden();

  await page.evaluate((rows) => {
    setBranchData('T1', rows, 'مايو 2026.xlsx', '');
    STATE.active = 'T1';
    renderAll();
  }, sampleRows);

  await page.locator('[data-tab="pureherb"]').click();
  await expect(page.locator('#pureherb-content')).toContainText('Zincolive');
  await expect(page.locator('#pureherb-content')).toContainText('Dr. Ahmed');

  await page.locator('[data-tab="featured"]').click();
  await expect(page.locator('#panel-featured')).toContainText('Reflex');

  expect(errors).toEqual([]);
});

test('core utilities and IndexedDB snapshot are available in the generated file', async ({ page }) => {
  const result = await page.evaluate(async (rows) => {
    setBranchData('T1', rows, 'مايو 2026.xlsx', '');
    STATE.active = 'T1';
    await _idbPut(_IDB_KEY, _buildSnapshot());
    const snapshot = await _idbGet(_IDB_KEY);
    return {
      date: PharmaCore.periodDateScore('مايو 2026'),
      snapshotValid: PharmaCore.validateSnapshot(snapshot).valid,
      totalRows: STATE.data.T1.totalRows,
    };
  }, sampleRows);

  expect(result).toEqual({ date: 202605, snapshotValid: true, totalRows: 3 });
});

test('chooses the latest period chronologically and clears PHI from memory on logout', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  const latest = await page.evaluate((rows) => {
    const aprilRows = rows.slice(0, 1);
    const juneRows = [...rows, ...rows];
    STATE.periods.T1 = [
      { id: 10, label: 'يونيو 2026', rows: juneRows, data: aggregate(juneRows) },
      { id: 11, label: 'أبريل 2026', rows: aprilRows, data: aggregate(aprilRows) },
      { id: 12, label: 'مايو 2026', rows, data: aggregate(rows) },
    ];
    rebuildBranchFromPeriods('T1');
    const result = { reportName: STATE.data.T1.reportName, rows: STATE.data.T1.totalRows };
    doLogout();
    result.locked = STATE.data.T1 === null && STATE.periods.T1.length === 0;
    return result;
  }, sampleRows);

  expect(latest).toEqual({ reportName: 'يونيو 2026', rows: 6, locked: true });
  await expect(page.locator('#loginScreen')).toBeVisible();
});

test('creates an anonymized, credential-free share by default', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await page.evaluate((rows) => {
    setBranchData('T1', rows, 'مايو 2026.xlsx', '');
    STATE.active = 'T1';
  }, sampleRows);

  await expect(page.locator('#exportPrivacyMode')).toHaveValue('anonymized');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#shareBtn').click();
  const download = await downloadPromise;
  const html = await readFile(await download.path(), 'utf8');

  expect(download.suggestedFilename()).toContain('anonymized');
  expect(html).toContain('"anonymized":true');
  expect(html).toContain('const USERS = {}; /* credentials intentionally removed from shared file */');
  expect(html).not.toContain('Patient 1');
  expect(html).not.toContain('"patient":"P1"');
  expect(html).not.toContain('"orderNo":"O1"');
});

test('escapes uploaded text in printable visit cards', async ({ page }) => {
  const printed = await page.evaluate(() => {
    let html = '';
    const originalOpen = window.open;
    window.open = () => ({
      document: { write(value) { html = value; }, close() {} },
      print() {},
      set opener(_) {},
    });
    window._vcData = {
      x: { name: '<img src=x onerror=alert(1)>', section: '<script>bad()</script>', total: 1, uniqueDrugs: 1, patients: 1 },
      branch: 'T1',
      rank: 1,
      total: 1,
      plTotal: 1,
      plRows: [{ name: '<svg onload=alert(1)>', count: 1 }],
      opps: [],
      topDrugs: [{ name: '<iframe src=x>', count: 1 }],
    };
    printVisitCard();
    window.open = originalOpen;
    return html;
  });

  expect(printed).not.toContain('<img src=x');
  expect(printed).not.toContain('<script>bad()');
  expect(printed).not.toContain('<iframe src=x>');
  expect(printed).toContain('&lt;img');
});
