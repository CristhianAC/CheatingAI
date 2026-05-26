import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    include: [
      '@lucide/svelte/icons/moon',
      '@lucide/svelte/icons/sun',
      '@lucide/svelte/icons/x',
      '@lucide/svelte/icons/chevron-down',
      '@lucide/svelte/icons/chevron-up',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      // Specific proctoring service routes (must come before catch-all /api rule)
      '/api/v1/proctoring': {
        target: 'http://localhost:8001',
        changeOrigin: true
      },
      '/api/v1/sessions': {
        target: 'http://localhost:8001',
        changeOrigin: true
      },
      '/proctoring-health': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: () => '/health'
      },
      // Catch-all for main API (plagiarism detection)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
