<script>
	
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import { editorStore } from '$lib/stores/editor.svelte.js';
	import { drawMiniWaveform } from '$lib/utils/waveform.js';
	import { onMount } from 'svelte';

	
	let { block, trackId, pixelsPerMs, trackHeight, onDragStart } = $props();

	const RESIZE_HANDLE_W = 8;
	let canvasEl;

	const isSelected = $derived(timelineStore.selectedBlockId === block.id);

	const blockWidth = $derived(Math.max(20, block.duration * pixelsPerMs));
	const blockLeft = $derived(block.startTime * pixelsPerMs);

	const BLOCK_CLASS = {
		sine: 'block-sine',
		triangle: 'block-triangle',
		square: 'block-square',
		sawtooth: 'block-sawtooth'
	};

	$effect(() => {
		if (canvasEl) {
			const color = { sine: '#38bdf8', triangle: '#34d399', square: '#fbbf24', sawtooth: '#f97316' }[block.wave_type];
			drawMiniWaveform(canvasEl, block.wave_type, color ? `${color}99` : 'rgba(255,255,255,0.4)');
		}
	});

	let resizing = false;
	let dragging = false;
	let startX = 0;
	let startDuration = 0;

	function onBlockPointerDown(e) {
		if (e.button !== 0) return;
		e.stopPropagation();
		timelineStore.selectedBlockId = block.id;
		onDragStart?.(e, block.id);
	}

	function onResizePointerDown(e) {
		e.stopPropagation();
		e.preventDefault();
		resizing = true;
		startX = e.clientX;
		startDuration = block.duration;

		const onMove = (ev) => {
			if (!resizing) return;
			const delta = (ev.clientX - startX) / pixelsPerMs;
			timelineStore.resizeBlock(block.id, startDuration + delta);
		};
		const onUp = () => {
			resizing = false;
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function onContextMenu(e) {
		e.preventDefault();
		
		timelineStore.duplicateBlock(block.id);
	}

	function toggleMute(e) {
		e.stopPropagation();
		timelineStore.toggleBlockMute(block.id);
	}

	function deleteBlock(e) {
		e.stopPropagation();
		timelineStore.deleteBlock(block.id);
	}

	function sendToEditor(e) {
		e.stopPropagation();
		editorStore.loadForEdit({ ...block, id: block.soundId || '' }, block.id);
	}
</script>

<div
	class="absolute select-none border rounded sound-block group
		{BLOCK_CLASS[block.wave_type] ?? 'block-sine'}
		{isSelected ? 'block-selected' : ''}
		{block.muted ? 'block-muted' : ''}
	"
	style="
		left: {blockLeft}px;
		top: 4px;
		width: {blockWidth}px;
		height: {trackHeight - 8}px;
		cursor: grab;
	"
	onpointerdown={onBlockPointerDown}
	oncontextmenu={onContextMenu}
	role="button"
	tabindex="0"
>
	
	<canvas
		bind:this={canvasEl}
		style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.6"
		width={blockWidth}
		height={trackHeight - 8}
	></canvas>

	
	<div class="absolute inset-0 flex items-center px-1.5 overflow-hidden pointer-events-none">
		<span class="text-white/80 text-[10px] font-mono truncate leading-none">
			{block.name}
		</span>
	</div>

	
	<div class="absolute top-0.5 right-10 hidden group-hover:flex gap-0.5 z-10">
		<button
			class="w-4 h-4 rounded text-[9px] bg-black/60 text-sky-300 hover:text-sky-200 leading-none"
			onclick={sendToEditor}
			title="Edit in sidebar"
		>✎</button>
	</div>

	
	<div class="absolute top-0.5 right-5 hidden group-hover:flex gap-0.5 z-10">
		<button
			class="w-4 h-4 rounded text-[9px] bg-black/60 text-white/70 hover:text-white leading-none"
			onclick={toggleMute}
			title={block.muted ? 'Unmute' : 'Mute'}
		>
			{block.muted ? '▷' : '◼'}
		</button>
	</div>

	
	<div class="absolute top-0.5 right-0.5 hidden group-hover:flex z-10">
		<button
			class="w-4 h-4 rounded text-[9px] bg-black/60 text-red-400 hover:text-red-300 leading-none"
			onclick={deleteBlock}
			title="Delete"
		>✕</button>
	</div>

	
	<div
		class="absolute right-0 top-0 bottom-0 cursor-ew-resize hover:bg-white/20 rounded-r"
		style="width: {RESIZE_HANDLE_W}px"
		onpointerdown={onResizePointerDown}
		role="separator"
	></div>
</div>
