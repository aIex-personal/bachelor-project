<script>
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { authStore } from "$lib/stores/auth.svelte.js";

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto("/dashboard");
		} else {
			goto("/login");
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<span class="loading loading-spinner loading-lg text-primary"></span>
</div>
