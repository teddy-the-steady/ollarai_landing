import { defineConfig, loadEnv } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(fileURLToPath(import.meta.url))

// The beta pages (/login/, /app/) can't work without these, so refuse to build a broken bundle.
const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, root)
    const missing = REQUIRED_ENV.filter(key => !env[key])
    if (missing.length) {
      throw new Error(`Missing ${missing.join(', ')} - copy .env.example to .env.local and fill it in`)
    }
  }

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          privacy: resolve(root, 'privacy/index.html'),
          privacyEn: resolve(root, 'en/privacy/index.html'),
          privacyJa: resolve(root, 'ja/privacy/index.html'),
          login: resolve(root, 'login/index.html'),
          app: resolve(root, 'app/index.html'),
        },
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        }
      }
    },
    server: {
      open: true
    }
  }
})
