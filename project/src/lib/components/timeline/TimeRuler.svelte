<script>
	
	import { onMount, onDestroy } from 'svelte';

	
	let { totalMs = 5000, pixelsPerMs = 0.5, scrollLeft = 0, height = 32 } = $props();

	
	let canvas;
	let containerEl;
	let ro;
	let w = $state(800);

	$effect(() => {
		
		if (canvas) draw();
	});

	function draw() {
		if (!canvas) return;
		canvas.width = w;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, w, height);

		
		ctx.fillStyle = '#0a0a12';
		ctx.fillRect(0, 0, w, height);

		
		const visibleMs = w / pixelsPerMs;
		let majorInterval = 500; 
		let minorInterval = 100;

		if (visibleMs < 2000) { majorInterval = 100; minorInterval = 25; }
		else if (visibleMs < 5000) { majorInterval = 200; minorInterval = 50; }
		else if (visibleMs < 10000) { majorInterval = 500; minorInterval = 100; }
		else if (visibleMs < 30000) { majorInterval = 1000; minorInterval = 250; }

		const startMs = scrollLeft / pixelsPerMs;
		const endMs = startMs + visibleMs;

		ctx.font = '10px monospace';
		ctx.textBaseline = 'top';

		
		const minorStart = Math.floor(startMs / minorInterval) * minorInterval;
		for (let ms = minorStart; ms <= endMs; ms += minorInterval) {
			const x = (ms - startMs) * pixelsPerMs;
			ctx.fillStyle = 'rgba(255,255,255,0.15)';
			ctx.fillRect(x, height - 8, 1, 8);
		}

		
		const majorStart = Math.floor(startMs / majorInterval) * majorInterval;
		for (let ms = majorStart; ms <= endMs + majorInterval; ms += majorInterval) {
			const x = (ms - startMs) * pixelsPerMs;
			if (x < -100 || x > w + 50) continue;

			ctx.fillStyle = 'rgba(255,255,255,0.4)';
			ctx.fillRect(x, 0, 1, height);

			
			const label = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)}s`;
			ctx.fillStyle = 'rgba(255,255,255,0.5)';
			ctx.fillText(label, x + 3, 4);
		}
	}

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				w = entry.contentRect.width || 800;
				draw();
			}
		});
		if (containerEl) ro.observe(containerEl);
		draw();
	});

	onDestroy(() => ro?.disconnect());
</script>

<div bind:this={containerEl} style="height: {height}px; position: relative; overflow: hidden;">
	<canvas bind:this={canvas} style="position: absolute; left: 0; top: 0; width: 100%; height: {height}px;"></canvas>
</div>
