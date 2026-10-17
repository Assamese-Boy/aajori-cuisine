import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://cuisine-admin.aajori.in',
        changeOrigin: true,
        secure: false,
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
