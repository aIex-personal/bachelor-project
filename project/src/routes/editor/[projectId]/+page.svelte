<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { editorStore } from '$lib/stores/editor.svelte.js';
	import { timelineStore } from '$lib/stores/timeline.svelte.js';
	import { playbackStore } from '$lib/stores/playback.svelte.js';
	import { exportProjectToWav, exportProjectToWavMultiChannel, downloadWav } from '$lib/audio/WavEncoder.js';
	import { sanitizeName } from '$lib/utils/naming.js';
	import { audioDeviceStore } from '$lib/stores/audioDevice.svelte.js';

	import Timeline from '$lib/components/timeline/Timeline.svelte';
	import PlaybackControls from '$lib/components/timeline/PlaybackControls.svelte';
	import SoundEditor from '$lib/components/editor/SoundEditor.svelte';
	import FilterPanel from '$lib/components/filter/FilterPanel.svelte';
	import DeviceSelector from '$lib/components/audio/DeviceSelector.svelte';
	import RoutingToggle from '$lib/components/audio/RoutingToggle.svelte';

	const { data } = $props();

	
	let projectId = $derived($page.params?.projectId ?? null);

	let projectName = $state('Haptic Pattern');
	let saving = $state(false);
	let autoSaving = $state(false);
	let exporting = $state(false);
	let showExportDropdown = $state(false);
	let showSidebar = $state(true);

	
	let snapToGrid = $derived(timelineStore.snapToGrid);

	let autoSaveTimer = null;

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			await goto('/login');
			return;
		}

		editorStore.reset();
		timelineStore.clear();
		playbackStore.stop();

		if (projectId) {
			await loadProject(projectId);
		}

		
		autoSaveTimer = setInterval(async () => {
			if (timelineStore.tracks.length > 0 && !saving) {
				autoSaving = true;
				await saveProject(true);
				autoSaving = false;
			}
		}, 15000);
	});

	onDestroy(() => {
		clearInterval(autoSaveTimer);
	});

	async function loadProject(id) {
		try {
			const project = await pb.collection('projects').getOne(id);
			projectName = project.name;
			const tracks = Array.isArray(project.tracks) ? project.tracks : [];
			timelineStore.load(tracks);
		} catch (e) {
			console.error('Failed to load project', e);
			editorStore.notify('Failed to load project.', 'error');
		}
	}

	async function saveProject(silent = false) {
		if (!authStore.user?.id) return;
		saving = true;
		try {
			const name = sanitizeName(projectName, 'Haptic Pattern');
			const tracks = timelineStore.serialize();
			const totalDuration = timelineStore.totalDuration;

			if (projectId) {
				await pb.collection('projects').update(projectId, {
					name,
					tracks,
					total_duration: totalDuration
				});
			} else {
				const created = await pb.collection('projects').create({
					name,
					owner: authStore.user.id,
					tracks,
					total_duration: totalDuration
				});
				
				await goto(`/editor/${created.id}`, { replaceState: true });
			}
			if (!silent) editorStore.notify('Project saved!');
		} catch (e) {
			if (!silent) editorStore.notify('Failed to save project.', 'error');
			console.error(e);
		} finally {
			saving = false;
		}
	}

	function exportProject() {
		exporting = true;
		showExportDropdown = false;
		try {
			const ch = audioDeviceStore.channelCount ?? 2;
			const name = sanitizeName(projectName, 'haptic-export');
			if (ch > 1) {
				const blob = exportProjectToWavMultiChannel(timelineStore.tracks, timelineStore.totalDuration, ch);
				downloadWav(blob, `${name}-${ch}ch`);
				editorStore.notify(`Exported as ${ch}-channel WAV!`);
			} else {
				const blob = exportProjectToWav(timelineStore.tracks, timelineStore.totalDuration);
				downloadWav(blob, name);
				editorStore.notify('Exported as WAV!');
			}
		} catch (e) {
			editorStore.notify('Export failed.', 'error');
			console.error(e);
		} finally {
			exporting = false;
		}
	}

	function exportProjectMono() {
		exporting = true;
		showExportDropdown = false;
		try {
			const blob = exportProjectToWav(timelineStore.tracks, timelineStore.totalDuration);
			downloadWav(blob, sanitizeName(projectName, 'haptic-export') + '-mono');
			editorStore.notify('Exported as mono WAV!');
		} catch (e) {
			editorStore.notify('Export failed.', 'error');
			console.error(e);
		} finally {
			exporting = false;
		}
	}

	function deleteSelected() {
		if (timelineStore.selectedBlockId) {
			timelineStore.deleteBlock(timelineStore.selectedBlockId);
		}
	}
</script>

<svelte:head>
	<title>{projectName} — Haptic Studio · Hamsø Engineering</title>
</svelte:head>

