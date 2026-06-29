import { AudioEngine } from '$lib/audio/AudioEngine.js';
import { timelineStore } from './timeline.svelte.js';
import { audioDeviceStore } from './audioDevice.svelte.js';

class PlaybackStore {
	
	state = $state('stopped');

	
	position = $state(0);

	
	loop = $state(false);

	
	#rafId = null;

	
	#startAudioTime = 0;

	
	#startPosition = 0;

	
	#engine = null;

	get isPlaying() { return this.state === 'playing'; }
	get isPaused()  { return this.state === 'paused'; }
	get isStopped() { return this.state === 'stopped'; }

	
	getEngine() {
		if (!this.#engine) this.#engine = new AudioEngine();
		return this.#engine;
	}

	
	async play() {
		const engine = this.getEngine();

		if (this.state === 'paused') {
			
			this.#startPosition = this.position;
		} else {
			this.#startPosition = this.position;
		}

		await engine.resume();

		
		
		if (audioDeviceStore.selectedDeviceId) {
			try {
				await engine.setOutputDevice(audioDeviceStore.selectedDeviceId);
			} catch (e) {
				console.warn('Failed to set audio output device:', e);
			}
		}

		
		
		
		if (audioDeviceStore.routingMode === 'separated') {
			engine.setupMultiChannel(audioDeviceStore.channelCount);
		} else {
			engine.resetToStereo();
		}

		this.#startAudioTime = engine.context.currentTime;
		this.state = 'playing';

		
		engine.scheduleTimeline(
			timelineStore.tracks,
			this.#startPosition,
			this.#startAudioTime,
			audioDeviceStore.routingMode
		);

		this.#tick();
	}

	
	async applyAudioDevice() {
		if (!this.#engine) return;
		try {
			await this.#engine.setOutputDevice(audioDeviceStore.selectedDeviceId);
		} catch (e) {
			console.warn('Failed to hot-switch audio output device:', e);
		}
	}

	
	applyMultiChannel() {
		if (!this.#engine) return;
		if (audioDeviceStore.routingMode === 'separated') {
			this.#engine.setupMultiChannel(audioDeviceStore.channelCount);
		} else {
			this.#engine.resetToStereo();
		}
	}

	
	pause() {
		if (this.state !== 'playing') return;
		this.getEngine().stopAll();
		this.state = 'paused';
		if (this.#rafId) cancelAnimationFrame(this.#rafId);
		this.#rafId = null;
	}

	
	stop() {
		this.getEngine().stopAll();
		this.state = 'stopped';
		this.position = 0;
		if (this.#rafId) cancelAnimationFrame(this.#rafId);
		this.#rafId = null;
	}

	
	seek(positionMs) {
		if (!Number.isFinite(positionMs)) return;
		const wasPlaying = this.state === 'playing';
		if (wasPlaying) {
			this.getEngine().stopAll();
			if (this.#rafId) cancelAnimationFrame(this.#rafId);
		}
		this.position = Math.max(0, positionMs);
		if (wasPlaying) this.play();
	}

	
	#tick() {
		this.#rafId = requestAnimationFrame(() => {
			if (this.state !== 'playing') return;

			const engine = this.getEngine();
			const elapsed = (engine.context.currentTime - this.#startAudioTime) * 1000;
			this.position = this.#startPosition + elapsed;

			const total = timelineStore.totalDuration;
			if (this.position >= total) {
				if (this.loop) {
					this.position = 0;
					this.#startPosition = 0;
					this.#startAudioTime = engine.context.currentTime;
					engine.scheduleTimeline(timelineStore.tracks, 0, this.#startAudioTime);
				} else {
					this.stop();
					return;
				}
			}

			this.#tick();
		});
	}
}

export const playbackStore = new PlaybackStore();
