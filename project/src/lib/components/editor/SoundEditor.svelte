<script>
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { editorStore } from '$lib/stores/editor.svelte.js';
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import { AudioEngine } from '$lib/audio/AudioEngine.js';
	import { exportSoundToWav, downloadWav } from '$lib/audio/WavEncoder.js';
	import { generateSoundName } from '$lib/utils/naming.js';
	import WaveformCanvas from './WaveformCanvas.svelte';
	import EnvelopeEditor from './EnvelopeEditor.svelte';
	import PresetLibrary from '$lib/components/library/PresetLibrary.svelte';

	
	let { onSaved } = $props();

	let engine = new AudioEngine();
	let showEnvelope = $state(false);
	let previewPlaying = $state(false);

	const sound = $derived(editorStore.sound);
	const tab = $derived(editorStore.activeTab);

	const WAVE_TYPES = [
		{ value: 'sine',     label: 'Sine',     icon: '∿' },
		{ value: 'triangle', label: 'Triangle', icon: '⋀' },
		{ value: 'square',   label: 'Square',   icon: '⊓' },
		{ value: 'sawtooth', label: 'Saw',      icon: '⟋' }
	];

	async function previewSound() {
		previewPlaying = true;
		await engine.preview(sound);
		setTimeout(() => (previewPlaying = false), sound.duration + 100);
	}

	async function saveSound() {
		
		const freq = Number(sound.frequency);
		const amp = Number(sound.amplitude);
		const dur = Number(sound.duration);
		if (isNaN(freq) || freq < 20 || freq > 20000) {
			editorStore.notify('Frequency must be between 20 and 20 000 Hz.', 'error');
			return;
		}
		if (isNaN(amp) || amp < 0 || amp > 1) {
			editorStore.notify('Amplitude must be between 0 and 1.', 'error');
			return;
		}
		if (isNaN(dur) || dur < 10) {
			editorStore.notify('Duration must be at least 10 ms.', 'error');
			return;
		}

		editorStore.isSaving = true;
		try {
			const payload = {
				name: sound.name || generateSoundName(sound.wave_type, sound.frequency, sound.amplitude),
				owner: authStore.user?.id,
				wave_type: sound.wave_type,
				frequency: sound.frequency,
				frequency_end: sound.frequency_end,
				amplitude: sound.amplitude,
				duration: sound.duration,
				envelope: sound.envelope,
				tags: sound.tags,
				category: sound.category,
				notes: sound.notes
			};

			if (editorStore.editingId) {
				await pb.collection('sounds').update(editorStore.editingId, payload);
				editorStore.notify('Sound updated!');
			} else {
				const created = await pb.collection('sounds').create(payload);
				editorStore.editingId = created.id;
				editorStore.notify('Sound saved!');
			}

			editorStore.isDirty = false;
			onSaved?.();
		} catch (e) {
			editorStore.notify('Failed to save sound.', 'error');
			console.error(e);
		} finally {
			editorStore.isSaving = false;
		}
	}

	async function saveAsNew() {
		const orig = editorStore.editingId;
		editorStore.editingId = null;
		await saveSound();
		if (!editorStore.editingId) editorStore.editingId = orig;
	}

	function addToTimeline() {
		if (!sound.name) {
			editorStore.updateField('name', generateSoundName(sound.wave_type, sound.frequency, sound.amplitude));
		}
		timelineStore.addSoundToLastTrack({ ...sound });
		editorStore.notify('Added to timeline');
	}

	function addToNewTrack() {
		if (!sound.name) {
			editorStore.updateField('name', generateSoundName(sound.wave_type, sound.frequency, sound.amplitude));
		}
		timelineStore.addSoundToTrack({ ...sound }, null, 0);
		editorStore.notify('Added to new track');
	}

	function downloadPreview() {
		const blob = exportSoundToWav(sound);
		const name = sound.name || generateSoundName(sound.wave_type, sound.frequency, sound.amplitude);
		downloadWav(blob, name);
	}

	function applyToBlock() {
		timelineStore.updateBlock(editorStore.editingBlockId, {
			name: sound.name,
			wave_type: sound.wave_type,
			frequency: sound.frequency,
			frequency_end: sound.frequency_end,
			amplitude: sound.amplitude,
			duration: sound.duration,
			envelope: [...(sound.envelope ?? [])]
		});
		editorStore.notify('Block updated');
	}

	function formatMs(ms) {
		return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
	}
