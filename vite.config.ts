import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  // Tauri expects a fixed port; don't open a browser
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Watch for changes in the Tauri source as well
      ignored: ["**/src-tauri/**"],
    },
  },
  // Use relative paths so the Tauri bundle loads assets correctly
  base: "./",
}));
