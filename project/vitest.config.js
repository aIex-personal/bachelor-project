import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ['src/tests/unit/**/*.test.js'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/tests/setup.js'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/lib/**/*.js', 'src/lib/**/*.svelte.js'],
			exclude: ['src/lib/api/**', 'src/lib/server/**']
		}
	},
	resolve: {
		alias: {
			$lib: resolve(__dirname, 'src/lib'),
			'$app/navigation': resolve(__dirname, 'src/tests/mocks/app-navigation.js'),
			'$app/stores': resolve(__dirname, 'src/tests/mocks/app-stores.js'),
			'$app/environment': resolve(__dirname, 'src/tests/mocks/app-environment.js'),
			'$lib/api/pocketbase.js': resolve(__dirname, 'src/tests/mocks/pocketbase.js')
		}
	}
});
