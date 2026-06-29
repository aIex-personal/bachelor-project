
import { describe, it, expect, beforeEach } from 'vitest';
import {
	generateSamples,
	mixSounds,
	encodeWav,
	exportSoundToWav,
	exportProjectToWav
} from '$lib/audio/WavEncoder.js';

const SAMPLE_RATE = 44100;

describe('generateSamples', () => {
	it('returns a Float32Array', () => {
		const samples = generateSamples({ wave_type: 'sine', frequency: 200, amplitude: 0.7, duration: 100 });
		expect(samples).toBeInstanceOf(Float32Array);
	});

	it('has the correct number of samples for the duration', () => {
		
		const samples = generateSamples({ wave_type: 'sine', frequency: 200, amplitude: 0.7, duration: 100 });
		expect(samples.length).toBe(Math.floor(SAMPLE_RATE * 100 / 1000));
	});

	it('all sample values are within -1..1', () => {
		const samples = generateSamples({ wave_type: 'sine', frequency: 200, amplitude: 1.0, duration: 50 });
		for (const v of samples) {
			expect(v).toBeGreaterThanOrEqual(-1 - 1e-6);
			expect(v).toBeLessThanOrEqual(1 + 1e-6);
		}
	});

	it('amplitude=0 results in all-zero samples', () => {
		const samples = generateSamples({ wave_type: 'sine', frequency: 200, amplitude: 0, duration: 50 });
		for (const v of samples) {
			expect(v).toBeCloseTo(0);
		}
	});

	it('generates correct sample count for all wave types', () => {
		for (const wave of ['sine', 'triangle', 'square', 'sawtooth']) {
			const s = generateSamples({ wave_type: wave, frequency: 440, amplitude: 0.5, duration: 200 });
			expect(s.length).toBe(Math.floor(SAMPLE_RATE * 200 / 1000));
		}
	});

	it('frequency sweep (frequency_end) produces samples', () => {
		const samples = generateSamples({
			wave_type: 'sine',
			frequency: 100,
			frequency_end: 500,
			amplitude: 0.5,
			duration: 100
		});
		expect(samples.length).toBeGreaterThan(0);
	});

	it('envelope points are applied without crashing', () => {
		const samples = generateSamples({
			wave_type: 'sine',
			frequency: 200,
			frequency_end: 200,
			amplitude: 0.5,
			duration: 200,
			envelope: [
				{ time: 0.0, frequency: 100 },
				{ time: 0.5, frequency: 400 },
				{ time: 1.0, frequency: 200 }
			]
		});
		expect(samples.length).toBeGreaterThan(0);
	});

	describe('filter effects (US-035, US-036)', () => {
		it('disabled filter has no effect', () => {
			const base = generateSamples({ wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 100 });
			const filtered = generateSamples({
				wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 100,
				filter: { enabled: false, fadeIn: 50, fadeInEnabled: true, fadeOut: 0, fadeOutEnabled: false,
					amplitude: 0.5, amplitudeEnabled: true, duration: 0, durationEnabled: false,
					frequency: 0, frequencyEnabled: false }
			});
			
			for (let i = 0; i < base.length; i++) {
				expect(filtered[i]).toBeCloseTo(base[i], 5);
			}
		});

		it('amplitudeEnabled modifies overall loudness', () => {
			const quiet = generateSamples({
				wave_type: 'square', frequency: 200, amplitude: 0.5, duration: 100,
				filter: { enabled: true, amplitude: -0.4, amplitudeEnabled: true,
					fadeIn: 0, fadeInEnabled: false, fadeOut: 0, fadeOutEnabled: false,
					duration: 0, durationEnabled: false, frequency: 0, frequencyEnabled: false }
			});
			const normal = generateSamples({ wave_type: 'square', frequency: 200, amplitude: 0.5, duration: 100 });
			
			const maxQuiet = Math.max(...quiet.map(Math.abs));
			const maxNormal = Math.max(...normal.map(Math.abs));
			expect(maxQuiet).toBeLessThan(maxNormal);
		});

		it('fadeIn causes first sample to approach 0', () => {
			const samples = generateSamples({
				wave_type: 'square', frequency: 200, amplitude: 1.0, duration: 100,
				filter: { enabled: true, fadeIn: 50, fadeInEnabled: true,
					fadeOut: 0, fadeOutEnabled: false, amplitude: 0, amplitudeEnabled: false,
					duration: 0, durationEnabled: false, frequency: 0, frequencyEnabled: false }
			});
			
			expect(Math.abs(samples[0])).toBeCloseTo(0, 2);
		});

		it('fadeOut causes last sample to approach 0', () => {
			const samples = generateSamples({
				wave_type: 'square', frequency: 200, amplitude: 1.0, duration: 100,
				filter: { enabled: true, fadeOut: 50, fadeOutEnabled: true,
					fadeIn: 0, fadeInEnabled: false, amplitude: 0, amplitudeEnabled: false,
					duration: 0, durationEnabled: false, frequency: 0, frequencyEnabled: false }
			});
			expect(Math.abs(samples[samples.length - 1])).toBeCloseTo(0, 2);
		});

		it('durationEnabled changes the sample length', () => {
			const extended = generateSamples({
				wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 100,
				filter: { enabled: true, duration: 100, durationEnabled: true,
					fadeIn: 0, fadeInEnabled: false, fadeOut: 0, fadeOutEnabled: false,
					amplitude: 0, amplitudeEnabled: false, frequency: 0, frequencyEnabled: false }
			});
			const normal = generateSamples({ wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 100 });
			expect(extended.length).toBeGreaterThan(normal.length);
		});
	});
});

