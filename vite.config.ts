import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // This will generate a file containing all the assets to be cached
        // which our custom sw.js can read.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
      },
      // We are using a custom service worker, so we point to it.
      // The plugin will still process it and inject the precache manifest.
      srcDir: 'public',
      filename: 'sw.js',
      strategies: 'injectManifest',
      manifest: false, // We have a manual manifest file, so we disable this.
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})