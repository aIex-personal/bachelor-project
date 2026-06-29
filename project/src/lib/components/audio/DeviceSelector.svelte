<script>
	
	import { onMount } from 'svelte';
	import { audioDeviceStore } from '$lib/stores/audioDevice.svelte.js';
	import { playbackStore } from '$lib/stores/playback.svelte.js';

	onMount(async () => {
		await audioDeviceStore.init();
	});

	async function onDeviceChange(e) {
		audioDeviceStore.selectedDeviceId = e.currentTarget.value;
		if (playbackStore.isPlaying) {
			await playbackStore.applyAudioDevice();
		}
	}

	function onChannelCountChange(e) {
		audioDeviceStore.channelCount = Number(e.currentTarget.value);
		playbackStore.applyMultiChannel();
	}
</script>

<div class="flex items-center gap-1.5" title="Audio output configuration">
	
	{#if audioDeviceStore.canEnumerate}
		<div class="tooltip tooltip-bottom" data-tip="Audio output device">
			{#if audioDeviceStore.loading}
				<span class="loading loading-spinner loading-xs text-base-content/40"></span>
			{:else}
				<select
					class="select select-xs select-bordered max-w-44 text-xs"
					value={audioDeviceStore.selectedDeviceId}
					onchange={onDeviceChange}
					disabled={audioDeviceStore.devices.length === 0}
				>
					<option value="">Default output</option>
					{#each audioDeviceStore.outputDevices as device (device.deviceId)}
						<option value={device.deviceId}>
							{device.label || `Device ${device.deviceId.slice(0, 8)}…`}
						</option>
					{/each}
				</select>
			{/if}
		</div>
	{/if}

	
	{#if audioDeviceStore.isElectron && audioDeviceStore.channelOptions.length > 1}
		<div class="tooltip tooltip-bottom" data-tip="Output channels">
			<select
				class="select select-xs select-bordered w-20 text-xs"
				value={audioDeviceStore.channelCount}
				onchange={onChannelCountChange}
			>
				{#each audioDeviceStore.channelOptions as n}
					<option value={n}>{n} ch</option>
				{/each}
			</select>
		</div>
	{/if}

	
	{#if audioDeviceStore.isMultiChannel}
		<span
			class="badge badge-xs badge-primary"
			title="{audioDeviceStore.channelCount}-channel discrete output active"
		>
			MCH
		</span>
	{/if}
</div>
