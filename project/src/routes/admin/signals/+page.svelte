<script>
	import SignalCreator from '$lib/components/admin/SignalCreator.svelte';
	import SignalDatabase from '$lib/components/admin/SignalDatabase.svelte';

	let activeTab = $state('database');
</script>

<div class="flex flex-col h-full overflow-hidden">
	<header class="px-6 py-4 border-b border-white/10 flex-none">
		<h1 class="text-lg font-bold">Signal Library</h1>
		<p class="text-xs text-base-content/40">Create, manage and distribute haptic signals to users.</p>
	</header>

	<div class="flex-none px-6 pt-3">
		<div role="tablist" class="tabs tabs-bordered">
			<button
				role="tab"
				class="tab {activeTab === 'database' ? 'tab-active' : ''}"
				onclick={() => activeTab = 'database'}
			>
				Signal Database
			</button>
			<button
				role="tab"
				class="tab {activeTab === 'create' ? 'tab-active' : ''}"
				onclick={() => activeTab = 'create'}
			>
				+ Create Signal
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-hidden p-6">
		{#if activeTab === 'database'}
			<SignalDatabase />
		{:else}
			<div class="overflow-y-auto h-full">
				<SignalCreator />
			</div>
		{/if}
	</div>
</div>
