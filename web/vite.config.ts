import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // trailingSlash-friendly asset paths for Vercel static
  base: "/",
  build: {
    rollupOptions: {
      output: {
        // Keep react/react-dom in the graph default (splitting them often breaks
        // dynamic import hydration). Isolate heavy, stable vendors + catalog JSON.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) {
              return "router-vendor";
            }
            if (id.includes("cmdk") || id.includes("@radix-ui/react-dialog")) {
              return "cmdk-vendor";
            }
            if (id.includes("lucide-react")) {
              return "icons-vendor";
            }
          }
          // Isolate full catalog JSON (feature pages / palette). Shell uses catalog-meta only.
          if (
            id.includes(`${path.sep}data${path.sep}catalog.json`) ||
            id.includes("/data/catalog.json")
          ) {
            return "catalog-data";
          }
          if (
            id.includes(`${path.sep}data${path.sep}catalog-meta.json`) ||
            id.includes("/data/catalog-meta.json")
          ) {
            return "catalog-meta";
          }
          return undefined;
        }
      }
    }
  }
});
