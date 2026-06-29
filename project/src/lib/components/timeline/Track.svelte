<script>
	
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import { editorStore } from '$lib/stores/editor.svelte.js';
	import { audioDeviceStore } from '$lib/stores/audioDevice.svelte.js';
	import SoundBlock from './SoundBlock.svelte';

	
	let { track, pixelsPerMs, trackHeight, headerWidth } = $props();

	let draggingBlockId = $state(null);
	let dragStartX = 0;
	let dragStartTime = 0;

	function onTrackPointerDown(e) {
		
		if (e.target === e.currentTarget) {
			timelineStore.selectedBlockId = null;
		}
	}

	function onDragStart(e, blockId) {
		draggingBlockId = blockId;
		dragStartX = e.clientX;
		const block = track.blocks.find(b => b.id === blockId);
		dragStartTime = block?.startTime ?? 0;

		const onMove = (ev) => {
			if (!draggingBlockId) return;
			const deltaX = ev.clientX - dragStartX;
			const deltaMs = deltaX / pixelsPerMs;
			const newTime = Math.max(0, dragStartTime + deltaMs);

			
			const pointedEl = document.elementFromPoint(ev.clientX, ev.clientY);
			const trackEl = pointedEl?.closest('[data-track-id]');
			const targetTrackId = trackEl?.dataset?.trackId;

			if (targetTrackId && targetTrackId !== track.id) {
				timelineStore.moveBlock(blockId, newTime, targetTrackId);
				
				draggingBlockId = null;
			} else {
				timelineStore.moveBlock(blockId, newTime);
			}
		};
		const onUp = () => {
			draggingBlockId = null;
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function editTrackName() {
		const newName = prompt('Rename track:', track.name);
		if (newName?.trim()) {
			timelineStore.updateTrack(track.id, { name: newName.trim() });
		}
	}

	function removeTrack() {
		if (confirm(`Remove track "${track.name}"?`)) {
			timelineStore.removeTrack(track.id);
		}
	}

	function toggleFilter() {
		timelineStore.updateTrack(track.id, { filterEnabled: !track.filterEnabled });
		if (!track.filterEnabled) {
			timelineStore.selectedTrackId = track.id;
		}
	}
</script>

<div
	class="flex border-b border-white/5"
	style="height: {trackHeight}px"
>
	
	<div
		class="flex-none flex flex-col justify-center px-2 gap-0.5 bg-base-300 border-r border-white/10"
		style="width: {headerWidth}px; min-width: {headerWidth}px"
	>
		
		<button
			class="text-left text-xs font-medium truncate w-full hover:text-primary transition-colors leading-tight"
			onclick={editTrackName}
			title="Click to rename"
		>
			{track.name}
		</button>

		
		<div class="flex items-center gap-1">
			<button
				class="btn btn-ghost btn-xs px-1 h-5 min-h-0 text-xs {track.muted ? 'text-warning' : 'text-base-content/60'}"
				onclick={() => timelineStore.toggleTrackMute(track.id)}
				title={track.muted ? 'Unmute track' : 'Mute track'}
			>
				{track.muted ? 'M' : 'M'}
			</button>

			
			<input
				type="range"
				min="0" max="1" step="0.05"
				class="range range-xs range-primary w-16"
				value={track.volume}
				oninput={(e) => timelineStore.updateTrack(track.id, { volume: Number(e.currentTarget.value) })}
				title={`Volume: ${Math.round(track.volume * 100)}%`}
			/>

			<button
				class="btn btn-ghost btn-xs px-1 h-5 min-h-0 text-[10px] {track.filterEnabled ? 'text-purple-400' : 'text-base-content/30'}"
				onclick={toggleFilter}
				title="Toggle track filter"
			>F</button>

			<button
				class="btn btn-ghost btn-xs px-1 h-5 min-h-0 text-[10px] text-error/60 hover:text-error ml-auto"
				onclick={removeTrack}
				title="Remove track"
			>✕</button>
		</div>

		
		{#if track.filterEnabled}
			<div class="badge badge-xs badge-ghost text-purple-400 border-purple-400/30">filter on</div>
		{/if}

		
		{#if audioDeviceStore.channelCount > 1}
			<div class="flex items-center gap-0.5 mt-0.5">
				<span class="text-[9px] text-base-content/40 uppercase tracking-wide leading-none">Ch</span>
				<select
					class="select select-ghost select-xs h-4 min-h-0 text-[10px] text-primary w-10 p-0 leading-none"
					value={track.channelIndex ?? 0}
					onchange={(e) => timelineStore.updateTrack(track.id, { channelIndex: Number(e.currentTarget.value) })}
					title="Output channel for this track"
				>
					{#each Array.from({ length: audioDeviceStore.channelCount }, (_, i) => i) as ch}
						<option value={ch}>{ch + 1}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	
	
	<div
		class="relative flex-1 overflow-visible"
		data-track-id={track.id}
		style="background: var(--track-bg);"
		onpointerdown={onTrackPointerDown}
	>
		
		{#if track.filterEnabled}
			<div class="absolute inset-0 filter-overlay pointer-events-none" style="z-index: 1"></div>
		{/if}

		
		{#each track.blocks as block (block.id)}
			<SoundBlock
				{block}
				trackId={track.id}
				{pixelsPerMs}
				{trackHeight}
				onDragStart={(e, id) => onDragStart(e, id)}
			/>
		{/each}
	</div>
</div>
