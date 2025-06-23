import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // Configuración específica para dominios permitidos
  base: mode === 'production' ? '/' : '/',
  
  server: {
    host: "::",
    port: 8080,
    // Configuración adicional de seguridad para desarrollo
    cors: {
      origin: [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'https://park-sell-rover.lovable.app'
      ]
    }
  },
  
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    // Configuración de build para producción
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  
  define: {
    __ALLOWED_DOMAINS__: JSON.stringify([
      'localhost',
      '127.0.0.1', 
      'park-sell-rover.lovable.app'
    ])
  }
}));