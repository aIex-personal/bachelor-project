// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 * Tests run against a locally running HapticStudio instance.
 * Start the dev server before running: `npm run dev`
 */
export default defineConfig({
	testDir: './src/tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [['html', { outputFolder: 'playwright-report' }], ['line']],
	use: {
		baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
