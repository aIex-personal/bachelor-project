<script>
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const { children } = $props();

	
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		if (!authStore.isAdmin) {
			goto('/dashboard');
		}
	});

	const NAV = [
		{ href: '/admin', label: 'Overview', icon: '⚡' },
		{ href: '/admin/signals', label: 'Signal Library', icon: '🎵' },
		{ href: '/admin/users', label: 'Users', icon: '👥' }
	];

	function isActive(href) {
		if (href === '/admin') return $page.url.pathname === '/admin';
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="flex h-screen overflow-hidden bg-base-200">
	
	<aside class="w-52 flex-none flex flex-col bg-base-300 border-r border-white/10">
		<div class="px-4 py-3 border-b border-white/10">
			<p class="font-bold text-sm">Admin Panel</p>
			<p class="text-xs text-base-content/40">{authStore.user?.name ?? authStore.user?.email}</p>
		</div>
		<nav class="flex-1 py-2">
			{#each NAV as item}
				<a
					href={item.href}
					class="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors
						{isActive(item.href)
							? 'bg-primary/20 text-primary font-medium'
							: 'text-base-content/60 hover:text-base-content hover:bg-white/5'}"
				>
					<span>{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="border-t border-white/10 px-4 py-3 flex flex-col gap-1.5">
			<a href="/dashboard" class="btn btn-ghost btn-sm justify-start gap-2 text-xs">
				← Dashboard
			</a>
		</div>
	</aside>

	
	<main class="flex-1 flex flex-col overflow-hidden">
		{@render children()}
	</main>
</div>
