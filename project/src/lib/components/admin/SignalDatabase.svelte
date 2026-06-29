<script>
	
	import { onMount } from 'svelte';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { exportSoundToWav, downloadWav } from '$lib/audio/WavEncoder.js';
	import { AudioEngine } from '$lib/audio/AudioEngine.js';
	import WaveformCanvas from '$lib/components/editor/WaveformCanvas.svelte';

	let signals = $state([]);
	let users = $state([]);
	let accessMap = $state({}); 
	let loading = $state(true);
	let search = $state('');
	let filterType = $state('');
	let filterCategory = $state('');
	let selectedSignal = $state(null);

	const engine = new AudioEngine();

	const filteredSignals = $derived(
		signals.filter(s => {
			if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
			if (filterType && s.wave_type !== filterType) return false;
			if (filterCategory && s.category !== filterCategory) return false;
			return true;
		})
	);

	const categories = $derived([...new Set(signals.map(s => s.category).filter(Boolean))]);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [signalsRes, usersRes, accessRes] = await Promise.all([
				pb.collection('admin_signals').getList(1, 200, { sort: '-created' }),
				pb.collection('users').getList(1, 200, { sort: 'name', fields: 'id,name,email,role' }),
				pb.collection('signal_access').getList(1, 1000, {})
			]);

			signals = signalsRes.items;
			users = usersRes.items;

			
			const map = {};
			for (const access of accessRes.items) {
				if (!map[access.signal_id]) map[access.signal_id] = new Set();
				map[access.signal_id].add(access.user_id);
			}
			accessMap = map;
		} catch (e) {
			console.error('Failed to load signal database', e);
		} finally {
			loading = false;
		}
	}

	async function deleteSignal(signal) {
		if (!confirm(`Delete signal "${signal.name}"?`)) return;
		try {
			await pb.collection('admin_signals').delete(signal.id);
			signals = signals.filter(s => s.id !== signal.id);
			if (selectedSignal?.id === signal.id) selectedSignal = null;
		} catch (e) {
			console.error(e);
		}
	}

	async function toggleUserAccess(signalId, userId) {
		const hasAccess = accessMap[signalId]?.has(userId);
		try {
			if (hasAccess) {
				
				const records = await pb.collection('signal_access').getList(1, 1, {
					filter: `signal_id = "${signalId}" && user_id = "${userId}"`
				});
				if (records.items.length > 0) {
					await pb.collection('signal_access').delete(records.items[0].id);
				}
				accessMap = {
					...accessMap,
					[signalId]: new Set([...(accessMap[signalId] ?? [])].filter(id => id !== userId))
				};
			} else {
				await pb.collection('signal_access').create({
					signal_id: signalId,
					user_id: userId,
					granted_by: authStore.user?.id
				});
				const current = new Set(accessMap[signalId] ?? []);
				current.add(userId);
				accessMap = { ...accessMap, [signalId]: current };
			}
		} catch (e) {
			console.error('Failed to toggle access', e);
		}
	}

	async function toggleGlobal(signal) {
		try {
			const updated = await pb.collection('admin_signals').update(signal.id, {
				is_globally_accessible: !signal.is_globally_accessible
			});
			signals = signals.map(s => s.id === signal.id ? updated : s);
		} catch (e) {
			console.error(e);
		}
	}

	async function preview(signal) {
		await engine.preview({
			wave_type: signal.wave_type,
			frequency: signal.frequency,
			frequency_end: signal.frequency_end,
			amplitude: signal.amplitude,
			duration: signal.duration,
			envelope: signal.envelope
		});
	}

	function download(signal) {
		const blob = exportSoundToWav(signal);
		downloadWav(blob, signal.name);
	}

	const WAVE_ICONS = { sine: '∿', triangle: '⋀', square: '⊓', sawtooth: '⟋' };
	const WAVE_COLORS = { sine: 'text-sky-400', triangle: 'text-emerald-400', square: 'text-yellow-400', sawtooth: 'text-orange-400' };

	function formatMs(ms) {
		return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
	}
</script>

