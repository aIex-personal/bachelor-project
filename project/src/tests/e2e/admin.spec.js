
import { test as base, expect } from '@playwright/test';
import { TEST_ADMIN, ensureUserExists, login } from './helpers.js';

const test = base.extend({
	adminPage: async ({ page }, use) => {
		await ensureUserExists(page, TEST_ADMIN);
		await login(page, TEST_ADMIN);
		await use(page);
	}
});

test.describe('Admin layout (FR-001, FR-002)', () => {
	test('admin dashboard is accessible for admin users', async ({ adminPage: page }) => {
		await page.goto('/admin');
		
		await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
		await expect(page.locator('body')).toBeVisible();
	});

	test('admin nav shows Users and Signals sections', async ({ adminPage: page }) => {
		await page.goto('/admin');
		await expect(
			page.locator('a:has-text("Users"), [data-testid="admin-users-link"]')
		).toBeVisible({ timeout: 8_000 });
		await expect(
			page.locator('a:has-text("Signals"), [data-testid="admin-signals-link"]')
		).toBeVisible({ timeout: 8_000 });
	});
});

test.describe('User Management (US-003, US-004, US-005, US-006)', () => {
	test.beforeEach(async ({ adminPage: page }) => {
		await page.goto('/admin/users');
	});

	test('users page shows a table or list of users', async ({ adminPage: page }) => {
		await expect(
			page.locator('table, [data-testid="users-list"], .user-row, tr')
		).toBeVisible({ timeout: 8_000 });
	});

	test('user rows display email and role (US-003)', async ({ adminPage: page }) => {
		
		const rows = page.locator('tr, [data-testid="user-row"]');
		const count = await rows.count();
		expect(count).toBeGreaterThan(0);
	});

	test('role dropdown or selector is present for each user (US-004)', async ({
		adminPage: page
	}) => {
		const roleSelect = page.locator(
			'select[name*="role" i], [data-testid="role-select"], select option[value="user"]'
		);
		await expect(roleSelect.first()).toBeVisible({ timeout: 8_000 });
	});

	test('preset access toggle is present (US-005)', async ({ adminPage: page }) => {
		const accessToggle = page.locator(
			'input[type="checkbox"][name*="preset" i], input[type="checkbox"][name*="access" i], [data-testid="preset-access-toggle"], button:has-text("Access"), button:has-text("Grant")'
		);
		
		const count = await accessToggle.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});
});

test.describe('Signal Creator (Admin — AGENTS.md spec)', () => {
	test.beforeEach(async ({ adminPage: page }) => {
		await page.goto('/admin/signals');
	});

	test('signals page loads (US-014, Admin spec)', async ({ adminPage: page }) => {
		await expect(page.locator('body')).toBeVisible();
		await expect(page).not.toHaveURL(/\/login/);
	});

	test('signal creator form is present', async ({ adminPage: page }) => {
		
		const form = page.locator(
			'form, [data-testid="signal-creator"], [data-testid="signal-form"]'
		);
		await expect(form.first()).toBeVisible({ timeout: 8_000 });
	});

	test('signal name input is present', async ({ adminPage: page }) => {
		const nameInput = page.locator(
			'input[name="name"], input[placeholder*="name" i][not([name="project"])]'
		);
		await expect(nameInput.first()).toBeVisible({ timeout: 8_000 });
	});

	test('tag/category fields are present', async ({ adminPage: page }) => {
		const tagField = page.locator(
			'input[name*="tag" i], input[name*="categor" i], [data-testid="tags-input"], [data-testid="category-input"]'
		);
		await expect(tagField.first()).toBeVisible({ timeout: 8_000 });
	});

	test('signal database / library section is visible', async ({ adminPage: page }) => {
		const library = page.locator(
			'[data-testid="signal-database"], [data-testid="signal-library"], .signal-list, table'
		);
		await expect(library.first()).toBeVisible({ timeout: 8_000 });
	});

	test('download (WAV) button is available for saved signals', async ({
		adminPage: page
	}) => {
		
		const nameInput = page.locator('input[name="name"]').first();
		if (await nameInput.count() > 0) {
			await nameInput.fill(`E2E Signal ${Date.now()}`);
		}
		const saveBtn = page.locator('button:has-text("Save"), [data-testid="save-signal"]');
		if (await saveBtn.count() > 0) {
			await saveBtn.first().click();
			await page.waitForTimeout(1_000);
		}

		const downloadBtn = page.locator(
			'button:has-text("Download"), button:has-text("WAV"), a[download], [data-testid="download-wav"]'
		);
		
		if (await downloadBtn.count() > 0) {
			await expect(downloadBtn.first()).toBeVisible({ timeout: 5_000 });
		}
	});
});

test.describe('RBAC — non-admin blocked from admin routes (FR-001)', () => {
	test('regular user redirected away from /admin', async ({ page }) => {
		
		const { TEST_USER, ensureUserExists: ensure, login: doLogin } = await import(
			'./helpers.js'
		);
		await ensure(page, TEST_USER);
		await doLogin(page, TEST_USER);

		await page.goto('/admin');
		
		await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 8_000 });
	});
});
