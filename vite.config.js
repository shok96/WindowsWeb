import { defineConfig } from 'vite';
import { resolve } from 'path';
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm';

export default defineConfig({
  root: '.',
  publicDir: 'public/assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    monacoEditorPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});













