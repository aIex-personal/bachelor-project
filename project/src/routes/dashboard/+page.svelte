<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { generateProjectName } from '$lib/utils/naming.js';

	
	let projects = $state([]);
	let loading = $state(true);
	let creating = $state(false);
	let deleteTarget = $state(null);
	let searchQuery = $state('');

	const filteredProjects = $derived(
		projects.filter(p =>
			p.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			await goto('/login');
			return;
		}
		await loadProjects();
	});

	async function loadProjects() {
		loading = true;
		try {
			const result = await pb.collection('projects').getList(1, 50, {
				sort: '-updated',
				filter: `owner = "${authStore.user?.id}"`
			});
			projects = result.items;
		} catch (e) {
			console.error('Failed to load projects', e);
		} finally {
			loading = false;
		}
	}

	async function createProject() {
		creating = true;
		try {
			const name = generateProjectName(projects.map(p => p.name));
			const project = await pb.collection('projects').create({
				name,
				owner: authStore.user?.id,
				tracks: [],
				total_duration: 0
			});
			await goto(`/editor/${project.id}`);
		} catch (e) {
			console.error('Failed to create project', e);
		} finally {
			creating = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		try {
			await pb.collection('projects').delete(deleteTarget.id);
			projects = projects.filter(p => p.id !== deleteTarget.id);
		} catch (e) {
			console.error('Failed to delete project', e);
		} finally {
			deleteTarget = null;
		}
	}

	function formatDate(dateStr) {
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		}).format(new Date(dateStr));
	}

	function formatDuration(ms) {
		if (!ms) return '—';
		const s = Math.round(ms / 1000);
		if (s < 60) return `${s}s`;
		return `${Math.floor(s / 60)}m ${s % 60}s`;
	}
</script>

<svelte:head>
	<title>Dashboard — Haptic Studio · Hamsø Engineering</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-base-200">
	
	<nav class="navbar bg-base-100 px-4 shadow-md">
		<div class="flex-1">
			<a href="/dashboard" class="flex items-center gap-3">
				<img src="/hamso-logo.png" alt="Hamsø Engineering" class="h-8 w-auto" />
				<div class="flex flex-col leading-tight">
					<span class="text-base font-bold tracking-tight">Haptic Studio</span>
					<span class="text-[10px] font-medium tracking-widest text-base-content/50 uppercase">Hamsø Engineering</span>
				</div>
			</a>
		</div>
		<div class="flex-none flex items-center gap-2">
			<a href="/help" class="btn btn-ghost btn-sm gap-1.5">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Help
			</a>
			{#if authStore.isAdmin}
				<a href="/admin" class="btn btn-ghost btn-sm">Admin</a>
			{/if}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder">
					<div class="bg-neutral text-neutral-content w-8 rounded-full">
						<span class="text-xs">{(authStore.user?.name || 'U')[0].toUpperCase()}</span>
					</div>
				</div>
				<ul tabindex="0" role="menu" class="dropdown-content menu menu-sm bg-base-100 rounded-box z-50 mt-3 w-48 p-2 shadow-lg">
					<li class="menu-title text-xs">{authStore.user?.name}</li>
					<li class="menu-title text-xs opacity-50">{authStore.user?.role}</li>
					<li><a href="/dashboard">My Projects</a></li>
					<li><a href="/help">Help</a></li>
					{#if authStore.isAdmin}
						<li><a href="/admin">Admin Panel</a></li>
					{/if}
					<li><button onclick={() => authStore.logout()}>Sign Out</button></li>
				</ul>
			</div>
		</div>
	</nav>

	
	<main class="flex-1 p-6 max-w-7xl mx-auto w-full">
		
		<div class="flex items-center justify-between mb-6">
			<div>
				<h1 class="text-2xl font-bold">My Projects</h1>
				<p class="text-base-content/50 text-sm">Create and manage your haptic patterns</p>
			</div>
			<button class="btn btn-primary gap-2" onclick={createProject} disabled={creating}>
				{#if creating}
					<span class="loading loading-spinner loading-sm"></span>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
				{/if}
				New Project
			</button>
		</div>

		
		<label class="input input-bordered input-sm flex items-center gap-2 mb-6 max-w-xs">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
			</svg>
			<input type="text" placeholder="Search projects…" bind:value={searchQuery} class="grow bg-transparent outline-none text-sm" />
		</label>

		
		{#if loading}
			<div class="flex justify-center py-16">
				<span class="loading loading-spinner loading-lg text-primary"></span>
			</div>
		{:else if filteredProjects.length === 0}
			<div class="flex flex-col items-center justify-center py-24 gap-4 text-base-content/40">
				<div class="text-6xl">〰</div>
				<p class="text-lg font-medium">
					{searchQuery ? 'No projects match your search' : 'No projects yet'}
				</p>
				{#if !searchQuery}
					<button class="btn btn-primary btn-sm" onclick={createProject}>
						Create your first project
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each filteredProjects as project}
					<div class="card bg-base-100 border border-white/5 hover:border-primary/40 cursor-pointer transition-all duration-150 group">
						
						<a href="/editor/{project.id}" class="block p-4 pb-0">
							<div class="h-16 rounded bg-base-200 flex items-center justify-center overflow-hidden mb-3">
								{#if (project.tracks?.length ?? 0) > 0}
									<div class="flex gap-0.5 items-center w-full px-3">
										{#each Array(32) as _, i}
											<div
												class="bg-primary/50 rounded-full w-1"
												style="height: {Math.random() * 80 + 10}%"
											></div>
										{/each}
									</div>
								{:else}
									<span class="text-base-content/20 text-sm">Empty project</span>
								{/if}
							</div>
						</a>

						<div class="card-body p-4 pt-0">
							<h3 class="font-semibold truncate text-sm group-hover:text-primary transition-colors">
								{project.name}
							</h3>
							<div class="flex items-center justify-between text-xs text-base-content/40">
								<span>{formatDate(project.updated)}</span>
								<span>{formatDuration(project.total_duration)}</span>
							</div>
							<div class="flex gap-1 mt-2">
								<a href="/editor/{project.id}" class="btn btn-primary btn-xs flex-1">Open</a>
								<button
									class="btn btn-ghost btn-xs btn-square text-error"
									onclick={() => deleteTarget = project}
									title="Delete project"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

{#if deleteTarget}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Delete Project</h3>
			<p class="py-4 text-base-content/70">
				Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
				This action cannot be undone.
			</p>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => deleteTarget = null}>Cancel</button>
				<button class="btn btn-error" onclick={confirmDelete}>Delete</button>
			</div>
		</div>
		<div class="modal-backdrop" role="button" tabindex="-1" onclick={() => deleteTarget = null} onkeydown={(e) => e.key === 'Escape' && (deleteTarget = null)}></div>
	</dialog>
{/if}
