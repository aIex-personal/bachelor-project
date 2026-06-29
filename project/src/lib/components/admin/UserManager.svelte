<script>
	
	import { onMount } from 'svelte';
	import { pb } from '$lib/api/pocketbase.js';
	import { authStore } from '$lib/stores/auth.svelte.js';

	let users = $state([]);
	let signals = $state([]);
	let accessMap = $state({}); 
	let loading = $state(true);
	let search = $state('');
	let selectedUser = $state(null);
	let savingRole = $state('');
	let notification = $state('');

	const filteredUsers = $derived(
		users.filter(u => {
			if (!search) return true;
			const q = search.toLowerCase();
			return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
		})
	);

	const userSignals = $derived(
		selectedUser
			? signals.filter(s => !s.is_globally_accessible)
			: []
	);

	onMount(async () => {
		await refresh();
	});

	async function refresh() {
		loading = true;
		try {
			const [usersRes, signalsRes, accessRes] = await Promise.all([
				pb.collection('users').getList(1, 500, { sort: 'created', fields: 'id,name,email,role,created' }),
				pb.collection('admin_signals').getList(1, 500, { sort: 'name', fields: 'id,name,wave_type,is_globally_accessible' }),
				pb.collection('signal_access').getList(1, 2000, { fields: 'id,user_id,signal_id' })
			]);
			users = usersRes.items;
			signals = signalsRes.items;

			
			const map = {};
			for (const a of accessRes.items) {
				if (!map[a.user_id]) map[a.user_id] = new Set();
				map[a.user_id].add(a.signal_id);
			}
			accessMap = map;
		} catch (e) {
			console.error('Failed to load users', e);
		} finally {
			loading = false;
		}
	}

	async function changeRole(user, newRole) {
		if (user.id === authStore.user?.id) {
			notify('You cannot change your own role.', true);
			return;
		}
		if (!confirm(`Change role of "${user.name || user.email}" to ${newRole}?`)) return;
		savingRole = user.id;
		try {
			const updated = await pb.collection('users').update(user.id, { role: newRole });
			users = users.map(u => u.id === user.id ? { ...u, role: updated.role } : u);
			notify(`${user.name || user.email} is now ${newRole}.`);
		} catch (e) {
			console.error(e);
			notify('Failed to change role.', true);
		} finally {
			savingRole = '';
		}
	}

	async function deleteUser(user) {
		if (user.id === authStore.user?.id) {
			notify('You cannot delete your own account.', true);
			return;
		}
		if (!confirm(`Permanently delete user "${user.name || user.email}"?`)) return;
		try {
			await pb.collection('users').delete(user.id);
			users = users.filter(u => u.id !== user.id);
			if (selectedUser?.id === user.id) selectedUser = null;
			notify('User deleted.');
		} catch (e) {
			console.error(e);
			notify('Failed to delete user.', true);
		}
	}

	async function toggleSignalAccess(signalId) {
		if (!selectedUser) return;
		const userId = selectedUser.id;
		const hasAccess = accessMap[userId]?.has(signalId);
		try {
			if (hasAccess) {
				const records = await pb.collection('signal_access').getList(1, 1, {
					filter: `signal_id = "${signalId}" && user_id = "${userId}"`
				});
				if (records.items.length > 0) {
					await pb.collection('signal_access').delete(records.items[0].id);
				}
				const current = new Set(accessMap[userId] ?? []);
				current.delete(signalId);
				accessMap = { ...accessMap, [userId]: current };
			} else {
				await pb.collection('signal_access').create({
					signal_id: signalId,
					user_id: userId,
					granted_by: authStore.user?.id
				});
				const current = new Set(accessMap[userId] ?? []);
				current.add(signalId);
				accessMap = { ...accessMap, [userId]: current };
			}
		} catch (e) {
			console.error('Toggle access failed', e);
			notify('Failed to update access.', true);
		}
	}

	function notify(msg, isErr = false) {
		notification = (isErr ? '✗ ' : '✓ ') + msg;
		setTimeout(() => notification = '', 3000);
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString();
	}

	const ROLE_COLORS = {
		user: 'badge-ghost',
		manager: 'badge-warning',
		superadmin: 'badge-error'
	};

	const WAVE_ICONS = { sine: '∿', triangle: '⋀', square: '⊓', sawtooth: '⟋' };
</script>

