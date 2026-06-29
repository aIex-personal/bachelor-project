
import { test as base, expect } from '@playwright/test';

export const TEST_USER = {
	email: 'e2e-user@hapticstudio.test',
	password: 'E2eTestPassword123!',
	name: 'E2E Test User'
};

export const TEST_ADMIN = {
	email: 'e2e-admin@hapticstudio.test',
	password: 'E2eAdminPassword123!',
	name: 'E2E Admin'
};

export async function ensureUserExists(page, user) {
	await page.goto('/login');
	
	await page.fill('input[type="email"]', user.email);
	await page.fill('input[type="password"]', user.password);
	await page.click('button[type="submit"]');

	const url = page.url();
	if (url.includes('/login')) {
		
		await page.goto('/register');
		await page.fill('input[name="name"]', user.name);
		await page.fill('input[type="email"]', user.email);
		await page.fill('input[type="password"]', user.password);
		const confirmInput = page.locator('input[name="passwordConfirm"], input[name="confirm"]');
		if (await confirmInput.count() > 0) {
			await confirmInput.fill(user.password);
		}
		await page.click('button[type="submit"]');
	}
}

export async function login(page, user) {
	await page.goto('/login');
	await page.fill('input[type="email"]', user.email);
	await page.fill('input[type="password"]', user.password);
	await page.click('button[type="submit"]');
	await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

export const test = base.extend({
	authenticatedPage: async ({ page }, use) => {
		await ensureUserExists(page, TEST_USER);
		await login(page, TEST_USER);
		await use(page);
	}
});

export { expect };
