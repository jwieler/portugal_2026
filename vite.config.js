import { defineConfig } from 'vite';

// GitHub Pages serves a project site from /<repo>/, so the built assets need
// that prefix. BASE_PATH lets the Actions workflow (or a local preview) override it.
export default defineConfig({
  base: process.env.BASE_PATH || '/portugal_2026/',
  build: { outDir: 'dist', sourcemap: false }
});
