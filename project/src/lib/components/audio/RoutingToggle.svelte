<script>
	
	import { audioDeviceStore } from '$lib/stores/audioDevice.svelte.js';
	import { playbackStore } from '$lib/stores/playback.svelte.js';

	async function setMode(mode) {
		if (audioDeviceStore.routingMode === mode) return;
		audioDeviceStore.routingMode = mode;

		
		if (playbackStore.isPlaying) {
			playbackStore.stop();
			await playbackStore.play();
		} else {
			playbackStore.applyMultiChannel();
		}
	}

	const isMixed     = $derived(audioDeviceStore.routingMode === 'mixed');
	const isSeparated = $derived(audioDeviceStore.routingMode === 'separated');
</script>

<div
	class="join rounded-full border border-white/10 bg-base-300"
	title="Audio routing mode"
	role="group"
	aria-label="Audio routing mode"
>
	<button
		class="join-item btn btn-sm rounded-full px-3 transition-colors
		       {isMixed ? 'bg-primary text-primary-content shadow-inner' : 'btn-ghost text-base-content/50 hover:text-base-content'}"
		onclick={() => setMode('mixed')}
		aria-pressed={isMixed}
		title="Mixed — all tracks play on the same output"
	>
		
		<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12 7-12 7zM3 6l6 1M3 18l6-1" />
		</svg>
		Mixed
	</button>

	<button
		class="join-item btn btn-sm rounded-full px-3 transition-colors
		       {isSeparated ? 'bg-secondary text-secondary-content shadow-inner' : 'btn-ghost text-base-content/50 hover:text-base-content'}"
		onclick={() => setMode('separated')}
		aria-pressed={isSeparated}
		title="Separated — each track routes to its own output channel"
	>
		
		<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M8 6l4-4 4 4M8 18l4 4 4-4M12 2v5M12 17v5M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4" />
		</svg>
		Separated
	</button>
</div>