describe('mixSounds', () => {
	it('returns a Float32Array of the correct total length', () => {
		const s1 = new Float32Array(4410).fill(0.5);
		const mixed = mixSounds([{ samples: s1, offsetMs: 0 }], 100);
		expect(mixed).toBeInstanceOf(Float32Array);
		expect(mixed.length).toBe(Math.ceil(SAMPLE_RATE * 100 / 1000));
	});

	it('places a sound at an offset correctly', () => {
		const s1 = new Float32Array(100).fill(1.0);
		const mixed = mixSounds([{ samples: s1, offsetMs: 500 }], 1000);
		
		const offsetSamples = Math.floor(SAMPLE_RATE * 500 / 1000);
		expect(mixed[offsetSamples - 1]).toBeCloseTo(0);
		expect(mixed[offsetSamples]).toBeGreaterThan(0);
	});

	it('mixes two sounds that overlap and normalizes if needed', () => {
		const s1 = new Float32Array(4410).fill(1.0);
		const s2 = new Float32Array(4410).fill(1.0);
		const mixed = mixSounds(
			[{ samples: s1, offsetMs: 0 }, { samples: s2, offsetMs: 0 }],
			100
		);
		
		const max = Math.max(...mixed.map(Math.abs));
		expect(max).toBeLessThanOrEqual(1 + 1e-6);
	});

	it('returns an empty/zero buffer when no sounds provided', () => {
		const mixed = mixSounds([], 100);
		for (const v of mixed) {
			expect(v).toBeCloseTo(0);
		}
	});
});

describe('encodeWav', () => {
	it('returns a Blob with audio/wav MIME type', () => {
		const samples = new Float32Array(4410).fill(0.1);
		const blob = encodeWav(samples);
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe('audio/wav');
	});

	it('encoded blob has a valid RIFF header (44 bytes + data)', () => {
		const samples = new Float32Array(100);
		const blob = encodeWav(samples);
		
		expect(blob.size).toBe(44 + 100 * 2);
	});

	it('encodes zero-length samples without throwing', () => {
		expect(() => encodeWav(new Float32Array(0))).not.toThrow();
	});

	it('clamps samples outside -1..1 without throwing', () => {
		const samples = new Float32Array([2.0, -3.0, 0.5]);
		expect(() => encodeWav(samples)).not.toThrow();
	});
});

describe('exportSoundToWav', () => {
	it('returns a WAV Blob for a valid sound params object', () => {
		const blob = exportSoundToWav({ wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 50 });
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe('audio/wav');
	});

	it('blob size is proportional to duration', () => {
		const short = exportSoundToWav({ wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 50 });
		const long = exportSoundToWav({ wave_type: 'sine', frequency: 200, amplitude: 0.5, duration: 200 });
		expect(long.size).toBeGreaterThan(short.size);
	});
});

describe('exportProjectToWav', () => {
	const makeTrack = (muted = false, blocks = []) => ({
		id: 'trk_1',
		name: 'Track 1',
		muted,
		volume: 1,
		filterEnabled: false,
		filter: null,
		blocks
	});

	const makeBlock = (muted = false) => ({
		id: 'blk_1',
		soundId: '',
		name: 'Test',
		wave_type: 'sine',
		frequency: 200,
		frequency_end: 200,
		amplitude: 0.5,
		duration: 100,
		startTime: 0,
		muted,
		volume: 1,
		envelope: [],
		filter: null
	});

	it('returns a WAV Blob', () => {
		const tracks = [makeTrack(false, [makeBlock(false)])];
		const blob = exportProjectToWav(tracks, 200);
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe('audio/wav');
	});

	it('muted tracks are excluded from the export', () => {
		const withSound = exportProjectToWav([makeTrack(false, [makeBlock(false)])], 200);
		const withMuted = exportProjectToWav([makeTrack(true, [makeBlock(false)])], 200);
		
		
		expect(withMuted.size).toBe(withSound.size); 
	});

	it('muted blocks are excluded from the export', () => {
		const tracks = [makeTrack(false, [makeBlock(true)])];
		const blob = exportProjectToWav(tracks, 200);
		expect(blob).toBeInstanceOf(Blob);
	});

	it('handles empty tracks array', () => {
		expect(() => exportProjectToWav([], 200)).not.toThrow();
	});

	it('handles tracks with no blocks', () => {
		expect(() => exportProjectToWav([makeTrack(false, [])], 200)).not.toThrow();
	});
});
