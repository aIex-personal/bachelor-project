<script>
	import { onMount } from 'svelte';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { editorStore } from '$lib/stores/editor.svelte.js';
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import PresetCard from './PresetCard.svelte';

	let sounds = $state([]);
	let adminSignals = $state([]);
	let loading = $state(true);
	let error = $state('');
	let search = $state('');
	let filterType = $state('');
	let activeSource = $state('personal'); 

	const displaySounds = $derived(
		(activeSource === 'personal' ? sounds : adminSignals).filter(s => {
			if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
			if (filterType && s.wave_type !== filterType) return false;
			return true;
		})
	);

	onMount(async () => {
		await loadSounds();
	});

	async function loadSounds() {
		loading = true;
		error = '';
		try {
			const [personal, library] = await Promise.all([
				pb.collection('sounds').getList(1, 200, {
					filter: `owner = "${authStore.user?.id}"`,
					sort: '-created'
				}),
				pb.collection('admin_signals').getList(1, 200, {
					sort: '-created'
				}).catch(() => ({ items: [] }))
			]);
			sounds = personal.items;
			adminSignals = library.items;
		} catch (e) {
			console.error('Failed to load sounds', e);
			error = 'Failed to load sounds. Check your connection.';
		} finally {
			loading = false;
		}
	}

	function editSound(sound) {
		editorStore.loadForEdit(sound);
	}

	function addToTimeline(sound) {
		timelineStore.addSoundToLastTrack(sound);
		editorStore.notify(`"${sound.name}" added to timeline`);
	}

	function addToNewTrack(sound) {
		timelineStore.addSoundToTrack(sound, null, 0);
		editorStore.notify(`"${sound.name}" added to new track`);
	}

	async function deleteSound(sound) {
		if (!confirm(`Delete "${sound.name}"? This cannot be undone.`)) return;
		try {
			await pb.collection('sounds').delete(sound.id);
			sounds = sounds.filter(s => s.id !== sound.id);
		} catch (e) {
			console.error('Failed to delete sound', e);
			error = 'Failed to delete sound.';
		}
	}
</script>

<div class="flex flex-col h-full">
	
	<div class="px-3 pt-3 pb-0">
		<div class="tabs tabs-boxed tabs-xs">
			<button class="tab {activeSource === 'personal' ? 'tab-active' : ''}" onclick={() => activeSource = 'personal'}>
				My Sounds
				<span class="badge badge-xs ml-1">{sounds.length}</span>
			</button>
			<button class="tab {activeSource === 'library' ? 'tab-active' : ''}" onclick={() => activeSource = 'library'}>
				Library
				<span class="badge badge-xs ml-1">{adminSignals.length}</span>
			</button>
		</div>
	</div>

	
	<div class="px-3 py-2 flex flex-col gap-1.5">
		<label class="input input-bordered input-xs flex items-center gap-1.5">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
			</svg>
			<input
				type="text"
				class="grow bg-transparent outline-none text-xs"
				placeholder="Search sounds…"
				bind:value={search}
			/>
		</label>
		<select class="select select-bordered select-xs w-full" bind:value={filterType}>
			<option value="">All types</option>
			<option value="sine">Sine</option>
			<option value="triangle">Triangle</option>
			<option value="square">Square</option>
			<option value="sawtooth">Sawtooth</option>
		</select>
	</div>

	
	{#if error}
		<div class="mx-3 mb-1 alert alert-error py-1 px-2 text-xs flex items-center gap-2">
			<span class="flex-1">{error}</span>
			<button class="btn btn-ghost btn-xs" onclick={() => { error = ''; loadSounds(); }}>Retry</button>
		</div>
	{/if}

	
	<div class="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
		{#if loading}
			<div class="flex justify-center py-8">
				<span class="loading loading-spinner loading-sm text-primary"></span>
			</div>
		{:else if displaySounds.length === 0}
			<div class="flex flex-col items-center justify-center py-10 gap-2 text-base-content/30">
				<span class="text-3xl">🔉</span>
				<p class="text-xs text-center">
					{search || filterType ? 'No sounds match filter' : activeSource === 'personal' ? 'No sounds yet. Create one!' : 'No library sounds available.'}
				</p>
			</div>
		{:else}
			{#each displaySounds as sound (sound.id)}
				<PresetCard
					{sound}
					showDelete={activeSource === 'personal'}
					onEdit={() => editSound(sound)}
					onAddToTimeline={() => addToTimeline(sound)}
					onAddToNewTrack={() => addToNewTrack(sound)}
					onDelete={() => deleteSound(sound)}
				/>
			{/each}
		{/if}
	</div>

	
	<div class="px-3 pb-2 flex-none">
		<button class="btn btn-ghost btn-xs w-full gap-1" onclick={loadSounds}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Refresh
		</button>
	</div>
</div>
