import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      registerType: 'autoUpdate',
      manifest: {
        name: 'Progress Syncer',
        short_name: 'Progress Syncer',
        description: 'Track your workouts, habits, and body measurements.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'https://mhwxdqcnlibqxeiyyuxl.supabase.co/storage/v1/object/public/avatars/83018041-32c6-44c9-b1f0-8953506a6fe6/0.9004334509043234.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://mhwxdqcnlibqxeiyyuxl.supabase.co/storage/v1/object/public/avatars/83018041-32c6-44c9-b1f0-8953506a6fe6/0.9004334509043234.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})





// restart-trigger: 20260217161541
























// restart-trigger: 20260217163837
