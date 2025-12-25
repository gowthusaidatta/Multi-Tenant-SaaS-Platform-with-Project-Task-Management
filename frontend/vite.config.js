import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  server: {
    host: '0.0.0.0',
    port: 3000,
    fs: {
      allow: [path.resolve(__dirname)]
    }
  }
})
