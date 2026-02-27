import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: process.env.PARITY_BASE_URL || 'https://web-three-lyart-85.vercel.app',
    headless: true,
  },
  reporter: [['list']],
})
