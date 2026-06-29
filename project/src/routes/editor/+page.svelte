<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { generateProjectName } from '$lib/utils/naming.js';

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			await goto('/login');
			return;
		}
		
		try {
			const existing = await pb.collection('projects').getList(1, 50, {
				filter: `owner = "${authStore.user?.id}"`,
				fields: 'name'
			});
			const name = generateProjectName(existing.items.map(p => p.name));
			const project = await pb.collection('projects').create({
				name,
				owner: authStore.user?.id,
				tracks: [],
				total_duration: 0
			});
			await goto(`/editor/${project.id}`, { replaceState: true });
		} catch (e) {
			console.error(e);
			await goto('/dashboard');
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<span class="loading loading-spinner loading-lg text-primary"></span>
	<span class="ml-3 text-base-content/50">Creating new project…</span>
</div>