<div class="flex flex-col h-screen overflow-hidden bg-base-200">
	
	<nav class="flex-none flex items-center gap-2 px-3 py-1.5 bg-base-100 border-b border-white/10 z-30">
		
		<a href="/dashboard" class="btn btn-ghost btn-sm btn-square" title="Back to Dashboard">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
			</svg>
		</a>

		
		<PlaybackControls />

		
		<DeviceSelector />

		
		<RoutingToggle />

		
		<div class="flex-1 flex justify-center">
			<label class="input input-bordered input-sm flex items-center gap-1 max-w-64">
				<input
					type="text"
					class="grow bg-transparent outline-none text-sm font-medium text-center"
					placeholder="Project name…"
					bind:value={projectName}
					maxlength="100"
				/>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
				</svg>
			</label>
		</div>

		
		<div class="flex items-center gap-1">
			<button
				class="btn btn-ghost btn-sm gap-1"
				onclick={() => saveProject()}
				disabled={saving}
				title="Save project (Ctrl+S)"
			>
				{#if saving || autoSaving}
					<span class="loading loading-spinner loading-xs"></span>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
					</svg>
				{/if}
				{autoSaving ? 'Auto-saving…' : 'Save'}
			</button>

			
			<div class="join relative">
				
				<button
					class="btn btn-ghost btn-sm join-item gap-1"
					onclick={exportProject}
					disabled={exporting}
					title="Export as {audioDeviceStore.channelCount}-channel WAV"
				>
					{#if exporting}
						<span class="loading loading-spinner loading-xs"></span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
						</svg>
					{/if}
					Export ({audioDeviceStore.channelCount}ch)
				</button>

				
				<button
					class="btn btn-ghost btn-sm join-item px-1"
					onclick={() => showExportDropdown = !showExportDropdown}
					disabled={exporting}
					title="More export options"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				
				{#if showExportDropdown}
					
					<div
						class="absolute right-0 top-full mt-1 z-50 bg-base-100 border border-white/10 rounded-box shadow-lg min-w-52"
						onmouseleave={() => showExportDropdown = false}
					>
						<ul class="menu menu-sm p-1 gap-0.5">
							<li>
								<button onclick={exportProject} class="gap-2 text-sm" disabled={exporting}>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
									</svg>
									Download ({audioDeviceStore.channelCount}ch interleaved)
								</button>
							</li>
							<li>
								<button onclick={exportProjectMono} class="gap-2 text-sm text-base-content/70" disabled={exporting}>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
									</svg>
									Download (merged to mono)
								</button>
							</li>
						</ul>
					</div>
				{/if}
			</div>

			
			<button
				class="btn btn-ghost btn-sm btn-square {showSidebar ? 'text-primary' : ''}"
				onclick={() => showSidebar = !showSidebar}
				title="Toggle sound editor"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V5l12 7-12 7z" />
				</svg>
			</button>

			<a href="/help" class="btn btn-ghost btn-sm btn-square" title="Help">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</a>
		</div>
	</nav>

	
	<div class="flex-none flex items-center gap-1 px-3 py-1 bg-base-200 border-b border-white/5 z-20">
		
		<button class="icon-btn" title="Select" disabled>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
			</svg>
		</button>

		<button
			class="icon-btn {timelineStore.selectedBlockId ? '' : 'btn-disabled'}"
			onclick={deleteSelected}
			title="Delete selected (Del)"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
			</svg>
		</button>

		<div class="divider-horizontal mx-1 h-5 w-px bg-white/10"></div>

		
		<div class="flex items-center gap-1">
			<button
				class="btn btn-xs gap-1 {snapToGrid ? 'btn-primary' : 'btn-ghost text-base-content/40'}"
				onclick={() => timelineStore.snapToGrid = true}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
				Gridsnap
			</button>
			<button
				class="btn btn-xs gap-1 {!snapToGrid ? 'btn-primary' : 'btn-ghost text-base-content/40'}"
				onclick={() => timelineStore.snapToGrid = false}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
				</svg>
				Freemove
			</button>
		</div>

		
		{#if snapToGrid}
			<select
				class="select select-ghost select-xs ml-1 text-xs"
				value={timelineStore.gridSize}
				onchange={(e) => timelineStore.gridSize = Number(e.currentTarget.value)}
			>
				<option value={10}>10ms</option>
				<option value={25}>25ms</option>
				<option value={50}>50ms</option>
				<option value={100}>100ms</option>
				<option value={250}>250ms</option>
			</select>
		{/if}
	</div>

	
	<div class="flex flex-1 min-h-0">
		
		<div class="flex flex-col flex-1 min-w-0 min-h-0">
			<div class="flex-1 min-h-0">
				<Timeline />
			</div>

			
			<FilterPanel />
		</div>

		
		{#if showSidebar}
			<SoundEditor onSaved={() => {}} />
		{/if}
	</div>
</div>

{#if editorStore.notification}
	<div class="toast toast-end toast-bottom z-50">
		<div class="alert {editorStore.notifType === 'error' ? 'alert-error' : 'alert-success'} py-2 text-sm shadow-lg">
			<span>{editorStore.notification}</span>
		</div>
	</div>
{/if}
