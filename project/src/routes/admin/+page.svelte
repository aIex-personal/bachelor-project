<script>
	import { onMount } from 'svelte';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';

	let stats = $state({ users: 0, signals: 0, projects: 0, patterns: 0 });
	let loading = $state(true);
	let recentSignals = $state([]);

	onMount(async () => {
		try {
			const [usersRes, signalsRes, projectsRes, patternsRes, recentRes] = await Promise.all([
				pb.collection('users').getList(1, 1, { fields: 'id' }),
				pb.collection('admin_signals').getList(1, 1, { fields: 'id' }),
				pb.collection('projects').getList(1, 1, { fields: 'id' }),
				pb.collection('patterns').getList(1, 1, { fields: 'id' }),
				pb.collection('admin_signals').getList(1, 5, { sort: '-created', fields: 'id,name,wave_type,category,created' })
			]);
			stats = {
				users: usersRes.totalItems,
				signals: signalsRes.totalItems,
				projects: projectsRes.totalItems,
				patterns: patternsRes.totalItems
			};
			recentSignals = recentRes.items;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	});

	function formatDate(d) {
		return new Date(d).toLocaleDateString();
	}

	const WAVE_COLORS = { sine: 'text-sky-400', triangle: 'text-emerald-400', square: 'text-yellow-400', sawtooth: 'text-orange-400' };
	const WAVE_ICONS = { sine: '∿', triangle: '⋀', square: '⊓', sawtooth: '⟋' };
</script>

<div class="p-6 overflow-y-auto flex-1">
	<h1 class="text-xl font-bold mb-1">Overview</h1>
	<p class="text-sm text-base-content/40 mb-6">
		Logged in as <span class="font-medium text-base-content/60">{authStore.user?.name ?? authStore.user?.email}</span>
		<span class="badge badge-xs badge-warning ml-1">{authStore.role}</span>
	</p>

	
	{#if loading}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			{#each [0,1,2,3] as _}
				<div class="card bg-base-300 skeleton h-24"></div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			{#each [
				{ label: 'Users', value: stats.users, icon: '👥', href: '/admin/users' },
				{ label: 'Admin Signals', value: stats.signals, icon: '🎵', href: '/admin/signals' },
				{ label: 'Projects', value: stats.projects, icon: '📁', href: null },
				{ label: 'Patterns', value: stats.patterns, icon: '🔁', href: null }
			] as stat}
				<div class="card bg-base-300 hover:bg-base-100/50 transition-colors {stat.href ? 'cursor-pointer' : ''}">
					<div class="card-body p-4 gap-1">
						<div class="text-2xl">{stat.icon}</div>
						<div class="text-3xl font-bold">{stat.value}</div>
						<div class="text-xs text-base-content/40">{stat.label}</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	
	<div class="card bg-base-300">
		<div class="card-body p-4">
			<h2 class="card-title text-sm mb-3">Recent Signals</h2>
			{#if recentSignals.length === 0}
				<p class="text-sm text-base-content/30 py-4 text-center">
					No signals yet.
					<a href="/admin/signals" class="link link-primary">Create one →</a>
				</p>
			{:else}
				<div class="space-y-2">
					{#each recentSignals as signal}
						<div class="flex items-center gap-3 text-sm">
							<span class="text-base {WAVE_COLORS[signal.wave_type]}">
								{WAVE_ICONS[signal.wave_type]}
							</span>
							<span class="flex-1 font-medium">{signal.name}</span>
							{#if signal.category}
								<span class="badge badge-xs badge-ghost">{signal.category}</span>
							{/if}
							<span class="text-xs text-base-content/30">{formatDate(signal.created)}</span>
						</div>
					{/each}
					<div class="pt-1">
						<a href="/admin/signals" class="btn btn-sm btn-outline w-full">View all signals →</a>
					</div>
				</div>
			{/if}
		</div>
	</div>

	
	<div class="mt-6 flex gap-3 flex-wrap">
		<a href="/admin/signals" class="btn btn-primary btn-sm">+ Create Signal</a>
		<a href="/admin/users" class="btn btn-ghost btn-sm">Manage Users</a>
		<a href="/dashboard" class="btn btn-ghost btn-sm">← Go to Dashboard</a>
	</div>
</div>
