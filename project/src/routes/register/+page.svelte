<script>
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte.js';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirm = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister(e) {
		e.preventDefault();
		error = '';

		if (password !== confirm) {
			error = 'Passwords do not match.';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}

		loading = true;
		try {
			await authStore.register(email, password, name);
			await goto('/dashboard');
		} catch (err) {
			error = err?.data?.message || err?.message || 'Registration failed. Try a different email.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Register — Haptic Studio · Hamsø Engineering</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-300">
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

			<form onsubmit={handleRegister} class="flex flex-col gap-3">
				<label class="form-control">
					<div class="label">
						<span class="label-text text-xs font-medium uppercase tracking-wider">Display Name</span>
					</div>
					<input
						type="text"
						class="input input-bordered input-sm"
						placeholder="Your Name"
						bind:value={name}
						required
						autocomplete="name"
						maxlength="50"
					/>
				</label>

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
						placeholder="Min. 8 characters"
						bind:value={password}
						required
						autocomplete="new-password"
						minlength="8"
					/>
				</label>

				<label class="form-control">
					<div class="label">
						<span class="label-text text-xs font-medium uppercase tracking-wider">Confirm Password</span>
					</div>
					<input
						type="password"
						class="input input-bordered input-sm"
						placeholder="Repeat password"
						bind:value={confirm}
						required
						autocomplete="new-password"
					/>
				</label>

				<button type="submit" class="btn btn-primary mt-2" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Create Account
				</button>
			</form>

			<div class="divider text-xs">OR</div>

			<p class="text-center text-sm text-base-content/60">
				Already have an account?
				<a href="/login" class="link link-primary">Sign in</a>
			</p>
		</div>
	</div>
</div>
