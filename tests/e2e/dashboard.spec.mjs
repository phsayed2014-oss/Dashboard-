import { expect, test } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

test('extracts a text PDF and shows its data-quality report', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  const temp = await mkdtemp(join(tmpdir(), 'pharmadash-pdf-'));
  const pdfPath = join(temp, 'oracle-sample.pdf');
  const pdfPage = await page.context().newPage();
  try {
    await pdfPage.setContent(`
      <style>
        @page { margin: 0; size: 1200px 800px; }
        body { margin: 0; font: 14px Arial; }
        span { position: absolute; white-space: nowrap; }
      </style>
      <span style="left:20px;top:40px">Patient No</span>
      <span style="left:130px;top:40px">Patient Name</span>
      <span style="left:360px;top:40px">Service Name</span>
      <span style="left:680px;top:40px">Order No</span>
      <span style="left:780px;top:40px">Status</span>
      <span style="left:880px;top:40px">Doctor Name</span>
      <span style="left:20px;top:100px">12345</span>
      <span style="left:130px;top:100px">Patient One</span>
      <span style="left:360px;top:100px">ZINCOLIVE Syrup 150ML</span>
      <span style="left:680px;top:100px">O100</span>
      <span style="left:780px;top:100px">Closed</span>
      <span style="left:880px;top:100px">Dr Ahmed ORTHOPAEDIC</span>
      <span style="left:20px;top:160px">P12A</span>
      <span style="left:130px;top:160px">Patient Two</span>
      <span style="left:360px;top:160px">REFLEX MASSAGE Emulgel 100ML</span>
      <span style="left:680px;top:160px">O101</span>
      <span style="left:780px;top:160px">Closed</span>
      <span style="left:880px;top:160px">Dr Sara GENERAL</span>
    `);
    await pdfPage.pdf({ path: pdfPath, width: '1200px', height: '800px', printBackground: true });
    await pdfPage.close();

    await page.locator('#file-T1').setInputFiles(pdfPath);
    await expect(page.locator('#meta-T1')).toContainText('2 وصفة');
    await expect(page.locator('#dataQualityPanel')).toBeVisible();
    await expect(page.locator('#dataQualityPanel')).toContainText('PDF');

    const extracted = await page.evaluate(() => STATE.data.T1.rows);
    expect(extracted[0]).toMatchObject({
      patient: '12345',
      service: 'ZINCOLIVE Syrup 150ML',
      doctor: 'Dr Ahmed',
      section: 'ORTHOPAEDIC',
      status: 'Closed',
    });
    expect(extracted[1]).toMatchObject({
      patient: 'P12A',
      service: 'REFLEX MASSAGE Emulgel 100ML',
      doctor: 'Dr Sara',
      section: 'GENERAL',
    });
  } finally {
    await pdfPage.close().catch(() => {});
    await rm(temp, { recursive: true, force: true });
  }
});

test('seals saved snapshots and refuses tampered local data', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  const integrity = await page.evaluate(async (rows) => {
    setBranchData('T1', rows, 'مايو 2026.xlsx', '');
    STATE.active = 'T1';
    await saveData({ immediate: true });
    await flushSaveData();
    const snapshot = await _idbGet(_IDB_KEY);
    return snapshot.integrity;
  }, sampleRows);
  expect(integrity).toMatchObject({ algorithm: 'SHA-256' });
  expect(integrity.digest).toHaveLength(64);
  await expect(page.locator('#saveStatus')).toHaveAttribute('data-state', 'saved');

  await page.evaluate(async () => {
    const snapshot = await _idbGet(_IDB_KEY);
    snapshot.periods.T1[0].rows[0].doctor = 'Tampered';
    await _idbPut(_IDB_KEY, snapshot);
  });
  await page.reload();
  await expect(page.locator('#saveStatus')).toHaveAttribute('data-state', 'error');
  const restored = await page.evaluate(() => STATE.data.T1);
  expect(restored).toBeNull();
});

test('paginates large tables and searches the cached index', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await page.evaluate(() => {
    const rows = Array.from({ length: 450 }, (_, index) => ({
      doctor: `Doctor ${String(index).padStart(3, '0')}`,
      service: `Drug ${index % 20}`,
      section: 'GENERAL',
      patient: `P${index}`,
      patientName: '',
      orderNo: `O${index}`,
      status: 'Closed',
    }));
    setBranchData('T1', rows, 'large.csv', '');
    STATE.active = 'T1';
    renderAll();
  });

  await page.locator('[data-tab="doctors"]').click();
  await expect(page.locator('#docTbl tr')).toHaveCount(200);
  await page.locator('#docMore').click();
  await expect(page.locator('#docTbl tr')).toHaveCount(400);
  await page.locator('#docSearch').fill('Doctor 449');
  await expect(page.locator('#docTbl tr')).toHaveCount(1);
  await expect(page.locator('#docTbl')).toContainText('Doctor 449');
});

test('rolls back the whole snapshot when one branch cannot be restored', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  const result = await page.evaluate(async () => {
    lockInMemoryData();
    await _idbPut(_IDB_KEY, {
      v: 2,
      active: 'T1',
      periods: {
        T1: [{ id: 1, label: 'مايو 2026', rows: [{ doctor: 'Dr Good', service: 'Drug A' }] }],
        T2: [{ id: 2, label: 'مايو 2026', rows: [{ doctor: 'FAIL', service: 'Drug B' }] }],
        T3: [],
      },
      dt: {},
    });
    const originalAggregate = aggregateAsync;
    aggregateAsync = async (rows, onProgress) => {
      if (rows[0]?.doctor === 'FAIL') throw new Error('forced restore failure');
      return originalAggregate(rows, onProgress);
    };
    try {
      const restored = await loadSavedData();
      return {
        restored,
        dataEmpty: STATE.data.T1 === null && STATE.data.T2 === null,
        periodsEmpty: STATE.periods.T1.length === 0 && STATE.periods.T2.length === 0,
      };
    } finally {
      aggregateAsync = originalAggregate;
    }
  });

  expect(result).toEqual({ restored: false, dataEmpty: true, periodsEmpty: true });
  await expect(page.locator('#saveStatus')).toHaveAttribute('data-state', 'error');
});

test('enforces upload limits in daily tracking', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  await page.evaluate(() => dtOpenUpload('2026-07-09'));
  await page.evaluate(async () => {
    await dtHandleFile({
      name: 'oversized.csv',
      size: PharmaCore.MAX_UPLOAD_BYTES + 1,
    });
  });

  await expect(page.locator('#dtUpError')).toContainText('50MB');
  const stored = await page.evaluate(() => DT.store['2026-07-09']);
  expect(stored).toBeUndefined();
});

test('destroys the bar chart when switching to the doctor bubble view', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await page.evaluate((rows) => {
    setBranchData('T1', rows, 'مايو 2026.xlsx', '');
    STATE.active = 'T1';
    renderAll();
  }, sampleRows);
  await page.waitForFunction(() => Boolean(charts.cTopDocs));

  const bubble = page.locator('.vt-btn', { hasText: 'فقاعات' });
  const bar = page.locator('.vt-btn', { hasText: 'بار' });
  for (let index = 0; index < 3; index += 1) {
    await bubble.click();
    expect(await page.evaluate(() => Boolean(charts.cTopDocs))).toBe(false);
    await bar.click();
    await page.waitForFunction(() => Boolean(charts.cTopDocs));
  }
  expect(await page.evaluate(() => Object.keys(charts).filter((key) => key === 'cTopDocs'))).toEqual(['cTopDocs']);
});
