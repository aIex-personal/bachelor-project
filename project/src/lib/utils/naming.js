

const WAVE_PREFIXES = {
	sine: 'Sine',
	triangle: 'Triangle',
	square: 'Square',
	sawtooth: 'Saw'
};

const FREQ_LABELS = [
	[80,   'Bass'],
	[200,  'Low'],
	[500,  'Mid'],
	[1000, 'High'],
	[Infinity, 'Ultra']
];

const AMP_LABELS = [
	[0.3, 'Light'],
	[0.6, 'Medium'],
	[0.85, 'Strong'],
	[Infinity, 'Max']
];

const DUR_LABELS = [
	[50,   'Tap'],
	[150,  'Short'],
	[400,  'Medium'],
	[1000, 'Long'],
	[Infinity, 'Extended']
];

function getLabel(value, thresholds) {
	for (const [threshold, label] of thresholds) {
		if (value <= threshold) return label;
	}
	return thresholds[thresholds.length - 1][1];
}

export function generateSoundName(waveType, frequency, amplitude, duration) {
	const prefix = WAVE_PREFIXES[waveType] ?? 'Wave';
	const freqLabel = getLabel(frequency, FREQ_LABELS);
	const ampLabel = getLabel(amplitude, AMP_LABELS);

	if (duration !== undefined) {
		const durLabel = getLabel(duration, DUR_LABELS);
		return `${prefix}${freqLabel}${ampLabel}${durLabel}`;
	}

	return `${prefix}${freqLabel}${ampLabel}`;
}

export function generateProjectName(existingNames = []) {
	let n = 1;
	while (existingNames.includes(`Haptic Pattern ${n}`)) {
		n++;
	}
	return `Haptic Pattern ${n}`;
}

export function generatePatternName(existingNames = []) {
	let n = 1;
	while (existingNames.includes(`Pattern ${n}`)) {
		n++;
	}
	return `Pattern ${n}`;
}

export function generateTrackName(trackCount) {
	return `Track ${trackCount + 1}`;
}

export function sanitizeName(name, fallback = 'Untitled') {
	const trimmed = name?.replace(/\s+/g, ' ').trim();
	return trimmed || fallback;
}

export function makeUnique(base, existing = []) {
	if (!existing.includes(base)) return base;
	let n = 2;
	while (existing.includes(`${base} (${n})`)) n++;
	return `${base} (${n})`;
}
