import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Разрешает доступ из локальной сети и внешних туннелей
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/main': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/cases': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/games': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/shop': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/image': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
