import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        // enabled: true,
      },
      manifest: {
        name: 'Iris',
        short_name: 'Iris',
        icons: [
          {
            src: '/img/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/img/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/img/maskable_icon.png',
            sizes: '640x640',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/img/maskable_icon_x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src/js',
    },
  },
  /* preact/compat paths */
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
  },
});
