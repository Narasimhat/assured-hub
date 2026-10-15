import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the app under the repository name; Vercel and local runs serve from the root.
const GITHUB_PAGES_BASE = process.env.GITHUB_PAGES_BASE || "/Assured_QC/";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" && process.env.GITHUB_PAGES === "1" ? GITHUB_PAGES_BASE : (process.env.VITE_BASE || "./"),
  worker: { format: "es" },
  build: { rollupOptions: { input: {
    main: new URL("./index.html", import.meta.url).pathname,
    bench: new URL("./bench.html", import.meta.url).pathname,
  } } },
  server: { host: true, port: 5174 },
}));
