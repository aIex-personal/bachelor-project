
import { describe, it, expect, beforeEach } from 'vitest';

let store;

beforeEach(async () => {
	const mod = await import('$lib/stores/editor.svelte.js');
	store = mod.editorStore;
	store.reset();
});

describe('EditorStore – defaults', () => {
	it('starts in "new" tab', () => {
		expect(store.activeTab).toBe('new');
	});

	it('default sound has sensible values', () => {
		expect(store.sound.wave_type).toBe('sine');
		expect(store.sound.frequency).toBe(200);
		expect(store.sound.amplitude).toBe(0.7);
		expect(store.sound.duration).toBe(100);
		expect(store.sound.envelope).toEqual([]);
	});

	it('starts clean (not dirty, not saving)', () => {
		expect(store.isDirty).toBe(false);
		expect(store.isSaving).toBe(false);
	});

	it('editingId is null for new sounds', () => {
		expect(store.editingId).toBeNull();
	});
});

describe('EditorStore – newSound()', () => {
	it('resets to blank sound (US-007)', () => {
		store.updateField('frequency', 999);
		store.newSound();
		expect(store.sound.frequency).toBe(200);
	});

	it('clears editingId', () => {
		store.editingId = 'existing_id';
		store.newSound();
		expect(store.editingId).toBeNull();
	});

	it('switches to "new" tab', () => {
		store.activeTab = 'edit';
		store.newSound();
		expect(store.activeTab).toBe('new');
	});

	it('clears isDirty', () => {
		store.updateField('frequency', 500);
		store.newSound();
		expect(store.isDirty).toBe(false);
	});
});

describe('EditorStore – loadForEdit() (US-015, US-016)', () => {
	const soundFixture = {
		id: 'abc123',
		name: 'My Sound',
		wave_type: 'square',
		frequency: 440,
		frequency_end: 440,
		amplitude: 0.8,
		duration: 200,
		envelope: [{ time: 0.5, frequency: 600 }],
		tags: ['tag1'],
		category: 'kick',
		notes: 'test note'
	};

	it('loads all fields into the store', () => {
		store.loadForEdit(soundFixture);
		expect(store.sound.name).toBe('My Sound');
		expect(store.sound.wave_type).toBe('square');
		expect(store.sound.frequency).toBe(440);
		expect(store.sound.amplitude).toBe(0.8);
		expect(store.sound.duration).toBe(200);
	});

	it('sets editingId', () => {
		store.loadForEdit(soundFixture);
		expect(store.editingId).toBe('abc123');
	});

	it('switches to "edit" tab', () => {
		store.loadForEdit(soundFixture);
		expect(store.activeTab).toBe('edit');
	});

	it('clears isDirty on load', () => {
		store.isDirty = true;
		store.loadForEdit(soundFixture);
		expect(store.isDirty).toBe(false);
	});

	it('preserves envelope points', () => {
		store.loadForEdit(soundFixture);
		expect(store.sound.envelope).toHaveLength(1);
		expect(store.sound.envelope[0].time).toBe(0.5);
		expect(store.sound.envelope[0].frequency).toBe(600);
	});
});

describe('EditorStore – updateField() (US-007–US-011)', () => {
	it('updates wave_type (US-007)', () => {
		store.updateField('wave_type', 'triangle');
		expect(store.sound.wave_type).toBe('triangle');
	});

	it('updates amplitude (US-008)', () => {
		store.updateField('amplitude', 0.3);
		expect(store.sound.amplitude).toBe(0.3);
	});

	it('updates frequency (US-009)', () => {
		store.updateField('frequency', 880);
		expect(store.sound.frequency).toBe(880);
	});

	it('updates duration (US-010)', () => {
		store.updateField('duration', 500);
		expect(store.sound.duration).toBe(500);
	});

	it('marks isDirty after any field update', () => {
		expect(store.isDirty).toBe(false);
		store.updateField('frequency', 300);
		expect(store.isDirty).toBe(true);
	});

	it('auto-generates name when name is blank (US-012)', () => {
		store.sound.name = '';
		store.updateField('frequency', 300);
		expect(store.sound.name.length).toBeGreaterThan(0);
	});

	it('preserves existing name when not blank', () => {
		store.sound.name = 'My Custom Name';
		store.updateField('frequency', 300);
		expect(store.sound.name).toBe('My Custom Name');
	});
});

describe('EditorStore – autoName() (US-012)', () => {
	it('generates a non-empty display name from current params', () => {
		store.sound.wave_type = 'sine';
		store.sound.frequency = 200;
		store.sound.amplitude = 0.7;
		store.autoName();
		expect(store.sound.name.length).toBeGreaterThan(0);
	});

	it('name changes when params change', () => {
		store.sound.wave_type = 'sine';
		store.sound.frequency = 200;
		store.sound.amplitude = 0.5;
		store.autoName();
		const name1 = store.sound.name;

		store.sound.frequency = 1000;
		store.autoName();
		const name2 = store.sound.name;

		expect(name1).not.toBe(name2);
	});
});

describe('EditorStore – reset()', () => {
	it('resets all state to defaults', () => {
		store.updateField('frequency', 999);
		store.editingId = 'xyz';
		store.activeTab = 'edit';
		store.reset();
		expect(store.sound.frequency).toBe(200);
		expect(store.editingId).toBeNull();
		expect(store.activeTab).toBe('new');
		expect(store.isDirty).toBe(false);
	});
});

describe('EditorStore – notify()', () => {
	it('sets notification and type', () => {
		store.notify('Saved!', 'success');
		expect(store.notification).toBe('Saved!');
		expect(store.notifType).toBe('success');
	});

	it('defaults type to success', () => {
		store.notify('Done');
		expect(store.notifType).toBe('success');
	});

	it('clears notification after ~3 seconds', async () => {
		vi.useFakeTimers();
		store.notify('Hello');
		expect(store.notification).toBe('Hello');
		vi.advanceTimersByTime(3100);
		expect(store.notification).toBeNull();
		vi.useRealTimers();
	});
});
