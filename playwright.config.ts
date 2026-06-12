import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'npm run server:start',
      url: 'http://127.0.0.1:3101/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        LOG_LEVEL: 'silent',
        PORT: '3101',
        STUDYSYNC_RATE_LIMIT_MULTIPLIER: '20',
        STUDYSYNC_DB_PATH: 'server/data/playwright.db'
      }
    },
    {
      command: 'npm run client',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_PORT: '3100',
        VITE_API_PROXY_TARGET: 'http://127.0.0.1:3101'
      }
    }
  ]
});
