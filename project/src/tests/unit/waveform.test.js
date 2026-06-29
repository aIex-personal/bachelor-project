
import { describe, it, expect } from 'vitest';
import { waveSample, generateWaveformPoints } from '$lib/utils/waveform.js';

describe('waveSample', () => {
	it('sine returns 0 at phase 0', () => {
		expect(waveSample('sine', 0)).toBeCloseTo(0);
	});

	it('sine returns 0 at phase 0.5', () => {
		expect(waveSample('sine', 0.5)).toBeCloseTo(0);
	});

	it('sine returns 1 at phase 0.25', () => {
		expect(waveSample('sine', 0.25)).toBeCloseTo(1);
	});

	it('sine returns -1 at phase 0.75', () => {
		expect(waveSample('sine', 0.75)).toBeCloseTo(-1);
	});

	it('square returns +1 for phase < 0.5', () => {
		expect(waveSample('square', 0)).toBe(1);
		expect(waveSample('square', 0.49)).toBe(1);
	});

	it('square returns -1 for phase >= 0.5', () => {
		expect(waveSample('square', 0.5)).toBe(-1);
		expect(waveSample('square', 0.99)).toBe(-1);
	});

	it('sawtooth returns -1 at phase 0', () => {
		expect(waveSample('sawtooth', 0)).toBeCloseTo(-1);
	});

	it('sawtooth returns +1 at phase 1', () => {
		expect(waveSample('sawtooth', 1)).toBeCloseTo(1);
	});

	it('sawtooth is linear between -1 and +1', () => {
		expect(waveSample('sawtooth', 0.5)).toBeCloseTo(0);
	});

	it('triangle returns -1 at phase 0', () => {
		expect(waveSample('triangle', 0)).toBeCloseTo(-1);
	});

	it('triangle returns +1 at phase 0.5', () => {
		expect(waveSample('triangle', 0.5)).toBeCloseTo(1);
	});

	it('triangle returns -1 at phase 1', () => {
		expect(waveSample('triangle', 1)).toBeCloseTo(-1);
	});

	it('returns 0 for unknown type', () => {
		expect(waveSample('unknown', 0.5)).toBe(0);
	});

	it('all wave types stay within -1..1 range', () => {
		const types = ['sine', 'triangle', 'square', 'sawtooth'];
		const phases = Array.from({ length: 100 }, (_, i) => i / 100);
		for (const type of types) {
			for (const phase of phases) {
				const v = waveSample(type, phase);
				expect(v).toBeGreaterThanOrEqual(-1 - 1e-9);
				expect(v).toBeLessThanOrEqual(1 + 1e-9);
			}
		}
	});
});

describe('generateWaveformPoints', () => {
	it('returns array of correct length', () => {
		const pts = generateWaveformPoints('sine', 3, 128);
		expect(pts).toHaveLength(128);
	});

	it('defaults to 256 points', () => {
		const pts = generateWaveformPoints('sine');
		expect(pts).toHaveLength(256);
	});

	it('all values are in -1..1 range', () => {
		for (const type of ['sine', 'triangle', 'square', 'sawtooth']) {
			const pts = generateWaveformPoints(type, 2, 64);
			for (const v of pts) {
				expect(v).toBeGreaterThanOrEqual(-1 - 1e-9);
				expect(v).toBeLessThanOrEqual(1 + 1e-9);
			}
		}
	});

	it('sine waveform contains both positive and negative samples', () => {
		const pts = generateWaveformPoints('sine', 3, 256);
		expect(pts.some((v) => v > 0.5)).toBe(true);
		expect(pts.some((v) => v < -0.5)).toBe(true);
	});

	it('square waveform contains only +1 and -1 values', () => {
		const pts = generateWaveformPoints('square', 2, 64);
		for (const v of pts) {
			expect(Math.abs(Math.abs(v) - 1)).toBeLessThan(1e-9);
		}
	});

	it('works with cycles = 1', () => {
		const pts = generateWaveformPoints('sawtooth', 1, 64);
		expect(pts).toHaveLength(64);
	});
});
