import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Change base to '/' for Vercel deployment
  base: '/',
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Remove the base element injection since we're deploying to root
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsDir: "assets",
  },
}));