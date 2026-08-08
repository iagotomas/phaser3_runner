import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
  build: {
    // Phaser is a large dependency; raise the chunk size warning limit
    chunkSizeWarningLimit: 1600
  }
})
