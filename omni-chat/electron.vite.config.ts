import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'src/main/index.ts',
        formats: ['cjs'],
        fileName: () => '[name].js',
      },
      outDir: 'dist/main',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@main': path.join(__dirname, 'src/main'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'src/preload/index.ts',
        formats: ['cjs'],
        fileName: () => '[name].js',
      },
      outDir: 'dist/preload',
      emptyOutDir: true,
    },
  },
})
