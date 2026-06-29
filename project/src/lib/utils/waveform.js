

export function generateWaveformPoints(type, cycles = 3, points = 256) {
	const samples = [];
	for (let i = 0; i < points; i++) {
		const phase = ((i / points) * cycles) % 1;
		samples.push(waveSample(type, phase));
	}
	return samples;
}

export function waveSample(type, phase) {
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

export function drawWaveform(canvas, points, opts = {}) {
	const {
		strokeColor = '#38bdf8',
		fillColor = 'rgba(56,189,248,0.15)',
		lineWidth = 2,
		filled = true
	} = opts;

	const ctx = canvas.getContext('2d');
	const { width, height } = canvas;
	const mid = height / 2;

	ctx.clearRect(0, 0, width, height);

	if (!points || points.length === 0) return;

	ctx.beginPath();
	ctx.moveTo(0, mid);

	for (let i = 0; i < points.length; i++) {
		const x = (i / (points.length - 1)) * width;
		const y = mid - points[i] * (mid * 0.85);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}

	if (filled) {
		ctx.lineTo(width, mid);
		ctx.lineTo(0, mid);
		ctx.closePath();
		ctx.fillStyle = fillColor;
		ctx.fill();
	}

	
	ctx.beginPath();
	for (let i = 0; i < points.length; i++) {
		const x = (i / (points.length - 1)) * width;
		const y = mid - points[i] * (mid * 0.85);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lineWidth;
	ctx.lineJoin = 'round';
	ctx.stroke();
}

export function drawMiniWaveform(canvas, type, color = 'rgba(255,255,255,0.6)') {
	const points = generateWaveformPoints(type, 2, 64);
	drawWaveform(canvas, points, {
		strokeColor: color,
		fillColor: 'transparent',
		lineWidth: 1.5,
		filled: false
	});
}

export const WAVE_COLORS = {
	sine:     { stroke: '#38bdf8', fill: 'rgba(56,189,248,0.15)' },
	triangle: { stroke: '#34d399', fill: 'rgba(52,211,153,0.15)' },
	square:   { stroke: '#fbbf24', fill: 'rgba(251,191,36,0.15)' },
	sawtooth: { stroke: '#f97316', fill: 'rgba(249,115,22,0.15)' }
};
