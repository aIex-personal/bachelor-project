<script>
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';

	let activeSection = $state('getting-started');

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			await goto('/login');
		}
	});

	const sections = [
		{ id: 'getting-started', label: 'Getting Started' },
		{ id: 'dashboard', label: 'Dashboard' },
		{ id: 'editor', label: 'Editor' },
		{ id: 'timeline', label: 'Timeline & Tracks' },
		{ id: 'sound-editor', label: 'Sound Editor' },
		{ id: 'filters', label: 'Filters & Effects' },
		{ id: 'audio-devices', label: 'Audio Devices' },
		{ id: 'export', label: 'Exporting' },
		{ id: 'faq', label: 'FAQ' },
	];
</script>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>

<svelte:head>
	<title>Help — Haptic Studio · Hamsø Engineering</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-base-200">

	<nav class="navbar bg-base-100 px-4 shadow-md">
		<div class="flex-1">
			<a href="/dashboard" class="flex items-center gap-3">
				<img src="/hamso-logo.png" alt="Hamsø Engineering" class="h-8 w-auto" />
				<div class="flex flex-col leading-tight">
					<span class="text-base font-bold tracking-tight">Haptic Studio</span>
					<span class="text-[10px] font-medium tracking-widest text-base-content/50 uppercase">Hamsø Engineering</span>
				</div>
			</a>
		</div>
		<div class="flex-none flex items-center gap-2">
			<a href="/dashboard" class="btn btn-ghost btn-sm">Dashboard</a>
			{#if authStore.isAdmin}
				<a href="/admin" class="btn btn-ghost btn-sm">Admin</a>
			{/if}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder">
					<div class="bg-neutral text-neutral-content w-8 rounded-full">
						<span class="text-xs">{(authStore.user?.name || 'U')[0].toUpperCase()}</span>
					</div>
				</div>
				<ul tabindex="0" role="menu" class="dropdown-content menu menu-sm bg-base-100 rounded-box z-50 mt-3 w-48 p-2 shadow-lg">
					<li class="menu-title text-xs">{authStore.user?.name}</li>
					<li class="menu-title text-xs opacity-50">{authStore.user?.role}</li>
					<li><a href="/dashboard">My Projects</a></li>
					<li><a href="/help">Help</a></li>
					{#if authStore.isAdmin}
						<li><a href="/admin">Admin Panel</a></li>
					{/if}
					<li><button onclick={() => authStore.logout()}>Sign Out</button></li>
				</ul>
			</div>
		</div>
	</nav>

	<div class="flex flex-1 max-w-7xl mx-auto w-full gap-6 p-6">

		<!-- Sidebar nav -->
		<aside class="w-52 shrink-0 hidden md:block">
			<div class="sticky top-6">
				<p class="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3 px-2">Topics</p>
				<ul class="menu menu-sm bg-base-100 rounded-box p-2 gap-0.5">
					{#each sections as s}
						<li>
							<a
								href="#{s.id}"
								class:active={activeSection === s.id}
								onclick={() => activeSection = s.id}
							>
								{s.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</aside>

		<!-- Content -->
		<main class="flex-1 min-w-0 space-y-10">

			<div>
				<h1 class="text-3xl font-bold mb-1">Help & Documentation</h1>
				<p class="text-base-content/50 text-sm">Learn how to use Haptic Studio to design haptic feedback patterns.</p>
			</div>

			<!-- Getting Started -->
			<section id="getting-started" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">1</span>
					Getting Started
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-4">
						<p class="text-base-content/70">Haptic Studio lets you design, preview, and export haptic feedback patterns for use in your applications.</p>

						<div class="steps steps-vertical">
							<div class="step step-primary">
								<div class="text-left ml-3">
									<p class="font-semibold text-sm">Create an account or log in</p>
									<p class="text-xs text-base-content/50">Go to <a href="/login" class="link link-primary">/login</a> and sign in with your credentials.</p>
								</div>
							</div>
							<div class="step step-primary">
								<div class="text-left ml-3">
									<p class="font-semibold text-sm">Open the Dashboard</p>
									<p class="text-xs text-base-content/50">After login you land on the Dashboard — your central project hub.</p>
								</div>
							</div>
							<div class="step step-primary">
								<div class="text-left ml-3">
									<p class="font-semibold text-sm">Create a new project</p>
									<p class="text-xs text-base-content/50">Click <strong>New Project</strong> — a name is generated automatically, you can rename it anytime.</p>
								</div>
							</div>
							<div class="step step-primary">
								<div class="text-left ml-3">
									<p class="font-semibold text-sm">Design in the Editor</p>
									<p class="text-xs text-base-content/50">Add tracks, place sound blocks, tweak the envelope, apply filters, and preview playback.</p>
								</div>
							</div>
							<div class="step step-primary">
								<div class="text-left ml-3">
									<p class="font-semibold text-sm">Export your pattern</p>
									<p class="text-xs text-base-content/50">Download as WAV (mono or multi-channel) for use in your target platform.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Dashboard -->
			<section id="dashboard" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">2</span>
					Dashboard
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-3">
						<div class="overflow-x-auto">
							<table class="table table-sm">
								<thead>
									<tr>
										<th>Element</th>
										<th>What it does</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="font-medium">New Project</td>
										<td class="text-base-content/70">Creates a blank project and opens it in the Editor immediately.</td>
									</tr>
									<tr>
										<td class="font-medium">Search bar</td>
										<td class="text-base-content/70">Filters your project list by name in real time.</td>
									</tr>
									<tr>
										<td class="font-medium">Project card → Open</td>
										<td class="text-base-content/70">Opens the project in the Editor.</td>
									</tr>
									<tr>
										<td class="font-medium">Project card → Delete (trash icon)</td>
										<td class="text-base-content/70">Permanently deletes the project after confirmation. Cannot be undone.</td>
									</tr>
									<tr>
										<td class="font-medium">Waveform thumbnail</td>
										<td class="text-base-content/70">A preview of the pattern's track activity. Grey means the project is empty.</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</section>

			<!-- Editor -->
			<section id="editor" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">3</span>
					Editor Overview
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-4">
						<p class="text-base-content/70">The Editor is split into several panels that work together:</p>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each [
								{ name: 'Timeline', desc: 'The main canvas. Tracks run horizontally. Sound blocks sit on tracks and can be dragged, resized, and clicked.' },
								{ name: 'Playback Controls', desc: 'Play / Pause / Stop, scrubber position, BPM, and snap-to-grid toggle.' },
								{ name: 'Sound Editor', desc: 'Appears when a sound block is selected. Edit waveform, amplitude envelope, and other per-block parameters.' },
								{ name: 'Filter Panel', desc: 'Apply and tune filters (low-pass, high-pass, resonance, etc.) to the selected block.' },
								{ name: 'Preset Library', desc: 'Browse and drag pre-built haptic signals onto the timeline.' },
								{ name: 'Device Selector', desc: 'Choose which audio output device receives the preview signal.' },
								{ name: 'Routing Toggle', desc: 'Switch between mono mix and per-channel routing for multi-actuator setups.' },
							] as panel}
								<div class="flex gap-3 p-3 bg-base-200 rounded-lg">
									<div class="mt-0.5 text-primary shrink-0">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</div>
									<div>
										<p class="font-semibold text-sm">{panel.name}</p>
										<p class="text-xs text-base-content/60 mt-0.5">{panel.desc}</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="alert alert-info text-sm py-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Projects auto-save every 15 seconds when tracks are present. Manual save is available via the <strong>Save</strong> button in the top bar.
						</div>
					</div>
				</div>
			</section>

			<!-- Timeline -->
			<section id="timeline" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">4</span>
					Timeline &amp; Tracks
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-4">
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" checked />
							<div class="collapse-title font-semibold text-sm">Adding tracks</div>
							<div class="collapse-content text-sm text-base-content/70">
								Click <strong>Add Track</strong> in the timeline toolbar. Each track represents one logical channel or actuator layer.
							</div>
						</div>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" />
							<div class="collapse-title font-semibold text-sm">Placing sound blocks</div>
							<div class="collapse-content text-sm text-base-content/70">
								Drag a preset from the Preset Library onto a track, or use the <strong>+</strong> button on an empty track to create a blank block at the current playhead position.
							</div>
						</div>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" />
							<div class="collapse-title font-semibold text-sm">Moving &amp; resizing blocks</div>
							<div class="collapse-content text-sm text-base-content/70">
								Drag a block by its body to move it. Drag the right edge to resize (change duration). Hold <kbd class="kbd kbd-xs">Shift</kbd> while dragging to disable snap-to-grid temporarily.
							</div>
						</div>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" />
							<div class="collapse-title font-semibold text-sm">Snap to grid</div>
							<div class="collapse-content text-sm text-base-content/70">
								Toggle via the grid icon in Playback Controls. When enabled, blocks snap to beat subdivisions defined by the current BPM.
							</div>
						</div>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" />
							<div class="collapse-title font-semibold text-sm">Deleting blocks</div>
							<div class="collapse-content text-sm text-base-content/70">
								Select a block and press <kbd class="kbd kbd-xs">Delete</kbd> or <kbd class="kbd kbd-xs">Backspace</kbd>, or use the block's context menu.
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Sound Editor -->
			<section id="sound-editor" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">5</span>
					Sound Editor
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-3">
						<p class="text-sm text-base-content/70">Select any block on the timeline to open the Sound Editor in the right sidebar.</p>
						<div class="overflow-x-auto">
							<table class="table table-sm">
								<thead>
									<tr>
										<th>Parameter</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="font-medium">Waveform</td>
										<td class="text-base-content/70">Choose the base wave shape: sine, square, sawtooth, triangle, or noise.</td>
									</tr>
									<tr>
										<td class="font-medium">Frequency</td>
										<td class="text-base-content/70">Carrier frequency in Hz. Actuators typically respond to 20–300 Hz.</td>
									</tr>
									<tr>
										<td class="font-medium">Amplitude</td>
										<td class="text-base-content/70">Overall gain of the block (0–1).</td>
									</tr>
									<tr>
										<td class="font-medium">Envelope (ADSR)</td>
										<td class="text-base-content/70">Attack, Decay, Sustain, Release shape the amplitude over the block's duration. Drag the envelope handles on the Waveform Canvas.</td>
									</tr>
									<tr>
										<td class="font-medium">Waveform Canvas</td>
										<td class="text-base-content/70">Live preview of the rendered waveform with envelope overlay.</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</section>

			<!-- Filters -->
			<section id="filters" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">6</span>
					Filters &amp; Effects
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-3">
						<p class="text-sm text-base-content/70">The Filter Panel applies real-time DSP to the selected block's output. Rotate a knob by clicking and dragging up/down.</p>
						<div class="overflow-x-auto">
							<table class="table table-sm">
								<thead>
									<tr>
										<th>Filter</th>
										<th>Effect</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="font-medium">Low-pass</td>
										<td class="text-base-content/70">Cuts frequencies above the cutoff — smooths sharp transients.</td>
									</tr>
									<tr>
										<td class="font-medium">High-pass</td>
										<td class="text-base-content/70">Cuts frequencies below the cutoff — removes low rumble.</td>
									</tr>
									<tr>
										<td class="font-medium">Resonance (Q)</td>
										<td class="text-base-content/70">Boosts frequencies near the cutoff for a sharper, more pronounced effect.</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div class="alert alert-warning text-xs py-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
							</svg>
							High resonance at high gain can clip the signal. Keep an eye on the waveform canvas for clipping artefacts.
						</div>
					</div>
				</div>
			</section>

			<!-- Audio Devices -->
			<section id="audio-devices" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">7</span>
					Audio Devices
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-3">
						<p class="text-sm text-base-content/70">Haptic Studio routes its preview output through your system's audio devices — useful for monitoring via an actuator driver or amplifier.</p>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" checked />
							<div class="collapse-title font-semibold text-sm">Selecting an output device</div>
							<div class="collapse-content text-sm text-base-content/70">
								Open the <strong>Device Selector</strong> in the editor toolbar. Your browser will prompt for permission the first time. Select the device that is connected to your haptic actuator.
							</div>
						</div>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" />
							<div class="collapse-title font-semibold text-sm">Mono vs. multi-channel routing</div>
							<div class="collapse-content text-sm text-base-content/70">
								Use the <strong>Routing Toggle</strong> to switch between a mono mix (all tracks summed to one channel) and per-track channel assignment. Multi-channel is useful when your hardware has multiple independent actuators on separate channels.
							</div>
						</div>
						<div class="collapse collapse-arrow bg-base-200">
							<input type="checkbox" />
							<div class="collapse-title font-semibold text-sm">Device not appearing?</div>
							<div class="collapse-content text-sm text-base-content/70">
								Ensure the device is connected and not in use by another application. Reload the page to refresh the device list. Some browsers limit enumeration until a user gesture has occurred.
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Export -->
			<section id="export" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">8</span>
					Exporting
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-4">
						<p class="text-sm text-base-content/70">Use the <strong>Export</strong> dropdown in the top bar of the Editor to download your project as a WAV file.</p>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div class="p-3 bg-base-200 rounded-lg">
								<p class="font-semibold text-sm">Export as WAV (Mono)</p>
								<p class="text-xs text-base-content/60 mt-1">All tracks are summed into a single mono channel. 44.1 kHz, 16-bit. Best for single-actuator setups.</p>
							</div>
							<div class="p-3 bg-base-200 rounded-lg">
								<p class="font-semibold text-sm">Export as WAV (Multi-channel)</p>
								<p class="text-xs text-base-content/60 mt-1">Each track becomes its own channel in the file. Channel count matches track count. Best for multi-actuator rigs.</p>
							</div>
						</div>
						<div class="alert alert-info text-xs py-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							The exported filename is derived from the project name. Rename the project before exporting to get a clean filename.
						</div>
					</div>
				</div>
			</section>

			<!-- FAQ -->
			<section id="faq" class="scroll-mt-6">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
					<span class="badge badge-primary badge-sm">9</span>
					FAQ
				</h2>
				<div class="card bg-base-100 border border-white/5">
					<div class="card-body gap-3">
						{#each [
							{
								q: 'Are my projects saved automatically?',
								a: 'Yes. The editor auto-saves every 15 seconds when your project has tracks. A manual Save button is also available for on-demand saves.'
							},
							{
								q: 'Can I rename a project?',
								a: 'Yes. Click the project name in the editor\'s top bar to rename it inline. The change is saved on blur or pressing Enter.'
							},
							{
								q: 'What sample rate and bit depth does the WAV export use?',
								a: '44 100 Hz (44.1 kHz), 16-bit PCM. This covers the full range of haptic carrier frequencies.'
							},
							{
								q: 'I don\'t hear any sound during preview.',
								a: 'Check that the correct output device is selected in the Device Selector. Make sure your system volume is up and the device is not muted. Some browsers require a user gesture (e.g. clicking Play) before audio can start.'
							},
							{
								q: 'What is the maximum number of tracks?',
								a: 'There is no hard limit in the current version. Performance may degrade with very large numbers of simultaneous high-frequency tracks.'
							},
							{
								q: 'How do I delete a track?',
								a: 'Use the track\'s options menu (three-dot icon on the left side of the track header) and choose Remove Track.'
							},
						] as item}
							<div class="collapse collapse-arrow bg-base-200">
								<input type="checkbox" />
								<div class="collapse-title font-semibold text-sm">{item.q}</div>
								<div class="collapse-content text-sm text-base-content/70">{item.a}</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<div class="pb-12 text-center text-xs text-base-content/30">
				Haptic Studio · Hamsø Engineering
			</div>

		</main>
	</div>
</div>