<div class="flex gap-4 h-full min-h-0">
	
	<div class="flex flex-col flex-1 min-w-0 min-h-0">
		
		<div class="flex gap-2 mb-3 flex-wrap">
			<label class="input input-bordered input-sm flex items-center gap-1.5 flex-1 min-w-40">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
				</svg>
				<input
					type="text"
					class="grow bg-transparent outline-none text-sm"
					placeholder="Search signals…"
					bind:value={search}
				/>
			</label>
			<select class="select select-bordered select-sm" bind:value={filterType}>
				<option value="">All types</option>
				<option value="sine">Sine</option>
				<option value="triangle">Triangle</option>
				<option value="square">Square</option>
				<option value="sawtooth">Sawtooth</option>
			</select>
			<select class="select select-bordered select-sm" bind:value={filterCategory}>
				<option value="">All categories</option>
				{#each categories as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
			<button class="btn btn-ghost btn-sm" onclick={loadData}>↺</button>
		</div>

		
		{#if loading}
			<div class="flex justify-center py-10">
				<span class="loading loading-spinner loading-md text-primary"></span>
			</div>
		{:else if filteredSignals.length === 0}
			<div class="flex flex-col items-center py-16 gap-2 text-base-content/30">
				<span class="text-4xl">📵</span>
				<p class="text-sm">No signals in library yet. Use the Signal Creator above.</p>
			</div>
		{:else}
			<div class="overflow-auto flex-1">
				<table class="table table-sm table-zebra w-full">
					<thead class="sticky top-0 bg-base-200 z-10">
						<tr>
							<th class="w-6">Type</th>
							<th>Name</th>
							<th class="w-20">Duration</th>
							<th class="w-20">Category</th>
							<th class="w-16">Access</th>
							<th class="w-32">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSignals as signal (signal.id)}
							<tr
								class="cursor-pointer {selectedSignal?.id === signal.id ? 'bg-primary/10' : 'hover:bg-white/5'}"
								onclick={() => selectedSignal = signal}
							>
								<td>
									<span class="text-base {WAVE_COLORS[signal.wave_type] ?? ''}">
										{WAVE_ICONS[signal.wave_type] ?? '~'}
									</span>
								</td>
								<td>
									<div class="font-medium text-sm">{signal.name}</div>
									{#if signal.tags?.length > 0}
										<div class="flex gap-1 mt-0.5">
											{#each (signal.tags ?? []).slice(0, 3) as tag}
												<span class="badge badge-xs badge-ghost">{tag}</span>
											{/each}
										</div>
									{/if}
								</td>
								<td class="font-mono text-xs">{formatMs(signal.duration)}</td>
								<td class="text-xs text-base-content/50">{signal.category || '—'}</td>
								<td>
									{#if signal.is_globally_accessible}
										<span class="badge badge-success badge-xs">Global</span>
									{:else}
										<span class="badge badge-ghost badge-xs">
											{accessMap[signal.id]?.size ?? 0} users
										</span>
									{/if}
								</td>
								<td>
									<div class="flex gap-1" onclick={(e) => e.stopPropagation()}>
										<button class="btn btn-xs btn-ghost" onclick={() => preview(signal)} title="Preview">▶</button>
										<button class="btn btn-xs btn-ghost" onclick={() => download(signal)} title="Download WAV">⬇</button>
										{#if authStore.isSuperAdmin}
											<button class="btn btn-xs btn-ghost text-error" onclick={() => deleteSignal(signal)} title="Delete">✕</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	
	{#if selectedSignal}
		<div class="w-72 flex-none flex flex-col gap-3 border-l border-white/10 pl-4">
			<div class="flex items-center justify-between">
				<h4 class="font-bold text-sm">{selectedSignal.name}</h4>
				<button class="btn btn-ghost btn-xs btn-square" onclick={() => selectedSignal = null}>✕</button>
			</div>

			
			<WaveformCanvas waveType={selectedSignal.wave_type} height={70} />

			
			<div class="text-xs space-y-1 text-base-content/60">
				<div class="flex justify-between">
					<span>Type</span>
					<span class="font-mono {WAVE_COLORS[selectedSignal.wave_type]}">{selectedSignal.wave_type}</span>
				</div>
				<div class="flex justify-between">
					<span>Frequency</span>
					<span class="font-mono">{selectedSignal.frequency}Hz → {selectedSignal.frequency_end ?? selectedSignal.frequency}Hz</span>
				</div>
				<div class="flex justify-between">
					<span>Amplitude</span>
					<span class="font-mono">{Math.round(selectedSignal.amplitude * 100)}%</span>
				</div>
				<div class="flex justify-between">
					<span>Duration</span>
					<span class="font-mono">{formatMs(selectedSignal.duration)}</span>
				</div>
				{#if selectedSignal.description}
					<p class="pt-1 text-base-content/40">{selectedSignal.description}</p>
				{/if}
			</div>

			
			{#if selectedSignal.tags?.length > 0}
				<div class="flex gap-1 flex-wrap">
					{#each selectedSignal.tags as tag}
						<span class="badge badge-sm badge-outline">{tag}</span>
					{/each}
				</div>
			{/if}

			
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-primary checkbox-sm"
					checked={selectedSignal.is_globally_accessible}
					onchange={() => toggleGlobal(selectedSignal)}
					id="global-toggle"
				/>
				<label for="global-toggle" class="text-xs cursor-pointer">Globally accessible</label>
			</div>

			
			{#if !selectedSignal.is_globally_accessible}
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-base-content/50 mb-2">User Access</p>
					<div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
						{#each users as user (user.id)}
							{#if user.role !== 'superadmin' && user.role !== 'manager'}
								<label class="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-1 py-0.5 rounded">
									<input
										type="checkbox"
										class="checkbox checkbox-xs checkbox-primary"
										checked={accessMap[selectedSignal.id]?.has(user.id) ?? false}
										onchange={() => toggleUserAccess(selectedSignal.id, user.id)}
									/>
									<span class="text-xs truncate">{user.name || user.email}</span>
									<span class="text-[10px] text-base-content/30 ml-auto">{user.role}</span>
								</label>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			
			<button class="btn btn-outline btn-sm w-full" onclick={() => download(selectedSignal)}>
				⬇ Download WAV
			</button>
		</div>
	{/if}
</div>
