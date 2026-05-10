import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Copy /data folder to dist during build
function copyDataFolder() {
  return {
    name: 'copy-data-folder',
    apply: 'build',
    enforce: 'post',
    writeBundle() {
      const srcPath = path.resolve(__dirname, 'data')
      const distPath = path.resolve(__dirname, 'dist/data')

      if (fs.existsSync(srcPath)) {
        if (!fs.existsSync(distPath)) {
          fs.mkdirSync(distPath, { recursive: true })
        }
        fs.cpSync(srcPath, distPath, { recursive: true })
      }
    }
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    copyDataFolder(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    // Serve /data folder during development
    middlewares: []
  }
})
