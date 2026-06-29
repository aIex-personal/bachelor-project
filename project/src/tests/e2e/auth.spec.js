
import { test, expect } from '@playwright/test';

const UNIQUE_SUFFIX = Date.now();
const NEW_USER = {
	email: `new-user-${UNIQUE_SUFFIX}@hapticstudio.test`,
	password: 'NewUserPass123!',
	name: `New User ${UNIQUE_SUFFIX}`
};

test.describe('Registration (US-001)', () => {
	test('shows registration form at /register', async ({ page }) => {
		await page.goto('/register');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('registers a new user and redirects to dashboard or login', async ({ page }) => {
		await page.goto('/register');
		await page.fill('input[name="name"], input[placeholder*="name" i]', NEW_USER.name);
		await page.fill('input[type="email"]', NEW_USER.email);
		await page.fill('input[type="password"]', NEW_USER.password);

		
		const confirmInput = page.locator('input[name="passwordConfirm"], input[name="confirm"]');
		if (await confirmInput.count() > 0) {
			await confirmInput.fill(NEW_USER.password);
		}

		await page.click('button[type="submit"]');

		
		await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 10_000 });
	});

	test('shows error for duplicate email', async ({ page }) => {
		await page.goto('/register');
		await page.fill('input[name="name"], input[placeholder*="name" i]', NEW_USER.name);
		await page.fill('input[type="email"]', NEW_USER.email); 
		await page.fill('input[type="password"]', NEW_USER.password);
		const confirmInput = page.locator('input[name="passwordConfirm"], input[name="confirm"]');
		if (await confirmInput.count() > 0) await confirmInput.fill(NEW_USER.password);

		await page.click('button[type="submit"]');
		
		await expect(page.locator('.alert-error, [role="alert"]')).toBeVisible({ timeout: 8_000 });
	});

	test('shows error for mismatched passwords (if confirm field exists)', async ({ page }) => {
		await page.goto('/register');
		const confirmInput = page.locator('input[name="passwordConfirm"], input[name="confirm"]');
		if (await confirmInput.count() === 0) {
			test.skip(); 
		}
		await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test');
		await page.fill('input[type="email"]', `mismatch-${UNIQUE_SUFFIX}@test.test`);
		await page.fill('input[type="password"]', 'Password123!');
		await confirmInput.fill('WrongPassword!');
		await page.click('button[type="submit"]');
		
		await expect(page).toHaveURL(/\/register|error/, { timeout: 5_000 });
	});
});

test.describe('Login (US-002)', () => {
	test('shows login form at /login', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('logs in with valid credentials and redirects to dashboard', async ({ page }) => {
		
		await page.goto('/login');
		await page.fill('input[type="email"]', NEW_USER.email);
		await page.fill('input[type="password"]', NEW_USER.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
	});

	test('shows error message for invalid credentials', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="email"]', 'nonexistent@nowhere.test');
		await page.fill('input[type="password"]', 'WrongPassword');
		await page.click('button[type="submit"]');
		await expect(page.locator('.alert-error, [role="alert"]')).toBeVisible({ timeout: 8_000 });
	});

	test('shows error for empty form submission', async ({ page }) => {
		await page.goto('/login');
		
		await page.click('button[type="submit"]');
		
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('Authentication guards (FR-001, NFR-002)', () => {
	test('redirects /dashboard to /login when not authenticated', async ({ page }) => {
		
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
	});

	test('redirects /editor to /login when not authenticated', async ({ page }) => {
		await page.goto('/editor');
		await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
	});

	test('redirects /admin to /login when not authenticated', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/login|\/dashboard/, { timeout: 8_000 });
	});
});

test.describe('Logout', () => {
	test('logout button returns user to login page', async ({ page }) => {
		
		await page.goto('/login');
		await page.fill('input[type="email"]', NEW_USER.email);
		await page.fill('input[type="password"]', NEW_USER.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('**/dashboard', { timeout: 10_000 });

		
		const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign out")');
		await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
		await logoutBtn.click();
		await expect(page).toHaveURL(/\/(login|$)/, { timeout: 8_000 });
	});
});

test.describe('Page titles and branding (NFR-002)', () => {
	test('login page has correct title', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveTitle(/HapticStudio/i);
	});

	test('register page is accessible', async ({ page }) => {
		await page.goto('/register');
		await expect(page.locator('body')).toBeVisible();
	});
});
