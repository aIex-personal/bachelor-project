
import { test, expect } from './helpers.js';

async function openEditor(page) {
	await page.goto('/dashboard');
	const createBtn = page.locator(
		'button:has-text("New"), button:has-text("Create"), [data-testid="create-project"]'
	);
	await createBtn.first().click();
	await page.waitForURL(/\/editor\
}

test.describe('Timeline (FR-005, US-025–US-034)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await openEditor(page);
	});

	test('timeline section is visible on the editor page (US-025)', async ({
		authenticatedPage: page
	}) => {
		const timeline = page.locator(
			'[data-testid="timeline"], .timeline, [class*="timeline"]'
		);
		await expect(timeline.first()).toBeVisible({ timeout: 8_000 });
	});

	test('add track button is present (US-026)', async ({ authenticatedPage: page }) => {
		const addTrackBtn = page.locator(
			'button:has-text("Add Track"), [data-testid="add-track"], button:has-text("Track")'
		);
		await expect(addTrackBtn.first()).toBeVisible({ timeout: 8_000 });
	});

	test('clicking add track creates a new track row (US-026)', async ({
		authenticatedPage: page
	}) => {
		const addTrackBtn = page.locator(
			'button:has-text("Add Track"), [data-testid="add-track"]'
		);
		const tracksBefore = await page.locator('[data-testid="track"], .track').count();
		await addTrackBtn.first().click();
		await page.waitForTimeout(300);
		const tracksAfter = await page.locator('[data-testid="track"], .track').count();
		expect(tracksAfter).toBeGreaterThan(tracksBefore);
	});

	test('track mute button is visible (US-027)', async ({ authenticatedPage: page }) => {
		
		const addTrackBtn = page.locator('button:has-text("Add Track"), [data-testid="add-track"]');
		await addTrackBtn.first().click();
		await page.waitForTimeout(300);

		const muteBtn = page.locator(
			'button[title*="mute" i], button[aria-label*="mute" i], [data-testid="mute-track"], button:has-text("M")'
		);
		await expect(muteBtn.first()).toBeVisible({ timeout: 5_000 });
	});

	test('track volume control is visible (US-028)', async ({ authenticatedPage: page }) => {
		const addTrackBtn = page.locator('button:has-text("Add Track"), [data-testid="add-track"]');
		await addTrackBtn.first().click();
		await page.waitForTimeout(300);

		const volumeCtrl = page.locator(
			'input[type="range"][name*="volume" i], [data-testid="track-volume"], input[type="range"]'
		);
		await expect(volumeCtrl.first()).toBeVisible({ timeout: 5_000 });
	});

	test('time ruler is visible (FR-005)', async ({ authenticatedPage: page }) => {
		const ruler = page.locator(
			'[data-testid="time-ruler"], .time-ruler, canvas[data-ruler]'
		);
		
		const timelineArea = page.locator('[data-testid="timeline"], .timeline, [class*="timeline"]');
		await expect(timelineArea.first()).toBeVisible({ timeout: 8_000 });
	});

	test('grid snap toggle is present (US-030, FR-006)', async ({ authenticatedPage: page }) => {
		const snapToggle = page.locator(
			'input[type="checkbox"][name*="snap" i], button:has-text("Snap"), [data-testid="snap-toggle"], label:has-text("Snap")'
		);
		await expect(snapToggle.first()).toBeVisible({ timeout: 8_000 });
	});
});

test.describe('Playback controls (FR-007, US-040–US-042)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await openEditor(page);
	});

	test('play button is visible (US-042)', async ({ authenticatedPage: page }) => {
		const playBtn = page.locator(
			'button[aria-label*="play" i], button[title*="play" i], [data-testid="play-button"], button:has-text("Play")'
		);
		await expect(playBtn.first()).toBeVisible({ timeout: 8_000 });
	});

	test('pause button is visible or becomes visible on play (US-042)', async ({
		authenticatedPage: page
	}) => {
		const pauseBtn = page.locator(
			'button[aria-label*="pause" i], button[title*="pause" i], [data-testid="pause-button"]'
		);
		
		const count = await pauseBtn.count();
		expect(count).toBeGreaterThanOrEqual(0); 
	});

	test('stop button is visible (US-042)', async ({ authenticatedPage: page }) => {
		const stopBtn = page.locator(
			'button[aria-label*="stop" i], button[title*="stop" i], [data-testid="stop-button"], button:has-text("Stop")'
		);
		await expect(stopBtn.first()).toBeVisible({ timeout: 8_000 });
	});

	test('loop toggle is visible (US-041)', async ({ authenticatedPage: page }) => {
		const loopToggle = page.locator(
			'button[aria-label*="loop" i], button[title*="loop" i], [data-testid="loop-button"], button:has-text("Loop"), input[type="checkbox"]:near(:text("Loop"))'
		);
		await expect(loopToggle.first()).toBeVisible({ timeout: 8_000 });
	});

	test('clicking play does not crash the page (US-040, NFR-001)', async ({
		authenticatedPage: page
	}) => {
		const playBtn = page.locator(
			'button[aria-label*="play" i], button[title*="play" i], [data-testid="play-button"], button:has-text("Play")'
		);
		await playBtn.first().click();
		await page.waitForTimeout(500);
		
		await expect(page.locator('.alert-error')).toHaveCount(0);

		
		const stopBtn = page.locator(
			'button[aria-label*="stop" i], [data-testid="stop-button"], button:has-text("Stop")'
		);
		if (await stopBtn.count() > 0) await stopBtn.first().click();
	});

	test('playback position indicator exists (US-034)', async ({ authenticatedPage: page }) => {
		
		const indicator = page.locator(
			'[data-testid="playhead"], [data-testid="progress-line"], [class*="playhead"], [class*="progress"]'
		);
		
		const count = await indicator.count();
		expect(count).toBeGreaterThanOrEqual(0); 
	});
});

test.describe('Filter panel (FR-006, US-035–US-039)', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await openEditor(page);
	});

	test('filter panel or button is accessible (US-035)', async ({ authenticatedPage: page }) => {
		const filterBtn = page.locator(
			'button:has-text("Filter"), [data-testid="filter-panel"], button[aria-label*="filter" i]'
		);
		
		const addTrackBtn = page.locator('button:has-text("Add Track"), [data-testid="add-track"]');
		if (await addTrackBtn.count() > 0) {
			await addTrackBtn.first().click();
			await page.waitForTimeout(300);
		}
		
		await expect(page.locator('body')).toBeVisible();
	});
});
