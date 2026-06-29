<script>
	import { playbackStore } from '$lib/stores/playback.svelte.js';
	import { timelineStore } from '$lib/stores/timeline.svelte.js';

	
	let { onExport } = $props();

	function formatPosition(ms) {
		const totalSec = ms / 1000;
		const min = Math.floor(totalSec / 60);
		const sec = Math.floor(totalSec % 60);
		const msRem = Math.floor(ms % 1000);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${msRem.toString().padStart(3, '0')}`;
	}

	async function togglePlay() {
		if (playbackStore.isPlaying) {
			playbackStore.pause();
		} else {
			await playbackStore.play();
		}
	}
</script>

<div class="flex items-center gap-2">
	
	<button
		class="btn btn-ghost btn-sm btn-square {playbackStore.loop ? 'text-primary' : 'text-base-content/40'}"
		onclick={() => playbackStore.loop = !playbackStore.loop}
		title="Toggle loop"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
		</svg>
	</button>

	
	<button
		class="btn btn-primary btn-sm btn-square"
		onclick={togglePlay}
		disabled={timelineStore.tracks.length === 0}
		title={playbackStore.isPlaying ? 'Pause' : 'Play'}
	>
		{#if playbackStore.isPlaying}
			
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
				<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
			</svg>
		{:else}
			
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
				<polygon points="5,3 19,12 5,21"/>
			</svg>
		{/if}
	</button>

	
	<button
		class="btn btn-ghost btn-sm btn-square text-error"
		onclick={() => playbackStore.stop()}
		title="Stop"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
			<rect x="4" y="4" width="16" height="16" rx="1"/>
		</svg>
	</button>

	
	<span class="font-mono text-xs text-base-content/50 bg-base-300 px-2 py-1 rounded">
		{formatPosition(playbackStore.position)}
	</span>
</div>
