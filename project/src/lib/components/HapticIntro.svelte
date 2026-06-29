<script>
	import { onMount } from 'svelte';

	let { onComplete } = $props();

	let canvasEl;
	let exiting = $state(false);
	let titleIn = $state(false);
	let subIn = $state(false);
	let hintIn = $state(false);

	let rafId = null;
	let t0 = null;
	const DURATION_MS = 4600;

	
	function playAudio() {
		try {
			const ac = new (window.AudioContext || window.webkitAudioContext)();
			const ct = ac.currentTime;

			function burst(freq, delay, dur, vol) {
				const osc = ac.createOscillator();
				const env = ac.createGain();
				osc.type = 'sine';
				osc.frequency.value = freq;
				const t = ct + delay;
				env.gain.setValueAtTime(0, t);
				env.gain.linearRampToValueAtTime(vol, t + 0.013);
				env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
				osc.connect(env).connect(ac.destination);
				osc.start(t);
				osc.stop(t + dur + 0.07);
			}

			
			burst(28, 0.04, 0.6, 0.65);

			
			burst(48, 0.68, 0.14, 0.48);
			burst(48, 0.87, 0.14, 0.48);
			burst(48, 1.06, 0.14, 0.48);

			
			const sw = ac.createOscillator();
			const swGain = ac.createGain();
			sw.type = 'sine';
			sw.frequency.setValueAtTime(32, ct + 1.2);
			sw.frequency.exponentialRampToValueAtTime(340, ct + 3.1);
			swGain.gain.setValueAtTime(0, ct + 1.2);
			swGain.gain.linearRampToValueAtTime(0.22, ct + 1.35);
			swGain.gain.setValueAtTime(0.22, ct + 2.85);
			swGain.gain.exponentialRampToValueAtTime(0.0001, ct + 3.2);
			sw.connect(swGain).connect(ac.destination);
			sw.start(ct + 1.2);
			sw.stop(ct + 3.3);

			
			burst(220, 3.15, 0.55, 0.12);
			burst(330, 3.38, 0.5, 0.09);
			burst(440, 3.58, 0.8, 0.07);
		} catch (_) {
			
		}
	}

	
	function resize() {
		if (!canvasEl) return;
		canvasEl.width = window.innerWidth;
		canvasEl.height = window.innerHeight;
	}

	function drawFrame(ts) {
		if (t0 === null) t0 = ts;
		const t = (ts - t0) / 1000; 

		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		const W = canvasEl.width;
		const H = canvasEl.height;
		const cx = W / 2;
		const cy = H / 2;

		
		ctx.fillStyle = '#06060f';
		ctx.fillRect(0, 0, W, H);

		
		const GRID = 52;
		for (let gx = GRID * 0.5; gx < W; gx += GRID) {
			for (let gy = GRID * 0.5; gy < H; gy += GRID) {
				const d = Math.hypot(gx - cx, gy - cy);
				const w = Math.sin(t * 3.0 - d * 0.027) * 0.5 + 0.5;
				ctx.fillStyle = `rgba(99,102,241,${0.04 + w * 0.1})`;
				ctx.beginPath();
				ctx.arc(gx, gy, 1.1 + w * 0.5, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		
		const waveIn = Math.min(t / 0.75, 1);

		
		let shake = 0;
		if (t < 0.65) {
			shake = Math.sin(t * 50) * 8 * (t / 0.65);
		} else if (t < 1.2) {
			shake = Math.sin(t * 42) * 22 * (1.2 - t) / 0.55;
		}

		const WAVES = [
			{ f: 1.5,  a: 90,  sp: 2.1, ph: 0.0,  r: 99,  g: 102, b: 241, lw: 2.5 },
			{ f: 2.9,  a: 50,  sp: 3.7, ph: 1.3,  r: 236, g: 72,  b: 153, lw: 1.7 },
			{ f: 0.75, a: 115, sp: 1.3, ph: 2.8,  r: 34,  g: 211, b: 238, lw: 1.5 }
		];

		WAVES.forEach(({ f, a, sp, ph, r, g, b, lw }) => {
			const alpha = 0.8 * waveIn;
			const grad = ctx.createLinearGradient(0, 0, W, 0);
			grad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
			grad.addColorStop(0.12, `rgba(${r},${g},${b},${alpha})`);
			grad.addColorStop(0.88, `rgba(${r},${g},${b},${alpha})`);
			grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

			ctx.beginPath();
			ctx.lineWidth = lw;
			ctx.strokeStyle = grad;

			for (let px = 0; px <= W; px += 3) {
				const nx = ((px / W) - 0.5) * Math.PI * 8;
				const y = cy + (Math.sin(nx * f + t * sp + ph) * a + shake) * waveIn;
				px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
			}
			ctx.stroke();
		});

		
		const maxR = Math.hypot(cx, cy) * 1.25;
		for (let i = 0; i < 16; i++) {
			const birth = i * 0.4 + 0.02;
			if (t < birth) break;
			const age = t - birth;
			const r = age * maxR * 0.5;
			if (r > maxR) continue;
			const alpha = Math.max(0, 0.55 - age * 0.42);
			if (alpha <= 0) continue;
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
			ctx.lineWidth = 1.5;
			ctx.stroke();
		}

		
		const orbR = 52 + Math.sin(t * 7) * 12;
		const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 3.2);
		grd.addColorStop(0,    `rgba(155,155,255,${0.65 * waveIn})`);
		grd.addColorStop(0.35, `rgba(99,102,241,${0.3 * waveIn})`);
		grd.addColorStop(1,    'rgba(99,102,241,0)');
		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(cx, cy, orbR * 3.2, 0, Math.PI * 2);
		ctx.fill();

		
		ctx.beginPath();
		ctx.arc(cx, cy, orbR * 0.4, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(215,215,255,${0.6 * waveIn})`;
		ctx.fill();

		
		for (let sy = 0; sy < H; sy += 4) {
			ctx.fillStyle = 'rgba(0,0,8,0.07)';
			ctx.fillRect(0, sy, W, 2);
		}

		
		if (t > 1.55 && !titleIn) titleIn = true;
		if (t > 2.25 && !subIn)   subIn   = true;
		if (t > 2.75 && !hintIn)  hintIn  = true;
		if (t > DURATION_MS / 1000 - 0.9 && !exiting) exiting = true;

		if (t < DURATION_MS / 1000) {
			rafId = requestAnimationFrame(drawFrame);
		} else {
			onComplete?.();
		}
	}

	
	function skip() {
		if (exiting) return;
		exiting = true;
		if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
		setTimeout(() => onComplete?.(), 750);
	}

	function handleKey(e) {
		if (e.key === 'Tab') return; 
		skip();
	}

	onMount(() => {
		resize();
		window.addEventListener('resize', resize);
		window.addEventListener('keydown', handleKey, { once: true });
		setTimeout(playAudio, 80);
		rafId = requestAnimationFrame(drawFrame);

		return () => {
			window.removeEventListener('resize', resize);
			window.removeEventListener('keydown', handleKey);
			if (rafId !== null) cancelAnimationFrame(rafId);
		};
	});
</script>

<div
	class="intro"
	class:exiting
	role="dialog"
	aria-label="Haptic Studio intro animation"
	aria-modal="true"
	onclick={skip}
	onkeydown={handleKey}
	tabindex="-1"
>
	<canvas bind:this={canvasEl}></canvas>

	<div class="overlay">
		<div class="center-block">
			
			<div class="title-group" class:visible={titleIn}>
				<span class="label-haptic">HAPTIC</span>
				<span class="label-studio glitch" data-text="STUDIO">STUDIO</span>
			</div>
			<p class="company" class:visible={subIn}>HAMSØ ENGINEERING</p>
		</div>

		<button class="skip-hint" class:visible={hintIn} onclick={skip} tabindex="0">
			PRESS ANY KEY OR CLICK TO SKIP
		</button>
	</div>
</div>

<style>
	/* ── Wrapper ──────────────────────────────────────────────────────────────── */
	.intro {
		position: fixed;
		inset: 0;
		z-index: 9999;
		cursor: pointer;
		user-select: none;
		overflow: hidden;
		transition: opacity 0.75s ease, transform 0.75s ease;
	}

	.intro.exiting {
		opacity: 0;
		transform: scale(1.05);
		pointer-events: none;
	}

	canvas {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}

	/* ── Overlay layout ────────────────────────────────────────────────────────── */
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.center-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	/* ── Title ────────────────────────────────────────────────────────────────── */
	.title-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1;
		opacity: 0;
		transform: translateY(30px) scale(0.94);
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.title-group.visible {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.label-haptic {
		font-size: clamp(1.1rem, 2.8vw, 1.75rem);
		font-weight: 300;
		letter-spacing: 0.8em;
		padding-right: 0.8em; /* compensate letter-spacing indent */
		color: rgba(99, 102, 241, 0.95);
		text-shadow:
			0 0 20px rgba(99, 102, 241, 0.9),
			0 0 48px rgba(99, 102, 241, 0.5);
		text-transform: uppercase;
		margin-bottom: 0.1em;
	}

	.label-studio {
		font-size: clamp(3.8rem, 13vw, 9rem);
		font-weight: 900;
		letter-spacing: 0.1em;
		padding-right: 0.1em;
		color: #ffffff;
		text-shadow:
			0 0 30px rgba(99, 102, 241, 1),
			0 0 70px rgba(99, 102, 241, 0.6),
			0 0 130px rgba(99, 102, 241, 0.3);
		text-transform: uppercase;
	}

	/* ── Glitch effect on STUDIO ─────────────────────────────────────────────── */
	.glitch {
		position: relative;
	}

	.glitch::before,
	.glitch::after {
		content: attr(data-text);
		position: absolute;
		inset: 0;
		width: 100%;
		text-shadow: none;
	}

	.glitch::before {
		color: #ff00e5;
		clip-path: polygon(0 12%, 100% 12%, 100% 36%, 0 36%);
		animation: glitch-hi 3.8s infinite 0.5s;
		opacity: 0;
	}

	.glitch::after {
		color: #00e5ff;
		clip-path: polygon(0 57%, 100% 57%, 100% 83%, 0 83%);
		animation: glitch-lo 3.8s infinite 0.85s;
		opacity: 0;
	}

	@keyframes glitch-hi {
		0%, 78%, 100% { transform: translate(0); opacity: 0; }
		80%            { transform: translate(-6px, -2px); opacity: 0.85; }
		82%            { transform: translate(6px, 1px); opacity: 0.6; }
		84%            { transform: translate(-3px); opacity: 0.85; }
		86%            { transform: translate(0); opacity: 0; }
	}

	@keyframes glitch-lo {
		0%, 73%, 100% { transform: translate(0); opacity: 0; }
		75%            { transform: translate(7px, 2px); opacity: 0.85; }
		77%            { transform: translate(-7px, -1px); opacity: 0.6; }
		79%            { transform: translate(4px); opacity: 0.85; }
		81%            { transform: translate(0); opacity: 0; }
	}

	/* ── Company name ────────────────────────────────────────────────────────── */
	.company {
		font-size: clamp(0.6rem, 1.4vw, 0.82rem);
		font-weight: 400;
		letter-spacing: 0.52em;
		padding-right: 0.52em;
		color: rgba(170, 170, 230, 0.6);
		text-transform: uppercase;
		opacity: 0;
		transform: translateY(14px);
		transition: opacity 0.65s ease, transform 0.65s ease;
	}

	.company.visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Skip hint ───────────────────────────────────────────────────────────── */
	.skip-hint {
		position: absolute;
		bottom: 2.25rem;
		background: none;
		border: none;
		cursor: pointer;
		pointer-events: auto;
		font-size: clamp(0.5rem, 1.1vw, 0.62rem);
		letter-spacing: 0.32em;
		padding-right: 0.32em;
		color: rgba(140, 140, 200, 0.5);
		text-transform: uppercase;
		opacity: 0;
		transition: opacity 0.55s ease;
	}

	.skip-hint.visible {
		opacity: 1;
		animation: hint-blink 2.2s ease-in-out infinite;
	}

	@keyframes hint-blink {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.45; }
	}
</style>
