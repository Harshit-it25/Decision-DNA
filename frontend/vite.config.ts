
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react()],
  server: {
    port: 8007,
    strictPort: true,
    host: '127.0.0.1',
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true
      },
      '/dataset.csv': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true
      }
    }
  }
});
