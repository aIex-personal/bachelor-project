<script>
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import HapticIntro from '$lib/components/HapticIntro.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	
	const alreadySeen = browser && !!sessionStorage.getItem('intro-seen');
	let showIntro = $state(browser && !alreadySeen);
	let showForm  = $state(alreadySeen || !browser);

	function onIntroComplete() {
		if (browser) sessionStorage.setItem('intro-seen', '1');
		showIntro = false;
		showForm  = true;
	}

	async function handleLogin(e) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await authStore.login(email, password);
			await goto('/dashboard');
		} catch (err) {
			error = err?.data?.message || err?.message || 'Login failed. Check your credentials.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login — Haptic Studio · Hamsø Engineering</title>
</svelte:head>

{#if showIntro}
	<HapticIntro onComplete={onIntroComplete} />
{/if}

{#if showForm}
<div class="flex min-h-screen items-center justify-center bg-base-300" in:fade={{ duration: 550, delay: 80 }}>
	<div class="card w-full max-w-sm bg-base-100 shadow-2xl">
		<div class="card-body gap-4">
			
			<div class="mb-2 text-center">
				<div class="mb-4 flex justify-center">
					<img src="/hamso-logo.png" alt="Hamsø Engineering" class="h-14 w-auto" />
				</div>
				<h1 class="text-2xl font-bold tracking-tight">Haptic Studio</h1>
			</div>

			{#if error}
				<div class="alert alert-error py-2 text-sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
					</svg>
					{error}
				</div>
			{/if}

			<form onsubmit={handleLogin} class="flex flex-col gap-3">
				<label class="form-control">
					<div class="label">
						<span class="label-text text-xs font-medium uppercase tracking-wider">Email</span>
					</div>
					<input
						type="email"
						class="input input-bordered input-sm"
						placeholder="you@example.com"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</label>

				<label class="form-control">
					<div class="label">
						<span class="label-text text-xs font-medium uppercase tracking-wider">Password</span>
					</div>
					<input
						type="password"
						class="input input-bordered input-sm"
						placeholder="••••••••"
						bind:value={password}
						required
						autocomplete="current-password"
					/>
				</label>

				<button type="submit" class="btn btn-primary mt-2" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Sign In
				</button>
			</form>

			<div class="divider text-xs">OR</div>

			<p class="text-center text-sm text-base-content/60">
				Don't have an account?
				<a href="/register" class="link link-primary">Create one</a>
			</p>
		</div>
	</div>
</div>
{/if}
