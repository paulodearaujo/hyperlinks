import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$styles: '/src/styles', // Caminho para onde `global.css` está localizado
			$lib: '/src/lib',
			$routes: '/src/routes'
		}
	}
});
