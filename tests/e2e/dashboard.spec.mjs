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
    const sensitiveRows = rows.map((row, index) => ({ ...row, nationalId: index === 0 ? 'SECRET-NATIONAL-ID' : '' }));
    setBranchData('T1', sensitiveRows, 'Patient 1 private report.xlsx', '');
    STATE.active = 'T1';
    localStorage.setItem('pharmdash_pl_target_v1', JSON.stringify({ target: 77777, achieved: 123, month: 'مايو 2026', currency: 'ريال' }));
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
  expect(html).not.toContain('SECRET-NATIONAL-ID');
  expect(html).toContain('"target":77777');
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
      <span style="left:20px;top:40px">Patient</span>
      <span style="left:76px;top:40px">No</span>
      <span style="left:130px;top:40px">Patient Name</span>
      <span style="left:360px;top:40px">Service Name</span>
      <span style="left:680px;top:40px">Order No</span>
      <span style="left:780px;top:40px">Status</span>
      <span style="left:880px;top:40px">Doctor</span>
      <span style="left:940px;top:40px">Name</span>
      <span style="left:20px;top:100px">12345</span>
      <span style="left:130px;top:100px">Patient One</span>
      <span style="left:360px;top:100px">ZINCOLIVE Syrup</span>
      <span style="left:680px;top:100px">O100</span>
      <span style="left:780px;top:100px">Closed</span>
      <span style="left:880px;top:100px">Dr Ahmed ORTHOPAEDIC</span>
      <span style="left:360px;top:116px">150ML</span>
      <span style="left:20px;top:160px">P12A</span>
      <span style="left:130px;top:160px">Patient Two</span>
      <span style="left:360px;top:160px">REFLEX MASSAGE Emulgel 100ML</span>
      <span style="left:680px;top:160px">O101</span>
      <span style="left:780px;top:160px">Closed</span>
      <span style="left:880px;top:160px">Dr Sara GENERAL</span>
      <span style="left:20px;top:220px">١٢٣</span>
      <span style="left:130px;top:220px">Patient Three</span>
      <span style="left:360px;top:220px">Drug C</span>
      <span style="left:680px;top:220px">O102</span>
      <span style="left:780px;top:220px">Closed</span>
      <span style="left:880px;top:220px">Dr Vincent</span>
    `);
    await pdfPage.pdf({ path: pdfPath, width: '1200px', height: '800px', printBackground: true });
    await pdfPage.close();

    await page.locator('#file-T1').setInputFiles(pdfPath);
    await expect(page.locator('#meta-T1')).toContainText('3 وصفة');
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
    expect(extracted[2]).toMatchObject({
      patient: '123',
      service: 'Drug C',
      doctor: 'Dr Vincent',
      section: '',
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

test('classifies doctor trends from the oldest and newest dated periods', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await page.evaluate(() => {
    const oldRows = [
      { doctor: 'Dr Growth', service: 'Drug A', section: 'GENERAL', patient: '1', status: 'Closed' },
      { doctor: 'Dr Lost', service: 'Drug B', section: 'GENERAL', patient: '2', status: 'Closed' },
    ];
    const newRows = [
      { doctor: 'Dr Growth', service: 'Drug A', section: 'GENERAL', patient: '3', status: 'Closed' },
      { doctor: 'Dr Growth', service: 'Drug A', section: 'GENERAL', patient: '4', status: 'Closed' },
      { doctor: 'Dr Growth', service: 'Drug C', section: 'GENERAL', patient: '5', status: 'Closed' },
      { doctor: 'Dr New', service: 'Drug D', section: 'GENERAL', patient: '6', status: 'Closed' },
    ];
    STATE.periods.T1 = [
      { id: 2, label: 'يونيو 2026', rows: newRows, data: aggregate(newRows) },
      { id: 1, label: 'أبريل 2026', rows: oldRows, data: aggregate(oldRows) },
      { id: 3, label: 'oracle-report', rows: [], data: aggregate([]) },
    ];
    rebuildBranchFromPeriods('T1');
    STATE.active = 'T1';
    renderAll();
  });

  await page.locator('[data-tab="trends"]').click();
  await expect(page.locator('#trends-content')).toContainText('أبريل 2026');
  await expect(page.locator('#trends-content')).toContainText('يونيو 2026');
  await expect(page.locator('#trends-content')).toContainText('Dr Growth');
  await expect(page.locator('#trends-content')).toContainText('200.0%');
  await expect(page.locator('#trends-content')).toContainText('Dr New');
  await expect(page.locator('#trends-content')).toContainText('طبيب جديد');
  await expect(page.locator('#trends-content')).toContainText('Dr Lost');
  await expect(page.locator('#trends-content')).toContainText('متوقف');
});

test('does not commit a branch upload after data is locked', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  const result = await page.evaluate(async (rows) => {
    const original = parseCSV;
    let finish;
    parseCSV = () => new Promise((resolve) => { finish = resolve; });
    try {
      const pending = handleFile('T1', { name: 'deferred.csv', size: 20 });
      while (!finish) await new Promise((resolve) => setTimeout(resolve, 10));
      lockInMemoryData();
      finish(rows);
      await pending;
      return {
        data: STATE.data.T1,
        periods: STATE.periods.T1.length,
      };
    } finally {
      parseCSV = original;
    }
  }, sampleRows);

  expect(result).toEqual({ data: null, periods: 0 });
});

test('cancels a hidden daily upload when its modal closes', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();

  const stored = await page.evaluate(async (rows) => {
    dtOpenUpload('2026-07-09');
    const original = parseCSV;
    let finish;
    parseCSV = () => new Promise((resolve) => { finish = resolve; });
    try {
      const pending = dtHandleFile({ name: 'deferred.csv', size: 20 });
      while (!finish) await new Promise((resolve) => setTimeout(resolve, 0));
      closeModal();
      finish(rows);
      await pending;
      return DT.store['2026-07-09'];
    } finally {
      parseCSV = original;
    }
  }, sampleRows);

  expect(stored).toBeUndefined();
});

test('selects the workbook data sheet and preserves formatted patient IDs', async ({ page }) => {
  const parsed = await page.evaluate(async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Cover'], ['Monthly report']]), 'Cover');
    const data = XLSX.utils.aoa_to_sheet([
      ['اسم الطبيب', 'اسم الخدمة', 'رقم المريض', 'رقم الطلب'],
      ['د. أحمد', 'دواء أ', 123, 7],
    ]);
    data.C2.z = '000000';
    data.D2.z = '0000';
    XLSX.utils.book_append_sheet(workbook, data, 'Data');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const rows = await parseExcel(new File([bytes], 'report.xlsx'));
    return { row: rows[0], sheet: rows._parseMeta.sheet };
  });

  expect(parsed).toEqual({
    row: {
      doctor: 'د. أحمد',
      service: 'دواء أ',
      section: '',
      patient: '000123',
      patientName: '',
      orderNo: '0007',
      status: 'غير محدد',
    },
    sheet: 'Data',
  });
});

test('opens a cross-branch drug result and keeps near-expiry demand branch-local', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await page.evaluate(() => {
    setBranchData('T1', [{ doctor: 'Dr One', service: 'Drug One', patient: '1', status: 'Closed' }], 'مايو 2026.xlsx', '');
    setBranchData('T2', [{ doctor: 'Dr Two', service: 'BLUM-D 50000 IU TABLET 20 TABLET BOX', patient: '2', status: 'Closed' }], 'مايو 2026.xlsx', '');
    STATE.active = 'T1';
    renderAll();
  });

  await page.locator('#globalSearch').fill('BLUM');
  await expect(page.locator('.sr-item[data-type="drug"]')).toBeVisible();
  await page.locator('.sr-item[data-type="drug"]').click();
  await expect(page.locator('#modalBg')).toHaveClass(/show/);
  await expect(page.locator('#modalBody')).toContainText('كل الفروع');
  await page.locator('#modalClose').click();

  const demand = await page.evaluate(() => {
    renderNearExpiry();
    const absent = window.__neCrossRef.has('T1|1-03-187-229');
    setBranchData('T1', [{ doctor: 'Dr One', service: 'BLUM-D 50000 IU TABLET 20 TABLET BOX', patient: '3', status: 'Closed' }], 'يونيو 2026.xlsx', '');
    renderNearExpiry();
    return { absent, present: window.__neCrossRef.has('T1|1-03-187-229') };
  });
  expect(demand).toEqual({ absent: false, present: true });
});

test('exports manual reports without Rx data and clears their saved edits', async ({ page }) => {
  await page.locator('#loginUser').fill('elsayed');
  await page.locator('#loginPass').fill('pharma2026');
  await page.locator('.login-btn').click();
  await page.evaluate(() => {
    localStorage.setItem('pharmdash_agedmeds_v1', JSON.stringify({
      months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
      y2025: { T1: [1, 1, 1, 1, 1, 1], T2: [1, 1, 1, 1, 1, 1], T3: [1, 1, 1, 1, 1, 1] },
      y2026: { T1: [2, 2, 2, 2, 2, 2], T2: [2, 2, 2, 2, 2, 2], T3: [2, 2, 2, 2, 2, 2] },
      specialties2025: [['الأسنان', 10]],
      specialties2026: [['المسالك', 20]],
      june2026Confirmed: 6,
    }));
    localStorage.setItem('pharmdash_pl_target_v1', JSON.stringify({ target: 99, achieved: 1, month: 'اختبار', currency: 'ريال' }));
  });

  await page.locator('[data-tab="agedmeds"]').click();
  await expect(page.locator('#agedmeds-content')).toContainText('الأسنان');
  await expect(page.locator('#agedmeds-content')).toContainText('المسالك');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportXlsxBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('PharmaDash-');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTitle('مسح البيانات المحفوظة').click();
  await expect.poll(() => page.evaluate(() => ({
    aged: localStorage.getItem('pharmdash_agedmeds_v1'),
    target: localStorage.getItem('pharmdash_pl_target_v1'),
  }))).toEqual({ aged: null, target: null });
});
