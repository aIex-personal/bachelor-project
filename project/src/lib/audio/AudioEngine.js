
export class AudioEngine {
	
	context;

	
	#activeSources = [];

	
	#channelCount = 2;

	
	#merger = null;

	constructor() {
		this.context = new AudioContext();
	}

	
	get channelCount() { return this.#channelCount; }

	
	setupMultiChannel(n) {
		const max = this.context.destination.maxChannelCount;
		const ch = Math.min(Math.max(1, n), max);

		if (ch === this.#channelCount && this.#merger !== null) return; 

		
		if (this.#merger) {
			try { this.#merger.disconnect(); } catch (_) {}
			this.#merger = null;
		}

		this.#channelCount = ch;

		
		this.context.destination.channelCount = ch;
		this.context.destination.channelCountMode = 'explicit';
		this.context.destination.channelInterpretation = 'discrete';

		
		this.#merger = this.context.createChannelMerger(ch);
		this.#merger.connect(this.context.destination);
	}

	
	async setOutputDevice(deviceId) {
		if (typeof this.context.setSinkId === 'function') {
			await this.context.setSinkId(deviceId || '');
		}
	}

	
	resetToStereo() {
		if (this.#merger) {
			try { this.#merger.disconnect(); } catch (_) {}
			this.#merger = null;
		}
		this.#channelCount = 2;
		
		try {
			this.context.destination.channelCount = 2;
			this.context.destination.channelCountMode = 'max';
			this.context.destination.channelInterpretation = 'speakers';
		} catch (_) {}
	}

	
	async resume() {
		if (this.context.state === 'suspended') {
			await this.context.resume();
		}
	}

	
	createSound(params, startAt, channelIndex) {
		const {
			wave_type = 'sine',
			frequency = 200,
			frequency_end,
			amplitude = 0.7,
			duration = 100,
			envelope = [],
			filter = null
		} = params;

		const ctx = this.context;
		const start = (startAt != null && Number.isFinite(startAt)) ? startAt : ctx.currentTime;
		const durationSec = duration / 1000;

		
		const safeFreq = Math.max(20, Math.min(20000, isNaN(frequency) ? 200 : frequency));
		const rawEnd = frequency_end ?? frequency;
		const freqEnd = Math.max(20, Math.min(20000, isNaN(rawEnd) ? safeFreq : rawEnd));

		
		const osc = ctx.createOscillator();
		osc.type = wave_type;
		osc.frequency.setValueAtTime(safeFreq, start);

		
		if (envelope && envelope.length > 0) {
			for (const point of envelope) {
				const pf = Math.max(20, Math.min(20000, isNaN(point.frequency) ? safeFreq : point.frequency));
				osc.frequency.setValueAtTime(pf, start + point.time * durationSec);
			}
		} else if (freqEnd !== safeFreq) {
			osc.frequency.linearRampToValueAtTime(freqEnd, start + durationSec);
		}

		
		const gain = ctx.createGain();
		let ampValue = Math.max(0, Math.min(1, Number.isFinite(amplitude) ? amplitude : 0.7));
		let fadeInMs = 0;
		let fadeOutMs = 0;

		if (filter?.enabled) {
			if (filter.amplitudeEnabled) ampValue = Math.max(0, Math.min(1, ampValue + (Number.isFinite(filter.amplitude) ? filter.amplitude : 0)));
			if (filter.fadeInEnabled) fadeInMs = Math.max(0, filter.fadeIn);
			if (filter.fadeOutEnabled) fadeOutMs = Math.max(0, filter.fadeOut);
		}

		const safeDuration = Number.isFinite(duration) ? Math.max(10, duration) : 100;
		const effectiveDuration = filter?.enabled && filter.durationEnabled
			? Math.max(10, safeDuration + (Number.isFinite(filter.duration) ? filter.duration : 0))
			: safeDuration;
		const effectiveDurSec = effectiveDuration / 1000;

		gain.gain.setValueAtTime(fadeInMs > 0 ? 0 : ampValue, start);
		if (fadeInMs > 0) {
			gain.gain.linearRampToValueAtTime(ampValue, start + fadeInMs / 1000);
		}
		if (fadeOutMs > 0) {
			const fadeOutStart = Math.max(start, start + effectiveDurSec - fadeOutMs / 1000);
			gain.gain.setValueAtTime(ampValue, fadeOutStart);
			gain.gain.linearRampToValueAtTime(0, start + effectiveDurSec);
		}

		osc.connect(gain);

		
		
		const merger = this.#merger;
		if (
			merger !== null &&
			typeof channelIndex === 'number' &&
			channelIndex >= 0 &&
			channelIndex < this.#channelCount
		) {
			gain.connect(merger, 0, channelIndex);
		} else {
			gain.connect(this.context.destination);
		}

		osc.start(start);
		osc.stop(start + effectiveDurSec);

		this.#activeSources.push(osc);

		osc.onended = () => {
			this.#activeSources = this.#activeSources.filter(s => s !== osc);
			try { osc.disconnect(); } catch (_) {}
			try { gain.disconnect(); } catch (_) {}
		};

		return {
			source: osc,
			gain,
			stop: () => {
				try { osc.stop(); } catch (_) {}
			}
		};
	}

	
	async preview(params) {
		await this.resume();
		this.createSound(params);
	}

	
	scheduleTimeline(tracks, fromMs, audioStartTime, routingMode = 'mixed') {
		for (let trackIdx = 0; trackIdx < tracks.length; trackIdx++) {
			const track = tracks[trackIdx];
			if (track.muted) continue;

			
			
			const chIdx = routingMode === 'separated'
				? ((track.channelIndex !== undefined && track.channelIndex !== null)
					? track.channelIndex
					: trackIdx)
				: undefined;

			for (const block of track.blocks) {
				if (block.muted) continue;

				
				const blockEndMs = block.startTime + block.duration;
				if (blockEndMs <= fromMs) continue;

				const offsetMs = block.startTime - fromMs;
				const audioTime = audioStartTime + Math.max(0, offsetMs) / 1000;

				
				const trimMs = offsetMs < 0 ? -offsetMs : 0;
				const params = {
					wave_type: block.wave_type,
					frequency: block.frequency,
					frequency_end: block.frequency_end,
					amplitude: block.amplitude * track.volume,
					duration: block.duration - trimMs,
					envelope: block.envelope,
					filter: block.filter ?? (track.filterEnabled ? track.filter : null)
				};

				this.createSound(params, audioTime, chIdx);
			}
		}
	}

	
	stopAll() {
		for (const src of this.#activeSources) {
			try { src.stop(); } catch (_) {}
		}
		this.#activeSources = [];
	}
}

let _sharedEngine = null;

export function getSharedEngine() {
	if (!_sharedEngine) _sharedEngine = new AudioEngine();
	return _sharedEngine;
}
