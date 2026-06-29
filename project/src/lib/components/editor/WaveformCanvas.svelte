<script>
	import { onMount, onDestroy } from 'svelte';
	import { generateWaveformPoints, drawWaveform, WAVE_COLORS } from '$lib/utils/waveform.js';

	
	let {
		waveType = 'sine',
		points = undefined,
		width = 0,
		height = 80,
		filled = true,
		cycles = 3,
		class: className = ''
	} = $props();

	
	let canvas;
	let containerEl;
	let ro;
	let actualWidth = $state(200);

	const colors = $derived(WAVE_COLORS[waveType] ?? WAVE_COLORS.sine);
	const displayPoints = $derived(points ?? generateWaveformPoints(waveType, cycles));

	$effect(() => {
		
		if (canvas) draw();
	});

	function draw() {
		canvas.width = actualWidth;
		canvas.height = height;
		drawWaveform(canvas, displayPoints, {
			strokeColor: colors.stroke,
			fillColor: colors.fill,
			lineWidth: 2,
			filled
		});
	}

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				actualWidth = entry.contentRect.width || 200;
				draw();
			}
		});
		if (containerEl) ro.observe(containerEl);
		
		else draw();
	});

	onDestroy(() => {
		ro?.disconnect();
	});
</script>

<div bind:this={containerEl} class="w-full {className}" style="height: {height}px">
	<canvas bind:this={canvas} style="width: 100%; height: {height}px; display: block;"></canvas>
</div>
