import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    sourcemap: false,
  },
  server: {
    port: 3000,
    strictPort: true,
    open: false,
  },
});