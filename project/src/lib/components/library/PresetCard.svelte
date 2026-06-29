<script>
	import WaveformCanvas from '$lib/components/editor/WaveformCanvas.svelte';
	import { getSharedEngine } from '$lib/audio/AudioEngine.js';

	
	let { sound, showDelete = false, onEdit, onAddToTimeline, onAddToNewTrack, onDelete } = $props();

	const engine = getSharedEngine();
	let playing = $state(false);

	const WAVE_ICONS = { sine: '∿', triangle: '⋀', square: '⊓', sawtooth: '⟋' };
	const WAVE_COLORS = { sine: 'text-sky-400', triangle: 'text-emerald-400', square: 'text-yellow-400', sawtooth: 'text-orange-400' };

	async function preview() {
		playing = true;
		await engine.preview(sound);
		setTimeout(() => (playing = false), sound.duration + 100);
	}

	function formatMs(ms) {
		if (!ms) return '—';
		return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
	}
</script>

<div class="preset-card group p-2 flex flex-col gap-1.5 rounded-lg">
	
	<div class="flex items-center gap-2">
		<span class="text-base {WAVE_COLORS[sound.wave_type] ?? ''}" title={sound.wave_type}>
			{WAVE_ICONS[sound.wave_type] ?? '~'}
		</span>
		<span class="font-medium text-xs truncate flex-1 leading-tight">{sound.name}</span>
		<span class="text-xs text-base-content/40 font-mono">{formatMs(sound.duration)}</span>
	</div>

	
	<div class="rounded overflow-hidden" style="height: 32px">
		<WaveformCanvas waveType={sound.wave_type} height={32} cycles={2} filled={false} class="opacity-70" />
	</div>

	
	{#if sound.tags?.length > 0}
		<div class="flex gap-1 flex-wrap">
			{#each (sound.tags ?? []).slice(0, 3) as tag}
				<span class="badge badge-xs badge-ghost">{tag}</span>
			{/each}
		</div>
	{/if}

	
	<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
		<button
			class="btn btn-xs btn-ghost flex-1 gap-1"
			onclick={preview}
			disabled={playing}
			title="Preview"
		>
			{playing ? '◼' : '▶'}
		</button>
		<button
			class="btn btn-xs btn-ghost flex-1"
			onclick={() => onEdit?.()}
			title="Edit"
		>Edit</button>
		
		<div class="join flex-1">
			<button
				class="btn btn-xs btn-secondary join-item flex-1"
				onclick={() => onAddToTimeline?.()}
				title="Add to timeline (last track)"
			>+TL</button>
			<div class="dropdown dropdown-top dropdown-end">
				<button tabindex="0" class="btn btn-xs btn-secondary join-item px-1" title="More options">▾</button>
				
				<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 p-1 shadow-lg border border-white/10 text-xs w-36">
					<li><button onclick={() => onAddToNewTrack?.()}>New track</button></li>
				</ul>
			</div>
		</div>
		{#if showDelete}
			<button
				class="btn btn-xs btn-ghost text-error btn-square"
				onclick={() => onDelete?.()}
				title="Delete"
			>✕</button>
		{/if}
	</div>
</div>
