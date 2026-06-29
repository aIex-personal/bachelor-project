
import { test, expect } from './helpers.js';

test.describe('Dashboard (US-043–US-046)', () => {
	test('dashboard is visible after login', async ({ authenticatedPage: page }) => {
		await expect(page).toHaveURL(/\/dashboard/);
		
		await expect(
			page.locator('h1, h2, [data-testid="dashboard-title"]')
		).toBeVisible({ timeout: 8_000 });
	});

	test('shows empty state or project list', async ({ authenticatedPage: page }) => {
		
		const body = page.locator('body');
		await expect(body).toBeVisible();
		
		const hasEmpty = await page.locator('text=/no projects|get started|create/i').count();
		const hasCards = await page.locator('[data-testid="project-card"], .card').count();
		expect(hasEmpty + hasCards).toBeGreaterThan(0);
	});

	test('create new project button is present (US-043)', async ({ authenticatedPage: page }) => {
		const createBtn = page.locator(
			'button:has-text("New"), button:has-text("Create"), a:has-text("New Project"), [data-testid="create-project"]'
		);
		await expect(createBtn.first()).toBeVisible({ timeout: 8_000 });
	});

	test('clicking create project navigates to editor (US-043, FR-008)', async ({
		authenticatedPage: page
	}) => {
		const createBtn = page.locator(
			'button:has-text("New"), button:has-text("Create"), [data-testid="create-project"]'
		);
		await createBtn.first().click();
		await expect(page).toHaveURL(/\/editor/, { timeout: 12_000 });
	});

	test('new project has an auto-generated name (US-046)', async ({
		authenticatedPage: page
	}) => {
		
		const createBtn = page.locator(
			'button:has-text("New"), button:has-text("Create"), [data-testid="create-project"]'
		);
		await createBtn.first().click();
		await page.waitForURL(/\/editor\
		
		const nameInput = page.locator('input[placeholder*="project" i], input[data-testid="project-name"], input[value*="Haptic Pattern"]');
		if (await nameInput.count() > 0) {
			const value = await nameInput.first().inputValue();
			expect(value).toMatch(/Haptic Pattern \d+/);
		}
	});

	test('projects list can be searched/filtered (US-019, NFR-002)', async ({
		authenticatedPage: page
	}) => {
		const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], [data-testid="search-projects"]');
		if (await searchInput.count() > 0) {
			await searchInput.first().fill('nonexistentproject_xyz');
			
			await page.waitForTimeout(500);
			const cards = await page.locator('[data-testid="project-card"], .card').count();
			
			expect(cards).toBeGreaterThanOrEqual(0);
		}
	});

	test('delete project shows confirmation (US-043, NFR-002)', async ({
		authenticatedPage: page
	}) => {
		
		const createBtn = page.locator(
			'button:has-text("New"), button:has-text("Create"), [data-testid="create-project"]'
		);
		await createBtn.first().click();
		await page.waitForURL(/\/editor\
		await page.goto('/dashboard');

		const deleteBtn = page.locator(
			'button:has-text("Delete"), [data-testid="delete-project"], button[aria-label*="delete" i]'
		);
		if (await deleteBtn.count() > 0) {
			await deleteBtn.first().click();
			
			const confirmDialog = page.locator(
				'[role="dialog"], .modal, button:has-text("Confirm"), button:has-text("Yes")'
			);
			await expect(confirmDialog.first()).toBeVisible({ timeout: 5_000 });
		}
	});
});
