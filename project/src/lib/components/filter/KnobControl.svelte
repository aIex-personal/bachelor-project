<script>
	

	
	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		label = '',
		unit = '',
		enabled = true,
		onchange,
		ontoggle,
		size = 48
	} = $props();

	let knobEl = $state();
	let dragging = $state(false);
	let startY = 0;
	let startValue = 0;

	function onPointerDown(e) {
		if (!enabled) return;
		dragging = true;
		startY = e.clientY;
		startValue = value;
		knobEl.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e) {
		if (!dragging) return;
		const delta = (startY - e.clientY) / 120; 
		const newVal = Math.max(min, Math.min(max, startValue + delta * (max - min)));
		
		const snapped = Math.round(newVal / step) * step;
		onchange?.(snapped);
	}

	function onPointerUp() {
		dragging = false;
	}

	
	const rotation = $derived(
		((value - min) / (max - min)) * 270 - 135
	);

	const displayValue = $derived(
		step >= 1 ? Math.round(value) : value.toFixed(1)
	);
</script>

<div class="flex flex-col items-center gap-1 select-none {!enabled ? 'opacity-40' : ''}">
	
	<div
		bind:this={knobEl}
		class="relative rounded-full cursor-ns-resize {dragging ? 'scale-110' : ''} transition-transform"
		style="width: {size}px; height: {size}px; background: radial-gradient(circle at 40% 35%, #2d3748, #1a202c); border: 2px solid {enabled ? '#38bdf8' : '#4a5568'}; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		role="slider"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-label={label}
		tabindex="0"
		onkeydown={(e) => {
			if (e.code === 'ArrowUp') onchange?.(Math.min(max, value + step));
			if (e.code === 'ArrowDown') onchange?.(Math.max(min, value - step));
		}}
	>
		
		<div
			class="absolute rounded-full"
			style="
				width: 3px; height: 40%;
				background: {enabled ? '#38bdf8' : '#4a5568'};
				left: 50%; top: 8%;
				transform-origin: bottom center;
				transform: translateX(-50%) rotate({rotation}deg);
			"
		></div>
	</div>

	
	<div class="text-xs font-mono text-base-content/70 bg-base-300 px-1.5 py-0.5 rounded min-w-12 text-center">
		{displayValue}{unit}
	</div>

	
	<div class="flex flex-col items-center gap-0.5">
		<span class="text-[10px] text-base-content/50 uppercase tracking-wider">{label}</span>
		{#if ontoggle}
			<button
				class="btn btn-xs {enabled ? 'btn-primary' : 'btn-ghost'} h-4 min-h-0 px-2 text-[10px]"
				onclick={() => ontoggle?.()}
			>
				{enabled ? 'On' : 'Off'}
			</button>
		{/if}
	</div>
</div>
