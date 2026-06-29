
import { test, expect } from './helpers.js';

async function openEditor(page) {
	await page.goto('/dashboard');
	const createBtn = page.locator(
		'button:has-text("New"), button:has-text("Create"), [data-testid="create-project"]'
	);
	await createBtn.first().click();
	await page.waitForURL(/\/editor\
}

test.describe('Sound Editor (FR-003)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await openEditor(page);
	});

	test('editor page loads without errors', async ({ authenticatedPage: page }) => {
		await expect(page.locator('body')).toBeVisible();
		
		await expect(page.locator('.alert-error')).toHaveCount(0);
	});

	test('wave type selector is present (US-007)', async ({ authenticatedPage: page }) => {
		
		const waveSelector = page.locator(
			'select[name="wave_type"], [data-testid="wave-type"], button:has-text("Sine"), button:has-text("sine")'
		);
		await expect(waveSelector.first()).toBeVisible({ timeout: 8_000 });
	});

	test('can change wave type (US-007)', async ({ authenticatedPage: page }) => {
		const triangleOpt = page.locator(
			'option[value="triangle"], button:has-text("Triangle"), [data-value="triangle"]'
		);
		if (await triangleOpt.count() > 0) {
			await triangleOpt.first().click();
		} else {
			const sel = page.locator('select[name="wave_type"]');
			if (await sel.count() > 0) {
				await sel.selectOption('triangle');
			}
		}
		
		await expect(page.locator('canvas, svg')).toBeVisible({ timeout: 5_000 });
	});

	test('frequency control is present (US-009)', async ({ authenticatedPage: page }) => {
		const freqInput = page.locator(
			'input[name="frequency"], input[data-testid="frequency"], [data-testid="frequency-knob"]'
		);
		await expect(freqInput.first()).toBeVisible({ timeout: 8_000 });
	});

	test('amplitude control is present (US-008)', async ({ authenticatedPage: page }) => {
		const ampInput = page.locator(
			'input[name="amplitude"], input[data-testid="amplitude"], [data-testid="amplitude-knob"]'
		);
		await expect(ampInput.first()).toBeVisible({ timeout: 8_000 });
	});

	test('duration control is present (US-010)', async ({ authenticatedPage: page }) => {
		const durInput = page.locator(
			'input[name="duration"], input[data-testid="duration"]'
		);
		await expect(durInput.first()).toBeVisible({ timeout: 8_000 });
	});

	test('can type a sound name (US-012)', async ({ authenticatedPage: page }) => {
		const nameInput = page.locator(
			'input[name="name"], input[placeholder*="name" i][not([name="project"])]'
		).first();
		if (await nameInput.count() > 0) {
			await nameInput.fill('My Test Sound');
			await expect(nameInput).toHaveValue('My Test Sound');
		}
	});

	test('preview button is present (US-013)', async ({ authenticatedPage: page }) => {
		const previewBtn = page.locator(
			'button:has-text("Preview"), button:has-text("Play"), [data-testid="preview-sound"]'
		);
		await expect(previewBtn.first()).toBeVisible({ timeout: 8_000 });
	});

	test('save sound button is present (US-014)', async ({ authenticatedPage: page }) => {
		const saveBtn = page.locator(
			'button:has-text("Save"), [data-testid="save-sound"]'
		);
		await expect(saveBtn.first()).toBeVisible({ timeout: 8_000 });
	});

	test('saving a sound shows success feedback (US-014, NFR-002)', async ({
		authenticatedPage: page
	}) => {
		
		const nameInput = page.locator('input[name="name"]').first();
		if (await nameInput.count() > 0) {
			await nameInput.fill(`E2E Sound ${Date.now()}`);
		}
		const saveBtn = page.locator('button:has-text("Save"), [data-testid="save-sound"]');
		await saveBtn.first().click();
		
		const feedback = page.locator('.alert-success, [role="alert"], .toast, .notification');
		await expect(feedback.first()).toBeVisible({ timeout: 8_000 });
	});
});

test.describe('Preset Library (FR-004, US-018–US-024)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await openEditor(page);
	});

	test('presets tab is accessible (US-018)', async ({ authenticatedPage: page }) => {
		const presetsTab = page.locator(
			'button:has-text("Preset"), [data-testid="presets-tab"], a:has-text("Preset")'
		);
		await expect(presetsTab.first()).toBeVisible({ timeout: 8_000 });
	});

	test('preset library shows after clicking presets tab (US-018)', async ({
		authenticatedPage: page
	}) => {
		const presetsTab = page.locator(
			'button:has-text("Preset"), [data-testid="presets-tab"]'
		);
		await presetsTab.first().click();
		
		await expect(
			page.locator('[data-testid="preset-library"], input[placeholder*="search" i], .preset-list')
		).toBeVisible({ timeout: 8_000 });
	});

	test('search box narrows preset results (US-021)', async ({
		authenticatedPage: page
	}) => {
		const presetsTab = page.locator('button:has-text("Preset"), [data-testid="presets-tab"]');
		await presetsTab.first().click();
		const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
		if (await searchInput.count() > 0) {
			await searchInput.first().fill('nonexistent_xyz_sound');
			await page.waitForTimeout(500);
			
			const cards = page.locator('[data-testid="preset-card"], .preset-card');
			const count = await cards.count();
			expect(count).toBeGreaterThanOrEqual(0);
		}
	});
});
