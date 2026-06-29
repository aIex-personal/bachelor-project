<script>
	
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { AudioEngine } from '$lib/audio/AudioEngine.js';
	import { exportSoundToWav, downloadWav } from '$lib/audio/WavEncoder.js';
	import { generateSoundName } from '$lib/utils/naming.js';
	import WaveformCanvas from '$lib/components/editor/WaveformCanvas.svelte';
	import EnvelopeEditor from '$lib/components/editor/EnvelopeEditor.svelte';

	
	let { onSaved } = $props();

	let engine = new AudioEngine();
	let saving = $state(false);
	let previewing = $state(false);
	let notification = $state('');
	let notifType = $state('success');

	
	let name = $state('');
	let waveType = $state('sine');
	let frequency = $state(200);
	let frequencyEnd = $state(200);
	let amplitude = $state(0.7);
	let duration = $state(100);
	let envelope = $state([]);
	let tags = $state('');
	let category = $state('');
	let description = $state('');
	let isGlobal = $state(false);
	let showEnvelope = $state(false);

	const WAVE_TYPES = [
		{ value: 'sine',     label: 'Sine',     icon: '∿' },
		{ value: 'triangle', label: 'Triangle', icon: '⋀' },
		{ value: 'square',   label: 'Square',   icon: '⊓' },
		{ value: 'sawtooth', label: 'Saw',      icon: '⟋' }
	];

	const PRESET_CATEGORIES = [
		'Clicks', 'Taps', 'Pulses', 'Sweeps',
		'Alerts', 'Notifications', 'Feedback', 'Textures'
	];

	function autoName() {
		name = generateSoundName(waveType, frequency, amplitude, duration);
	}

	async function preview() {
		previewing = true;
		await engine.preview({ wave_type: waveType, frequency, frequency_end: frequencyEnd, amplitude, duration, envelope });
		setTimeout(() => (previewing = false), duration + 100);
	}

	async function save() {
		if (!name.trim()) {
			autoName();
		}
		saving = true;
		try {
			const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
			await pb.collection('admin_signals').create({
				name: name.trim() || generateSoundName(waveType, frequency, amplitude, duration),
				created_by: authStore.user?.id,
				wave_type: waveType,
				frequency,
				frequency_end: frequencyEnd,
				amplitude,
				duration,
				envelope,
				tags: tagArray,
				category,
				description,
				is_globally_accessible: isGlobal
			});
			notify('Signal uploaded to library!', 'success');
			onSaved?.();
			reset();
		} catch (e) {
			notify('Failed to save signal.', 'error');
			console.error(e);
		} finally {
			saving = false;
		}
	}

	function download() {
		const blob = exportSoundToWav({ wave_type: waveType, frequency, frequency_end: frequencyEnd, amplitude, duration, envelope });
		downloadWav(blob, name || 'signal');
	}

	function reset() {
		name = '';
		waveType = 'sine';
		frequency = 200;
		frequencyEnd = 200;
		amplitude = 0.7;
		duration = 100;
		envelope = [];
		tags = '';
		category = '';
		description = '';
	}

	let notifTimer;
	function notify(msg, type = 'success') {
		notification = msg;
		notifType = type;
		clearTimeout(notifTimer);
		notifTimer = setTimeout(() => (notification = ''), 3000);
	}

	function formatMs(ms) {
		return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
	}
</script>

<div class="card bg-base-100 border border-white/5">
	<div class="card-body p-4">
		<h3 class="card-title text-base mb-3">Signal Creator</h3>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			
			<div class="flex flex-col gap-3">
				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs font-medium uppercase tracking-wider">Signal Name</span>
					</div>
					<div class="flex gap-1">
						<input
							type="text"
							class="input input-bordered input-sm flex-1"
							placeholder="Auto-generate…"
							bind:value={name}
							maxlength="100"
						/>
						<button class="btn btn-ghost btn-sm btn-square" onclick={autoName} title="Auto-name">✦</button>
					</div>
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs font-medium uppercase tracking-wider">Waveform</span>
					</div>
					<div class="flex gap-1">
						{#each WAVE_TYPES as wt}
							<button
								class="btn btn-sm flex-1 flex-col h-12 gap-0 text-lg {waveType === wt.value ? 'btn-primary' : 'btn-ghost'}"
								onclick={() => waveType = wt.value}
							>
								<span>{wt.icon}</span>
								<span class="text-[10px]">{wt.label}</span>
							</button>
						{/each}
					</div>
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Duration</span>
						<span class="label-text-alt text-primary font-mono">{formatMs(duration)}</span>
					</div>
					<input type="range" min="10" max="5000" step="10" class="range range-primary range-xs" bind:value={duration} />
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Frequency</span>
						<span class="label-text-alt text-primary font-mono">{frequency}Hz</span>
					</div>
					<input type="range" min="20" max="1000" step="5" class="range range-primary range-xs" bind:value={frequency} />
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Sweep End</span>
						<span class="label-text-alt text-primary font-mono">{frequencyEnd}Hz</span>
					</div>
					<input type="range" min="20" max="1000" step="5" class="range range-primary range-xs" bind:value={frequencyEnd} />
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Amplitude</span>
						<span class="label-text-alt text-primary font-mono">{Math.round(amplitude * 100)}%</span>
					</div>
					<input type="range" min="0" max="1" step="0.01" class="range range-primary range-xs" bind:value={amplitude} />
				</div>
			</div>

			
			<div class="flex flex-col gap-3">
				
				<WaveformCanvas waveType={waveType} height={80} />

				
				<div class="flex gap-2">
					<button class="btn btn-ghost btn-sm flex-1" onclick={preview} disabled={previewing}>
						{previewing ? '◼' : '▶'} Preview
					</button>
					<button class="btn btn-ghost btn-sm" onclick={download} title="Download WAV">⬇ WAV</button>
				</div>

				
				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" bind:checked={showEnvelope} />
					<div class="collapse-title text-xs font-medium py-2">Frequency Envelope</div>
					<div class="collapse-content">
						<EnvelopeEditor
							bind:points={envelope}
							baseFreq={frequency}
							maxFreq={1000}
							height={80}
							onchange={(pts) => envelope = pts}
						/>
					</div>
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Category</span>
					</div>
					<select class="select select-bordered select-sm" bind:value={category}>
						<option value="">— None —</option>
						{#each PRESET_CATEGORIES as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Tags</span>
					</div>
					<input
						type="text"
						class="input input-bordered input-sm"
						placeholder="tap, short, click, …"
						bind:value={tags}
					/>
				</div>

				
				<div class="form-control">
					<div class="label py-1">
						<span class="label-text text-xs uppercase tracking-wider">Description</span>
					</div>
					<textarea
						class="textarea textarea-bordered textarea-sm resize-none"
						rows="2"
						placeholder="Brief description of this signal…"
						bind:value={description}
					></textarea>
				</div>

				
				<div class="flex items-center gap-2">
					<input type="checkbox" class="checkbox checkbox-primary checkbox-sm" bind:checked={isGlobal} id="global-access" />
					<label for="global-access" class="text-sm cursor-pointer">
						Globally accessible (all users can see this signal)
					</label>
				</div>

				
				<button class="btn btn-primary w-full" onclick={save} disabled={saving}>
					{#if saving}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Upload to Signal Library
				</button>
			</div>
		</div>
	</div>
</div>

{#if notification}
	<div class="toast toast-end toast-bottom z-50">
		<div class="alert {notifType === 'error' ? 'alert-error' : 'alert-success'} py-2 text-sm">
			<span>{notification}</span>
		</div>
	</div>
{/if}
