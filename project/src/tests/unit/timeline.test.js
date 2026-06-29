
import { describe, it, expect, beforeEach } from 'vitest';

function makeSoundData(overrides = {}) {
	return {
		id: 'sound_1',
		name: 'Test Sine',
		wave_type: 'sine',
		frequency: 200,
		frequency_end: 200,
		amplitude: 0.7,
		duration: 100,
		envelope: [],
		...overrides
	};
}

let store;

beforeEach(async () => {
	
	const mod = await import('$lib/stores/timeline.svelte.js');
	store = mod.timelineStore;
	store.clear();
	store.snapToGrid = false; 
});

describe('TimelineStore – track management (FR-005, US-025, US-026)', () => {
	it('starts with no tracks after clear()', () => {
		expect(store.tracks).toHaveLength(0);
	});

	it('addTrack() adds a track and returns its id', () => {
		const id = store.addTrack('Drums');
		expect(store.tracks).toHaveLength(1);
		expect(store.tracks[0].id).toBe(id);
		expect(store.tracks[0].name).toBe('Drums');
	});

	it('addTrack() auto-names if no name provided', () => {
		store.addTrack();
		expect(store.tracks[0].name).toBe('Track 1');
		store.addTrack();
		expect(store.tracks[1].name).toBe('Track 2');
	});

	it('addTrack() sets defaults (muted=false, volume=1)', () => {
		store.addTrack('T');
		const t = store.tracks[0];
		expect(t.muted).toBe(false);
		expect(t.volume).toBe(1);
		expect(t.blocks).toHaveLength(0);
	});

	it('removeTrack() removes the correct track', () => {
		const id1 = store.addTrack('A');
		const id2 = store.addTrack('B');
		store.removeTrack(id1);
		expect(store.tracks).toHaveLength(1);
		expect(store.tracks[0].id).toBe(id2);
	});

	it('removeTrack() with unknown id leaves tracks unchanged', () => {
		store.addTrack('A');
		store.removeTrack('nonexistent');
		expect(store.tracks).toHaveLength(1);
	});

	it('updateTrack() updates the specified track', () => {
		const id = store.addTrack('A');
		store.updateTrack(id, { name: 'Renamed', volume: 0.5 });
		expect(store.tracks[0].name).toBe('Renamed');
		expect(store.tracks[0].volume).toBe(0.5);
	});

	it('toggleTrackMute() toggles muted state (US-027)', () => {
		const id = store.addTrack('A');
		expect(store.tracks[0].muted).toBe(false);
		store.toggleTrackMute(id);
		expect(store.tracks[0].muted).toBe(true);
		store.toggleTrackMute(id);
		expect(store.tracks[0].muted).toBe(false);
	});
});

describe('TimelineStore – block management (FR-005, US-032, US-033)', () => {
	it('addSoundToTrack() creates a new track when trackId is null', () => {
		store.addSoundToTrack(makeSoundData(), null, 0);
		expect(store.tracks).toHaveLength(1);
		expect(store.tracks[0].blocks).toHaveLength(1);
	});

	it('addSoundToTrack() adds to existing track', () => {
		const tid = store.addTrack('T');
		store.addSoundToTrack(makeSoundData(), tid, 0);
		store.addSoundToTrack(makeSoundData({ name: 'Sound 2' }), tid, 200);
		expect(store.tracks[0].blocks).toHaveLength(2);
	});

	it('addSoundToTrack() sets correct block properties', () => {
		const tid = store.addTrack('T');
		store.addSoundToTrack(makeSoundData(), tid, 150);
		const block = store.tracks[0].blocks[0];
		expect(block.wave_type).toBe('sine');
		expect(block.frequency).toBe(200);
		expect(block.amplitude).toBe(0.7);
		expect(block.duration).toBe(100);
		expect(block.startTime).toBe(150);
		expect(block.muted).toBe(false);
	});

	it('addSoundToTrack() sets selectedBlockId', () => {
		const tid = store.addTrack('T');
		const blockId = store.addSoundToTrack(makeSoundData(), tid, 0);
		expect(store.selectedBlockId).toBe(blockId);
	});

	it('deleteBlock() removes the block from its track (US-031)', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.deleteBlock(bid);
		expect(store.tracks[0].blocks).toHaveLength(0);
	});

	it('deleteBlock() clears selectedBlockId if it matches', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.selectedBlockId = bid;
		store.deleteBlock(bid);
		expect(store.selectedBlockId).toBeNull();
	});

	it('duplicateBlock() creates a copy offset by the source duration', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData({ duration: 100 }), tid, 0);
		store.duplicateBlock(bid);
		expect(store.tracks[0].blocks).toHaveLength(2);
		const copy = store.tracks[0].blocks[1];
		expect(copy.startTime).toBe(100);
		expect(copy.id).not.toBe(bid);
	});

	it('resizeBlock() changes duration with minimum clamp (US-033)', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.resizeBlock(bid, 300);
		expect(store.tracks[0].blocks[0].duration).toBe(300);
	});

	it('resizeBlock() clamps to a minimum of 10 ms', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.resizeBlock(bid, 0);
		expect(store.tracks[0].blocks[0].duration).toBe(10);
	});

	it('toggleBlockMute() toggles block muted flag (US-031)', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.toggleBlockMute(bid);
		expect(store.tracks[0].blocks[0].muted).toBe(true);
		store.toggleBlockMute(bid);
		expect(store.tracks[0].blocks[0].muted).toBe(false);
	});
});

