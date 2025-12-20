import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_FIREBASE_EMULATOR: 'true',
      VITE_DISABLE_FIREBASE_EMULATOR: 'false',
      VITE_FIRESTORE_EMULATOR_HOST: 'localhost',
      VITE_FIRESTORE_EMULATOR_PORT: '8080',
      VITE_FIREBASE_AUTH_EMULATOR_HOST: 'localhost',
      VITE_FIREBASE_AUTH_EMULATOR_PORT: '9099',
      VITE_FIREBASE_STORAGE_EMULATOR_HOST: 'localhost',
      VITE_FIREBASE_STORAGE_EMULATOR_PORT: '9199',
    },
  },
})
