<script>
	import UserManager from '$lib/components/admin/UserManager.svelte';
</script>

<div class="flex flex-col h-full overflow-hidden">
	<header class="px-6 py-4 border-b border-white/10 flex-none">
		<h1 class="text-lg font-bold">User Management</h1>
		<p class="text-xs text-base-content/40">Manage roles and signal access for all users.</p>
	</header>
	<div class="flex-1 overflow-hidden p-6">
		<UserManager />
	</div>
</div>
