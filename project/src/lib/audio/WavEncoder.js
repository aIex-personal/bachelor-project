

const SAMPLE_RATE = 44100;
const BIT_DEPTH = 16;
const NUM_CHANNELS = 1;

function waveSample(type, phase) {
	switch (type) {
		case 'sine':
			return Math.sin(2 * Math.PI * phase);
		case 'triangle':
			return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
		case 'square':
			return phase < 0.5 ? 1 : -1;
		case 'sawtooth':
			return 2 * phase - 1;
		default:
			return 0;
	}
}

function interpolateFrequency(envelope, t, baseFreq, endFreq) {
	if (!envelope || envelope.length === 0) {
		
		return baseFreq + (endFreq - baseFreq) * t;
	}

	
	const sorted = [...envelope].sort((a, b) => a.time - b.time);

	if (t <= sorted[0].time) return sorted[0].frequency;
	if (t >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].frequency;

	for (let i = 0; i < sorted.length - 1; i++) {
		if (t >= sorted[i].time && t <= sorted[i + 1].time) {
			const ratio = (t - sorted[i].time) / (sorted[i + 1].time - sorted[i].time);
			return sorted[i].frequency + (sorted[i + 1].frequency - sorted[i].frequency) * ratio;
		}
	}
	return baseFreq;
}

export function generateSamples(params) {
	const {
		wave_type = 'sine',
		frequency = 200,
		frequency_end,
		amplitude = 0.7,
		duration = 100,
		envelope = [],
		filter = null
	} = params;

	let effectiveDuration = duration;
	let effectiveAmplitude = amplitude;
	let fadeInMs = 0;
	let fadeOutMs = 0;

	if (filter?.enabled) {
		if (filter.durationEnabled) effectiveDuration = Math.max(10, duration + filter.duration);
		if (filter.amplitudeEnabled) effectiveAmplitude = Math.max(0, Math.min(1, amplitude + filter.amplitude));
		if (filter.fadeInEnabled) fadeInMs = Math.max(0, filter.fadeIn);
		if (filter.fadeOutEnabled) fadeOutMs = Math.max(0, filter.fadeOut);
	}

	const freqEnd = frequency_end ?? frequency;
	const numSamples = Math.floor(SAMPLE_RATE * effectiveDuration / 1000);
	const samples = new Float32Array(numSamples);
	let phase = 0;

	for (let i = 0; i < numSamples; i++) {
		const t = i / numSamples;
		const freq = interpolateFrequency(envelope, t, frequency, freqEnd);
		phase += freq / SAMPLE_RATE;
		if (phase >= 1) phase -= 1;

		let value = waveSample(wave_type, phase) * effectiveAmplitude;

		
		if (fadeInMs > 0) {
			const fadeInSamples = Math.floor(SAMPLE_RATE * fadeInMs / 1000);
			if (i < fadeInSamples) {
				value *= i / fadeInSamples;
			}
		}

		
		if (fadeOutMs > 0) {
			const fadeOutSamples = Math.floor(SAMPLE_RATE * fadeOutMs / 1000);
			const fadeOutStart = numSamples - fadeOutSamples;
			if (i >= fadeOutStart) {
				value *= (numSamples - i) / fadeOutSamples;
			}
		}

		samples[i] = value;
	}

	return samples;
}

export function mixSounds(soundsWithOffsets, totalDurationMs) {
	const totalSamples = Math.ceil(SAMPLE_RATE * totalDurationMs / 1000);
	const mixed = new Float32Array(totalSamples);

	for (const { samples, offsetMs } of soundsWithOffsets) {
		const offsetSamples = Math.floor(SAMPLE_RATE * offsetMs / 1000);
		for (let i = 0; i < samples.length; i++) {
			if (offsetSamples + i < totalSamples) {
				mixed[offsetSamples + i] += samples[i];
			}
		}
	}

	
	let max = 0;
	for (let i = 0; i < mixed.length; i++) {
		const abs = Math.abs(mixed[i]);
		if (abs > max) max = abs;
	}
	if (max > 1) {
		for (let i = 0; i < mixed.length; i++) {
			mixed[i] /= max;
		}
	}

	return mixed;
}

