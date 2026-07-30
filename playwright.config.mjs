import { defineConfig } from '@playwright/test';

const launchOptions = {
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:8123',
    browserName: 'chromium',
    headless: true,
    launchOptions,
  },
  webServer: {
    command: 'python3 -m http.server 8123',
    cwd: '.',
    url: 'http://127.0.0.1:8123/PharmaDash-v3-medical-ready.html',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