describe('TimelineStore – block positioning (FR-006, US-030)', () => {
	it('moveBlock() changes the block startTime', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.moveBlock(bid, 500);
		expect(store.tracks[0].blocks[0].startTime).toBe(500);
	});

	it('moveBlock() with targetTrackId moves block between tracks', () => {
		const tid1 = store.addTrack('A');
		const tid2 = store.addTrack('B');
		const bid = store.addSoundToTrack(makeSoundData(), tid1, 0);
		store.moveBlock(bid, 200, tid2);
		expect(store.tracks.find((t) => t.id === tid1).blocks).toHaveLength(0);
		expect(store.tracks.find((t) => t.id === tid2).blocks).toHaveLength(1);
		expect(store.tracks.find((t) => t.id === tid2).blocks[0].startTime).toBe(200);
	});

	it('snap() rounds to nearest gridSize (US-030)', () => {
		store.gridSize = 50;
		expect(store.snap(60)).toBe(50);
		expect(store.snap(76)).toBe(100);
		expect(store.snap(25)).toBe(50);
	});

	it('moveBlock() snaps when snapToGrid is enabled', () => {
		store.snapToGrid = true;
		store.gridSize = 100;
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.moveBlock(bid, 130);
		expect(store.tracks[0].blocks[0].startTime).toBe(100);
	});
});

describe('TimelineStore – filter management (FR-006, US-035, US-036)', () => {
	it('setBlockFilter() attaches a filter config to a block', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		const filterCfg = {
			enabled: true,
			frequency: 50,
			frequencyEnabled: true,
			amplitude: 0.1,
			amplitudeEnabled: false,
			duration: 0,
			durationEnabled: false,
			fadeIn: 20,
			fadeInEnabled: true,
			fadeOut: 20,
			fadeOutEnabled: true
		};
		store.setBlockFilter(bid, filterCfg);
		expect(store.tracks[0].blocks[0].filter).toEqual(filterCfg);
	});

	it('setBlockFilter() can set filter to null (disable)', () => {
		const tid = store.addTrack('T');
		const bid = store.addSoundToTrack(makeSoundData(), tid, 0);
		store.setBlockFilter(bid, null);
		expect(store.tracks[0].blocks[0].filter).toBeNull();
	});
});

describe('TimelineStore – totalDuration (FR-005)', () => {
	it('returns at least 3000 ms when no blocks', () => {
		store.addTrack('Empty');
		expect(store.totalDuration).toBeGreaterThanOrEqual(3000);
	});

	it('extends past the last block end time', () => {
		const tid = store.addTrack('T');
		store.addSoundToTrack(makeSoundData({ duration: 500 }), tid, 2000);
		
		expect(store.totalDuration).toBeGreaterThanOrEqual(3500);
	});
});

describe('TimelineStore – serialize/load (FR-008, US-043, US-044)', () => {
	it('serialize() returns a plain JSON-safe array', () => {
		const tid = store.addTrack('T');
		store.addSoundToTrack(makeSoundData(), tid, 0);
		const data = store.serialize();
		
		const reparsed = JSON.parse(JSON.stringify(data));
		expect(reparsed).toHaveLength(1);
		expect(reparsed[0].blocks).toHaveLength(1);
	});

	it('load() restores tracks from serialized data', () => {
		const tid = store.addTrack('T');
		store.addSoundToTrack(makeSoundData(), tid, 0);
		const data = store.serialize();
		store.clear();
		store.load(data);
		expect(store.tracks).toHaveLength(1);
		expect(store.tracks[0].blocks).toHaveLength(1);
	});

	it('load() with null/undefined clears tracks gracefully', () => {
		store.addTrack('T');
		store.load(null);
		expect(store.tracks).toHaveLength(0);
	});

	it('clear() resets all state', () => {
		store.addTrack('T');
		store.selectedBlockId = 'something';
		store.selectedTrackId = 'otherthing';
		store.clear();
		expect(store.tracks).toHaveLength(0);
		expect(store.selectedBlockId).toBeNull();
		expect(store.selectedTrackId).toBeNull();
	});
});
