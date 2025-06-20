import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    port: 5174,
    hmr: {
      port: 5175,
    },
  },
  build: {
    minify: false,
    sourcemap: true,
  },
});