</script>

<div class="flex h-full flex-col bg-base-100 border-l border-white/5 w-72 min-w-72 overflow-y-auto">
	
	<div class="tabs tabs-bordered tabs-sm px-2 pt-2 flex-none">
		<button
			class="tab {tab === 'new' ? 'tab-active' : ''}"
			onclick={() => { editorStore.newSound(); }}
		>New</button>
		<button
			class="tab {tab === 'edit' ? 'tab-active' : ''}"
			onclick={() => editorStore.activeTab = 'edit'}
		>Edit</button>
		<button
			class="tab {tab === 'presets' ? 'tab-active' : ''}"
			onclick={() => { editorStore.activeTab = 'presets'; editorStore.editingBlockId = null; }}
		>Presets</button>
	</div>

	
	{#if tab === 'presets'}
		<div class="flex-1 overflow-y-auto">
			<PresetLibrary />
		</div>

	
	{:else}
		<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

			
			{#if tab === 'edit' && editorStore.editingBlockId}
				<div class="text-center text-xs text-accent bg-accent/10 rounded px-2 py-1">
					Editing timeline block
				</div>
			{:else if tab === 'edit' && editorStore.editingId}
				<div class="text-center text-xs text-base-content/40">
					Editing saved sound
				</div>
			{/if}

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Name</span>
				</div>
				<div class="flex gap-1">
					<input
						type="text"
						class="input input-bordered input-xs flex-1"
						placeholder="Auto-generate…"
						value={sound.name}
						oninput={(e) => editorStore.updateField('name', e.currentTarget.value)}
						maxlength="100"
					/>
					<button
						class="btn btn-ghost btn-xs btn-square"
						title="Auto-generate name"
						onclick={() => editorStore.autoName()}
					>✦</button>
				</div>
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Waveform</span>
				</div>
				<div class="grid grid-cols-4 gap-1">
					{#each WAVE_TYPES as wType}
						<button
							class="btn btn-sm flex-col h-12 gap-0 text-lg {sound.wave_type === wType.value ? 'btn-primary' : 'btn-ghost'}"
							onclick={() => editorStore.updateField('wave_type', wType.value)}
							title={wType.label}
						>
							<span>{wType.icon}</span>
							<span class="text-[10px] font-mono">{wType.label}</span>
						</button>
					{/each}
				</div>
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Duration</span>
					<span class="label-text-alt text-primary font-mono">{formatMs(sound.duration)}</span>
				</div>
				<input
					type="range"
					min="10" max="5000" step="10"
					class="range range-primary range-xs"
					value={sound.duration}
					oninput={(e) => editorStore.updateField('duration', Number(e.currentTarget.value))}
				/>
				<div class="flex justify-between text-xs text-base-content/30 mt-0.5">
					<span>10ms</span><span>5s</span>
				</div>
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Frequency</span>
					<span class="label-text-alt text-primary font-mono">{sound.frequency}Hz</span>
				</div>
				<input
					type="range"
					min="20" max="1000" step="5"
					class="range range-primary range-xs"
					value={sound.frequency}
					oninput={(e) => editorStore.updateField('frequency', Number(e.currentTarget.value))}
				/>
				<div class="flex justify-between text-xs text-base-content/30 mt-0.5">
					<span>20Hz</span><span>1000Hz</span>
				</div>
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Freq End (Sweep)</span>
					<span class="label-text-alt text-primary font-mono">{sound.frequency_end}Hz</span>
				</div>
				<input
					type="range"
					min="20" max="1000" step="5"
					class="range range-primary range-xs"
					value={sound.frequency_end}
					oninput={(e) => editorStore.updateField('frequency_end', Number(e.currentTarget.value))}
				/>
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Amplitude</span>
					<span class="label-text-alt text-primary font-mono">{Math.round(sound.amplitude * 100)}%</span>
				</div>
				<input
					type="range"
					min="0" max="1" step="0.01"
					class="range range-primary range-xs"
					value={sound.amplitude}
					oninput={(e) => editorStore.updateField('amplitude', Number(e.currentTarget.value))}
				/>
				<div class="flex justify-between text-xs text-base-content/30 mt-0.5">
					<span>0%</span><span>100%</span>
				</div>
			</div>

			
			<div class="border border-white/10 rounded-lg overflow-hidden">
				<button
					class="flex items-center justify-between w-full px-3 py-2 text-xs font-medium uppercase tracking-wider hover:bg-white/5 transition"
					onclick={() => showEnvelope = !showEnvelope}
				>
					<span>Frequency Envelope</span>
					<span class="text-base-content/50">{showEnvelope ? '▲' : '▼'}</span>
				</button>
				{#if showEnvelope}
					<div class="p-2">
						<EnvelopeEditor
							points={sound.envelope}
							baseFreq={sound.frequency}
							maxFreq={1000}
							height={90}
							onchange={(pts) => editorStore.updateField('envelope', pts)}
						/>
					</div>
				{/if}
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Tags</span>
				</div>
				<input
					type="text"
					class="input input-bordered input-xs w-full"
					placeholder="comma, separated, tags"
					value={(sound.tags ?? []).join(', ')}
					oninput={(e) => {
						const tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean);
						editorStore.updateField('tags', tags);
					}}
				/>
			</div>

			
			<div>
				<div class="label py-1">
					<span class="label-text text-xs font-medium uppercase tracking-wider">Preview</span>
				</div>
				<div class="rounded-lg overflow-hidden border border-white/10 bg-base-200">
					<WaveformCanvas waveType={sound.wave_type} height={80} filled={true} />
				</div>
				<div class="flex gap-1 mt-1">
					<button
						class="btn btn-ghost btn-xs flex-1 gap-1"
						onclick={previewSound}
						disabled={previewPlaying}
					>
						{previewPlaying ? '◼' : '▶'} Preview
					</button>
					<button
						class="btn btn-ghost btn-xs"
						onclick={downloadPreview}
						title="Download as WAV"
					>
						⬇
					</button>
				</div>
			</div>
		</div>

		
		<div class="p-3 border-t border-white/10 flex flex-col gap-2 flex-none">
			{#if tab === 'edit' && editorStore.editingBlockId}
				<button class="btn btn-accent btn-sm w-full" onclick={applyToBlock}>
					↺ Apply to Block
				</button>
			{/if}

			{#if tab === 'edit' && editorStore.editingId}
				<div class="flex gap-1">
					<button
						class="btn btn-primary btn-sm flex-1"
						onclick={saveSound}
						disabled={editorStore.isSaving}
					>
						{#if editorStore.isSaving}
							<span class="loading loading-spinner loading-xs"></span>
						{/if}
						Save
					</button>
					<button class="btn btn-ghost btn-sm flex-1" onclick={saveAsNew}>
						Save as New
					</button>
				</div>
			{:else}
				<button
					class="btn btn-primary btn-sm w-full"
					onclick={saveSound}
					disabled={editorStore.isSaving}
				>
					{#if editorStore.isSaving}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
					Save Sound
				</button>
			{/if}

			<div class="join w-full">
				<button class="btn btn-secondary btn-sm flex-1 join-item" onclick={addToTimeline}>
					+ Add to Timeline
				</button>
				<div class="dropdown dropdown-top dropdown-end">
					<button tabindex="0" class="btn btn-secondary btn-sm join-item px-2" title="More options">▾</button>
					
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 p-1 shadow-lg border border-white/10 text-xs w-40">
						<li><button onclick={addToNewTrack}>Add to new track</button></li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if editorStore.notification}
	<div class="toast toast-end toast-bottom z-50">
		<div class="alert {editorStore.notifType === 'error' ? 'alert-error' : 'alert-success'} py-2 text-sm">
			<span>{editorStore.notification}</span>
		</div>
	</div>
{/if}
