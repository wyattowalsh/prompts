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
        // Keep react/react-dom and dialog/command dependencies in the graph
        // default. Dynamic imports then keep modal/palette code out of the entry
        // graph instead of a shared manual chunk pulling JSX runtime into preload.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) {
              return "router-vendor";
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
