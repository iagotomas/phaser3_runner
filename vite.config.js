import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const certDir = resolve(__dirname, 'certs')
const httpsConfig = {
  cert: readFileSync(resolve(certDir, 'certificate.crt')),
  key: readFileSync(resolve(certDir, 'private.key'))
}

export default defineConfig({
  plugins: [
    // Copy static game assets into dist/assets on build
    // (in dev, Vite serves them straight from the project root)
    viteStaticCopy({
      targets: [
        {
          src: 'assets/**/*',
          dest: 'assets'
        }
      ]
    })
  ],
  server: {
    host: true,
    port: 8080,
    https: httpsConfig
  },
  preview: {
    host: true,
    port: 4173,
    https: httpsConfig
  },
  build: {
    // Phaser is a large dependency; raise the chunk size warning limit
    chunkSizeWarningLimit: 1600,
    // Keep PWA assets on stable paths so the service worker can cache them reliably.
    // Game code assets are still hashed for cache-busting.
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          const keepStable = /\.(png|jpg|jpeg|gif|webp|svg|ico|json|webmanifest)$/i.test(assetInfo.name)
          const isSplashOrIcon = /assets\/(icons|splash)\//i.test(assetInfo.originalFileName || assetInfo.name)
          if (keepStable && isSplashOrIcon) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
