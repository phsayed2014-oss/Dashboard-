import { expect, test } from '@playwright/test';

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
