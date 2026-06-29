

let blockCounter = 0;
let trackCounter = 0;

function newBlockId() {
	return `blk_${Date.now()}_${blockCounter++}`;
}
function newTrackId() {
	return `trk_${Date.now()}_${trackCounter++}`;
}

function defaultFilter() {
	return {
		enabled: false,
		frequency: 0,
		frequencyEnabled: false,
		amplitude: 0,
		amplitudeEnabled: false,
		duration: 0,
		durationEnabled: false,
		fadeIn: 0,
		fadeInEnabled: false,
		fadeOut: 0,
		fadeOutEnabled: false
	};
}

class TimelineStore {
	
	tracks = $state([]);

	
	selectedBlockId = $state(null);

	
	selectedTrackId = $state(null);

	
	snapToGrid = $state(true);

	
	gridSize = $state(50);

	
	pixelsPerMs = $state(0.5);

	
	totalDuration = $derived(
		Math.max(
			3000,
			...this.tracks.flatMap((t) =>
				t.blocks.map((b) => b.startTime + b.duration)
			)
		) + 1000
	);

	
	addTrack(name = '') {
		const id = newTrackId();
		const n = name || `Track ${this.tracks.length + 1}`;
		
		
		const channelIndex = this.tracks.length;
		this.tracks = [...this.tracks, {
			id,
			name: n,
			muted: false,
			volume: 1,
			filterEnabled: false,
			filter: defaultFilter(),
			channelIndex,
			blocks: []
		}];
		return id;
	}

	
	removeTrack(trackId) {
		this.tracks = this.tracks.filter(t => t.id !== trackId);
	}

	
	updateTrack(trackId, updates) {
		this.tracks = this.tracks.map(t =>
			t.id === trackId ? { ...t, ...updates } : t
		);
	}

	
	toggleTrackMute(trackId) {
		const track = this.tracks.find(t => t.id === trackId);
		if (track) this.updateTrack(trackId, { muted: !track.muted });
	}

	
	addSoundToTrack(soundData, trackId = null, startTime = 0) {
		let tid = trackId;
		if (!tid) {
			tid = this.addTrack(soundData.name);
		}

		const block = {
			id: newBlockId(),
			soundId: soundData.id || '',
			name: soundData.name,
			wave_type: soundData.wave_type,
			frequency: soundData.frequency,
			frequency_end: soundData.frequency_end ?? soundData.frequency,
			amplitude: soundData.amplitude,
			duration: soundData.duration,
			startTime: this.snapToGrid ? this.snap(startTime) : startTime,
			muted: false,
			volume: 1,
			envelope: soundData.envelope ?? [],
			filter: null
		};

		this.tracks = this.tracks.map(t =>
			t.id === tid ? { ...t, blocks: [...t.blocks, block] } : t
		);

		this.selectedBlockId = block.id;
		return block.id;
	}

	
	addSoundToLastTrack(soundData) {
		const lastTrack = this.tracks[this.tracks.length - 1];
		if (!lastTrack) {
			return this.addSoundToTrack(soundData, null, 0);
		}
		const endTime = lastTrack.blocks.length > 0
			? Math.max(...lastTrack.blocks.map(b => b.startTime + b.duration))
			: 0;
		return this.addSoundToTrack(soundData, lastTrack.id, endTime);
	}

	
	moveBlock(blockId, newStartTime, targetTrackId) {
		const time = this.snapToGrid ? this.snap(newStartTime) : Math.max(0, newStartTime);

		if (targetTrackId) {
			let block;
			
			this.tracks = this.tracks.map(t => {
				const found = t.blocks.find(b => b.id === blockId);
				if (found) block = found;
				return { ...t, blocks: t.blocks.filter(b => b.id !== blockId) };
			});
			
			if (block) {
				this.tracks = this.tracks.map(t =>
					t.id === targetTrackId
						? { ...t, blocks: [...t.blocks, { ...block, startTime: time }] }
						: t
				);
			}
		} else {
			this.tracks = this.tracks.map(t => ({
				...t,
				blocks: t.blocks.map(b =>
					b.id === blockId ? { ...b, startTime: time } : b
				)
			}));
		}
	}

	
	resizeBlock(blockId, newDuration) {
		const dur = this.snapToGrid
			? this.snap(Math.max(10, newDuration))
			: Math.max(10, newDuration);

		this.tracks = this.tracks.map(t => ({
			...t,
			blocks: t.blocks.map(b => b.id === blockId ? { ...b, duration: dur } : b)
		}));
	}

	
	deleteBlock(blockId) {
		this.tracks = this.tracks.map(t => ({
			...t,
			blocks: t.blocks.filter(b => b.id !== blockId)
		}));
		if (this.selectedBlockId === blockId) this.selectedBlockId = null;
	}

	
	duplicateBlock(blockId) {
		let newId = null;
		this.tracks = this.tracks.map(t => {
			const src = t.blocks.find(b => b.id === blockId);
			if (!src) return t;
			const copy = { ...src, id: newBlockId(), startTime: src.startTime + src.duration };
			newId = copy.id;
			return { ...t, blocks: [...t.blocks, copy] };
		});
		if (newId) this.selectedBlockId = newId;
		return newId;
	}

	
	updateBlock(blockId, params) {
		this.tracks = this.tracks.map(t => ({
			...t,
			blocks: t.blocks.map(b => b.id === blockId ? { ...b, ...params } : b)
		}));
	}

	
	toggleBlockMute(blockId) {
		this.tracks = this.tracks.map(t => ({
			...t,
			blocks: t.blocks.map(b => b.id === blockId ? { ...b, muted: !b.muted } : b)
		}));
	}

	
	setBlockFilter(blockId, filter) {
		this.tracks = this.tracks.map(t => ({
			...t,
			blocks: t.blocks.map(b => b.id === blockId ? { ...b, filter } : b)
		}));
	}

	
	snap(time) {
		return Math.round(time / this.gridSize) * this.gridSize;
	}

	
	clear() {
		this.tracks = [];
		this.selectedBlockId = null;
		this.selectedTrackId = null;
	}

	
	serialize() {
		return JSON.parse(JSON.stringify(this.tracks));
	}

	
	load(tracks) {
		this.tracks = tracks ?? [];
		this.selectedBlockId = null;
	}
}

export const timelineStore = new TimelineStore();
