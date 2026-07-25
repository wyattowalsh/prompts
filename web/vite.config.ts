import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // trailingSlash-friendly asset paths for Vercel static
  base: "/"
});
