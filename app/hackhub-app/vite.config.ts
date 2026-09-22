import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { codecovVitePlugin } from '@codecov/vite-plugin'

export default defineConfig({
  // SockJS's source entry assumes Node's `global`; its browser bundle scopes it safely.
  resolve: {
    alias: [{ find: /^sockjs-client$/, replacement: 'sockjs-client/dist/sockjs.js' }],
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080' },
      '/storage': { target: 'http://127.0.0.1:80' },
      '/ws': { target: 'http://127.0.0.1:8080', ws: true },
    },
  },
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'hackhub-app',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
})
