import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["@wagmi/connectors", "@base-org/account"],
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    svgr(),
    tailwindcss(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
