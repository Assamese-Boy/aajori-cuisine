import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/storage-api': {
        target: 'https://storage.tiwaautonomouscouncil.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage-api/, ''),
        secure: false,
      },
    },
  },
});
