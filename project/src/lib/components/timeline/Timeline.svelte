<script>
	import { onMount, onDestroy } from 'svelte';
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import { playbackStore } from '$lib/stores/playback.svelte.js';
	import TimeRuler from './TimeRuler.svelte';
	import Track from './Track.svelte';

	const TRACK_HEIGHT = 72;
	const HEADER_WIDTH = 180;
	const RULER_HEIGHT = 32;

	let containerEl;
	let scrollLeft = $state(0);
	let scrollEl;
	let rulerEl;
	let containerWidth = $state(800);
	let ro;

	const pxPerMs = $derived(timelineStore.pixelsPerMs);
	const totalMs = $derived(timelineStore.totalDuration);
	const totalPx = $derived(totalMs * pxPerMs);
	const cursorLeft = $derived(playbackStore.position * pxPerMs);

	
	$effect(() => {
		if (!playbackStore.isPlaying || !scrollEl) return;
		const scrollWidth = scrollEl.clientWidth;
		if (cursorLeft > scrollLeft + scrollWidth * 0.8) {
			scrollEl.scrollLeft = cursorLeft - scrollWidth * 0.3;
		}
	});

	function onScroll(e) {
		scrollLeft = e.currentTarget.scrollLeft;
	}

	function onKeyDown(e) {
		if (e.code === 'Delete' || e.code === 'Backspace') {
			if (timelineStore.selectedBlockId) {
				timelineStore.deleteBlock(timelineStore.selectedBlockId);
			}
		}
		if (e.code === 'Space' || e.code === 'KeyK') {
			e.preventDefault();
			if (playbackStore.isPlaying) playbackStore.pause();
			else playbackStore.play();
		}
	}

	function addTrack() {
		timelineStore.addTrack();
	}

	function clickOnRuler(e) {
		
		
		if (!rulerEl) return;
		const clientX = typeof e.clientX === 'number' ? e.clientX : 0;
		const rect = rulerEl.getBoundingClientRect();
		const x = clientX - rect.left + scrollLeft;
		const ms = x / pxPerMs;
		if (!Number.isFinite(ms)) return;
		playbackStore.seek(ms);
	}

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});
		if (containerEl) ro.observe(containerEl);
	});

	onDestroy(() => ro?.disconnect());
</script>

<svelte:window onkeydown={onKeyDown} />

<div
	bind:this={containerEl}
	class="flex flex-col h-full bg-base-200 select-none"
	style="min-width: 0"
>
	
	<div class="flex flex-none border-b border-white/10" style="height: {RULER_HEIGHT}px">
		
		<div
			class="flex-none bg-base-300 border-r border-white/10 flex items-center px-2"
			style="width: {HEADER_WIDTH}px"
		>
			<span class="text-xs text-base-content/30 font-mono">tracks</span>
		</div>

		
		<div bind:this={rulerEl} class="flex-1 overflow-hidden cursor-pointer" role="button" tabindex="0" onclick={clickOnRuler} onkeydown={(e) => e.key === ' ' && clickOnRuler(e)}>
			<TimeRuler totalMs={totalMs} pixelsPerMs={pxPerMs} scrollLeft={scrollLeft} height={RULER_HEIGHT} />
		</div>
	</div>

	
	<div class="flex-1 overflow-hidden flex flex-col min-h-0">
		<div
			class="flex-1 overflow-auto"
			bind:this={scrollEl}
			onscroll={onScroll}
		>
			
			<div class="relative" style="min-height: 100%">
				
				{#if timelineStore.tracks.length === 0}
					<div class="flex flex-col items-center justify-center h-48 gap-3 text-base-content/30">
						<span class="text-5xl">〰</span>
						<p class="text-sm">No tracks yet. Create a sound and add it to the timeline.</p>
						<button class="btn btn-ghost btn-sm" onclick={addTrack}>+ Add Empty Track</button>
					</div>
				{:else}
					
					<div style="min-width: {HEADER_WIDTH + totalPx + 100}px; position: relative">
						{#each timelineStore.tracks as track (track.id)}
							<Track
								{track}
								pixelsPerMs={pxPerMs}
								trackHeight={TRACK_HEIGHT}
								headerWidth={HEADER_WIDTH}
							/>
						{/each}

						
						{#if !playbackStore.isStopped}
							<div
								class="playback-cursor"
								style="left: {HEADER_WIDTH + cursorLeft}px; top: 0; height: {timelineStore.tracks.length * TRACK_HEIGHT}px"
							></div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	
	<div class="flex items-center gap-2 px-3 py-1.5 border-t border-white/10 bg-base-300 flex-none">
		<button class="btn btn-ghost btn-xs gap-1" onclick={addTrack}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Track
		</button>

		
		<div class="flex items-center gap-1 ml-auto">
			<button
				class="btn btn-ghost btn-xs btn-square"
				onclick={() => timelineStore.pixelsPerMs = Math.max(0.1, pxPerMs - 0.1)}
				title="Zoom out"
			>−</button>
			<span class="text-xs text-base-content/40 font-mono w-12 text-center">
				{Math.round(pxPerMs * 100) / 100}px/ms
			</span>
			<button
				class="btn btn-ghost btn-xs btn-square"
				onclick={() => timelineStore.pixelsPerMs = Math.min(5, pxPerMs + 0.1)}
				title="Zoom in"
			>+</button>
		</div>

		<span class="text-xs text-base-content/20">
			{timelineStore.tracks.length} track{timelineStore.tracks.length !== 1 ? 's' : ''} ·
			{Math.round(totalMs)}ms total
		</span>
	</div>
</div>
