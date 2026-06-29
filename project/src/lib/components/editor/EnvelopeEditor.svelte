<script>
	
	let { points = $bindable([]), baseFreq = 200, maxFreq = 20000, onchange, height = 100 } = $props();

	import { onMount, onDestroy } from 'svelte';

	
	let canvas;
	let containerEl;
	let ro;
	let w = $state(300);
	const h = $derived(height);

	const POINT_RADIUS = 6;

	let draggingIdx = $state(-1);

	$effect(() => {
		
		if (canvas) draw(points);
	});

	function freqToY(freq) {
		return h - (freq / maxFreq) * h;
	}

	function yToFreq(y) {
		return Math.max(0, Math.min(maxFreq, ((h - y) / h) * maxFreq));
	}

	function draw(pts) {
		if (!canvas) return;
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');

		
		ctx.fillStyle = 'rgba(0,0,0,0.3)';
		ctx.fillRect(0, 0, w, h);

		
		const baseY = freqToY(baseFreq);
		ctx.strokeStyle = 'rgba(255,255,255,0.1)';
		ctx.setLineDash([4, 4]);
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, baseY);
		ctx.lineTo(w, baseY);
		ctx.stroke();
		ctx.setLineDash([]);

		if (!pts || pts.length === 0) {
			
			ctx.strokeStyle = 'rgba(56,189,248,0.5)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(0, baseY);
			ctx.lineTo(w, baseY);
			ctx.stroke();
			return;
		}

		
		const sorted = [...pts].sort((a, b) => a.time - b.time);

		
		ctx.strokeStyle = '#38bdf8';
		ctx.lineWidth = 2;
		ctx.lineJoin = 'round';
		ctx.beginPath();

		const startY = freqToY(baseFreq);
		ctx.moveTo(0, startY);

		for (const pt of sorted) {
			const x = pt.time * w;
			const y = freqToY(pt.frequency);
			ctx.lineTo(x, y);
		}

		
		const lastPt = sorted[sorted.length - 1];
		ctx.lineTo(w, freqToY(lastPt.frequency));
		ctx.stroke();

		
		for (let i = 0; i < pts.length; i++) {
			const pt = pts[i];
			const x = pt.time * w;
			const y = freqToY(pt.frequency);

			ctx.beginPath();
			ctx.arc(x, y, POINT_RADIUS, 0, Math.PI * 2);
			ctx.fillStyle = draggingIdx === i ? '#fff' : '#38bdf8';
			ctx.fill();
			ctx.strokeStyle = '#0f172a';
			ctx.lineWidth = 2;
			ctx.stroke();

			
			ctx.fillStyle = 'rgba(255,255,255,0.7)';
			ctx.font = '10px monospace';
			ctx.fillText(`${Math.round(pt.frequency)}Hz`, x + 8, y - 4);
		}
	}

	function getHitIndex(x, y) {
		for (let i = 0; i < points.length; i++) {
			const px = points[i].time * w;
			const py = freqToY(points[i].frequency);
			const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
			if (dist <= POINT_RADIUS + 4) return i;
		}
		return -1;
	}

	function onPointerDown(e) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const hit = getHitIndex(x, y);
		if (hit >= 0) {
			draggingIdx = hit;
			canvas.setPointerCapture(e.pointerId);
		} else {
			
			const time = Math.max(0, Math.min(1, x / w));
			const frequency = yToFreq(y);
			const newPoints = [...points, { time, frequency }];
			onchange?.(newPoints);
		}
	}

	function onPointerMove(e) {
		if (draggingIdx < 0) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const time = Math.max(0, Math.min(1, x / w));
		const frequency = yToFreq(y);

		const newPoints = points.map((pt, i) =>
			i === draggingIdx ? { time, frequency } : pt
		);
		onchange?.(newPoints);
	}

	function onPointerUp() {
		draggingIdx = -1;
	}

	function onDblClick(e) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const hit = getHitIndex(x, y);
		if (hit >= 0) {
			const newPoints = points.filter((_, i) => i !== hit);
			onchange?.(newPoints);
		}
	}

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				w = entry.contentRect.width || 300;
				draw(points);
			}
		});
		if (containerEl) ro.observe(containerEl);
		draw(points);
	});

	onDestroy(() => ro?.disconnect());
</script>

<div bind:this={containerEl} class="w-full" style="height: {height}px">
	<canvas
		bind:this={canvas}
		style="width: 100%; height: {height}px; display: block; cursor: crosshair; border-radius: 6px;"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		ondblclick={onDblClick}
	></canvas>
	<p class="text-xs text-base-content/30 mt-1">Click to add points · Drag to move · Double-click to remove</p>
</div>
