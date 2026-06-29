import '@testing-library/jest-dom';

class MockAudioContext {
	currentTime = 0;
	state = 'running';

	createOscillator() {
		return {
			type: 'sine',
			frequency: {
				value: 440,
				setValueAtTime: vi.fn(),
				linearRampToValueAtTime: vi.fn(),
				cancelScheduledValues: vi.fn()
			},
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn(),
			disconnect: vi.fn(),
			addEventListener: vi.fn()
		};
	}

	createGain() {
		return {
			gain: {
				value: 1,
				setValueAtTime: vi.fn(),
				linearRampToValueAtTime: vi.fn(),
				cancelScheduledValues: vi.fn()
			},
			connect: vi.fn(),
			disconnect: vi.fn()
		};
	}

	get destination() {
		return { connect: vi.fn() };
	}

	resume() {
		return Promise.resolve();
	}

	close() {
		return Promise.resolve();
	}
}

global.AudioContext = MockAudioContext;

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
