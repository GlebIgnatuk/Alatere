import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
  },
  publicDir: 'public',
  base: '/',
  server: {
    host: '127.0.0.1',
    port: 3000,
    https: {
      key: './ssl/localhost-key.pem',
      cert: './ssl/localhost-cert.pem',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
