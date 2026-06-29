<script>
	import { onMount, onDestroy } from 'svelte';
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import KnobControl from './KnobControl.svelte';

	let collapsed = $state(false);

	
	const selectedTrack = $derived(
		timelineStore.selectedTrackId
			? timelineStore.tracks.find(t => t.id === timelineStore.selectedTrackId)
			: null
	);

	const selectedBlock = $derived(
		timelineStore.selectedBlockId
			? timelineStore.tracks.flatMap(t => t.blocks).find(b => b.id === timelineStore.selectedBlockId)
			: null
	);

	
	let filter = $state({
		enabled: false,
		frequency: 0,
		frequencyEnabled: false,
		amplitude: 0,
		amplitudeEnabled: false,
		duration: 0,
		durationEnabled: false,
		fadeIn: 0,
		fadeInEnabled: false,
		fadeOut: 30,
		fadeOutEnabled: false
	});

	
	$effect(() => {
		if (selectedBlock?.filter) {
			filter = { ...selectedBlock.filter };
		} else if (selectedTrack?.filter) {
			filter = { ...selectedTrack.filter };
		}
	});

	function applyFilter() {
		if (selectedBlock) {
			timelineStore.setBlockFilter(selectedBlock.id, { ...filter });
		} else if (selectedTrack) {
			timelineStore.updateTrack(selectedTrack.id, { filter: { ...filter } });
		}
	}

	function applyToAll() {
		for (const track of timelineStore.tracks) {
			timelineStore.updateTrack(track.id, { filter: { ...filter }, filterEnabled: filter.enabled });
		}
	}

	
	let canvasEl = $state();
	let containerEl = $state();
	let ro;
	let w = $state(200);
	const H = 80;

	$effect(() => {
		if (canvasEl) drawCurve();
	});

	function drawCurve() {
		if (!canvasEl) return;
		canvasEl.width = w;
		canvasEl.height = H;
		const ctx = canvasEl.getContext('2d');
		ctx.clearRect(0, 0, w, H);

		
		ctx.fillStyle = 'rgba(148,0,211,0.1)';
		ctx.fillRect(0, 0, w, H);

		
		const fadeInPx = filter.fadeInEnabled ? (filter.fadeIn / 100) * w * 0.3 : 0;
		const fadeOutPx = filter.fadeOutEnabled ? (filter.fadeOut / 100) * w * 0.3 : 0;

		ctx.beginPath();
		ctx.moveTo(0, H);
		ctx.lineTo(fadeInPx, 0);
		ctx.lineTo(w - fadeOutPx, 0);
		ctx.lineTo(w, H);
		ctx.strokeStyle = '#9c27b0';
		ctx.lineWidth = 2;
		ctx.stroke();

		ctx.fillStyle = 'rgba(156,39,176,0.2)';
		ctx.fill();
	}

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const e of entries) {
				w = e.contentRect.width || 200;
				drawCurve();
			}
		});
		if (containerEl) ro.observe(containerEl);
		drawCurve();
	});
	onDestroy(() => ro?.disconnect());
</script>

<div class="flex flex-col bg-base-300 border-t border-white/10 flex-none">
	
	<button
		class="flex items-center gap-2 px-4 py-2 text-left hover:bg-white/5 transition w-full"
		onclick={() => collapsed = !collapsed}
	>
		<span class="text-base font-bold text-purple-400">Filter</span>
		{#if !filter.enabled}
			<span class="badge badge-xs badge-ghost text-base-content/40">off</span>
		{:else}
			<span class="badge badge-xs text-white" style="background: #9c27b0">active</span>
		{/if}
		{#if selectedBlock}
			<span class="text-xs text-base-content/40">→ block: {selectedBlock.name}</span>
		{:else if selectedTrack}
			<span class="text-xs text-base-content/40">→ track: {selectedTrack.name}</span>
		{:else}
			<span class="text-xs text-base-content/30">Select a block or track</span>
		{/if}
		<span class="ml-auto text-base-content/40">{collapsed ? '▲' : '▼'}</span>
	</button>

	{#if !collapsed}
		<div class="flex gap-4 px-4 pb-3 items-start overflow-x-auto">
			
			<div class="flex flex-col gap-2 min-w-40">
				
				<div class="flex items-center gap-2">
					<span class="text-xs text-base-content/50">Filter all sounds</span>
					<button
						class="btn btn-xs {filter.enabled ? 'btn-error' : 'btn-ghost text-base-content/30'}"
						onclick={() => { filter.enabled = !filter.enabled; applyFilter(); }}
					>
						{filter.enabled ? '● On' : '● Off'}
					</button>
				</div>

				
				<div class="flex gap-1">
					<button class="btn btn-xs btn-ghost border border-white/10 flex-1" onclick={applyFilter}>
						Apply
					</button>
					<button class="btn btn-xs btn-ghost border border-white/10 flex-1" onclick={applyToAll}>
						All Tracks
					</button>
				</div>
			</div>

			
			<div class="flex gap-4 flex-1 flex-wrap justify-center">
				<KnobControl
					bind:value={filter.frequency}
					min={-500} max={500} step={5}
					label="Frequency" unit="Hz"
					enabled={filter.frequencyEnabled}
					onchange={(v) => { filter.frequency = v; applyFilter(); }}
					ontoggle={() => { filter.frequencyEnabled = !filter.frequencyEnabled; applyFilter(); }}
				/>
				<KnobControl
					bind:value={filter.amplitude}
					min={-1} max={1} step={0.05}
					label="Amplitude" unit=""
					enabled={filter.amplitudeEnabled}
					onchange={(v) => { filter.amplitude = v; applyFilter(); }}
					ontoggle={() => { filter.amplitudeEnabled = !filter.amplitudeEnabled; applyFilter(); }}
				/>
				<KnobControl
					bind:value={filter.duration}
					min={-1000} max={2000} step={10}
					label="Duration" unit="ms"
					enabled={filter.durationEnabled}
					onchange={(v) => { filter.duration = v; applyFilter(); }}
					ontoggle={() => { filter.durationEnabled = !filter.durationEnabled; applyFilter(); }}
				/>
				<KnobControl
					bind:value={filter.fadeIn}
					min={0} max={200} step={5}
					label="Fade In" unit="ms"
					enabled={filter.fadeInEnabled}
					onchange={(v) => { filter.fadeIn = v; applyFilter(); }}
					ontoggle={() => { filter.fadeInEnabled = !filter.fadeInEnabled; applyFilter(); }}
				/>
				<KnobControl
					bind:value={filter.fadeOut}
					min={0} max={200} step={5}
					label="Fade Out" unit="ms"
					enabled={filter.fadeOutEnabled}
					onchange={(v) => { filter.fadeOut = v; applyFilter(); }}
					ontoggle={() => { filter.fadeOutEnabled = !filter.fadeOutEnabled; applyFilter(); }}
				/>
			</div>

			
			<div
				bind:this={containerEl}
				class="rounded-lg overflow-hidden border border-purple-500/20 min-w-40 flex-1 max-w-56"
				style="height: {H}px"
			>
				<canvas bind:this={canvasEl} style="width: 100%; height: {H}px; display: block"></canvas>
			</div>
		</div>
	{/if}
</div>