<div class="flex gap-4 h-full min-h-0">
	
	<div class="flex flex-col flex-1 min-w-0 min-h-0">
		
		<div class="flex gap-2 mb-3">
			<label class="input input-bordered input-sm flex items-center gap-1.5 flex-1">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
				</svg>
				<input
					type="text"
					class="grow bg-transparent outline-none text-sm"
					placeholder="Search users…"
					bind:value={search}
				/>
			</label>
			<button class="btn btn-ghost btn-sm" onclick={refresh}>↺</button>
		</div>

		{#if notification}
			<div class="alert alert-sm mb-2 py-1.5 text-xs
				{notification.startsWith('✗') ? 'alert-error' : 'alert-success'}">
				{notification}
			</div>
		{/if}

		{#if loading}
			<div class="flex justify-center py-10">
				<span class="loading loading-spinner loading-md text-primary"></span>
			</div>
		{:else if filteredUsers.length === 0}
			<div class="flex flex-col items-center py-16 gap-2 text-base-content/30">
				<span class="text-4xl">👤</span>
				<p class="text-sm">No users found.</p>
			</div>
		{:else}
			<div class="overflow-auto flex-1">
				<table class="table table-sm w-full">
					<thead class="sticky top-0 bg-base-200 z-10">
						<tr>
							<th>Name / Email</th>
							<th class="w-28">Role</th>
							<th class="w-20">Joined</th>
							<th class="w-24">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredUsers as user (user.id)}
							<tr
								class="cursor-pointer {selectedUser?.id === user.id ? 'bg-primary/10' : 'hover:bg-white/5'}"
								onclick={() => selectedUser = user}
							>
								<td>
									<div class="font-medium text-sm">{user.name || '—'}</div>
									<div class="text-xs text-base-content/40">{user.email}</div>
								</td>
								<td>
									<span class="badge badge-sm {ROLE_COLORS[user.role] ?? 'badge-ghost'}">
										{user.role}
									</span>
								</td>
								<td class="text-xs text-base-content/40">{formatDate(user.created)}</td>
								<td onclick={e => e.stopPropagation()}>
									<div class="flex gap-1">
										{#if user.id !== authStore.user?.id}
											
											<select
												class="select select-xs select-bordered w-28"
												value={user.role}
												onchange={e => changeRole(user, e.currentTarget.value)}
												disabled={savingRole === user.id}
											>
												<option value="user">user</option>
												<option value="manager">manager</option>
												{#if authStore.isSuperAdmin}
													<option value="superadmin">superadmin</option>
												{/if}
											</select>
											<button
												class="btn btn-xs btn-ghost text-error"
												onclick={() => deleteUser(user)}
												title="Delete user"
											>✕</button>
										{:else}
											<span class="text-xs text-base-content/30 italic">You</span>
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

	
	{#if selectedUser}
		<div class="w-64 flex-none flex flex-col gap-3 border-l border-white/10 pl-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-bold text-sm">{selectedUser.name || selectedUser.email}</p>
					<p class="text-xs text-base-content/40">{selectedUser.email}</p>
				</div>
				<button class="btn btn-ghost btn-xs btn-square" onclick={() => selectedUser = null}>✕</button>
			</div>

			<div class="divider my-0 text-xs text-base-content/30">Signal Access</div>

			{#if signals.filter(s => !s.is_globally_accessible).length === 0}
				<p class="text-xs text-base-content/40 text-center py-4">
					No restricted signals in library yet.
				</p>
			{:else}
				<p class="text-xs text-base-content/50">
					Grant access to specific admin signals for this user. Globally accessible signals are available to all.
				</p>
				<div class="flex flex-col gap-1 overflow-y-auto flex-1">
					{#each signals.filter(s => !s.is_globally_accessible) as signal (signal.id)}
						<label class="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-1 py-1 rounded">
							<input
								type="checkbox"
								class="checkbox checkbox-xs checkbox-primary"
								checked={accessMap[selectedUser.id]?.has(signal.id) ?? false}
								onchange={() => toggleSignalAccess(signal.id)}
							/>
							<span class="text-base {signal.wave_type === 'sine' ? 'text-sky-400' : signal.wave_type === 'triangle' ? 'text-emerald-400' : signal.wave_type === 'square' ? 'text-yellow-400' : 'text-orange-400'}">
								{WAVE_ICONS[signal.wave_type] ?? '~'}
							</span>
							<span class="text-xs truncate">{signal.name}</span>
						</label>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
