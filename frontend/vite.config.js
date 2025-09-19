import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Generate timestamp for cache busting
const timestamp = Date.now();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Add timestamp to filename for aggressive cache busting
        entryFileNames: `assets/[name]-${timestamp}.[hash].js`,
        chunkFileNames: `assets/[name]-${timestamp}.[hash].js`,
        assetFileNames: `assets/[name]-${timestamp}.[hash].[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    },
    // Ensure index.html is always generated with cache busting
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000
  },
  base: '/', // Use absolute paths for production deployment
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  },
  // Add build info to HTML for debugging
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_TIMESTAMP__: timestamp
  }
})