export function encodeWav(samples) {
	const dataLength = samples.length * 2; 
	const buffer = new ArrayBuffer(44 + dataLength);
	const view = new DataView(buffer);

	const writeString = (offset, str) => {
		for (let i = 0; i < str.length; i++) {
			view.setUint8(offset + i, str.charCodeAt(i));
		}
	};

	
	writeString(0, 'RIFF');
	view.setUint32(4, 36 + dataLength, true);
	writeString(8, 'WAVE');

	
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);           
	view.setUint16(20, 1, true);            
	view.setUint16(22, NUM_CHANNELS, true);
	view.setUint32(24, SAMPLE_RATE, true);
	view.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * (BIT_DEPTH / 8), true); 
	view.setUint16(32, NUM_CHANNELS * (BIT_DEPTH / 8), true); 
	view.setUint16(34, BIT_DEPTH, true);

	
	writeString(36, 'data');
	view.setUint32(40, dataLength, true);

	
	for (let i = 0; i < samples.length; i++) {
		const clamped = Math.max(-1, Math.min(1, samples[i]));
		view.setInt16(44 + i * 2, clamped * 0x7fff, true);
	}

	return new Blob([buffer], { type: 'audio/wav' });
}

export function exportSoundToWav(params) {
	const samples = generateSamples(params);
	return encodeWav(samples);
}

export function exportProjectToWav(tracks, totalDurationMs) {
	const soundsWithOffsets = [];

	for (const track of tracks) {
		if (track.muted) continue;
		for (const block of track.blocks) {
			if (block.muted) continue;
			const samples = generateSamples({
				wave_type: block.wave_type,
				frequency: block.frequency,
				frequency_end: block.frequency_end,
				amplitude: block.amplitude * track.volume,
				duration: block.duration,
				envelope: block.envelope,
				filter: block.filter ?? (track.filterEnabled ? track.filter : null)
			});
			soundsWithOffsets.push({ samples, offsetMs: block.startTime });
		}
	}

	const mixed = mixSounds(soundsWithOffsets, totalDurationMs);
	return encodeWav(mixed);
}

export function encodeWavMultiChannel(channelBuffers) {
	const numChannels = channelBuffers.length;
	const numFrames   = channelBuffers[0].length;
	const dataLength  = numFrames * numChannels * 2; 
	const buffer      = new ArrayBuffer(44 + dataLength);
	const view        = new DataView(buffer);

	const writeString = (offset, str) => {
		for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
	};

	
	writeString(0, 'RIFF');
	view.setUint32(4, 36 + dataLength, true);
	writeString(8, 'WAVE');

	
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);                                          
	view.setUint16(20, 1, true);                                           
	view.setUint16(22, numChannels, true);
	view.setUint32(24, SAMPLE_RATE, true);
	view.setUint32(28, SAMPLE_RATE * numChannels * (BIT_DEPTH / 8), true); 
	view.setUint16(32, numChannels * (BIT_DEPTH / 8), true);               
	view.setUint16(34, BIT_DEPTH, true);

	
	writeString(36, 'data');
	view.setUint32(40, dataLength, true);

	
	let offset = 44;
	for (let frame = 0; frame < numFrames; frame++) {
		for (let ch = 0; ch < numChannels; ch++) {
			const clamped = Math.max(-1, Math.min(1, channelBuffers[ch][frame]));
			view.setInt16(offset, clamped * 0x7fff, true);
			offset += 2;
		}
	}

	return new Blob([buffer], { type: 'audio/wav' });
}

export function exportProjectToWavMultiChannel(tracks, totalDurationMs, numChannels) {
	const totalSamples = Math.ceil(SAMPLE_RATE * totalDurationMs / 1000);

	
	
	const channelBuffers = Array.from({ length: numChannels }, () => new Float32Array(totalSamples));

	for (let trackIdx = 0; trackIdx < tracks.length; trackIdx++) {
		const track = tracks[trackIdx];
		if (track.muted) continue;

		
		const chIdx = (track.channelIndex !== undefined && track.channelIndex !== null)
			? track.channelIndex
			: trackIdx;
		const ch = Math.min(Math.max(0, chIdx), numChannels - 1);

		for (const block of track.blocks) {
			if (block.muted) continue;

			const samples = generateSamples({
				wave_type:     block.wave_type,
				frequency:     block.frequency,
				frequency_end: block.frequency_end,
				amplitude:     block.amplitude * track.volume,
				duration:      block.duration,
				envelope:      block.envelope,
				filter:        block.filter ?? (track.filterEnabled ? track.filter : null)
			});

			const offsetSamples = Math.floor(SAMPLE_RATE * block.startTime / 1000);
			for (let i = 0; i < samples.length; i++) {
				if (offsetSamples + i < totalSamples) {
					channelBuffers[ch][offsetSamples + i] += samples[i];
				}
			}
		}
	}

	
	for (const buf of channelBuffers) {
		let max = 0;
		for (let i = 0; i < buf.length; i++) {
			const abs = Math.abs(buf[i]);
			if (abs > max) max = abs;
		}
		if (max > 1) {
			for (let i = 0; i < buf.length; i++) buf[i] /= max;
		}
	}

	return encodeWavMultiChannel(channelBuffers);
}

export function downloadWav(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
	a.click();
	URL.revokeObjectURL(url);
}
