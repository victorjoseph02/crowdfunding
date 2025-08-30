
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import rollupNodePolyfills from 'rollup-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    global: 'globalThis',
    'process.env': {}, 
  },
  build: {
    target: 'es2021',
    rollupOptions: {
      plugins: [
        rollupNodePolyfills(),
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2021',
    },
    timeout: 60000, 
  },
  resolve: {
    alias: {
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      sys: 'util',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
    },
  },
});