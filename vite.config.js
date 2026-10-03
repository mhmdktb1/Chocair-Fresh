import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let apiOrigin = null
  try {
    apiOrigin = new URL(env.VITE_API_BASE_URL || 'http://localhost:5001/api').origin
  } catch {
    apiOrigin = null
  }

  return {
    plugins: [
      react(),
      {
        // Open the TCP/TLS connection to the API while the JS bundle is still downloading.
        name: 'api-preconnect',
        transformIndexHtml() {
          if (!apiOrigin) return []
          return [
            { tag: 'link', attrs: { rel: 'preconnect', href: apiOrigin, crossorigin: '' }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'dns-prefetch', href: apiOrigin }, injectTo: 'head' },
          ]
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          // Rarely-changing libraries get their own long-cached chunks.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['axios', 'lucide-react', 'react-toastify'],
          },
        },
      },
    },
  }
})
