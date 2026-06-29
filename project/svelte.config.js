import adapterNode   from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';

const isElectronBuild = process.env.BUILD_TARGET === 'electron';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isElectronBuild
			? adapterStatic({
				// SPA fallback — Electron's app:// protocol handler serves index.html
				// for all unmatched routes, enabling client-side routing.
				fallback:    'index.html',
				precompress: false,
			})
			: adapterNode()
	}
};

export default config;
