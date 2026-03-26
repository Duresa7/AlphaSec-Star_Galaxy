import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    restoreMocks: true,
    setupFiles: ['./tests/setup.ts'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          supabase: ['@supabase/supabase-js'],
          tiptap: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link', '@tiptap/extension-image'],
        },
      },
    },
  },
})
