
import { describe, it, expect } from 'vitest';
import {
	generateSoundName,
	generateProjectName,
	generatePatternName,
	generateTrackName,
	sanitizeName,
	makeUnique
} from '$lib/utils/naming.js';

describe('generateSoundName', () => {
	it('returns a non-empty string for all wave types', () => {
		for (const wave of ['sine', 'triangle', 'square', 'sawtooth']) {
			const name = generateSoundName(wave, 200, 0.5);
			expect(typeof name).toBe('string');
			expect(name.length).toBeGreaterThan(0);
		}
	});

	it('uses correct prefix per wave type', () => {
		expect(generateSoundName('sine', 200, 0.5)).toMatch(/^Sine/);
		expect(generateSoundName('triangle', 200, 0.5)).toMatch(/^Triangle/);
		expect(generateSoundName('square', 200, 0.5)).toMatch(/^Square/);
		expect(generateSoundName('sawtooth', 200, 0.5)).toMatch(/^Saw/);
	});

	it('falls back to Wave for unknown type', () => {
		expect(generateSoundName('unknown', 200, 0.5)).toMatch(/^Wave/);
	});

	it('encodes Bass for very low frequency (≤80 Hz)', () => {
		expect(generateSoundName('sine', 50, 0.5)).toContain('Bass');
		expect(generateSoundName('sine', 80, 0.5)).toContain('Bass');
	});

	it('encodes Low for 81–200 Hz', () => {
		expect(generateSoundName('sine', 150, 0.5)).toContain('Low');
		expect(generateSoundName('sine', 200, 0.5)).toContain('Low');
	});

	it('encodes Mid for 201–500 Hz', () => {
		expect(generateSoundName('sine', 350, 0.5)).toContain('Mid');
		expect(generateSoundName('sine', 500, 0.5)).toContain('Mid');
	});

	it('encodes High for 501–1000 Hz', () => {
		expect(generateSoundName('sine', 750, 0.5)).toContain('High');
		expect(generateSoundName('sine', 1000, 0.5)).toContain('High');
	});

	it('encodes Ultra for frequencies above 1000 Hz', () => {
		expect(generateSoundName('sine', 2000, 0.5)).toContain('Ultra');
	});

	it('encodes Light for amplitude ≤0.3', () => {
		expect(generateSoundName('sine', 200, 0.1)).toContain('Light');
		expect(generateSoundName('sine', 200, 0.3)).toContain('Light');
	});

	it('encodes Medium for amplitude 0.31–0.6', () => {
		expect(generateSoundName('sine', 200, 0.45)).toContain('Medium');
		expect(generateSoundName('sine', 200, 0.6)).toContain('Medium');
	});

	it('encodes Strong for amplitude 0.61–0.85', () => {
		expect(generateSoundName('sine', 200, 0.75)).toContain('Strong');
		expect(generateSoundName('sine', 200, 0.85)).toContain('Strong');
	});

	it('encodes Max for amplitude above 0.85', () => {
		expect(generateSoundName('sine', 200, 1.0)).toContain('Max');
	});

	it('includes duration label when duration is provided', () => {
		const name = generateSoundName('sine', 200, 0.5, 50);
		expect(name).toContain('Tap');
	});

	it('encodes Short for duration 51–150 ms', () => {
		expect(generateSoundName('sine', 200, 0.5, 100)).toContain('Short');
	});

	it('encodes Long for duration 401–1000 ms', () => {
		expect(generateSoundName('sine', 200, 0.5, 800)).toContain('Long');
	});

	it('omits duration segment when duration is not provided', () => {
		
		const withDur = generateSoundName('sine', 200, 0.5, 100);
		const withOut = generateSoundName('sine', 200, 0.5);
		expect(withDur.length).toBeGreaterThan(withOut.length);
	});
});

describe('generateProjectName', () => {
	it('returns "Haptic Pattern 1" when no existing names', () => {
		expect(generateProjectName([])).toBe('Haptic Pattern 1');
		expect(generateProjectName()).toBe('Haptic Pattern 1');
	});

	it('increments to avoid collisions', () => {
		expect(generateProjectName(['Haptic Pattern 1'])).toBe('Haptic Pattern 2');
		expect(generateProjectName(['Haptic Pattern 1', 'Haptic Pattern 2'])).toBe(
			'Haptic Pattern 3'
		);
	});

	it('fills gaps — picks first available number', () => {
		
		const existing = ['Haptic Pattern 1', 'Haptic Pattern 2', 'Haptic Pattern 4'];
		expect(generateProjectName(existing)).toBe('Haptic Pattern 3');
	});
});

describe('generatePatternName', () => {
	it('returns "Pattern 1" when no existing names', () => {
		expect(generatePatternName([])).toBe('Pattern 1');
		expect(generatePatternName()).toBe('Pattern 1');
	});

	it('increments to avoid collisions', () => {
		expect(generatePatternName(['Pattern 1', 'Pattern 2'])).toBe('Pattern 3');
	});
});

describe('generateTrackName', () => {
	it('returns "Track 1" for trackCount = 0', () => {
		expect(generateTrackName(0)).toBe('Track 1');
	});

	it('increments correctly', () => {
		expect(generateTrackName(3)).toBe('Track 4');
	});
});

describe('sanitizeName', () => {
	it('trims leading/trailing whitespace', () => {
		expect(sanitizeName('  hello  ')).toBe('hello');
	});

	it('collapses internal whitespace', () => {
		expect(sanitizeName('hello   world')).toBe('hello world');
	});

	it('returns fallback for empty string', () => {
		expect(sanitizeName('')).toBe('Untitled');
		expect(sanitizeName('   ')).toBe('Untitled');
	});

	it('returns custom fallback', () => {
		expect(sanitizeName('', 'My Sound')).toBe('My Sound');
	});

	it('handles null/undefined gracefully', () => {
		expect(sanitizeName(null)).toBe('Untitled');
		expect(sanitizeName(undefined)).toBe('Untitled');
	});
});

describe('makeUnique', () => {
	it('returns base name if not already used', () => {
		expect(makeUnique('Kick', ['Snare', 'Hat'])).toBe('Kick');
	});

	it('appends (2) on first collision', () => {
		expect(makeUnique('Kick', ['Kick'])).toBe('Kick (2)');
	});

	it('increments further on repeated collisions', () => {
		expect(makeUnique('Kick', ['Kick', 'Kick (2)', 'Kick (3)'])).toBe('Kick (4)');
	});

	it('handles empty existing array', () => {
		expect(makeUnique('Test', [])).toBe('Test');
	});
});
